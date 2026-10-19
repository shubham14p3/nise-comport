import { existsSync } from "node:fs";
import path from "node:path";
import { partners } from "@/lib/partners";

const EXTENSIONS = ["svg", "png", "webp", "jpg"] as const;

/** Public URL of an official logo dropped into public/images/partners/, if one exists. */
function logoFor(slug: string) {
  for (const extension of EXTENSIONS) {
    if (existsSync(path.join(process.cwd(), "public", "images", "partners", `${slug}.${extension}`))) return `/images/partners/${slug}.${extension}`;
  }
  return null;
}

export default function PartnerMarks() {
  return <div className="partner-grid">{partners.map((partner) => {
    const logo = logoFor(partner.slug);
    const body = <>
      <span className={`partner-mark tone-${partner.tone}`} aria-hidden="true">
        {logo
          // eslint-disable-next-line @next/next/no-img-element -- owner-supplied logo of unknown size
          ? <img src={logo} alt="" loading="lazy"/>
          : <b>{partner.initials}</b>}
      </span>
      <span className="partner-card__text"><b>{partner.name}</b><small>{partner.what}</small></span>
    </>;
    return partner.href
      ? <a key={partner.slug} className="partner-card" href={partner.href} target="_blank" rel="noopener noreferrer nofollow">{body}</a>
      : <div key={partner.slug} className="partner-card">{body}</div>;
  })}</div>;
}
