import { existsSync } from "node:fs";
import path from "node:path";
import { partners } from "@/lib/partners";
import type { Locale } from "@/lib/i18n";
import { partnerText } from "@/lib/translations/places";
import LoopScroller from "@/components/loop-scroller";

const EXTENSIONS = ["svg", "png", "webp", "jpg"] as const;

/** Public URL of an official logo dropped into public/images/partners/, if one exists. */
function logoFor(slug: string) {
  for (const extension of EXTENSIONS) {
    if (existsSync(path.join(process.cwd(), "public", "images", "partners", `${slug}.${extension}`))) return `/images/partners/${slug}.${extension}`;
  }
  return null;
}

export default function PartnerMarks({ lang = "en" }: { lang?: Locale }) {
  return <div className="partner-grid">{partners.map((partner) => {
    const text = partnerText(partner.slug, partner, lang);
    const logo = logoFor(partner.slug);
    const body = <>
      <span className={`partner-mark tone-${partner.tone}`} aria-hidden="true">
        {logo
          // eslint-disable-next-line @next/next/no-img-element -- owner-supplied logo of unknown size
          ? <img src={logo} alt="" loading="lazy"/>
          : <b>{partner.initials}</b>}
      </span>
      <span className="partner-card__text"><b>{text.name}</b><small>{text.what}</small></span>
    </>;
    return partner.href
      ? <a key={partner.slug} className="partner-card" href={partner.href} target="_blank" rel="noopener noreferrer nofollow">{body}</a>
      : <div key={partner.slug} className="partner-card">{body}</div>;
  })}</div>;
}

/** One endless line of badges for the footer: who we help customers reach. It drifts slowly, and can be dragged or swiped. Official logos in public/images/partners/ replace the lettered badges. */
export function PartnerStrip({ limit = 12 }: { limit?: number }) {
  return <div className="partner-strip">
    <LoopScroller label="Services and portals we help with" gap={8} auto>
      {partners.slice(0, limit).map((partner) => {
        const logo = logoFor(partner.slug);
        return <div key={partner.slug} role="listitem" className="partner-chip" title={`${partner.name}: ${partner.what}`}>
          <span className={`partner-mark partner-mark--sm tone-${partner.tone}`} aria-hidden="true">
            {logo
              // eslint-disable-next-line @next/next/no-img-element -- owner-supplied logo of unknown size
              ? <img src={logo} alt="" loading="lazy" draggable={false}/>
              : <b>{partner.initials}</b>}
          </span>
          <span>{partner.name}</span>
        </div>;
      })}
    </LoopScroller>
  </div>;
}
