import { NextRequest, NextResponse } from "next/server";
import { site } from "@/lib/site";
import { confirmConsent } from "@/lib/email-campaigns";

export const dynamic = "force-dynamic";

const MESSAGES = {
  confirmed: "Thank you. You will now receive updates from NISE COMPORT. You can unsubscribe at any time.",
  already: "You are already subscribed. Thank you.",
  stopped: "You asked us earlier to stop messages, so we have not changed that. Message us if you want to hear from us again.",
  invalid: "This link is not valid.",
} as const;

/** The YES link in the "would you like updates?" email. */
export async function GET(request: NextRequest) {
  const contactId = request.nextUrl.searchParams.get("c") ?? "";
  const token = request.nextUrl.searchParams.get("t") ?? "";
  const result = token.length > 10 ? await confirmConsent(contactId, token).catch(() => "invalid" as const) : "invalid" as const;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${site.name}</title></head>
  <body style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#1d1d1b">
  <h1 style="font-size:20px">${site.name}</h1><p>${MESSAGES[result]}</p><p><a href="${site.url}">Back to ${site.name}</a></p></body></html>`;
  return new NextResponse(html, { status: result === "invalid" ? 400 : 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
}
