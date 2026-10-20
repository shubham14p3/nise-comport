import { Download } from "lucide-react";
import { qrSvg } from "@/lib/qr";

type Card = { title: string; hint: string; url: string; file: string };

/** Two scannable codes (sign in, WhatsApp) with a download for each, for posters and visiting cards. */
export default function SiteQrCards({ cards, download }: { cards: Card[]; download: string }) {
  return <div className="qr-cards">{cards.map((card) => {
    const svg = qrSvg(card.url, { size: 1024 });
    const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return <article key={card.url} className="qr-card">
      <div className="qr-card__code" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qrSvg(card.url, { size: 168 }) }}/>
      <h3>{card.title}</h3>
      <p>{card.hint}</p>
      <a className="btn btn--ghost btn--sm" href={href} download={card.file}><Download size={15}/>{download}</a>
    </article>;
  })}</div>;
}
