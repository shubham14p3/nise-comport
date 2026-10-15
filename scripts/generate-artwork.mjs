import sharp from "sharp";
import { mkdirSync } from "node:fs";
/**
 * Generates the illustrated service posters in public/images/gallery (1200x900 WebP).
 * Run: node scripts/generate-artwork.mjs   (needs the "sharp" package, which Next.js installs for image optimisation,
 * and the Poppins font installed on the machine for the best result).
 */
const OUT = process.argv[2] ?? "public/images/gallery";
mkdirSync(OUT, { recursive: true });
const W = 1200, H = 900;
const font = `font-family="Poppins, Arial, sans-serif"`;

const esc = (v) => v.replaceAll("&", "&amp;");
function frame({ id, g1, g2, g3, kicker: k, title: t, sub: s2, art, tf = "" }) {
  const kicker = esc(k), title = esc(t), sub = esc(s2);
  const lines = title.split("\n");
  const titleSvg = lines.map((l, i) => `<text x="80" y="${520 + i * 92}" ${font} font-weight="700" font-size="82" fill="#fff" letter-spacing="-1">${l}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g1}"/><stop offset=".55" stop-color="${g2}"/><stop offset="1" stop-color="${g3}"/></linearGradient>
    <radialGradient id="glow" cx=".78" cy=".22" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#fff" opacity=".12"/></pattern>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#050823" flood-opacity=".35"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <circle cx="1080" cy="820" r="260" fill="#fff" opacity=".06"/>
  <g filter="url(#sh)"><g transform="${tf}">${art}</g></g>
  <rect x="80" y="${lines.length > 1 ? 330 : 400}" rx="22" width="${kicker.length * 17 + 56}" height="46" fill="#fff" fill-opacity=".18" stroke="#fff" stroke-opacity=".35"/>
  <text x="108" y="${lines.length > 1 ? 361 : 431}" ${font} font-weight="500" font-size="22" fill="#fff" letter-spacing="3">${kicker}</text>
  ${lines.length > 1 ? titleSvg.replaceAll('y="520', 'y="450').replaceAll('y="612', 'y="542') : titleSvg}
  <text x="80" y="${lines.length > 1 ? 620 : 600}" ${font} font-weight="400" font-size="32" fill="#fff" fill-opacity=".9">${sub}</text>
  <rect x="80" y="770" rx="30" width="430" height="60" fill="#070b1f" fill-opacity=".55"/>
  <circle cx="115" cy="800" r="10" fill="#3cf0a4"/>
  <text x="140" y="809" ${font} font-weight="700" font-size="24" fill="#fff" letter-spacing="1">NISE COMPORT · Telco</text>
</svg>`;
}

const card = (x, y, w, h, r = 28, fill = "#fff", extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const line = (x, y, w, c = "#d9def2", h = 16) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${c}"/>`;
const check = (cx, cy, r, c = "#12b886") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/><path d="M${cx - r * .42} ${cy} l${r * .3} ${r * .32} l${r * .55} -${r * .62}" stroke="#fff" stroke-width="${r * .22}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

const posters = [
  { id: "pan-card", g1: "#0a7bf7", g2: "#4a4dff", g3: "#8b3dff", kicker: "NEW · CORRECTION · REPRINT", title: "PAN card,\nsorted.", sub: "Documents checked before you apply.",
    art: `<g transform="rotate(-8 900 250)">${card(700, 110, 420, 270, 30)}${card(700, 110, 420, 70, 30, "#0a7bf7")}<rect x="700" y="150" width="420" height="30" fill="#0a7bf7"/>${line(730, 132, 140, "#ffffff", 14)}<circle cx="780" cy="265" r="48" fill="#e8ecff"/><circle cx="780" cy="250" r="18" fill="#9aa6d8"/><path d="M748 300 q32 -40 64 0" fill="#9aa6d8"/>${line(850, 225, 220)}${line(850, 260, 170)}${line(850, 295, 200)}${line(730, 340, 300, "#eef1fb")}</g>${check(1090, 110, 46)}` },
  { id: "certificates", g1: "#00a6a6", g2: "#0a7bf7", g3: "#3440c9", kicker: "JHARKHAND PORTAL HELP", tf: "translate(130 -40) scale(.88)", title: "Income, caste &\nresidence certificates", sub: "Filled carefully, tracked till it’s done.",
    art: `${card(800, 70, 300, 360, 24, "#dfe9ff", 'transform="rotate(8 950 250)"')}${card(760, 90, 300, 360, 24)}${line(795, 140, 200, "#0a7bf7", 18)}${line(795, 190, 230)}${line(795, 225, 210)}${line(795, 260, 230)}${line(795, 295, 160)}<circle cx="990" cy="380" r="46" fill="#ffb020"/><circle cx="990" cy="380" r="30" fill="none" stroke="#fff" stroke-width="6"/><path d="M965 420 l-12 50 l37 -18 l37 18 l-12 -50" fill="#ff8a00"/>` },
  { id: "aeps-banking", g1: "#0f9d63", g2: "#12b886", g3: "#0a7bf7", kicker: "AEPS · BC POINT", title: "Cash withdrawal\n& money transfer", sub: "Everyday banking, right in Telco.",
    art: `<circle cx="920" cy="250" r="170" fill="#fff"/><g fill="none" stroke="#12b886" stroke-width="12" stroke-linecap="round"><path d="M860 320 q-20 -70 20 -120 q45 -50 100 -10"/><path d="M890 340 q-15 -60 15 -95 q30 -30 60 0 q20 25 10 70"/><path d="M925 350 q-10 -50 5 -75"/><path d="M1000 230 q25 50 5 120"/></g><circle cx="1080" cy="420" r="70" fill="#ffb020"/><text x="1080" y="447" font-family="Poppins, Arial" font-weight="700" font-size="72" fill="#fff" text-anchor="middle">₹</text><circle cx="1110" cy="120" r="50" fill="#ffd166"/><text x="1110" y="140" font-family="Poppins, Arial" font-weight="700" font-size="52" fill="#fff" text-anchor="middle">₹</text>` },
  { id: "insurance", g1: "#ff3d8b", g2: "#b23dff", g3: "#4a4dff", kicker: "COMPARE · RENEW · BUY", title: "Bike, car &\nhealth insurance", sub: "Local help with participating insurers.",
    art: `<path d="M930 70 l170 60 v120 c0 110 -80 180 -170 220 c-90 -40 -170 -110 -170 -220 v-120 z" fill="#fff"/><path d="M930 115 l125 44 v92 c0 82 -58 135 -125 166 c-67 -31 -125 -84 -125 -166 v-92 z" fill="#ffe3ef"/>${check(930, 270, 62, "#ff3d8b")}` },
  { id: "print-from-phone", g1: "#08c7ff", g2: "#0a7bf7", g3: "#2b3bd6", kicker: "UPLOAD · PICK PAGES · COLLECT", title: "Print from\nyour phone", sub: "PDF, Word or photos. Ready at the counter.",
    art: `${card(720, 60, 210, 400, 36, "#070b1f")}${card(734, 90, 182, 340, 22, "#fff")}${line(752, 120, 120, "#0a7bf7")}${line(752, 160, 140)}${line(752, 190, 110)}${card(752, 230, 146, 110, 12, "#e6f6ff")}${line(752, 360, 140)}<g><rect x="930" y="250" width="230" height="130" rx="24" fill="#fff"/><rect x="965" y="200" width="160" height="70" rx="10" fill="#e6ecff"/><rect x="965" y="350" width="160" height="110" rx="10" fill="#fff" stroke="#d9def2" stroke-width="4"/>${line(985, 380, 110)}${line(985, 410, 80)}<circle cx="1125" cy="290" r="10" fill="#12b886"/></g>` },
  { id: "student-forms", g1: "#7c4dff", g2: "#b23dff", g3: "#ff3d8b", kicker: "EXAM · JOB · SCHOLARSHIP", title: "Forms filled\nright, first time", sub: "Photo, signature & uploads handled with care.",
    art: `${card(760, 150, 320, 330, 26)}${line(795, 200, 150, "#7c4dff", 18)}${card(795, 245, 110, 130, 14, "#efe9ff")}${line(925, 255, 120)}${line(925, 290, 100)}${line(925, 325, 120)}${line(795, 405, 250)}${line(795, 440, 190)}<path d="M860 70 l140 -45 l140 45 l-140 45 z" fill="#070b1f"/><path d="M915 95 v60 c50 30 120 30 170 0 v-60 l-85 28 z" fill="#1d2150"/><path d="M1140 70 v70" stroke="#ffb020" stroke-width="8"/><circle cx="1140" cy="148" r="12" fill="#ffb020"/>` },
  { id: "bills-recharge", g1: "#ff9f1c", g2: "#ff5e62", g3: "#ff3d8b", kicker: "ELECTRICITY · MOBILE · DTH", tf: "translate(60 -20) scale(.95)", title: "Bills & recharge,\nwith a receipt", sub: "Quick payments at the counter.",
    art: `<path d="M780 70 h300 v390 l-38 -24 l-38 24 l-37 -24 l-37 24 l-38 -24 l-37 24 l-38 -24 l-37 24 z" fill="#fff"/>${line(815, 120, 150, "#ff5e62", 18)}${line(815, 170, 230)}${line(815, 205, 200)}${line(815, 240, 230)}<text x="815" y="330" font-family="Poppins, Arial" font-weight="700" font-size="56" fill="#070b1f">₹ 649</text>${check(1030, 300, 34)}<path d="M1120 120 l-50 110 h45 l-25 100 l80 -130 h-50 l30 -80 z" fill="#ffe066"/>` },
  { id: "track-live", g1: "#070b1f", g2: "#1b1f5c", g3: "#0a7bf7", kicker: "YOUR ACCOUNT", title: "Track every\nrequest live", sub: "Reference number, status and updates.",
    art: `${card(760, 60, 360, 420, 32, "#fff")}${line(795, 100, 180, "#0a7bf7", 18)}${[0,1,2,3].map(i => `<circle cx="815" cy="${175 + i * 75}" r="18" fill="${i < 3 ? "#12b886" : "#d9def2"}"/>${i < 3 ? `<path d="M807 ${175 + i * 75} l6 6 l10 -12" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>` : ""}${i < 3 ? `<rect x="813" y="${193 + i * 75}" width="4" height="39" fill="#12b886"/>` : ""}${line(850, 165 + i * 75, [190, 150, 210, 120][i])}${line(850, 190 + i * 75, [120, 100, 90, 140][i], "#eef1fb", 12)}`).join("")}<rect x="990" y="85" width="100" height="36" rx="18" fill="#ff3d8b"/><text x="1040" y="110" font-family="Poppins, Arial" font-weight="700" font-size="18" fill="#fff" text-anchor="middle">LIVE</text>` },
];

const meta = [];
for (const p of posters) {
  const svg = frame(p);
  await sharp(Buffer.from(svg)).webp({ quality: 86 }).toFile(`${OUT}/${p.id}.webp`);
  meta.push(p.id);
}
console.log(meta.join(","));
