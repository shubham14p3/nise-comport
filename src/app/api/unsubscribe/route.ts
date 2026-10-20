import { NextRequest, NextResponse } from "next/server";
import { unsubscribeEmail, validUnsubscribe } from "@/lib/outreach";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const page = (title: string, body: string, status = 200) => new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head><body style="font-family:Arial,Helvetica,sans-serif;background:#f5f7fc;margin:0;padding:48px 16px;color:#0b1026"><div style="max-width:460px;margin:0 auto;background:#fff;border:1px solid #e2e6f3;border-radius:20px;padding:32px;text-align:center"><h1 style="font-size:22px;margin:0 0 12px">${title}</h1><p style="line-height:1.6;margin:0 0 20px">${body}</p><a href="${site.url}" style="color:#0660c9;font-weight:bold;text-decoration:none">${site.name}</a></div></body></html>`, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

/** The “stop these emails” link in birthday and reminder emails. */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("c") ?? "";
  const signature = request.nextUrl.searchParams.get("s") ?? "";
  try {
    if (!/^[0-9a-f-]{36}$/i.test(id) || !validUnsubscribe(id, signature)) return page("This link is not valid", "Please use the link in the latest email, or reply to the email and we will stop them for you.", 400);
    await unsubscribeEmail(id);
    return page("You are unsubscribed", "We will not send you these emails any more. If this was a mistake, just tell us at the service desk.");
  } catch (error) {
    console.error("[unsubscribe] failed", error);
    return page("Something went wrong", "Please try the link again in a moment, or call us and we will stop the emails for you.", 500);
  }
}
