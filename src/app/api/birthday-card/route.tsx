import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { loadConfig, cardSignature } from "@/lib/outreach";
import { pickBirthdayTemplate } from "@/lib/outreach-core";

export const runtime = "nodejs";

let fontCache: Promise<{ bold: Buffer; medium: Buffer; logo: string }> | null = null;
/** Poppins covers Latin and Devanagari, so English and Hindi cards render correctly. */
function assets() {
  fontCache ??= Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/Poppins-Bold.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Poppins-Medium.ttf")),
    readFile(join(process.cwd(), "public/images/logo/logo-footer.png")),
  ]).then(([bold, medium, logo]) => ({ bold, medium, logo: `data:image/png;base64,${logo.toString("base64")}` }));
  return fontCache;
}

/** Bengali glyphs come from Google Fonts on demand (only the characters on the card). */
async function bengaliFont(text: string) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@600&text=${encodeURIComponent(text)}`, { next: { revalidate: 604_800 } })).text();
    const url = /src: url\((.+?)\) format\('(opentype|truetype)'\)/.exec(css)?.[1];
    return url ? await (await fetch(url, { next: { revalidate: 604_800 } })).arrayBuffer() : null;
  } catch { return null; }
}

// Confetti pieces: left, top, size, rotation, round?, colour slot
const CONFETTI: [number, number, number, number, boolean, "accent" | "shape" | "ink"][] = [
  [60, 150, 34, 20, false, "accent"], [170, 60, 22, 0, true, "shape"], [300, 120, 28, 40, false, "ink"], [450, 50, 20, 0, true, "accent"], [620, 130, 30, 65, false, "shape"],
  [780, 55, 24, 0, true, "ink"], [910, 140, 34, 15, false, "accent"], [990, 70, 20, 0, true, "shape"], [40, 420, 24, 0, true, "shape"], [990, 400, 30, 50, false, "ink"],
  [90, 760, 30, 35, false, "accent"], [960, 740, 24, 0, true, "accent"], [200, 900, 20, 0, true, "ink"], [860, 910, 32, 25, false, "shape"],
];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get("t") ?? ""; const lang = params.get("l") === "hi" || params.get("l") === "bn" ? (params.get("l") as "hi" | "bn") : "en";
  const name = (params.get("n") ?? "").replace(/[<>]/g, "").slice(0, 40);
  // Only cards made by the shop (signed) are drawn, so nobody can use this address to print their own text.
  let allowed = false;
  try { allowed = cardSignature(id, lang, name) === params.get("s"); } catch { allowed = false; }
  if (!allowed) return new Response("Not found", { status: 404 });
  const template = pickBirthdayTemplate((await loadConfig()).birthdayTemplates, id);
  const title = template.title[lang]; const line = template.line[lang]; const signoff = template.signoff[lang];
  const { bold, medium, logo } = await assets();
  const bengali = /[ঀ-৿]/.test(`${title}${line}${signoff}${name}`) ? await bengaliFont(`${title}${line}${signoff}${name}`) : null;
  const fonts = [
    { name: "Poppins", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Poppins", data: medium, weight: 500 as const, style: "normal" as const },
    ...(bengali ? [{ name: "Hind Siliguri", data: bengali, weight: 600 as const, style: "normal" as const }] : []),
  ];
  const family = bengali ? "Poppins, Hind Siliguri" : "Poppins";
  const colours = { accent: template.accent, shape: template.shape, ink: template.ink };
  const nameSize = name.length > 26 ? 64 : name.length > 16 ? 82 : 100;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: family, color: template.ink, backgroundImage: `linear-gradient(150deg, ${template.from}, ${template.to})` }}>
      {CONFETTI.map(([left, top, size, rotate, round, slot], index) => (
        <div key={index} style={{ position: "absolute", left, top, width: size, height: round ? size : size * 0.5, borderRadius: round ? size : 6, background: colours[slot], opacity: 0.85, transform: `rotate(${rotate}deg)` }}/>
      ))}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", width: "100%", height: "100%", padding: "64px 70px" }}>
        <div style={{ display: "flex", background: "#fff", borderRadius: 22, padding: "14px 22px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by next/og, not the browser */}
          <img src={logo} width={240} height={45} alt=""/>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          {/* The cake: three tiers, candles and flames, drawn with boxes */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 26 }}>
            <div style={{ display: "flex", gap: 22, alignItems: "flex-end" }}>
              {[0, 1, 2].map((candle) => (
                <div key={candle} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 16, height: 26, borderRadius: 16, background: template.accent }}/>
                  <div style={{ width: 12, height: 44, background: "#fff", opacity: 0.95, borderRadius: 4 }}/>
                </div>
              ))}
            </div>
            <div style={{ width: 170, height: 70, background: template.accent, borderRadius: "18px 18px 0 0" }}/>
            <div style={{ width: 250, height: 80, background: "#fff", opacity: 0.95, borderRadius: 10 }}/>
            <div style={{ width: 340, height: 86, background: template.shape, borderRadius: "10px 10px 28px 28px" }}/>
          </div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1, color: template.accent }}>{title}</div>
          {name ? <div style={{ fontSize: nameSize, fontWeight: 700, lineHeight: 1.15, marginTop: 10 }}>{name}</div> : null}
          <div style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.4, marginTop: 24, maxWidth: 820, opacity: 0.95 }}>{line}</div>
        </div>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 500, padding: "14px 30px", borderRadius: 999, background: "rgba(255,255,255,0.18)" }}>{signoff}</div>
      </div>
    </div>,
    { width: 1080, height: 1080, fonts, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
  );
}
