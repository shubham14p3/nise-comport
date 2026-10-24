import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { getIntegration } from "@/lib/integration-vault";

export const runtime = "nodejs";
const schema = z.object({ provider: z.enum(["instagram", "facebook", "whatsapp", "email"]) });
export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("campaigns");
    if (actor.role !== "admin") return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    const { provider } = schema.parse(await readJson(request));
    const c = await getIntegration(provider);
    if (!c) return NextResponse.json({ ok: false, error: "Credentials not saved." }, { status: 400 });
    if (provider === "email") {
      if (!c.host || !c.port || !c.user || !c.password || !c.from) return NextResponse.json({ ok: false, error: "Complete all SMTP fields." }, { status: 400 });
      const smtp = nodemailer.createTransport({ host: c.host, port: Number(c.port), secure: Number(c.port) === 465, requireTLS: Number(c.port) === 587, auth: { user: c.user, pass: c.password }, connectionTimeout: 8000, greetingTimeout: 8000 });
      await smtp.verify();
      return NextResponse.json({ ok: true, message: "SMTP authentication succeeded." });
    }
    const token = provider === "facebook" ? c.pageAccessToken : provider === "instagram" ? c.accessToken : c.token;
    const id = provider === "facebook" ? c.pageId : provider === "instagram" ? c.instagramUserId : c.phoneId;
    if (!token || !id) return NextResponse.json({ ok: false, error: "Token and account ID required." }, { status: 400 });
    const response = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(id)}?fields=id&access_token=${encodeURIComponent(token)}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    const json = await response.json() as { id?: string; error?: { message?: string } };
    if (!response.ok || !json.id) return NextResponse.json({ ok: false, error: json.error?.message || "Meta validation failed." }, { status: 400 });
    return NextResponse.json({ ok: true, message: "Meta credentials validated against the configured account." });
  } catch (error) { return apiError(error); }
}
