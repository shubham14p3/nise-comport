import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { addresses, coupons, printJobs, storedFiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, makeReference } from "@/lib/http";
import { blackWhiteCost, COLOR_PAGE_RATE, countSelectedPages, couponDiscount } from "@/lib/print-pricing";
import { privateStoragePath } from "@/lib/storage";
import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const schema = z.object({
  fileId: z.uuid(), fileName: z.string().min(1).max(255), pageSelection: z.string().max(5000).default("all"),
  copies: z.number().int().min(1).max(50), colorPagesPerCopy: z.number().int().nonnegative(),
  sides: z.enum(["single", "double"]), paperSize: z.enum(["A4", "A3", "Letter"]), orientation: z.enum(["portrait", "landscape"]),
  fulfillment: z.enum(["pickup", "delivery"]), addressId: z.uuid().nullable().optional(),
  scheduledAt: z.string().nullable().optional(), coupon: z.string().trim().max(40).nullable().optional(),
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
  try {
    const data = schema.parse(await request.json());
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
    let discount = 0;
    if (data.coupon) {
      const code = data.coupon.toUpperCase();
      const [coupon] = await db.select().from(coupons).where(and(eq(coupons.code, code), eq(coupons.active, true), or(isNull(coupons.expiresAt), gt(coupons.expiresAt, new Date())))).limit(1);
      if (!coupon || subtotal < Number(coupon.minimumAmount)) return NextResponse.json({ error: "This coupon is no longer valid for the current order." }, { status: 400 });
      couponCode = coupon.code;
      discount = couponDiscount(coupon.discountType, Number(coupon.discountValue), subtotal);
      if (!discount) return NextResponse.json({ error: "This coupon is no longer valid for the current order." }, { status: 400 });
    }

    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    if (scheduledAt && (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now())) return NextResponse.json({ error: "Choose a future pickup or delivery time." }, { status: 400 });
    const total = Math.max(0, subtotal - discount);
    const [job] = await db.insert(printJobs).values({
      reference: makeReference("PR"), userId: user.id, status: "submitted", fileId: file.id, fileName: file.originalName,
      pageCount: printedPageCount, pageSelection: data.pageSelection.trim() || "all", copies: data.copies,
      blackWhitePages, colorPages, sides: data.sides, paperSize: data.paperSize, orientation: data.orientation,
      fulfillment: data.fulfillment, addressId: data.fulfillment === "delivery" ? data.addressId! : null,
      scheduledAt, couponCode, subtotal: subtotal.toFixed(2), discount: discount.toFixed(2), total: total.toFixed(2),
    }).returning({ id: printJobs.id, reference: printJobs.reference, status: printJobs.status, subtotal: printJobs.subtotal, discount: printJobs.discount, total: printJobs.total });
    return NextResponse.json({ ok: true, job }, { status: 201 });
  } catch (error) { return apiError(error); }
}
