import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { query, transaction, healthcheck } from "./db.js";
import {
  authOptional, requireAuth, requireRole, hashPassword, normalizeEmail, normalizeMobile,
  setSessionCookie, clearSessionCookie, verifyCredentials,
} from "./auth.js";
import {
  ensureStorage, uploadMiddleware, inspectDocument, signUploadToken, verifyUploadToken,
  finalizeUpload, preparePdf, resolveStorageKey, cleanupExpiredFiles,
} from "./storage.js";
import { calculateQuote, getConfig, getWalletBalance } from "./pricing.js";
import { createPaymentOrder, verifyRazorpayCheckout, verifyRazorpayWebhook } from "./payments.js";
import { notifyOrderStatus } from "./notifications.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const appOrigin = process.env.APP_ORIGIN || "http://localhost:5173";

await ensureStorage();

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === appOrigin || process.env.NODE_ENV !== "production") return callback(null, true);
    return callback(new Error("Origin not allowed"));
  },
  credentials: true,
}));

app.post("/api/payments/razorpay/webhook", express.raw({ type: "application/json" }), async (req, res, next) => {
  try {
    const signature = req.get("x-razorpay-signature");
    if (!verifyRazorpayWebhook(req.body, signature)) return res.status(401).json({ message: "Invalid webhook signature" });
    const event = JSON.parse(req.body.toString("utf8"));
    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) {
        const { rows } = await query("SELECT * FROM print_orders WHERE payment_order_reference=$1 LIMIT 1", [payment.order_id]);
        if (rows[0]) await markOrderPaid(rows[0].id, "razorpay", payment.id);
      }
    }
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(authOptional);

function requiredString(value, label, max = 250) {
  const result = String(value || "").trim();
  if (!result) throw Object.assign(new Error(`${label} is required`), { status: 400 });
  return result.slice(0, max);
}

function orderNumber() {
  return `NISE-P-${Date.now().toString().slice(-8)}${crypto.randomInt(10, 99)}`;
}

function friendlyStatus(status) {
  return ({
    DRAFT: "Draft",
    AWAITING_PAYMENT: "Awaiting payment",
    PAID: "Payment received",
    QUEUED: "Ready to print",
    PRINTING: "Printing",
    NEEDS_CUSTOMER_CONFIRMATION: "Needs your confirmation",
    READY_FOR_PICKUP: "Ready for pickup",
    OUT_FOR_DELIVERY: "Out for delivery",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
  })[status] || status;
}

function pagesFromSelection(selection, totalPages) {
  const pages = new Set();
  for (const token of String(selection || "").split(",").map((x) => x.trim()).filter(Boolean)) {
    if (token.includes("-")) {
      const [a, b] = token.split("-").map(Number);
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < a || b > totalPages) {
        throw Object.assign(new Error(`Invalid page range: ${token}`), { status: 400 });
      }
      for (let p = a; p <= b; p++) pages.add(p);
    } else {
      const p = Number(token);
      if (!Number.isInteger(p) || p < 1 || p > totalPages) {
        throw Object.assign(new Error(`Invalid page: ${token}`), { status: 400 });
      }
      pages.add(p);
    }
  }
  if (!pages.size) throw Object.assign(new Error("Select at least one page"), { status: 400 });
  return [...pages].sort((a, b) => a - b);
}

function pagesToSelection(pages) {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  if (!sorted.length) return "";
  const out = [];
  let start = sorted[0];
  let previous = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === previous + 1) { previous = current; continue; }
    out.push(start === previous ? String(start) : `${start}-${previous}`);
    start = current;
    previous = current;
  }
  return out.join(",");
}

function splitSelections(file) {
  const selected = pagesFromSelection(file.selection, file.totalPages);
  const color = file.colourSelection
    ? new Set(pagesFromSelection(file.colourSelection, file.totalPages))
    : new Set();
  const colorSelected = selected.filter((p) => color.has(p));
  const bwSelected = selected.filter((p) => !color.has(p));
  return { bw: pagesToSelection(bwSelected), color: pagesToSelection(colorSelected) };
}

async function hydrateFilesForQuote(files, userId) {
  return (files || []).map((file) => {
    if (!file.uploadToken) throw Object.assign(new Error("Upload each file before quoting"), { status: 400 });
    const meta = verifyUploadToken(file.uploadToken);
    if (meta.userId !== userId) throw Object.assign(new Error("Upload does not belong to this account"), { status: 403 });
    return {
      ...file,
      totalPages: Number(meta.totalPages),
      originalName: meta.originalName,
      mimeType: meta.mimeType,
    };
  });
}

async function fetchOrder(orderNumberValue, user, staff = false) {
  const params = [orderNumberValue];
  let access = "";
  if (!staff) {
    params.push(user.id);
    access = " AND o.customer_id=$2";
  }
  const { rows } = await query(
    `SELECT o.*, u.name customer_name, u.mobile customer_mobile, u.email customer_email,
       COALESCE(json_agg(json_build_object(
         'id',f.id,'name',f.original_name,'mimeType',f.mime_type,'totalPages',f.total_pages,
         'preparedBw',f.prepared_bw_key IS NOT NULL,'preparedColor',f.prepared_color_key IS NOT NULL,
         'segments',(SELECT COALESCE(json_agg(json_build_object(
           'pageSelection',s.page_selection,'colourMode',s.colour_mode,'copies',s.copies,
           'sides',s.sides,'paperSize',s.paper_size,'orientation',s.orientation
         ) ORDER BY s.colour_mode),'[]'::json) FROM print_segments s WHERE s.print_file_id=f.id)
       ) ORDER BY f.created_at) FILTER (WHERE f.id IS NOT NULL),'[]'::json) files
     FROM print_orders o
     JOIN users u ON u.id=o.customer_id
     LEFT JOIN print_files f ON f.order_id=o.id
     WHERE o.order_number=$1${access}
     GROUP BY o.id,u.id`,
    params
  );
  if (!rows[0]) throw Object.assign(new Error("Order not found"), { status: 404 });
  return rows[0];
}

async function addStatus(client, orderId, status, actorId, note = null) {
  await client.query(
    "INSERT INTO order_status_history(order_id,status,actor_user_id,note) VALUES($1,$2,$3,$4)",
    [orderId, status, actorId || null, note]
  );
}

async function markOrderPaid(orderId, provider, paymentReference) {
  return transaction(async (client) => {
    const { rows } = await client.query("SELECT * FROM print_orders WHERE id=$1 FOR UPDATE", [orderId]);
    const order = rows[0];
    if (!order) throw Object.assign(new Error("Order not found"), { status: 404 });
    if (["paid", "captured"].includes(order.payment_status)) return order;

    await client.query(
      `UPDATE print_orders
       SET payment_status='paid', payment_provider=$2, payment_reference=COALESCE($3,payment_reference),
           status='PAID', updated_at=NOW()
       WHERE id=$1`,
      [order.id, provider, paymentReference || null]
    );
    await addStatus(client, order.id, "PAID", null, "Payment confirmed");
    return { ...order, status: "PAID", payment_status: "paid" };
  });
}

async function notifyForOrder(orderNumberValue) {
  const { rows } = await query(
    `SELECT o.*,u.id user_id,u.name,u.mobile,u.email,u.whatsapp_consent
     FROM print_orders o JOIN users u ON u.id=o.customer_id WHERE o.order_number=$1`,
    [orderNumberValue]
  );
  const row = rows[0];
  if (!row) return;
  await notifyOrderStatus({
    order: row,
    user: { id: row.user_id, name: row.name, mobile: row.mobile, email: row.email, whatsapp_consent: row.whatsapp_consent },
    friendlyStatus: friendlyStatus(row.status),
  });
}

app.get("/api/health", async (_req, res, next) => {
  try { res.json({ ok: true, database: await healthcheck() }); } catch (error) { next(error); }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const name = requiredString(req.body.name, "Name", 100);
    const email = normalizeEmail(req.body.email);
    const mobile = normalizeMobile(req.body.mobile);
    if (!email && !mobile) throw Object.assign(new Error("Email or mobile is required"), { status: 400 });
    const passwordHash = await hashPassword(req.body.password);
    const { rows } = await query(
      `INSERT INTO users(name,email,mobile,password_hash,marketing_consent,whatsapp_consent)
       VALUES($1,$2,$3,$4,$5,$6)
       RETURNING id,role,name,email,mobile,marketing_consent,whatsapp_consent`,
      [name, email, mobile, passwordHash, Boolean(req.body.marketingConsent), Boolean(req.body.whatsappConsent)]
    );
    setSessionCookie(res, rows[0]);
    res.status(201).json({ user: rows[0] });
  } catch (error) {
    if (error.code === "23505") error = Object.assign(new Error("An account already exists with this email or mobile"), { status: 409 });
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const user = await verifyCredentials(req.body.identifier, req.body.password);
    setSessionCookie(res, user);
    res.json({ user });
  } catch (error) { next(error); }
});

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

app.get("/api/me", requireAuth, async (req, res) => {
  const walletBalancePaise = await getWalletBalance(req.user.id);
  res.json({ user: req.user, walletBalancePaise });
});

app.get("/api/config/print", async (_req, res, next) => {
  try {
    const [pricing, delivery, pickup, uploads] = await Promise.all([
      getConfig("print_pricing"), getConfig("delivery"), getConfig("pickup"), getConfig("uploads"),
    ]);
    res.json({ pricing, delivery, pickup, uploads });
  } catch (error) { next(error); }
});

app.post("/api/print/uploads", requireAuth, uploadMiddleware.array("files", 20), async (req, res, next) => {
  try {
    const results = [];
    for (const file of req.files || []) {
      try {
        const inspection = await inspectDocument(file.path, file.originalname, file.mimetype);
        const token = signUploadToken({
          userId: req.user.id,
          path: file.path,
          convertedPath: inspection.convertedPath,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          totalPages: inspection.totalPages,
        });
        results.push({
          uploadToken: token,
          name: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          totalPages: inspection.totalPages,
          previewUrl: `/api/print/uploads/preview?token=${encodeURIComponent(token)}`,
        });
      } catch (error) {
        try { fs.unlinkSync(file.path); } catch {}
        throw error;
      }
    }
    res.status(201).json({ files: results });
  } catch (error) { next(error); }
});

app.get("/api/print/uploads/preview", requireAuth, async (req, res, next) => {
  try {
    const meta = verifyUploadToken(requiredString(req.query.token, "Upload token", 10000));
    if (meta.userId !== req.user.id) throw Object.assign(new Error("Not allowed"), { status: 403 });
    const target = meta.convertedPath || meta.path;
    res.type(path.extname(target).toLowerCase() === ".pdf" ? "application/pdf" : meta.mimeType);
    res.set("Cache-Control", "private, no-store");
    res.sendFile(path.resolve(target));
  } catch (error) { next(error); }
});

app.post("/api/print/quote", requireAuth, async (req, res, next) => {
  try {
    const files = await hydrateFilesForQuote(req.body.files, req.user.id);
    const quote = await calculateQuote({
      files,
      fulfilment: req.body.fulfilment,
      couponCode: req.body.couponCode,
      walletRedeemPaise: req.body.walletRedeemPaise,
      userId: req.user.id,
    });
    res.json({ quote });
  } catch (error) { next(error); }
});

async function ensurePickupSlots(days = 7) {
  const config = await getConfig("pickup");
  const now = new Date();
  const dates = [];
  const dateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
  for (let d = 0; d < days; d++) {
    const day = new Date(now.getTime() + d * 86400000);
    dates.push(dateFmt.format(day));
  }
  for (const date of dates) {
    for (let hour = Number(config.openingHour); hour < Number(config.closingHour); hour++) {
      const start = `${date}T${String(hour).padStart(2, "0")}:00:00+05:30`;
      const endHour = hour + 1;
      const end = `${date}T${String(endHour).padStart(2, "0")}:00:00+05:30`;
      await query(
        `INSERT INTO pickup_slots(starts_at,ends_at,capacity)
         VALUES($1,$2,$3) ON CONFLICT(starts_at,ends_at) DO NOTHING`,
        [start, end, Number(config.capacity || 12)]
      );
    }
  }
}

app.get("/api/print/pickup-slots", async (_req, res, next) => {
  try {
    await ensurePickupSlots();
    const { rows } = await query(
      `SELECT id,starts_at,ends_at,capacity,booked_count
       FROM pickup_slots
       WHERE starts_at > NOW() AND blocked=false AND booked_count < capacity
       ORDER BY starts_at LIMIT 80`
    );
    res.json({ slots: rows });
  } catch (error) { next(error); }
});

app.post("/api/print/orders", requireAuth, async (req, res, next) => {
  try {
    const files = await hydrateFilesForQuote(req.body.files, req.user.id);
    const fulfilment = req.body.fulfilment === "delivery" ? "delivery" : "pickup";
    if (!files.length) throw Object.assign(new Error("Add at least one file"), { status: 400 });

    const quote = await calculateQuote({
      files,
      fulfilment,
      couponCode: req.body.couponCode,
      walletRedeemPaise: req.body.walletRedeemPaise,
      userId: req.user.id,
    });

    const number = orderNumber();
    const created = await transaction(async (client) => {
      let pickupSlotId = null;
      let deliveryAddress = null;

      if (fulfilment === "pickup") {
        pickupSlotId = requiredString(req.body.pickupSlotId, "Pickup slot", 100);
        const slot = await client.query(
          `UPDATE pickup_slots SET booked_count=booked_count+1
           WHERE id=$1 AND blocked=false AND booked_count < capacity AND starts_at > NOW()
           RETURNING id`,
          [pickupSlotId]
        );
        if (!slot.rows[0]) throw Object.assign(new Error("That pickup slot is no longer available"), { status: 409 });
      } else {
        deliveryAddress = req.body.deliveryAddress;
        if (!deliveryAddress?.line1 || !deliveryAddress?.postalCode) {
          throw Object.assign(new Error("Delivery address and postal code are required"), { status: 400 });
        }
        const deliveryConfig = await getConfig("delivery");
        if (deliveryConfig.allowedPostalCodes?.length && !deliveryConfig.allowedPostalCodes.includes(String(deliveryAddress.postalCode))) {
          throw Object.assign(new Error("Home delivery is not available for this postal code yet"), { status: 400 });
        }
      }

      const inserted = await client.query(
        `INSERT INTO print_orders(
          order_number,customer_id,status,fulfilment,pickup_slot_id,delivery_address,
          printing_subtotal_paise,delivery_fee_paise,wallet_redeemed_paise,discount_paise,
          total_paise,cashback_paise,payment_status,coupon_code,acquisition_source,customer_note
        ) VALUES($1,$2,'AWAITING_PAYMENT',$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12,$13,$14)
        RETURNING *`,
        [
          number, req.user.id, fulfilment, pickupSlotId, deliveryAddress ? JSON.stringify(deliveryAddress) : null,
          quote.printingSubtotalPaise, quote.deliveryFeePaise, quote.walletAppliedPaise, quote.discountPaise,
          quote.totalPaise, quote.cashbackPaise, quote.couponCode, req.body.acquisitionSource || "direct",
          String(req.body.customerNote || "").slice(0, 1000) || null,
        ]
      );
      const order = inserted.rows[0];

      if (quote.couponCode) {
        const reservedCoupon = await client.query(
          `UPDATE coupons SET used_count=used_count+1
           WHERE upper(code)=upper($1) AND active=true
             AND (starts_at IS NULL OR starts_at <= NOW())
             AND (ends_at IS NULL OR ends_at >= NOW())
             AND (max_uses IS NULL OR used_count < max_uses)
           RETURNING id`,
          [quote.couponCode]
        );
        if (!reservedCoupon.rows[0]) throw Object.assign(new Error("That coupon is no longer available"), { status: 409 });
      }

      if (quote.walletAppliedPaise > 0) {
        await client.query(
          `INSERT INTO wallet_ledger(user_id,order_id,amount_paise,entry_type,reason)
           VALUES($1,$2,$3,'redemption',$4)`,
          [req.user.id, order.id, -quote.walletAppliedPaise, `Reserved for ${number}`]
        );
      }

      await addStatus(client, order.id, "AWAITING_PAYMENT", req.user.id, "Order created");

      for (const file of files) {
        const finalized = await finalizeUpload({ token: file.uploadToken, orderNumber: number });
        const split = splitSelections(file);
        let preparedBwKey = null;
        let preparedColorKey = null;
        const sourcePdfKey = finalized.preparedStorageKey || finalized.storageKey;
        const isPdfSource = finalized.mimeType === "application/pdf" || Boolean(finalized.preparedStorageKey);

        if (isPdfSource && split.bw) {
          preparedBwKey = await preparePdf({
            sourceKey: sourcePdfKey, selection: split.bw, copies: file.copies,
            outputName: `${number}-BW-${finalized.originalName}.pdf`,
          });
        }
        if (isPdfSource && split.color) {
          preparedColorKey = await preparePdf({
            sourceKey: sourcePdfKey, selection: split.color, copies: file.copies,
            outputName: `${number}-COLOR-${finalized.originalName}.pdf`,
          });
        }

        const retentionDays = Number((await getConfig("uploads")).retentionDays || 7);
        const fileInsert = await client.query(
          `INSERT INTO print_files(
            order_id,original_name,storage_key,prepared_storage_key,prepared_bw_key,prepared_color_key,
            mime_type,size_bytes,total_pages,conversion_status,delete_after
          ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'ready',NOW()+($10 || ' days')::interval)
          RETURNING id`,
          [
            order.id, finalized.originalName, finalized.storageKey, finalized.preparedStorageKey,
            preparedBwKey, preparedColorKey, finalized.mimeType, finalized.sizeBytes,
            finalized.totalPages, String(retentionDays),
          ]
        );
        const fileId = fileInsert.rows[0].id;
        for (const [mode, selection] of [["bw", split.bw], ["color", split.color]]) {
          if (!selection) continue;
          await client.query(
            `INSERT INTO print_segments(print_file_id,page_selection,colour_mode,copies,sides,paper_size,orientation)
             VALUES($1,$2,$3,$4,$5,$6,$7)`,
            [
              fileId, selection, mode, Math.max(1, Number(file.copies) || 1),
              file.sides === "double" ? "double" : "single",
              ["A4","A3"].includes(file.paperSize) ? file.paperSize : "A4",
              file.orientation === "landscape" ? "landscape" : "portrait",
            ]
          );
        }
      }

      return order;
    });

    const requestedPaymentMethod = req.body.paymentMethod === "pay_at_shop" ? "pay_at_shop" : "online";
    const payment = quote.totalPaise === 0
      ? { provider: "wallet", orderId: null, amountPaise: 0 }
      : requestedPaymentMethod === "pay_at_shop"
        ? { provider: "pay_at_shop", orderId: null, amountPaise: quote.totalPaise }
        : await createPaymentOrder({ amountPaise: quote.totalPaise, receipt: number, notes: { niseOrder: number } });

    if (payment.provider === "razorpay") {
      await query("UPDATE print_orders SET payment_provider='razorpay',payment_order_reference=$2 WHERE id=$1", [created.id, payment.orderId]);
    } else if (payment.provider === "pay_at_shop") {
      await query("UPDATE print_orders SET payment_provider='pay_at_shop' WHERE id=$1", [created.id]);
    } else if (quote.totalPaise === 0) {
      await markOrderPaid(created.id, "wallet", null);
    }

    await notifyForOrder(number);
    res.status(201).json({
      order: await fetchOrder(number, req.user),
      quote,
      payment,
      payAtShopAvailable: true,
    });
  } catch (error) { next(error); }
});

app.get("/api/print/orders", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.order_number,o.status,o.fulfilment,o.total_paise,o.cashback_paise,o.payment_status,o.created_at,o.updated_at,
              ps.starts_at pickup_starts_at,ps.ends_at pickup_ends_at,
              (SELECT COUNT(*)::int FROM print_files f WHERE f.order_id=o.id) file_count
       FROM print_orders o LEFT JOIN pickup_slots ps ON ps.id=o.pickup_slot_id
       WHERE o.customer_id=$1 ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ orders: rows });
  } catch (error) { next(error); }
});

app.get("/api/print/orders/:orderNumber", requireAuth, async (req, res, next) => {
  try { res.json({ order: await fetchOrder(req.params.orderNumber, req.user) }); } catch (error) { next(error); }
});

app.post("/api/print/orders/:orderNumber/payment/create", requireAuth, async (req, res, next) => {
  try {
    const order = await fetchOrder(req.params.orderNumber, req.user);
    if (order.payment_status === "paid") return res.json({ alreadyPaid: true });
    const payment = await createPaymentOrder({
      amountPaise: order.total_paise,
      receipt: order.order_number,
      notes: { niseOrder: order.order_number },
    });
    if (payment.provider === "razorpay") {
      await query("UPDATE print_orders SET payment_provider='razorpay',payment_order_reference=$2 WHERE id=$1", [order.id, payment.orderId]);
    }
    res.json({ payment, payAtShopAvailable: true });
  } catch (error) { next(error); }
});

app.post("/api/print/orders/:orderNumber/payment/confirm", requireAuth, async (req, res, next) => {
  try {
    const order = await fetchOrder(req.params.orderNumber, req.user);
    if (req.body.method === "pay_at_shop") {
      await query("UPDATE print_orders SET payment_provider='pay_at_shop' WHERE id=$1", [order.id]);
      return res.json({ order: await fetchOrder(order.order_number, req.user) });
    }
    if (order.payment_provider !== "razorpay" || !order.payment_order_reference) throw Object.assign(new Error("No online payment is active for this order"), { status: 400 });
    if (!verifyRazorpayCheckout({
      orderId: order.payment_order_reference,
      paymentId: req.body.razorpayPaymentId,
      signature: req.body.razorpaySignature,
    })) throw Object.assign(new Error("Payment verification failed"), { status: 400 });

    await markOrderPaid(order.id, "razorpay", req.body.razorpayPaymentId);
    await notifyForOrder(order.order_number);
    res.json({ order: await fetchOrder(order.order_number, req.user) });
  } catch (error) { next(error); }
});

app.post("/api/print/orders/:orderNumber/cancel", requireAuth, async (req, res, next) => {
  try {
    const order = await fetchOrder(req.params.orderNumber, req.user);
    if (!["DRAFT","AWAITING_PAYMENT"].includes(order.status)) {
      throw Object.assign(new Error("This order can no longer be cancelled online"), { status: 409 });
    }
    await transaction(async (client) => {
      await client.query("UPDATE print_orders SET status='CANCELLED',updated_at=NOW() WHERE id=$1", [order.id]);
      if (order.pickup_slot_id) await client.query("UPDATE pickup_slots SET booked_count=GREATEST(0,booked_count-1) WHERE id=$1", [order.pickup_slot_id]);
      if (order.coupon_code) {
        await client.query("UPDATE coupons SET used_count=GREATEST(0,used_count-1) WHERE upper(code)=upper($1)", [order.coupon_code]);
      }
      if (order.wallet_redeemed_paise > 0) {
        const existing = await client.query("SELECT 1 FROM wallet_ledger WHERE order_id=$1 AND entry_type='reversal'", [order.id]);
        if (!existing.rows[0]) {
          await client.query(
            "INSERT INTO wallet_ledger(user_id,order_id,amount_paise,entry_type,reason) VALUES($1,$2,$3,'reversal',$4)",
            [req.user.id, order.id, order.wallet_redeemed_paise, `Wallet reversal for ${order.order_number}`]
          );
        }
      }
      await addStatus(client, order.id, "CANCELLED", req.user.id, "Cancelled by customer");
    });
    await notifyForOrder(order.order_number);
    res.json({ order: await fetchOrder(order.order_number, req.user) });
  } catch (error) { next(error); }
});

app.get("/api/addresses", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id,label,line1,line2,landmark,city,state,postal_code,is_default FROM addresses WHERE user_id=$1 ORDER BY is_default DESC,created_at DESC",
      [req.user.id]
    );
    res.json({ addresses: rows });
  } catch (error) { next(error); }
});

app.post("/api/addresses", requireAuth, async (req, res, next) => {
  try {
    const line1 = requiredString(req.body.line1, "Address", 200);
    const postalCode = requiredString(req.body.postalCode, "Postal code", 12);
    const makeDefault = Boolean(req.body.isDefault);
    const address = await transaction(async (client) => {
      if (makeDefault) await client.query("UPDATE addresses SET is_default=false WHERE user_id=$1", [req.user.id]);
      const { rows } = await client.query(
        `INSERT INTO addresses(user_id,label,line1,line2,landmark,city,state,postal_code,is_default)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [req.user.id, String(req.body.label || "Home").slice(0,40), line1, req.body.line2 || null, req.body.landmark || null, req.body.city || "Jamshedpur", req.body.state || "Jharkhand", postalCode, makeDefault]
      );
      return rows[0];
    });
    res.status(201).json({ address });
  } catch (error) { next(error); }
});

app.delete("/api/addresses/:id", requireAuth, async (req, res, next) => {
  try {
    await query("DELETE FROM addresses WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    res.status(204).end();
  } catch (error) { next(error); }
});

app.get("/api/wallet", requireAuth, async (req, res, next) => {
  try { res.json({ balancePaise: await getWalletBalance(req.user.id) }); } catch (error) { next(error); }
});

app.get("/api/wallet/ledger", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id,amount_paise,entry_type,reason,expires_at,created_at FROM wallet_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",
      [req.user.id]
    );
    res.json({ entries: rows, balancePaise: await getWalletBalance(req.user.id) });
  } catch (error) { next(error); }
});

app.get("/api/notifications", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id,title,body,channel,status,read_at,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",
      [req.user.id]
    );
    res.json({ notifications: rows });
  } catch (error) { next(error); }
});

app.post("/api/notifications/:id/read", requireAuth, async (req, res, next) => {
  try {
    await query("UPDATE notifications SET read_at=NOW() WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    res.status(204).end();
  } catch (error) { next(error); }
});

app.get("/api/staff/print/orders", requireRole("OWNER","STAFF"), async (req, res, next) => {
  try {
    const statuses = req.query.status ? String(req.query.status).split(",") : null;
    const params = [];
    let where = "";
    if (statuses?.length) {
      params.push(statuses);
      where = "WHERE o.status = ANY($1::print_order_status[])";
    }
    const { rows } = await query(
      `SELECT o.order_number,o.status,o.fulfilment,o.payment_status,o.total_paise,o.created_at,o.customer_note,
              u.name customer_name,u.mobile customer_mobile,
              ps.starts_at pickup_starts_at,ps.ends_at pickup_ends_at,
              (SELECT COUNT(*)::int FROM print_files f WHERE f.order_id=o.id) file_count
       FROM print_orders o JOIN users u ON u.id=o.customer_id
       LEFT JOIN pickup_slots ps ON ps.id=o.pickup_slot_id
       ${where} ORDER BY CASE o.status
         WHEN 'NEEDS_CUSTOMER_CONFIRMATION' THEN 0 WHEN 'PAID' THEN 1 WHEN 'QUEUED' THEN 2
         WHEN 'PRINTING' THEN 3 WHEN 'READY_FOR_PICKUP' THEN 4 ELSE 5 END, o.created_at`,
      params
    );
    res.json({ orders: rows });
  } catch (error) { next(error); }
});

app.get("/api/staff/print/orders/:orderNumber", requireRole("OWNER","STAFF"), async (req, res, next) => {
  try { res.json({ order: await fetchOrder(req.params.orderNumber, req.user, true) }); } catch (error) { next(error); }
});

const allowedTransitions = {
  PAID: ["QUEUED","CANCELLED","REFUNDED"],
  QUEUED: ["PRINTING","NEEDS_CUSTOMER_CONFIRMATION","CANCELLED","REFUNDED"],
  PRINTING: ["NEEDS_CUSTOMER_CONFIRMATION","READY_FOR_PICKUP","OUT_FOR_DELIVERY"],
  NEEDS_CUSTOMER_CONFIRMATION: ["QUEUED","PRINTING","CANCELLED"],
  READY_FOR_PICKUP: ["COMPLETED"],
  OUT_FOR_DELIVERY: ["COMPLETED"],
};

app.post("/api/staff/print/orders/:orderNumber/status", requireRole("OWNER","STAFF"), async (req, res, next) => {
  try {
    const order = await fetchOrder(req.params.orderNumber, req.user, true);
    const nextStatus = String(req.body.status || "").toUpperCase();
    if (!(allowedTransitions[order.status] || []).includes(nextStatus)) {
      throw Object.assign(new Error(`Cannot move order from ${order.status} to ${nextStatus}`), { status: 409 });
    }

    await transaction(async (client) => {
      await client.query(
        `UPDATE print_orders SET status=$2,updated_at=NOW(),completed_at=CASE WHEN $2='COMPLETED' THEN NOW() ELSE completed_at END
         WHERE id=$1`,
        [order.id, nextStatus]
      );
      await addStatus(client, order.id, nextStatus, req.user.id, String(req.body.note || "").slice(0, 500) || null);

      if (nextStatus === "REFUNDED") {
        if (order.wallet_redeemed_paise > 0) {
          const reversal = await client.query("SELECT 1 FROM wallet_ledger WHERE order_id=$1 AND entry_type='reversal'", [order.id]);
          if (!reversal.rows[0]) {
            await client.query(
              "INSERT INTO wallet_ledger(user_id,order_id,amount_paise,entry_type,reason) VALUES($1,$2,$3,'reversal',$4)",
              [order.customer_id, order.id, order.wallet_redeemed_paise, `Wallet reversal for ${order.order_number}`]
            );
          }
        }
        if (order.coupon_code) {
          await client.query("UPDATE coupons SET used_count=GREATEST(0,used_count-1) WHERE upper(code)=upper($1)", [order.coupon_code]);
        }
      }

      if (nextStatus === "COMPLETED" && order.cashback_paise > 0) {
        const existing = await client.query(
          "SELECT 1 FROM wallet_ledger WHERE order_id=$1 AND entry_type='cashback'",
          [order.id]
        );
        if (!existing.rows[0]) {
          await client.query(
            `INSERT INTO wallet_ledger(user_id,order_id,amount_paise,entry_type,reason,expires_at)
             VALUES($1,$2,$3,'cashback',$4,NOW()+INTERVAL '365 days')`,
            [order.customer_id, order.id, order.cashback_paise, `Cashback for ${order.order_number}`]
          );
        }
      }
    });

    await notifyForOrder(order.order_number);
    res.json({ order: await fetchOrder(order.order_number, req.user, true) });
  } catch (error) { next(error); }
});

app.post("/api/staff/print/orders/:orderNumber/mark-paid", requireRole("OWNER","STAFF"), async (req, res, next) => {
  try {
    const order = await fetchOrder(req.params.orderNumber, req.user, true);
    await markOrderPaid(order.id, "pay_at_shop", `staff:${req.user.id}`);
    await notifyForOrder(order.order_number);
    res.json({ order: await fetchOrder(order.order_number, req.user, true) });
  } catch (error) { next(error); }
});

app.get("/api/staff/print/files/:fileId/download", requireRole("OWNER","STAFF"), async (req, res, next) => {
  try {
    const mode = ["bw","color","source"].includes(req.query.mode) ? req.query.mode : "source";
    const { rows } = await query(
      `SELECT f.*,o.order_number FROM print_files f JOIN print_orders o ON o.id=f.order_id WHERE f.id=$1`,
      [req.params.fileId]
    );
    const file = rows[0];
    if (!file) throw Object.assign(new Error("File not found"), { status: 404 });
    const key = mode === "bw" ? file.prepared_bw_key : mode === "color" ? file.prepared_color_key : (file.prepared_storage_key || file.storage_key);
    if (!key) throw Object.assign(new Error(`No ${mode} print file is needed for this document`), { status: 404 });
    const filePath = resolveStorageKey(key);
    res.set("Cache-Control", "private, no-store");
    res.download(filePath, `${file.order_number}-${mode}-${file.original_name.replace(/\.(docx?|pdf)$/i, "")}.pdf`);
  } catch (error) { next(error); }
});

app.get("/api/admin/config", requireRole("OWNER"), async (_req, res, next) => {
  try {
    const { rows } = await query("SELECT key,value,updated_at FROM service_config ORDER BY key");
    res.json({ config: Object.fromEntries(rows.map((row) => [row.key, row.value])) });
  } catch (error) { next(error); }
});

app.put("/api/admin/config/:key", requireRole("OWNER"), async (req, res, next) => {
  try {
    if (!["print_pricing","delivery","pickup","uploads"].includes(req.params.key)) {
      throw Object.assign(new Error("Unknown configuration key"), { status: 400 });
    }
    await query(
      "INSERT INTO service_config(key,value,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(key) DO UPDATE SET value=$2,updated_at=NOW()",
      [req.params.key, JSON.stringify(req.body.value)]
    );
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.post("/api/admin/coupons", requireRole("OWNER"), async (req, res, next) => {
  try {
    const code = requiredString(req.body.code, "Coupon code", 32).toUpperCase();
    const kind = req.body.kind === "percent" ? "percent" : "flat";
    const value = Number(req.body.value);
    if (!Number.isFinite(value) || value <= 0) throw Object.assign(new Error("Coupon value must be positive"), { status: 400 });
    const { rows } = await query(
      `INSERT INTO coupons(code,kind,value,min_order_paise,max_discount_paise,starts_at,ends_at,max_uses)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [code,kind,value,Number(req.body.minOrderPaise||0),req.body.maxDiscountPaise||null,req.body.startsAt||null,req.body.endsAt||null,req.body.maxUses||null]
    );
    res.status(201).json({ coupon: rows[0] });
  } catch (error) { next(error); }
});

app.post("/api/internal/cleanup-files", requireRole("OWNER"), async (_req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id,storage_key,prepared_storage_key,prepared_bw_key,prepared_color_key FROM print_files WHERE delete_after < NOW()"
    );
    await cleanupExpiredFiles(rows.flatMap((row) => [
      { storage_key: row.storage_key, prepared_storage_key: row.prepared_storage_key },
      { storage_key: row.prepared_bw_key, prepared_storage_key: row.prepared_color_key },
    ]));
    await query(
      "UPDATE print_files SET storage_key='deleted',prepared_storage_key=NULL,prepared_bw_key=NULL,prepared_color_key=NULL WHERE delete_after < NOW()"
    );
    res.json({ deleted: rows.length });
  } catch (error) { next(error); }
});

const buildDir = path.resolve("./build");
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir, { maxAge: process.env.NODE_ENV === "production" ? "1h" : 0 }));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) return res.sendFile(path.join(buildDir, "index.html"));
    next();
  });
}

app.use((req, res) => res.status(404).json({ message: "Not found" }));

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number(error.status || (error.code === "LIMIT_FILE_SIZE" ? 413 : 500));
  const safeMessage = status >= 500 && process.env.NODE_ENV === "production" ? "Something went wrong" : error.message;
  res.status(status).json({ message: safeMessage, code: error.code || undefined });
});

app.listen(port, () => {
  console.log(`[NISE] web + API server listening on port ${port}`);
});
