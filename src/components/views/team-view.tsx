import SiteHeader from "@/components/site-header";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import TeamGrid from "@/components/team-grid";
import { LOCALE_META, type Locale } from "@/lib/i18n";
import { webPageLd } from "@/lib/structured-data";
import { publicTeam } from "@/lib/team";
import { lp, tr } from "@/lib/tr";

export async function TeamView({ lang }: { lang: Locale }) {
  const t = tr(lang);
  const people = await publicTeam();
  const home = lang === "en" ? "/" : `/${lang}`;
  return <main className="content-page" lang={LOCALE_META[lang].htmlLang}><SiteHeader/>
    <JsonLd data={webPageLd({ name: t("The NiSE COMPORT team", "NiSE COMPORT की टीम", "NiSE COMPORT-এর টিম"), description: "The people at the NiSE COMPORT service desk in Kharangajhar, Telco, Jamshedpur.", path: lp(lang, "/team") })}/>
    <section className="content-hero team-hero"><span className="team-hero__orb team-hero__orb--a" aria-hidden="true"/><span className="team-hero__orb team-hero__orb--b" aria-hidden="true"/><div className="container">
      <Breadcrumbs label={t("Breadcrumb", "ब्रेडक्रंब", "ব্রেডক্রাম্ব")} items={[{ name: t("Home", "होम", "হোম"), path: home }, { name: t("Our team", "हमारी टीम", "আমাদের টিম"), path: lp(lang, "/team") }]}/>
      <span className="eyebrow eyebrow-muted">{t("A LOCAL TEAM YOU CAN REACH", "एक स्थानीय टीम जिससे आप मिल सकते हैं", "একটি স্থানীয় টিম যাঁদের কাছে আপনি পৌঁছাতে পারেন")}</span>
      <h1>{t("People who help", "वे लोग जो", "যাঁরা কাজ")}<br/><em>{t("get things moving.", "काम आगे बढ़ाने में मदद करते हैं।", "এগিয়ে নিতে সাহায্য করেন।")}</em></h1>
      <p>{t("NiSE COMPORT is rooted in the Kharangajhar neighbourhood of Telco, Jamshedpur. Our team helps customers with everyday digital and government services, with clear steps and in-person support.", "NiSE COMPORT जमशेदपुर के टेल्को के खरंगाझार मोहल्ले में बसा है। हमारी टीम साफ़ चरणों और आमने-सामने की मदद के साथ ग्राहकों को रोज़मर्रा की डिजिटल और सरकारी सेवाओं में सहायता करती है।", "NiSE COMPORT জামশেদপুরের টেলকোর খরংগাঝাড় পাড়ায় শিকড় গেড়েছে। আমাদের টিম স্পষ্ট ধাপ ও সামনাসামনি সাহায্য দিয়ে গ্রাহকদের দৈনন্দিন ডিজিটাল ও সরকারি পরিষেবায় সহায়তা করে।")}</p>
      <div className="content-location"><MapPin size={15}/> {t("Kharangajhar, Telco, Jamshedpur, Jharkhand 831004", "खरंगाझार, टेल्को, जमशेदपुर, झारखंड 831004", "খরংগাঝাড়, টেলকো, জামশেদপুর, ঝাড়খণ্ড 831004")}</div>
    </div></section>
    <section className="container team-section"><TeamGrid people={people} lang={lang}/></section>
    <section className="container provider-note"><p>{t("Our staff guide you through applications and requests. They do not decide government approvals, insurance eligibility or third-party processing.", "हमारा स्टाफ़ आवेदनों और अनुरोधों में आपका मार्गदर्शन करता है। वे सरकारी स्वीकृति, बीमा की पात्रता या तीसरे पक्ष की प्रक्रिया का फ़ैसला नहीं करते।", "আমাদের কর্মীরা আবেদন ও অনুরোধে আপনাকে পথ দেখান। তাঁরা সরকারি অনুমোদন, বিমার যোগ্যতা বা তৃতীয় পক্ষের প্রক্রিয়া ঠিক করেন না।")}</p><Link className="arrow-link" href={lp(lang, "/contact")}>{t("Contact the service desk", "सर्विस डेस्क से संपर्क करें", "সার্ভিস ডেস্কে যোগাযোগ করুন")} <ArrowUpRight size={15}/></Link></section>
  </main>;
}
