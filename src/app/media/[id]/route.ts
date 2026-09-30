import { readPoster } from "@/lib/media";

export const runtime = "nodejs";

/** Public poster images uploaded in the admin area (used on /offers and in WhatsApp messages). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poster = await readPoster(id);
  if (!poster) return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  return new Response(new Uint8Array(poster.bytes), {
    headers: {
      "content-type": poster.mimeType,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      "x-robots-tag": "noindex",
    },
  });
}
