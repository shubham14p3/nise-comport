import { readUploadedPhoto } from "@/lib/gallery-store";

export const runtime = "nodejs";

/** Photos uploaded in Admin → Gallery (SEO file names, cached for a year). */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const bytes = await readUploadedPhoto(name);
  if (!bytes) return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  return new Response(new Uint8Array(bytes), { headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
}
