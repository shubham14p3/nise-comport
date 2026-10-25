import Link from "next/link";
import { ArrowUpRight, ClipboardList, ScanSearch } from "lucide-react";
import { CategoryIcon } from "@/components/icons";
import { categoryMeta } from "@/lib/categories";
import type { Locale } from "@/lib/i18n";
import { servicesInCategory } from "@/lib/services";

/**
 * The two optional action tiles fill unused slots when feature-gated service
 * categories leave a short last row (7 categories -> 9 tiles, 8 -> 9, 9 -> 9).
 * Never enable an unavailable category or invent a service merely for layout.
 */
const quickActions = [
  {
    key: "request",
    href: "/request",
    tone: "saffron",
    icon: ClipboardList,
    title: { en: "Start a request", hi: "नया अनुरोध शुरू करें", bn: "নতুন অনুরোধ করুন" },
    description: {
      en: "Choose a service and submit in 4 easy steps",
      hi: "सेवा चुनें और 4 आसान चरणों में अनुरोध भेजें",
      bn: "পরিষেবা বেছে ৪টি সহজ ধাপে অনুরোধ পাঠান",
    },
    footer: { en: "4 simple steps", hi: "4 आसान चरण", bn: "৪টি সহজ ধাপ" },
  },
  {
    key: "track",
    href: "/track",
    tone: "rose",
    icon: ScanSearch,
    title: { en: "Track a request", hi: "अनुरोध की स्थिति देखें", bn: "অনুরোধের অবস্থা দেখুন" },
    description: {
      en: "Check your request, PAN or certificate status",
      hi: "अनुरोध, पैन या प्रमाण पत्र की स्थिति देखें",
      bn: "অনুরোধ, প্যান বা সার্টিফিকেটের অবস্থা দেখুন",
    },
    footer: { en: "Check status", hi: "स्थिति देखें", bn: "অবস্থা দেখুন" },
  },
] as const;

/** Colourful category tiles. Services stay inside /services, so the home page stays short. */
export default function CategoryGrid({ locale = "en", countLabel }: { locale?: Locale; countLabel?: string }) {
  // Desktop uses three columns. Fill the final row with real, working actions.
  const actionCount = (3 - (categoryMeta.length % 3)) % 3;
  return <div className="cat-grid">
    {categoryMeta.map((meta, index) => {
      const count = servicesInCategory(meta.slug).length;
      return <Link prefetch={false} key={meta.slug} href={`/services?category=${meta.slug}`} className={`cat-tile tone-${meta.tone}`} style={{ animationDelay: `${index * 45}ms` }}>
        <span className="cat-tile__icon"><CategoryIcon icon={meta.icon} size={26}/></span>
        <span className="cat-tile__body">
          <strong>{meta.short[locale]}</strong>
          <small>{meta.line[locale]}</small>
        </span>
        <span className="cat-tile__count">{count} {countLabel ?? (count === 1 ? "service" : "services")}</span>
        <ArrowUpRight className="cat-tile__arrow" size={20} aria-hidden="true"/>
      </Link>;
    })}
    {quickActions.slice(0, actionCount).map((action, index) => {
      const Icon = action.icon;
      return <Link prefetch={false} key={action.key} href={action.href} className={`cat-tile cat-tile--action tone-${action.tone}`} style={{ animationDelay: `${(categoryMeta.length + index) * 45}ms` }}>
        <span className="cat-tile__icon"><Icon size={26} aria-hidden="true"/></span>
        <span className="cat-tile__body">
          <strong>{action.title[locale]}</strong>
          <small>{action.description[locale]}</small>
        </span>
        <span className="cat-tile__count">{action.footer[locale]}</span>
        <ArrowUpRight className="cat-tile__arrow" size={20} aria-hidden="true"/>
      </Link>;
    })}
  </div>;
}
