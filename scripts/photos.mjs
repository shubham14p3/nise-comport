#!/usr/bin/env node
/**
 * Adds your own photos to the website gallery and service pages.
 *
 *   npm run photos                                   → everything in photo-inbox/
 *   npm run photos -- "C:\Users\me\Desktop\pics"     → a folder (or single files)
 *   npm run photos -- --service pan-card "D:\pan.jpg" → put these under a service
 *   npm run photos -- https://example.com/photo.jpg  → download links (your own photos only)
 *   npm run photos -- --title "Our new counter" counter.jpg
 *
 * For each photo: rotates it upright, removes GPS/camera data, resizes to max 1600 px, saves a
 * WebP (quality 82, looks the same and is ~10x smaller than quality 100) as
 * public/images/gallery/photos/<service>-telco-jamshedpur-<n>.webp, and records it in
 * src/lib/gallery-photos.ts with a title and alt text. Re-running skips photos already added.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const ROOT = process.cwd();
const INBOX = join(ROOT, "photo-inbox");
const OUT_DIR = join(ROOT, "public", "images", "gallery", "photos");
const MANIFEST = join(ROOT, "src", "lib", "gallery-photos.ts");
const HEADER = "/** Your own photos, added by `npm run photos` (scripts/photos.mjs). You can edit titles and alt text here. */\nexport type GalleryPhoto = { src: string; width: number; height: number; title: string; alt: string; service: string; hash: string; addedOn: string };\n\nexport const galleryPhotos: GalleryPhoto[] = ";
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".heif", ".tif", ".tiff", ".bmp", ".gif"]);
const MAX_BYTES = 30 * 1024 * 1024;

// Service folder → name used in titles. Unknown folders are treated as "shop".
const SERVICES = {
  "pan-card": "PAN card", aadhaar: "Aadhaar update", "income-caste-residence-certificate": "Income, caste & residence certificate",
  "voter-id": "Voter ID", "passport-driving-licence": "Passport & driving licence", "aeps-money-transfer": "AEPS & money transfer",
  "bike-insurance": "Bike insurance", "car-insurance": "Car insurance", "health-life-insurance": "Health & life insurance",
  "scholarship-forms": "Scholarship forms", "exam-forms": "Exam & job forms", "bill-payment-recharge": "Bill payment & recharge",
  "itr-gst": "ITR & GST", "printing-scanning": "Printing & scanning", "computer-repair": "Computer & printer service",
  "website-design": "Website design", "ticket-booking": "Ticket booking", "lic-policy": "LIC policy service",
  "mutual-fund-sip": "SIP & mutual fund", "rent-agreement": "Rent agreement", "fssai-license": "FSSAI licence",
  "udyam-registration": "Udyam registration", "jeevan-pramaan": "Jeevan Pramaan", "birth-death-certificate": "Birth & death certificate",
  "land-mutation": "Land mutation", "aadhaar-pvc-card": "Aadhaar PVC card", "bank-account-opening": "Bank account opening",
  "ayushman-card": "Ayushman card", "ration-card": "Ration card", "abua-awas-yojana": "Abua Awas Yojana",
  shop: "Our desk", team: "Our team",
};

let sharp;
try { sharp = (await import("sharp")).default; }
catch {
  console.error("The image tool (sharp) isn't installed. Run: npm install --no-save sharp   then try again.");
  process.exit(1);
}

// ------------------------------------------------------------------ arguments
const args = process.argv.slice(2);
let forcedService = null, forcedTitle = null;
const inputs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--service") forcedService = args[++i];
  else if (args[i] === "--title") forcedTitle = args[++i];
  else inputs.push(args[i]);
}
if (forcedService && !SERVICES[forcedService]) {
  console.error(`Unknown service "${forcedService}". Use one of:\n  ${Object.keys(SERVICES).join(", ")}`);
  process.exit(1);
}

/** [{ file?, url?, service, fromInbox }] */
const jobs = [];
const isImage = (path) => IMAGE_EXT.has(extname(path).toLowerCase());
function addFolder(folder, service, fromInbox) {
  for (const name of readdirSync(folder)) {
    if (name.startsWith(".") || name === "_done" || name === "README.md") continue;
    const path = join(folder, name);
    if (statSync(path).isDirectory()) addFolder(path, forcedService ?? (SERVICES[name] ? name : service), fromInbox);
    else if (isImage(path)) jobs.push({ file: path, service: forcedService ?? service, fromInbox });
  }
}
if (!inputs.length) {
  mkdirSync(INBOX, { recursive: true });
  addFolder(INBOX, "shop", true);
} else {
  for (const input of inputs) {
    if (/^https?:\/\//i.test(input)) { jobs.push({ url: input, service: forcedService ?? "shop" }); continue; }
    const path = resolve(input);
    if (!existsSync(path)) { console.warn(`  ! Not found: ${input}`); continue; }
    if (statSync(path).isDirectory()) addFolder(path, forcedService ?? (SERVICES[basename(path)] ? basename(path) : "shop"), false);
    else if (isImage(path)) jobs.push({ file: path, service: forcedService ?? "shop" });
  }
}
if (!jobs.length) {
  console.log("No photos found. Put them in photo-inbox/<service>/ (see photo-inbox/README.md) and run npm run photos again.");
  process.exit(0);
}

// ------------------------------------------------------------------ processing
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8").slice(readFileSync(MANIFEST, "utf8").indexOf("galleryPhotos: GalleryPhoto[] = ") + 32).replace(/;\s*$/, "")) : [];
const known = new Set(manifest.map((item) => item.hash));
mkdirSync(OUT_DIR, { recursive: true });

async function bytesFor(job) {
  if (job.file) return readFileSync(job.file);
  const response = await fetch(job.url, { headers: { "user-agent": "Mozilla/5.0 (NISE COMPORT photo import)", accept: "image/*" }, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`download failed (${response.status})`);
  if (!(response.headers.get("content-type") ?? "").startsWith("image/")) throw new Error("the link is not an image");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_BYTES) throw new Error("image is larger than 30 MB");
  return buffer;
}

function nextName(service) {
  const base = `${service === "shop" ? "nise-comport-pragya-kendra" : service}-telco-jamshedpur`;
  let n = manifest.filter((item) => item.src.includes(`/${base}-`)).length + 1;
  while (existsSync(join(OUT_DIR, `${base}-${n}.webp`))) n++;
  return `${base}-${n}.webp`;
}

let added = 0, skipped = 0, failed = 0;
for (const job of jobs) {
  const label = job.file ? basename(job.file) : job.url;
  try {
    const input = await bytesFor(job);
    const hash = createHash("sha1").update(input).digest("hex").slice(0, 16);
    if (known.has(hash)) { skipped++; console.log(`  = already added: ${label}`); if (job.fromInbox) moveDone(job.file); continue; }
    const name = nextName(job.service);
    const { data, info } = await sharp(input, { failOn: "none" })
      .rotate()                                   // upright, using the camera's orientation
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })           // metadata (GPS, camera) is not copied
      .toBuffer({ resolveWithObject: true });
    writeFileSync(join(OUT_DIR, name), data);
    const what = SERVICES[job.service] ?? "Our desk";
    const number = name.match(/-(\d+)\.webp$/)[1];
    const title = forcedTitle ?? (job.service === "shop" ? "NISE COMPORT, Kharangajhar, Telco" : job.service === "team" ? "The NISE COMPORT team" : `${what} at NISE COMPORT`);
    manifest.push({
      src: `/images/gallery/photos/${name}`, width: info.width, height: info.height, title,
      alt: `${job.service === "shop" || job.service === "team" ? what : `${what} help`} at NISE COMPORT Pragya Kendra, Kharangajhar, Telco, Jamshedpur (photo ${number})`,
      service: job.service, hash, addedOn: new Date().toISOString().slice(0, 10),
    });
    known.add(hash);
    added++;
    console.log(`  + ${label} → ${name} (${info.width}×${info.height}, ${(data.length / 1024).toFixed(0)} KB)`);
    if (job.fromInbox) moveDone(job.file);
  } catch (error) {
    failed++;
    console.warn(`  ! ${label}: ${error instanceof Error ? error.message : error}`);
  }
}

function moveDone(file) {
  const done = join(INBOX, "_done");
  mkdirSync(done, { recursive: true });
  let target = join(done, basename(file));
  for (let n = 2; existsSync(target); n++) target = join(done, `${basename(file, extname(file))}-${n}${extname(file)}`);
  try { renameSync(file, target); } catch { /* leave it in place */ }
}

writeFileSync(MANIFEST, `${HEADER}${JSON.stringify(manifest, null, 2)};\n`);
console.log(`\nAdded ${added}, already there ${skipped}, failed ${failed}. Gallery now has ${manifest.length} photos.`);
console.log("Edit titles in src/lib/gallery-photos.ts if you like, then commit the new files in public/images/gallery/photos/ and that file.");
