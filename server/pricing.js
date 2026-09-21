import { query } from "./db.js";

function parseSelection(selection, totalPages) {
  const pages = new Set();
  for (const token of String(selection || "").split(",").map((v) => v.trim()).filter(Boolean)) {
    if (token.includes("-")) {
      const [start, end] = token.split("-").map(Number);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > totalPages) {
        throw Object.assign(new Error(`Invalid page range: ${token}`), { status: 400 });
      }
      for (let p = start; p <= end; p++) pages.add(p);
    } else {
      const page = Number(token);
      if (!Number.isInteger(page) || page < 1 || page > totalPages) {
        throw Object.assign(new Error(`Invalid page: ${token}`), { status: 400 });
      }
      pages.add(page);
    }
  }
  if (!pages.size) throw Object.assign(new Error("Select at least one page"), { status: 400 });
  return pages;
}

export async function getConfig(key) {
  const { rows } = await query("SELECT value FROM service_config WHERE key=$1", [key]);
  if (!rows[0]) throw new Error(`Missing service_config: ${key}`);
  return rows[0].value;
}

function tierRate(pageCount, tiers) {
  return tiers.find((t) => pageCount >= t.min && pageCount <= t.max)?.paise || 0;
}

export function countPrintSides(files) {
  let bw = 0;
  let color = 0;
  for (const file of files || []) {
    const totalPages = Number(file.totalPages);
    const selected = parseSelection(file.selection, totalPages);
    const colorPages = file.colourSelection ? parseSelection(file.colourSelection, totalPages) : new Set();
    const copies = Math.max(1, Number(file.copies) || 1);
    for (const page of selected) {
      if (colorPages.has(page)) color += copies;
      else bw += copies;
    }
  }
  return { bw, color };
}

async function couponDiscount(couponCode, subtotalPaise) {
  if (!couponCode) return { discountPaise: 0, coupon: null };
  const { rows } = await query(
    `SELECT * FROM coupons
     WHERE upper(code)=upper($1) AND active=true
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at >= NOW())
       AND (max_uses IS NULL OR used_count < max_uses)
     LIMIT 1`,
    [couponCode]
  );
  const coupon = rows[0];
  if (!coupon || subtotalPaise < coupon.min_order_paise) return { discountPaise: 0, coupon: null };
  let discountPaise = coupon.kind === "percent"
    ? Math.floor((subtotalPaise * coupon.value) / 100)
    : coupon.value;
  if (coupon.max_discount_paise) discountPaise = Math.min(discountPaise, coupon.max_discount_paise);
  return { discountPaise: Math.min(discountPaise, subtotalPaise), coupon };
}

export async function getWalletBalance(userId) {
  if (!userId) return 0;
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount_paise),0)::int AS balance
     FROM wallet_ledger
     WHERE user_id=$1 AND (expires_at IS NULL OR expires_at > NOW())`,
    [userId]
  );
  return rows[0]?.balance || 0;
}

export async function calculateQuote({ files, fulfilment, couponCode, walletRedeemPaise = 0, userId }) {
  const [pricing, delivery] = await Promise.all([getConfig("print_pricing"), getConfig("delivery")]);
  const { bw, color } = countPrintSides(files);
  const bwRatePaise = tierRate(bw, pricing.bw);
  const bwPaise = bw * bwRatePaise;
  const colorPaise = color * pricing.colorPaise;
  const printingSubtotalPaise = bwPaise + colorPaise;

  const { discountPaise, coupon } = await couponDiscount(couponCode, printingSubtotalPaise);
  const afterDiscount = Math.max(0, printingSubtotalPaise - discountPaise);

  let deliveryFeePaise = 0;
  if (fulfilment === "delivery" && delivery.enabled) {
    deliveryFeePaise = afterDiscount >= delivery.freeAbovePaise ? 0 : delivery.flatFeePaise;
  }

  const walletBalancePaise = await getWalletBalance(userId);
  const requestedWallet = Math.max(0, Number(walletRedeemPaise) || 0);
  const walletAppliedPaise = Math.min(requestedWallet, walletBalancePaise, afterDiscount + deliveryFeePaise);
  const totalPaise = Math.max(0, afterDiscount + deliveryFeePaise - walletAppliedPaise);
  const cashbackPaise = Math.floor((printingSubtotalPaise * Number(pricing.cashbackPercent || 0)) / 100);

  return {
    currency: "INR",
    counts: { bw, color },
    rates: { bwRatePaise, colorRatePaise: pricing.colorPaise },
    printingSubtotalPaise,
    discountPaise,
    deliveryFeePaise,
    walletBalancePaise,
    walletAppliedPaise,
    totalPaise,
    cashbackPaise,
    couponCode: coupon?.code || null,
    pricingStrategy: pricing.strategy || "flat",
  };
}
