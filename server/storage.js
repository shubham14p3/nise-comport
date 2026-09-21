import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import multer from "multer";
import jwt from "jsonwebtoken";
import { PDFDocument } from "pdf-lib";

const execFileAsync = promisify(execFile);
const root = path.resolve(process.env.PRIVATE_UPLOAD_DIR || "./private_uploads");
const incomingDir = path.join(root, "incoming");
const ordersDir = path.join(root, "orders");
const preparedDir = path.join(root, "prepared");
const maxBytes = Number(process.env.MAX_UPLOAD_MB || 25) * 1024 * 1024;
const allowedExtensions = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]);
const allowedMime = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

export async function ensureStorage() {
  await Promise.all([
    fs.mkdir(incomingDir, { recursive: true }),
    fs.mkdir(ordersDir, { recursive: true }),
    fs.mkdir(preparedDir, { recursive: true }),
  ]);
}

function safeBaseName(name) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120);
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    fsSync.mkdirSync(incomingDir, { recursive: true });
    cb(null, incomingDir);
  },
  filename(_req, file, cb) {
    cb(null, `${Date.now()}-${crypto.randomUUID()}-${safeBaseName(file.originalname)}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: maxBytes, files: 20 },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(ext) || !allowedMime.has(file.mimetype)) {
      return cb(Object.assign(new Error("Only PDF, Word, JPG and PNG files are supported"), { status: 400 }));
    }
    cb(null, true);
  },
});

function uploadSecret() {
  return process.env.JWT_SECRET;
}

export async function inspectDocument(filePath, originalName, mimeType) {
  const ext = path.extname(originalName).toLowerCase();
  if (mimeType === "application/pdf" || ext === ".pdf") {
    const bytes = await fs.readFile(filePath);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false });
    return { totalPages: pdf.getPageCount(), previewType: "pdf", convertedPath: filePath };
  }
  if (mimeType.startsWith("image/")) {
    return { totalPages: 1, previewType: "image", convertedPath: filePath };
  }
  if (ext === ".doc" || ext === ".docx") {
    const convertedPath = await convertWordToPdf(filePath);
    const bytes = await fs.readFile(convertedPath);
    const pdf = await PDFDocument.load(bytes);
    return { totalPages: pdf.getPageCount(), previewType: "pdf", convertedPath };
  }
  throw Object.assign(new Error("Unsupported document type"), { status: 400 });
}

export async function convertWordToPdf(filePath) {
  const binary = process.env.LIBREOFFICE_BIN;
  if (!binary) {
    throw Object.assign(
      new Error("Word conversion is not enabled on this server. Configure LIBREOFFICE_BIN or upload a PDF."),
      { status: 503, code: "WORD_CONVERTER_NOT_CONFIGURED" }
    );
  }
  const outputDir = path.dirname(filePath);
  await execFileAsync(binary, ["--headless", "--convert-to", "pdf", "--outdir", outputDir, filePath], { timeout: 60_000 });
  const pdfPath = path.join(outputDir, `${path.basename(filePath, path.extname(filePath))}.pdf`);
  await fs.access(pdfPath);
  return pdfPath;
}

export function signUploadToken(metadata) {
  return jwt.sign(metadata, uploadSecret(), { expiresIn: "2h", issuer: "nise-upload" });
}

export function verifyUploadToken(token) {
  return jwt.verify(token, uploadSecret(), { issuer: "nise-upload" });
}

export async function finalizeUpload({ token, orderNumber }) {
  const meta = verifyUploadToken(token);
  const currentPath = path.resolve(meta.path);
  if (!currentPath.startsWith(incomingDir)) throw Object.assign(new Error("Invalid upload token"), { status: 400 });
  const orderDir = path.join(ordersDir, orderNumber);
  await fs.mkdir(orderDir, { recursive: true });
  const finalName = `${crypto.randomUUID()}-${safeBaseName(meta.originalName)}`;
  const finalPath = path.join(orderDir, finalName);
  await fs.rename(currentPath, finalPath);

  let convertedFinalPath = finalPath;
  if (meta.convertedPath && path.resolve(meta.convertedPath) !== currentPath) {
    const convertedName = `${crypto.randomUUID()}-${safeBaseName(path.basename(meta.convertedPath))}`;
    convertedFinalPath = path.join(orderDir, convertedName);
    await fs.rename(path.resolve(meta.convertedPath), convertedFinalPath);
  }

  return {
    originalName: meta.originalName,
    mimeType: meta.mimeType,
    sizeBytes: meta.sizeBytes,
    totalPages: meta.totalPages,
    storageKey: path.relative(root, finalPath),
    preparedStorageKey: convertedFinalPath !== finalPath ? path.relative(root, convertedFinalPath) : null,
  };
}

export function resolveStorageKey(key) {
  const target = path.resolve(root, key);
  if (!target.startsWith(root)) throw Object.assign(new Error("Invalid storage key"), { status: 400 });
  return target;
}

function parsePages(selection, totalPages) {
  const pages = new Set();
  for (const raw of String(selection || "").split(",")) {
    const part = raw.trim();
    if (!part) continue;
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < a || b > totalPages) throw Object.assign(new Error(`Invalid page range: ${part}`), { status: 400 });
      for (let p = a; p <= b; p++) pages.add(p);
    } else {
      const p = Number(part);
      if (!Number.isInteger(p) || p < 1 || p > totalPages) throw Object.assign(new Error(`Invalid page: ${part}`), { status: 400 });
      pages.add(p);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

export async function preparePdf({ sourceKey, selection, copies = 1, outputName }) {
  const sourcePath = resolveStorageKey(sourceKey);
  const sourceBytes = await fs.readFile(sourcePath);
  const sourcePdf = await PDFDocument.load(sourceBytes);
  const pages = parsePages(selection, sourcePdf.getPageCount());
  const output = await PDFDocument.create();
  for (let c = 0; c < Math.max(1, Number(copies) || 1); c++) {
    const copied = await output.copyPages(sourcePdf, pages.map((p) => p - 1));
    copied.forEach((page) => output.addPage(page));
  }
  const bytes = await output.save();
  const filename = `${Date.now()}-${crypto.randomUUID()}-${safeBaseName(outputName || "print-ready.pdf")}`;
  const outPath = path.join(preparedDir, filename);
  await fs.writeFile(outPath, bytes);
  return path.relative(root, outPath);
}

export async function cleanupExpiredFiles(rows) {
  for (const row of rows) {
    for (const key of [row.storage_key, row.prepared_storage_key]) {
      if (!key) continue;
      try { await fs.unlink(resolveStorageKey(key)); } catch {}
    }
  }
}
