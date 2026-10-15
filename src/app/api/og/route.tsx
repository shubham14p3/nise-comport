import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

function clean(value: string | null, fallback: string) {
  return (value ?? fallback).replace(/[<>]/g, "").slice(0, 110);
}

let fontCache: Promise<{ bold: Buffer; medium: Buffer; logo: string }> | null = null;
/** Poppins covers Latin and Devanagari, so English and Hindi titles render correctly. */
function assets() {
  fontCache ??= Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/Poppins-Bold.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Poppins-Medium.ttf")),
    readFile(join(process.cwd(), "public/images/logo/logo-footer.png")),
  ]).then(([bold, medium, logo]) => ({ bold, medium, logo: `data:image/png;base64,${logo.toString("base64")}` }));
  return fontCache;
}

/** Bengali glyphs come from Google Fonts on demand (only the characters in the title). */
async function bengaliFont(text: string) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@600&text=${encodeURIComponent(text)}`, { next: { revalidate: 604_800 } })).text();
    const url = /src: url\((.+?)\) format\('(opentype|truetype)'\)/.exec(css)?.[1];
    return url ? await (await fetch(url, { next: { revalidate: 604_800 } })).arrayBuffer() : null;
  } catch { return null; }
}

const SUBTITLE = {
  "en-IN": "CSC & Pragya Kendra · Kharangajhar, Telco, Jamshedpur",
  "hi-IN": "CSC और प्रज्ञा केंद्र · खरंगाझार, टेल्को, जमशेदपुर",
  "bn-IN": "CSC ও প্রজ্ঞা কেন্দ্র · খরংগাঝাড়, টেলকো, জামশেদপুর",
} as const;

export async function GET(request: NextRequest) {
  const title = clean(request.nextUrl.searchParams.get("title"), "NISE COMPORT");
  const requested = request.nextUrl.searchParams.get("locale");
  const locale = requested === "hi-IN" || requested === "bn-IN" ? requested : "en-IN";
  const subtitle = SUBTITLE[locale];
  const { bold, medium, logo } = await assets();
  const bengali = locale === "bn-IN" ? await bengaliFont(`${title}${subtitle}`) : null;
  const fonts = [
    { name: "Poppins", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Poppins", data: medium, weight: 500 as const, style: "normal" as const },
    ...(bengali ? [{ name: "Hind Siliguri", data: bengali, weight: 600 as const, style: "normal" as const }] : []),
  ];
  const family = bengali ? "Poppins, Hind Siliguri" : "Poppins";
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", color: "#fff", fontFamily: family, backgroundColor: "#070b1f", backgroundImage: "radial-gradient(circle at 8% 0%, #1d4dff 0%, rgba(29,77,255,0) 45%), radial-gradient(circle at 100% 20%, #8b3dff 0%, rgba(139,61,255,0) 45%), radial-gradient(circle at 60% 120%, #ff3d8b 0%, rgba(255,61,139,0) 45%)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", background: "#fff", borderRadius: 22, padding: "16px 22px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by next/og, not the browser */}
          <img src={logo} width={264} height={49} alt=""/>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, fontWeight: 500, padding: "10px 20px", borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)" }}>
          <div style={{ width: 12, height: 12, borderRadius: 12, background: "#3cf0a4" }}/>Jamshedpur · Jharkhand
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ fontSize: title.length > 70 ? 54 : title.length > 40 ? 64 : 76, lineHeight: 1.1, fontWeight: 700, maxWidth: 1060, letterSpacing: -1 }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 500, color: "#9fdcff" }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, fontSize: 21, fontWeight: 500 }}>
          {["PAN", "Certificates", "Banking", "Insurance", "Print"].map((item) => <div key={item} style={{ display: "flex", padding: "8px 16px", borderRadius: 999, background: "rgba(255,255,255,0.1)" }}>{item}</div>)}
        </div>
        <div style={{ display: "flex", padding: "14px 26px", borderRadius: 999, fontSize: 24, fontWeight: 700, backgroundImage: "linear-gradient(120deg, #0a7bf7, #7c4dff 60%, #ff3d8b)" }}>nisecomport.com</div>
      </div>
    </div>,
    { width: 1200, height: 630, fonts, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
  );
}
