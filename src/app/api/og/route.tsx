import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

function clean(value: string | null, fallback: string) {
  return (value ?? fallback).replace(/[<>]/g, "").slice(0, 110);
}

export async function GET(request: NextRequest) {
  const title = clean(request.nextUrl.searchParams.get("title"), "NISE COMPORT");
  const locale = request.nextUrl.searchParams.get("locale") === "hi-IN" ? "hi-IN" : "en-IN";
  const subtitle = locale === "hi-IN"
    ? "प्रज्ञा केंद्र · खरंगाझार, टेल्को, जमशेदपुर"
    : "CSC & Pragya Kendra · Kharangajhar, Telco, Jamshedpur";
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f5ed", color: "#14271f", padding: "72px 78px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "0.08em" }}>NISE COMPORT</div>
        <div style={{ fontSize: 22, color: "#66735f" }}>JAMSHEDPUR · JHARKHAND</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ fontSize: title.length > 70 ? 54 : 64, lineHeight: 1.08, fontWeight: 800, maxWidth: 1050 }}>{title}</div>
        <div style={{ fontSize: 27, color: "#536256" }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 23 }}>
        <div>Government services · PAN · Banking · Insurance · Printing</div>
        <div style={{ background: "#14271f", color: "#f7f5ed", padding: "16px 24px", borderRadius: 999 }}>nisecomport.com</div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
  );
}
