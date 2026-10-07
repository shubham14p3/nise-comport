import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { revalidateTag, unstable_cache } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { galleryItems } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { galleryPhotos } from "@/lib/gallery-photos";
import { describePhoto, isGalleryTag, photoFileBase, tagLabel } from "@/lib/gallery-tags";
import { privateStoragePath } from "@/lib/storage";

/** A photo as the website shows it: from `npm run photos` (file) or uploaded in Admin → Gallery. */
export type LivePhoto = {
  src: string; width: number; height: number; title: string; alt: string; tag: string;
  hidden: boolean; source: "file" | "upload"; id: string | null; addedOn: string;
};

export const MAX_GALLERY_UPLOAD_BYTES = 20 * 1024 * 1024;
const UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif", "image/gif", "image/bmp", "image/tiff"]);

async function loadRows() {
  try { return await db.select().from(galleryItems).orderBy(asc(galleryItems.createdAt)); }
  catch (error) { console.error("[gallery] photos table unavailable (run npm run db:migrate)", error); return []; }
}

/** Every photo, newest first: file photos with any staff edits applied, then uploads. Includes hidden ones. */
async function buildAll(): Promise<LivePhoto[]> {
  const rows = await loadRows();
  const bySrc = new Map(rows.map((row) => [row.src, row]));
  const files: LivePhoto[] = galleryPhotos.map((photo) => {
    const edit = bySrc.get(photo.src);
    return {
      src: photo.src, width: photo.width, height: photo.height, source: "file", id: edit?.id ?? null, addedOn: photo.addedOn,
      title: edit?.title ?? photo.title, alt: edit?.alt ?? photo.alt, tag: edit?.tag ?? photo.service, hidden: edit ? edit.hidden : Boolean(photo.hidden),
    };
  });
  const uploads: LivePhoto[] = rows.filter((row) => row.objectKey).map((row) => ({
    src: row.src, width: row.width, height: row.height, title: row.title, alt: row.alt, tag: row.tag, hidden: row.hidden,
    source: "upload", id: row.id, addedOn: row.createdAt.toISOString().slice(0, 10),
  }));
  return [...files, ...uploads].reverse();
}

const cachedAll = unstable_cache(buildAll, ["gallery-photos"], { revalidate: 300, tags: ["gallery"] });

/** Visible photos for the website (newest first). */
export async function livePhotos() {
  return (await cachedAll()).filter((photo) => !photo.hidden);
}

export async function livePhotosFor(tag: string) {
  return (await livePhotos()).filter((photo) => photo.tag === tag);
}

/** All photos for the admin gallery, including hidden ones. */
export async function adminPhotos() {
  return buildAll();
}

function changed(title: string, actor: { id: string }, detail?: string) {
  revalidateTag("gallery", { expire: 0 });
  return logActivity({ kind: "promotion", permission: "content", category: "content", title, detail, actorId: actor.id });
}

/** Change a photo's tag (service / festival / shop), title, alt text or visibility. */
export async function updatePhoto(src: string, patch: { tag?: string; title?: string; alt?: string; hidden?: boolean }, actor: { id: string; name: string }) {
  const all = await buildAll();
  const photo = all.find((item) => item.src === src);
  if (!photo) throw new PublicError("Photo not found.", 404);
  if (patch.tag !== undefined && !isGalleryTag(patch.tag)) throw new PublicError("Choose a service, festival or shop category.", 400);
  const tag = patch.tag ?? photo.tag;
  // A new category with the automatic title? Re-write the title and alt text for it.
  const auto = describePhoto(tag, 1);
  const retitle = patch.tag !== undefined && patch.tag !== photo.tag && patch.title === undefined;
  const next = {
    tag,
    title: (patch.title ?? (retitle ? auto.title : photo.title)).replace(/\s+/g, " ").trim().slice(0, 140) || auto.title,
    alt: (patch.alt ?? (retitle ? auto.alt.replace(/\(.*\)$/, "").trim() : photo.alt)).replace(/\s+/g, " ").trim().slice(0, 240) || auto.alt,
    hidden: patch.hidden ?? photo.hidden,
  };
  await db.insert(galleryItems).values({ src, objectKey: null, width: photo.width, height: photo.height, ...next, createdBy: actor.id })
    .onConflictDoUpdate({ target: galleryItems.src, set: { ...next, updatedAt: new Date() } });
  await changed(`${actor.name} ${patch.hidden === true ? "hid" : patch.hidden === false ? "showed" : "edited"} a gallery photo (${tagLabel(tag)})`, actor, src);
}

/** Converts an uploaded JPG/PNG/HEIC… to an upright, GPS-free WebP and adds it to the gallery. */
export async function uploadPhoto(file: File, tagInput: string, actor: { id: string; name: string }) {
  const tag = isGalleryTag(tagInput) ? tagInput : "shop";
  if (!UPLOAD_TYPES.has(file.type) && !/\.(jpe?g|png|webp|heic|heif|avif|gif|bmp|tiff?)$/i.test(file.name)) throw new PublicError("Upload a photo (JPG, PNG, WebP or HEIC).", 400);
  if (file.size > MAX_GALLERY_UPLOAD_BYTES) throw new PublicError("Keep each photo under 20 MB.", 413);
  const input = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha1").update(input).digest("hex").slice(0, 16);
  const all = await buildAll();
  const [duplicate] = await db.select({ id: galleryItems.id }).from(galleryItems).where(eq(galleryItems.hash, hash)).limit(1);
  if (duplicate || galleryPhotos.some((photo) => photo.hash === hash)) throw new PublicError("This photo is already in the gallery.", 409);

  let sharp: typeof import("sharp").default;
  try { sharp = (await import("sharp")).default; }
  catch { throw new PublicError("Photo conversion isn’t available on this server. Ask your developer to install “sharp”.", 503); }
  let output: { data: Buffer; info: { width: number; height: number } };
  try {
    output = await sharp(input, { failOn: "none" }).rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 }).toBuffer({ resolveWithObject: true });
  } catch { throw new PublicError("That file couldn’t be read as a photo.", 400); }

  const base = photoFileBase(tag);
  let n = all.filter((photo) => photo.src.includes(`/${base}-`)).length + 1;
  while (all.some((photo) => photo.src.endsWith(`/${base}-${n}.webp`))) n++;
  const name = `${base}-${n}.webp`;
  const objectKey = `gallery/${name}`;
  const path = privateStoragePath(objectKey);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, output.data, { mode: 0o644 });
  const text = describePhoto(tag, n);
  try {
    const [row] = await db.insert(galleryItems).values({
      src: `/gallery/photo/${name}`, objectKey, tag, title: text.title, alt: text.alt,
      width: output.info.width, height: output.info.height, hash, createdBy: actor.id,
    }).returning();
    await changed(`${actor.name} added a gallery photo (${tagLabel(tag)})`, actor, row.src);
    return { src: row.src, tag, title: row.title };
  } catch (error) { await rm(path, { force: true }); throw error; }
}

/** Removes an uploaded photo (file photos can only be hidden). */
export async function deletePhoto(src: string, actor: { id: string; name: string }) {
  const [row] = await db.select().from(galleryItems).where(eq(galleryItems.src, src)).limit(1);
  if (!row?.objectKey) throw new PublicError("Only photos uploaded here can be deleted. Hide the others instead.", 400);
  await db.delete(galleryItems).where(eq(galleryItems.id, row.id));
  await rm(privateStoragePath(row.objectKey), { force: true });
  await changed(`${actor.name} deleted a gallery photo (${tagLabel(row.tag)})`, actor, src);
}

/** Bytes of an uploaded photo for /gallery/photo/<name>. */
export async function readUploadedPhoto(name: string) {
  if (!/^[a-z0-9-]+\.webp$/.test(name)) return null;
  try { return await readFile(privateStoragePath(`gallery/${name}`)); }
  catch { return null; }
}

