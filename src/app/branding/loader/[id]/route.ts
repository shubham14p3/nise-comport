import { readLoader } from "@/lib/loader-asset";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bytes = await readLoader((await params).id);
  if (!bytes) return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  return new Response(new Uint8Array(bytes), { headers: {
    "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox", "x-robots-tag": "noindex",
  } });
}
