import { NextRequest, NextResponse } from "next/server";
import { site } from "@/lib/site";
import { tokenMatches, unsubscribeContact } from "@/lib/email-campaigns";

export const dynamic = "force-dynamic";

/** One-click unsubscribe from campaign emails. Marks the contact as "said NO" for email and WhatsApp. */
export async function GET(request: NextRequest) {
  const contactId = request.nextUrl.searchParams.get("c") ?? "";
  const token = request.nextUrl.searchParams.get("t") ?? "";
  const ok = /^[0-9a-f-]{36}$/i.test(contactId) && token.length > 10 && tokenMatches(contactId, token);
  if (ok) await unsubscribeContact(contactId).catch((error) => console.error("[unsubscribe] failed", error));
  const message = ok ? "You have been unsubscribed. You will not receive more campaign emails from us." : "This link is not valid. Please contact us and we will remove you.";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${site.name}</title></head>
  <body style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#1d1d1b">
  <h1 style="font-size:20px">${site.name}</h1><p>${message}</p><p><a href="${site.url}">Back to ${site.name}</a></p></body></html>`;
  return new NextResponse(html, { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
}
