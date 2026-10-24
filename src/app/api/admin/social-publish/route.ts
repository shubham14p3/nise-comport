import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { getIntegration } from "@/lib/integration-vault";

export const runtime = "nodejs";
const schema = z.object({
  provider: z.enum(["facebook", "instagram"]),
  caption: z.string().trim().min(1).max(2200),
  imageUrl: z.url().startsWith("https://").optional(),
});
async function graph(path: string, token: string, data: Record<string, string>) {
  const body = new URLSearchParams({ ...data, access_token: token });
  const response = await fetch(`https://graph.facebook.com/v23.0/${path}`, { method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(20000) });
  const json = await response.json() as { id?: string; error?: { message?: string } };
  if (!response.ok || !json.id) throw new Error(json.error?.message || "Meta rejected the publish request.");
  return json.id;
}
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("campaigns");
    if (user.role !== "admin") return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    const input = schema.parse(await readJson(request));
    const credentials = await getIntegration(input.provider);
    if (!credentials) return NextResponse.json({ error: "Connect the provider in Integrations first." }, { status: 400 });
    if (input.provider === "facebook") {
      if (!credentials.pageId || !credentials.pageAccessToken) return NextResponse.json({ error: "Page ID and token are required." }, { status: 400 });
      const id = await graph(`${encodeURIComponent(credentials.pageId)}/${input.imageUrl ? "photos" : "feed"}`, credentials.pageAccessToken, input.imageUrl ? { url: input.imageUrl, caption: input.caption } : { message: input.caption });
      return NextResponse.json({ ok: true, id });
    }
    if (!input.imageUrl) return NextResponse.json({ error: "Instagram requires a public HTTPS image URL." }, { status: 400 });
    if (!credentials.instagramUserId || !credentials.accessToken) return NextResponse.json({ error: "Instagram account ID and token required." }, { status: 400 });
    const id = await graph(`${encodeURIComponent(credentials.instagramUserId)}/media`, credentials.accessToken, { image_url: input.imageUrl, caption: input.caption });
    // Instagram creation is asynchronous. Poll status_code before media_publish.
    let ready = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(id)}?fields=status_code&access_token=${encodeURIComponent(credentials.accessToken)}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      const status = await response.json() as { status_code?: string };
      if (status.status_code === "FINISHED") { ready = true; break; }
      if (status.status_code === "ERROR" || status.status_code === "EXPIRED") break;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    if (!ready) return NextResponse.json({ error: "Instagram media is still processing. No post was published; retry with a new request later.", containerId: id }, { status: 409 });
    const publishedId = await graph(`${encodeURIComponent(credentials.instagramUserId)}/media_publish`, credentials.accessToken, { creation_id: id });
    return NextResponse.json({ ok: true, id: publishedId });
  } catch (error) { return apiError(error); }
}
