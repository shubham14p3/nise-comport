import { fetchPlacePhoto } from "@/lib/google-places";

export const runtime = "nodejs";

/**
 * Streams one of the shop's Google Business Profile photos so the API key stays on the server.
 * Only indexes of the shop's own photo list (0–11) are accepted, so this can't be used to fetch
 * arbitrary Google content. Cached for 12 hours to keep Places API usage (and cost) low.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ index: string }> }) {
  const { index } = await params;
  const position = Number(index);
  if (!Number.isInteger(position) || position < 0 || position > 11) return new Response(null, { status: 404 });
  try {
    const photo = await fetchPlacePhoto(position);
    if (!photo) return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=600" } });
    return new Response(photo.bytes, {
      headers: {
        "Content-Type": photo.type,
        "Cache-Control": "public, max-age=43200, s-maxage=43200, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
