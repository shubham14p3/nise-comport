import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "@/components/icons";
import { categoryMeta } from "@/lib/categories";
import type { Locale } from "@/lib/i18n";
import { servicesInCategory } from "@/lib/services";

/** Colourful category tiles. Services stay inside /services, so the home page stays short. */
export default function CategoryGrid({ locale = "en", countLabel }: { locale?: Locale; countLabel?: string }) {
  return <div className="cat-grid">
    {categoryMeta.map((meta, index) => {
      const count = servicesInCategory(meta.slug).length;
      return <Link key={meta.slug} href={`/services?category=${meta.slug}`} className={`cat-tile tone-${meta.tone}`} style={{ animationDelay: `${index * 45}ms` }}>
        <span className="cat-tile__icon"><CategoryIcon icon={meta.icon} size={26}/></span>
        <span className="cat-tile__body">
          <strong>{meta.short[locale]}</strong>
          <small>{meta.line[locale]}</small>
        </span>
        <span className="cat-tile__count">{count} {countLabel ?? (count === 1 ? "service" : "services")}</span>
        <ArrowUpRight className="cat-tile__arrow" size={20} aria-hidden="true"/>
      </Link>;
    })}
  </div>;
}
