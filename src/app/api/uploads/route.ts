import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";
import { and, eq } from "drizzle-orm";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { printJobs, storedFiles } from "@/db/schema";
import { apiError } from "@/lib/http";
import { privateStoragePath } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;
const execFileAsync = promisify(execFile);
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const imageTypes = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"]]);
function validImageSignature(type: string, bytes: Buffer) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/webp") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  return false;
}
const wordTypes = new Set(["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const spreadsheetTypes = new Set(["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);

async function pdfPageCount(bytes: Buffer) {
  const pdf = await getDocument({ data: new Uint8Array(bytes), disableFontFace: true }).promise;
  return pdf.numPages;
}

async function convertWordToPdf(fileName: string, bytes: Buffer) {
  const directory = await mkdtemp(join(tmpdir(), "nise-convert-"));
  try {
    const safeName = basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
    const inputPath = join(directory, safeName);
    const outputPath = join(directory, `${safeName.slice(0, -extname(safeName).length)}.pdf`);
    await writeFile(inputPath, bytes, { mode: 0o600 });
    const office = process.env.LIBREOFFICE_BIN || "soffice";
    await execFileAsync(office, [`-env:UserInstallation=file://${join(directory, "profile")}`, "--headless", "--convert-to", "pdf", "--outdir", directory, inputPath], { timeout: 45_000, maxBuffer: 1024 * 1024 });
    return await readFile(outputPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new Error("Word-to-PDF conversion is unavailable. Please upload a PDF, or ask the service desk for help.");
    throw new Error("We could not convert this Word document. Save it as PDF and upload it again.");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in before uploading documents." }, { status: 401 });
  let finalPath: string | undefined;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    if (!file.size || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Choose a file up to 20 MB." }, { status: 400 });

    const incoming = Buffer.from(await file.arrayBuffer());
    let content = incoming;
    let mimeType = file.type;
    let pageCount: number | null = null;
    const name = basename(file.name).replace(/[\r\n]/g, "_");
    const extension = extname(name).toLowerCase();

    if (file.type === "application/pdf" && extension === ".pdf") {
      pageCount = await pdfPageCount(incoming);
      if (pageCount < 1 || pageCount > 1000) return NextResponse.json({ error: "PDFs can contain up to 1,000 pages." }, { status: 400 });
    } else if (imageTypes.has(file.type) && imageTypes.get(file.type) === extension && validImageSignature(file.type, incoming)) {
      pageCount = 1;
    } else if (wordTypes.has(file.type) && [".doc", ".docx"].includes(extension)) {
      content = await convertWordToPdf(name, incoming);
      mimeType = "application/pdf";
      pageCount = await pdfPageCount(content);
      if (pageCount < 1 || pageCount > 1000) return NextResponse.json({ error: "Converted files can contain up to 1,000 pages." }, { status: 400 });
    } else if (spreadsheetTypes.has(file.type) && [".csv", ".xlsx"].includes(extension) && user.role === "admin") {
      pageCount = null;
    } else {
      return NextResponse.json({ error: "Upload a valid PDF, DOC, DOCX, JPG, PNG, or WEBP file. Admins may also upload CSV/XLSX data files." }, { status: 400 });
    }

    if (content.byteLength > MAX_FILE_SIZE) return NextResponse.json({ error: "The converted PDF is larger than 20 MB. Please compress the document and try again." }, { status: 400 });
    const objectKey = `${user.id}/${randomUUID()}${mimeType === "application/pdf" ? ".pdf" : imageTypes.get(mimeType)}`;
    finalPath = privateStoragePath(objectKey);
    await mkdir(join(finalPath, ".."), { recursive: true, mode: 0o700 });
    await writeFile(finalPath, content, { mode: 0o600, flag: "wx" });
    const [record] = await db.insert(storedFiles).values({
      userId: user.id, objectKey, originalName: name, mimeType, sizeBytes: content.byteLength,
      pageCount, retainUntil: new Date(Date.now() + 30 * 24 * 60 * 60_000),
    }).returning({ id: storedFiles.id, originalName: storedFiles.originalName, sizeBytes: storedFiles.sizeBytes, pageCount: storedFiles.pageCount, mimeType: storedFiles.mimeType });
    return NextResponse.json({ ok: true, file: record }, { status: 201 });
  } catch (error) {
    if (finalPath) await rm(finalPath, { force: true }).catch(() => undefined);
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "File id is required." }, { status: 400 });
  const [file] = await db.select().from(storedFiles).where(and(eq(storedFiles.id, id), eq(storedFiles.userId, user.id))).limit(1);
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
  try {
    const bytes = await readFile(privateStoragePath(file.objectKey));
    return new NextResponse(bytes, { headers: { "Content-Type": file.mimeType, "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "The private file is no longer available." }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "File id is required." }, { status: 400 });
  const [file] = await db.select().from(storedFiles).where(and(eq(storedFiles.id, id), eq(storedFiles.userId, user.id))).limit(1);
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (file.requestId) return NextResponse.json({ error: "This file is attached to a service request." }, { status: 409 });
  const linked = await db.select({ id: printJobs.id }).from(printJobs).where(eq(printJobs.fileId, id)).limit(1);
  if (linked.length) return NextResponse.json({ error: "This file is attached to a print order." }, { status: 409 });
  await db.delete(storedFiles).where(eq(storedFiles.id, id));
  await rm(privateStoragePath(file.objectKey), { force: true }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
