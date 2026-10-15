import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { desc, eq } from "drizzle-orm";
import { media } from "@/db/schema";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { privateStoragePath } from "@/lib/storage";

/** JPEG and PNG only: WhatsApp image messages don't accept WebP, and SVG could carry scripts. */
const POSTER_TYPES = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"]]);
export const MAX_POSTER_BYTES = 5 * 1024 * 1024;

function signatureMatches(type: string, bytes: Buffer) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return false;
}

export type MediaItem = { id: string; url: string; title: string; locale: string | null; category: string | null; createdAt: string };

export async function listMedia(): Promise<MediaItem[]> {
  const rows = await db.select().from(media).orderBy(desc(media.createdAt)).limit(200);
  return rows.map((row) => ({ id: row.id, url: `/media/${row.id}`, title: row.title, locale: row.locale, category: row.category, createdAt: row.createdAt.toISOString() }));
}

export async function savePoster(file: File, meta: { title: string; locale?: string | null; category?: string | null }, uploadedBy: string) {
  const extension = POSTER_TYPES.get(file.type);
  if (!extension) throw new PublicError("Upload a JPG or PNG poster.", 400);
  if (file.size > MAX_POSTER_BYTES) throw new PublicError("Keep posters under 5 MB (WhatsApp’s limit for images).", 413);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!signatureMatches(file.type, bytes)) throw new PublicError("That file isn’t a valid JPG or PNG image.", 400);
  const id = randomUUID();
  const objectKey = `media/${id}${extension}`;
  const path = privateStoragePath(objectKey);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes, { mode: 0o600 });
  try {
    const title = meta.title.replace(/\s+/g, " ").trim().slice(0, 120) || file.name.slice(0, 120);
    const locale = meta.locale === "en" || meta.locale === "hi" || meta.locale === "bn" ? meta.locale : null;
    const [row] = await db.insert(media).values({ id, objectKey, originalName: file.name.slice(0, 255), mimeType: file.type, sizeBytes: file.size, title, locale, category: meta.category?.slice(0, 40) || null, uploadedBy }).returning();
    return { id: row.id, url: `/media/${row.id}`, title: row.title, locale: row.locale, category: row.category, createdAt: row.createdAt.toISOString() } satisfies MediaItem;
  } catch (error) {
    await rm(path, { force: true });
    throw error;
  }
}

export async function readPoster(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!row || !POSTER_TYPES.has(row.mimeType)) return null;
  try { return { bytes: await readFile(privateStoragePath(row.objectKey)), mimeType: row.mimeType }; }
  catch { return null; }
}
