import { createCipheriv, createHmac, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike } from "drizzle-orm";
import ExcelJS from "exceljs";
import { z } from "zod";
import { panImports, panRecords, storedFiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { privateStoragePath } from "@/lib/storage";

export const runtime = "nodejs";
const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
function encryptionKey() {
  const encoded = process.env.PAN_ENCRYPTION_KEY;
  if (!encoded) throw new Error("PAN import encryption is not configured.");
  const key = Buffer.from(encoded, "base64");
  if (key.byteLength !== 32) throw new Error("PAN_ENCRYPTION_KEY must be base64 encoding of exactly 32 random bytes.");
  return key;
}
function panIndexKey(key: Buffer) { return createHmac("sha256", key).update("NISE-COMPORT-PAN-INDEX-v1").digest(); }
function encryptPan(value: string, key: Buffer) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [nonce, cipher.getAuthTag(), ciphertext].map(part => part.toString("base64url")).join(".");
}
function cellText(value: ExcelJS.CellValue | undefined) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in value && typeof value.text === "string") return value.text.trim();
  return String(value).trim();
}
function normalizeHeader(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, ""); }
/** The owner, or staff with the PAN permission. */
async function isAdmin() { const user = await getCurrentUser(); return hasPermission(user, "pan") ? user : null; }

export async function POST(request: NextRequest) {
  const user = await isAdmin();
  if (!user) return NextResponse.json({ error: "PAN data access is required." }, { status: 403 });
  try {
    const { fileId } = z.object({ fileId: z.uuid() }).parse(await request.json());
    const [file] = await db.select().from(storedFiles).where(and(eq(storedFiles.id, fileId), eq(storedFiles.userId, user.id))).limit(1);
    const allowed = file && ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(file.mimeType);
    if (!file || !allowed || file.sizeBytes > MAX_IMPORT_BYTES) return NextResponse.json({ error: "Choose a CSV or XLSX file under 20 MB." }, { status: 400 });
    const workbook = new ExcelJS.Workbook();
    const sourcePath = privateStoragePath(file.objectKey);
    if (file.mimeType === "text/csv") await workbook.csv.readFile(sourcePath);
    else await workbook.xlsx.load(await readFile(sourcePath) as never);
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2 || sheet.rowCount > 50_001) return NextResponse.json({ error: "The file needs a header row and between 1 and 50,000 data rows." }, { status: 400 });
    const headers: string[] = [];
    sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, column) => { headers[column - 1] = normalizeHeader(cellText(cell.value)); });
    const panColumn = headers.findIndex(header => ["pan", "pannumber", "panid", "pancard"].includes(header));
    const nameColumn = headers.findIndex(header => ["name", "holdername", "applicantname", "customername"].includes(header));
    if (panColumn < 0 || nameColumn < 0) return NextResponse.json({ error: "Include columns named PAN and Name (or Holder Name)." }, { status: 400 });
    const key = encryptionKey();
    const candidates: { panHash: string; encryptedPan: string; holderName: string }[] = [];
    let rejected = 0;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const pan = cellText(row.getCell(panColumn + 1).value).toUpperCase().replace(/\s+/g, "");
      const holderName = cellText(row.getCell(nameColumn + 1).value).replace(/\s+/g, " ");
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan) || holderName.length < 2 || holderName.length > 150) { rejected++; return; }
      const panHash = createHmac("sha256", panIndexKey(key)).update(pan).digest("hex");
      candidates.push({ panHash, encryptedPan: encryptPan(pan, key), holderName });
    });
    const [batch] = await db.insert(panImports).values({ uploadedBy: user.id, fileId, rowCount: Math.max(0, sheet.rowCount - 1), status: "processing" }).returning({ id: panImports.id });
    let accepted = 0;
    for (let offset = 0; offset < candidates.length; offset += 500) {
      const rows = candidates.slice(offset, offset + 500).map(record => ({ ...record, importId: batch.id }));
      if (rows.length) accepted += (await db.insert(panRecords).values(rows).onConflictDoNothing().returning({ id: panRecords.id })).length;
    }
    const rejectedRows = rejected + candidates.length - accepted;
    await db.update(panImports).set({ acceptedRows: accepted, rejectedRows, status: "completed" }).where(eq(panImports.id, batch.id));
    return NextResponse.json({ ok: true, import: { id: batch.id, rowCount: sheet.rowCount - 1, acceptedRows: accepted, rejectedRows } }, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function GET(request: NextRequest) {
  const user = await isAdmin();
  if (!user) return NextResponse.json({ error: "PAN data access is required." }, { status: 403 });
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const imports = await db.select({ id: panImports.id, rowCount: panImports.rowCount, acceptedRows: panImports.acceptedRows, rejectedRows: panImports.rejectedRows, createdAt: panImports.createdAt }).from(panImports).orderBy(desc(panImports.createdAt)).limit(25);
  if (!query) return NextResponse.json({ imports, records: [] });
  let records: { id: string; holderName: string; recordStatus: string; createdAt: Date }[] = [];
  if (/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(query)) {
    const key = encryptionKey(); const hash = createHmac("sha256", panIndexKey(key)).update(query.toUpperCase()).digest("hex");
    records = await db.select({ id: panRecords.id, holderName: panRecords.holderName, recordStatus: panRecords.recordStatus, createdAt: panRecords.createdAt }).from(panRecords).where(eq(panRecords.panHash, hash)).limit(20);
  } else {
    const safeQuery = query.replace(/[\\%_]/g, "\\$&").slice(0, 100);
    records = await db.select({ id: panRecords.id, holderName: panRecords.holderName, recordStatus: panRecords.recordStatus, createdAt: panRecords.createdAt }).from(panRecords).where(ilike(panRecords.holderName, `%${safeQuery}%`)).orderBy(desc(panRecords.createdAt)).limit(50);
  }
  return NextResponse.json({ imports, records });
}
