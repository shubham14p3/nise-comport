export const dynamic = "force-dynamic";

/**
 * IndexNow key file (Bing, Yandex, Seznam and others pick up changed URLs within minutes).
 * Set INDEXNOW_KEY to 8–128 letters/digits/dashes, then run `npm run seo:indexnow` after a deploy.
 */
export function GET() {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key || !/^[a-zA-Z0-9-]{8,128}$/.test(key)) return new Response("Not found", { status: 404 });
  return new Response(key, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
}
