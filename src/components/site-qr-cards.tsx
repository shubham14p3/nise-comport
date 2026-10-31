import { Download } from "lucide-react";
import { qrSvg } from "@/lib/qr";

type Card = { title: string; hint: string; url: string; file: string; badge?: string; number?: string };

/** Two scannable codes (sign in, WhatsApp) with a download for each, for posters and visiting cards. */
export default function SiteQrCards({ cards, download }: { cards: Card[]; download: string }) {
  return <div className="qr-cards">{cards.map((card) => {
    const code = qrSvg(card.url, { size: card.badge ? 800 : 1024 });
    const safeNumber = (card.number ?? "").replace(/[^+0-9]/g, "");
    const svg = card.badge ? `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1200" viewBox="0 0 1024 1200">
      <rect width="1024" height="1200" rx="36" fill="white"/><rect width="1024" height="16" fill="#ef982b"/>
      <g font-family="Arial,sans-serif" text-anchor="middle"><text x="512" y="78" font-size="42" font-weight="bold" fill="#14643c">NiSE COMPORT</text>
      <text x="512" y="125" font-size="28" fill="#24344a">WhatsApp · Online Assistant</text></g>
      ${code.replace("<svg ", '<svg x="112" y="160" ')}
      <g font-family="Arial,sans-serif" text-anchor="middle" fill="#14643c"><text x="512" y="1015" font-size="34" font-weight="bold">${safeNumber}</text>
      <text x="512" y="1070" font-size="28">Scan karein · WhatsApp kholein · Send dabayein</text>
      <text x="512" y="1120" font-size="24">Documents: nisecomport.com/services</text></g><rect y="1184" width="1024" height="16" fill="#16804b"/></svg>` : code;
    const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return <article key={card.url} className="qr-card">
      <div className="qr-card__code" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qrSvg(card.url, { size: 168 }) }}/>
      {card.badge && <span className="qr-card__badge">{card.badge}</span>}
      <h3>{card.title}</h3>
      {card.number && <strong className="qr-card__number">{card.number}</strong>}
      <p>{card.hint}</p>
      <a className="btn btn--ghost btn--sm" href={href} download={card.file}><Download size={15}/>{download}</a>
    </article>;
  })}</div>;
}
