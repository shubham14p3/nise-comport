import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { addresses, printJobs, storedFiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, readJson } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { isIdempotencyConflict, notifyNewRequest, recordEvent, withUniqueReference } from "@/lib/requests";
import { blackWhiteCost, COLOR_PAGE_RATE, countSelectedPages } from "@/lib/print-pricing";
import { recordRedemption, resolveCoupon } from "@/lib/promotions";
import { privateStoragePath } from "@/lib/storage";
import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const schema = z.object({
  fileId: z.uuid(), fileName: z.string().min(1).max(255), pageSelection: z.string().max(5000).default("all"),
  copies: z.number().int().min(1).max(50), colorPagesPerCopy: z.number().int().nonnegative(),
  sides: z.enum(["single", "double"]), paperSize: z.enum(["A4", "A3", "Letter"]), orientation: z.enum(["portrait", "landscape"]),
  fulfillment: z.enum(["pickup", "delivery"]), addressId: z.uuid().nullable().optional(),
  scheduledAt: z.string().nullable().optional(), coupon: z.string().trim().max(40).nullable().optional(),
  idempotencyKey: z.uuid().optional(),
});

async function readDocumentPageCount(file: typeof storedFiles.$inferSelect) {
  if (file.mimeType.startsWith("image/")) return 1;
  if (file.mimeType !== "application/pdf") throw new Error("Upload a PDF, converted Word document, or image to place a print order.");
  const bytes = await readFile(privateStoragePath(file.objectKey));
  const pdf = await getDocument({ data: new Uint8Array(bytes), disableFontFace: true }).promise;
  return pdf.numPages;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 });
  if (user.role === "demo") return NextResponse.json({ error: "The local demo account can’t place print orders." }, { status: 403 });
  try {
    const data = schema.parse(await readJson(request));
    const jobFields = { id: printJobs.id, reference: printJobs.reference, status: printJobs.status, subtotal: printJobs.subtotal, discount: printJobs.discount, total: printJobs.total };
    if (data.idempotencyKey) {
      const [existing] = await db.select(jobFields).from(printJobs).where(and(eq(printJobs.userId, user.id), eq(printJobs.idempotencyKey, data.idempotencyKey))).limit(1);
      if (existing) return NextResponse.json({ ok: true, job: existing, duplicate: true });
    }
    await enforceRate(RATE_RULES.printJobsPerUserHour, identity("user", user.id), "You’ve sent several print requests in the last hour. Please call or WhatsApp us.");
    const [file] = await db.select().from(storedFiles).where(and(eq(storedFiles.id, data.fileId), eq(storedFiles.userId, user.id))).limit(1);
    if (!file || file.originalName !== data.fileName) return NextResponse.json({ error: "Your private upload could not be found. Upload the document again." }, { status: 400 });
    if (data.fulfillment === "delivery") {
      if (!data.addressId) return NextResponse.json({ error: "Choose a saved delivery address." }, { status: 400 });
      const [address] = await db.select({ id: addresses.id }).from(addresses).where(and(eq(addresses.id, data.addressId), eq(addresses.userId, user.id))).limit(1);
      if (!address) return NextResponse.json({ error: "Choose one of your saved delivery addresses." }, { status: 400 });
    }

    const actualPages = await readDocumentPageCount(file);
    if (actualPages !== file.pageCount) return NextResponse.json({ error: "The document changed after upload. Upload it again to refresh the page count." }, { status: 400 });
    const selectedPerCopy = countSelectedPages(data.pageSelection, actualPages);
    if (data.colorPagesPerCopy > selectedPerCopy) return NextResponse.json({ error: "Colour pages can’t exceed the selected pages per copy." }, { status: 400 });
    const printedPageCount = selectedPerCopy * data.copies;
    const colorPages = data.colorPagesPerCopy * data.copies;
    const blackWhitePages = printedPageCount - colorPages;
    const subtotal = blackWhiteCost(blackWhitePages) + colorPages * COLOR_PAGE_RATE;

    let couponCode: string | null = null;
    let couponId: string | null = null;
    let discount = 0;
    if (data.coupon) {
      // Festival, sports, welcome and hand-made codes: live window, one use per customer, minimum order.
      const resolved = await resolveCoupon({ code: data.coupon, userId: user.id, amount: subtotal, context: { service: "print" } });
      couponCode = resolved.coupon.code;
      couponId = resolved.coupon.id;
      discount = resolved.discount ?? 0;
    }

    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    if (scheduledAt && (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now() + 15 * 60_000)) throw new PublicError("Choose a pickup or delivery time at least 15 minutes from now.", 400, { fields: { scheduledAt: "Choose a later time." } });
    if (scheduledAt && scheduledAt.getTime() > Date.now() + 60 * 24 * 60 * 60_000) throw new PublicError("Choose a pickup or delivery time within the next 60 days.", 400, { fields: { scheduledAt: "Choose an earlier date." } });
    const total = Math.max(0, subtotal - discount);
    let job: { id: string; reference: string; status: string; subtotal: string; discount: string; total: string };
    try {
      job = await withUniqueReference("PR", async (reference) => {
        const [row] = await db.insert(printJobs).values({
          reference, userId: user.id, status: "submitted", fileId: file.id, fileName: file.originalName,
          pageCount: printedPageCount, pageSelection: data.pageSelection.trim() || "all", copies: data.copies,
          blackWhitePages, colorPages, sides: data.sides, paperSize: data.paperSize, orientation: data.orientation,
          fulfillment: data.fulfillment, addressId: data.fulfillment === "delivery" ? data.addressId! : null,
          scheduledAt, couponCode, subtotal: subtotal.toFixed(2), discount: discount.toFixed(2), total: total.toFixed(2), idempotencyKey: data.idempotencyKey ?? null,
        }).returning(jobFields);
        return row;
      });
    } catch (error) {
      if (data.idempotencyKey && isIdempotencyConflict(error)) {
        const [existing] = await db.select(jobFields).from(printJobs).where(and(eq(printJobs.userId, user.id), eq(printJobs.idempotencyKey, data.idempotencyKey))).limit(1);
        if (existing) return NextResponse.json({ ok: true, job: existing, duplicate: true });
      }
      throw error;
    }
    if (couponId) await recordRedemption(couponId, user.id, "print", job.id, discount);
    await recordEvent("print", job.id, user.id, null, "submitted", "Created online");
    await notifyNewRequest(user, job.reference, "print order", [`File: ${file.originalName}`, `Pages: ${printedPageCount} (${colorPages} colour)`, `Fulfilment: ${data.fulfillment}`, `Estimate: ₹${total.toFixed(2)}`, ...(couponCode ? [`Coupon: ${couponCode} (−₹${discount.toFixed(2)})`] : [])]);
    return NextResponse.json({ ok: true, job }, { status: 201 });
  } catch (error) { return apiError(error); }
}
