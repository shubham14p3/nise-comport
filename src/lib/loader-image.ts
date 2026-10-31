import sharp from "sharp";
import { PublicError } from "./errors.ts";
export const MAX_LOADER_BYTES = 2 * 1024 * 1024;
const formats: Record<string, string> = { "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" };

/** Rasterize SVG instead of serving active XML; preserve GIF/WebP animation. */
export async function loaderImage(file: File): Promise<Buffer> {
  if (!formats[file.type] || !file.size) throw new PublicError("Choose a PNG, JPG, WebP, SVG or GIF image.", 400);
  if (file.size > MAX_LOADER_BYTES) throw new PublicError("Keep loader images under 2 MB.", 413);
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { animated: true, limitInputPixels: 32_000_000 });
    const info = await image.metadata();
    const height = info.pageHeight ?? info.height ?? 0;
    if (info.format !== formats[file.type] || !info.width || !height || info.width > 4096 || height > 4096 || (info.pages ?? 1) > 120 || info.width * height * (info.pages ?? 1) > 32_000_000) {
      throw new Error("Unsupported image dimensions or format");
    }
    const bytes = await image.resize(256, 256, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    if (bytes.byteLength > MAX_LOADER_BYTES) throw new Error("Converted animation is too large");
    return bytes;
  } catch {
    throw new PublicError("Could not read this loader image. Use up to 4096×4096 pixels and 120 animation frames, under 2 MB.", 400);
  }
}
