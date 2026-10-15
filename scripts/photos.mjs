#!/usr/bin/env node
/**
 * Adds your own photos to the website gallery and service pages.
 *
 *   npm run photos                                   → everything in photo-inbox/
 *   npm run photos -- "C:\Users\me\Desktop\pics"     → a folder (or single files)
 *   npm run photos -- --service pan-card "D:\pan.jpg" → put these under a service
 *   npm run photos -- https://example.com/photo.jpg  → download links (your own photos only)
 *   npm run photos -- --title "Our new counter" counter.jpg
 *   npm run photos -- --no-git                       → convert only; don't commit and push
 *
 * For each photo: rotates it upright, removes GPS/camera data, resizes to max 1600 px, saves a
 * WebP (quality 82, looks the same and is ~10x smaller than quality 100) as
 * public/images/gallery/photos/<service>-telco-jamshedpur-<n>.webp, and records it in
 * src/lib/gallery-photos.ts with a title and alt text, then commits and pushes just those files.
 * Re-running skips photos already added.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const ROOT = process.cwd();
const INBOX = join(ROOT, "photo-inbox");
const OUT_DIR = join(ROOT, "public", "images", "gallery", "photos");
const MANIFEST = join(ROOT, "src", "lib", "gallery-photos.ts");
const HEADER = "/** Your own photos, added by `npm run photos` (scripts/photos.mjs). You can edit titles and alt text here. */\nexport type GalleryPhoto = { src: string; width: number; height: number; title: string; alt: string; service: string; hash: string; addedOn: string; hidden?: boolean };\n\nexport const galleryPhotos: GalleryPhoto[] = ";
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".heif", ".tif", ".tiff", ".bmp", ".gif"]);
const MAX_BYTES = 30 * 1024 * 1024;

// Folder names: services, festivals and shop tags (shared with the website and admin gallery).
const { describePhoto, isGalleryTag, photoFileBase } = await import("../src/lib/gallery-tags.ts");
const SERVICES = new Proxy({}, { get: (_target, key) => (typeof key === "string" && isGalleryTag(key) ? key : undefined) });

let sharp;
try { sharp = (await import("sharp")).default; }
catch {
  console.error("The image tool (sharp) isn't installed. Run: npm install --no-save sharp   then try again.");
  process.exit(1);
}

// ------------------------------------------------------------------ arguments
const args = process.argv.slice(2);
let forcedService = null, forcedTitle = null, git = true;
const inputs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--service") forcedService = args[++i];
  else if (args[i] === "--title") forcedTitle = args[++i];
  else if (args[i] === "--no-git") git = false;
  else inputs.push(args[i]);
}
if (forcedService && !SERVICES[forcedService]) {
  console.error(`Unknown category "${forcedService}". Use a folder name from photo-inbox/ (e.g. pan-card, diwali, shop).`);
  process.exit(1);
}

/** [{ file?, url?, service, fromInbox }] */
const jobs = [];
const isImage = (path) => IMAGE_EXT.has(extname(path).toLowerCase());
function addFolder(folder, service, fromInbox) {
  for (const name of readdirSync(folder)) {
    if (name.startsWith(".") || name === "_done" || name === "README.md") continue;
    // "all-photos" (or any unknown folder) = general photos of the centre.
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
  const base = photoFileBase(service);
  let n = manifest.filter((item) => item.src.includes(`/${base}-`)).length + 1;
  while (existsSync(join(OUT_DIR, `${base}-${n}.webp`))) n++;
  return `${base}-${n}.webp`;
}

let added = 0, skipped = 0, failed = 0;
const added_files = [];
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
    const number = Number(name.match(/-(\d+)\.webp$/)[1]);
    const text = describePhoto(job.service, number);
    manifest.push({
      src: `/images/gallery/photos/${name}`, width: info.width, height: info.height, title: forcedTitle ?? text.title, alt: text.alt,
      service: job.service, hash, addedOn: new Date().toISOString().slice(0, 10),
    });
    added_files.push(join(OUT_DIR, name));
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

// Save to GitHub: add only the new photos and the photo list, commit them, push.
if (added && git) {
  const { execFileSync } = await import("node:child_process");
  const run = (...cmd) => execFileSync("git", cmd, { cwd: ROOT, stdio: "inherit" });
  try {
    run("add", "--", MANIFEST, ...added_files);
    run("commit", "-m", `Add ${added} photo${added === 1 ? "" : "s"} to the gallery`, "--", MANIFEST, ...added_files);
    try { run("push"); console.log("Pushed to GitHub. The website shows them after the next deploy."); }
    catch { console.warn("Committed, but the push didn't work (no internet or not signed in?). Run: git push"); }
  } catch { console.warn("Couldn't commit automatically. Run: git add public/images/gallery/photos src/lib/gallery-photos.ts && git commit -m \"Add photos\" && git push"); }
} else if (added) {
  console.log("Not saved to GitHub (--no-git). Commit public/images/gallery/photos/ and src/lib/gallery-photos.ts when ready.");
}
