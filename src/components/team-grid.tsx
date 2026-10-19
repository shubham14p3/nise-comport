import Image from "next/image";
import type { CSSProperties } from "react";
import type { TeamPerson } from "@/lib/team";
import type { Locale } from "@/lib/i18n";
import { tr } from "@/lib/tr";

function Portrait({ person }: { person: TeamPerson }) {
  if (!person.image) return <span className="team-card__initial" aria-hidden="true">{person.name.slice(0, 1).toUpperCase()}</span>;
  // Uploaded photos come from /media/<id>, which is already a final file, so skip the image optimiser for them.
  return <Image src={person.image} alt={person.name} width={420} height={480} unoptimized={person.image.startsWith("/media/")} sizes="(max-width: 640px) 70vw, 280px"/>;
}

/** Leaders first (Head / Partner / Director / Owner roles), then the rest, each group in the order set in the admin area. */
export default function TeamGrid({ people, lang = "en" }: { people: TeamPerson[]; lang?: Locale }) {
  const t = tr(lang);
  const isLeader = (person: TeamPerson) => /head|partner|director|owner|founder|manager/i.test(person.role);
  const leaders = people.filter(isLeader);
  const rest = people.filter((person) => !isLeader(person));
  const card = (person: TeamPerson, index: number, large = false) => <article className={large ? "team-card team-card--lead" : "team-card"} key={person.id} style={{ "--i": index } as CSSProperties}>
    <div className="team-card__photo"><Portrait person={person}/></div>
    <div><h3>{person.name}</h3><p className="team-card__role">{person.role}</p>{person.bio ? <p className="team-card__bio">{person.bio}</p> : null}</div>
  </article>;
  if (!people.length) return <p className="admin-empty">{t("Our team details will be here soon.", "हमारी टीम की जानकारी जल्द यहाँ होगी।", "আমাদের টিমের তথ্য শীঘ্রই এখানে থাকবে।")}</p>;
  return <>
    {leaders.length > 0 && <div className="team-block"><h2 className="team-block__title">{t("Leadership", "नेतृत्व", "নেতৃত্ব")}</h2><div className="team-grid team-grid--lead">{leaders.map((person, index) => card(person, index, true))}</div></div>}
    {rest.length > 0 && <div className="team-block"><h2 className="team-block__title">{leaders.length ? t("The service desk", "सर्विस डेस्क", "সার্ভিস ডেস্ক") : t("Our team", "हमारी टीम", "আমাদের টিম")}</h2><div className="team-grid">{rest.map((person, index) => card(person, index))}</div></div>}
  </>;
}
