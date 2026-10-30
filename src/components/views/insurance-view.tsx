import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleCheck, CircleX, Phone, ShieldCheck } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import FaqSection from "@/components/faq-section";
import { WhatsAppIcon } from "@/components/icons";
import InsuranceForm from "@/components/insurance-form";
import JsonLd from "@/components/json-ld";
import SiteBanners from "@/components/site-banners";
import SiteHeader from "@/components/site-header";
import { LOCALE_META, type Locale } from "@/lib/i18n";
import {
  ADD_ONS, BIKE_TP_RATES, CLAIM_STEPS, COVERED, DOCUMENTS, FACILITATOR_NOTE, IDV_DEPRECIATION, INSURERS, NCB_SLABS, NOT_COVERED,
  POLICY_TYPES, PREMIUM_FACTORS, REJECTION_REASONS, RENEWAL_FACTS, SOLICITATION_NOTE, type InsurancePurpose,
} from "@/lib/motor-insurance";
import { liveBanners } from "@/lib/site-content";
import { site, whatsappLink } from "@/lib/site";
import { serviceLd } from "@/lib/structured-data";
import { MOTOR_TEXT } from "@/lib/translations/motor-insurance";
import { lp, tr } from "@/lib/tr";

const ENGLISH_FAQS = [
  { question: "Is NiSE COMPORT an insurance company?", answer: FACILITATOR_NOTE },
  { question: "When should I renew?", answer: "Up to 45 days before the end date. Renewing before expiry needs no inspection and keeps your No Claim Bonus. We send a WhatsApp reminder before your next due date." },
  { question: "My policy has expired. What now?", answer: "Don't drive until it's renewed: there's no cover and you can be fined. We arrange renewal; the insurer may ask for an inspection. Renew within 90 days of expiry to keep your NCB." },
  { question: "Can I change my insurer at renewal and keep my NCB?", answer: "Yes. The NCB belongs to you, not the insurer. Bring your last policy; we get your NCB applied with the new insurer." },
  { question: "What is IDV?", answer: "The Insured Declared Value is the vehicle's current value after depreciation. It's the most the insurer pays if the vehicle is stolen or totally damaged. A very low IDV lowers the premium but also the payout." },
  { question: "Do I really need zero depreciation?", answer: "For vehicles up to about 5 years old, yes, usually: without it, plastic, rubber and fibre parts are paid at 50% and other parts after age-based depreciation." },
  { question: "Who settles my claim?", answer: "The insurance company that issued your policy decides and pays the claim. We help you register it, prepare documents, follow up with the insurer and the garage until it's settled." },
];

export async function InsuranceView({ lang, purpose, vehicle }: { lang: Locale; purpose?: InsurancePurpose; vehicle?: "car" | "bike" }) {
  const t = tr(lang);
  const logos = await liveBanners("insurer");
  const x = lang === "en" ? null : MOTOR_TEXT[lang];
  const facilitator = x?.facilitatorNote ?? FACILITATOR_NOTE;
  const solicitation = x?.solicitationNote ?? SOLICITATION_NOTE;
  const faqs = x?.faqs ?? ENGLISH_FAQS;
  const policyTypes = POLICY_TYPES.map((type, index) => ({ id: type.id, ...(x?.policyTypes[index] ?? type) }));
  const addOns = ADD_ONS.map((item, index) => ({ id: item.id, ...(x?.addOns[index] ?? item) }));
  const covered = x?.covered ?? COVERED;
  const notCovered = x?.notCovered ?? NOT_COVERED;
  const renewal = x?.renewalFacts ?? RENEWAL_FACTS;
  const premium = x?.premiumFactors ?? PREMIUM_FACTORS;
  const docs = x?.documents ?? DOCUMENTS;
  const claimSteps = x?.claimSteps ?? CLAIM_STEPS;
  const rejections = x?.rejectionReasons ?? REJECTION_REASONS;
  const home = lang === "en" ? "/" : `/${lang}`;
  const path = lp(lang, "/insurance");
  return <main className="page" lang={LOCALE_META[lang].htmlLang}><SiteHeader/>
    <JsonLd data={serviceLd({ name: t("Car & bike insurance help", "कार और बाइक बीमा में मदद", "গাড়ি ও বাইক বিমায় সাহায্য"), description: "New policies, renewals, expired policies and claim support for cars and two-wheelers in Jamshedpur.", path, serviceType: "Motor insurance assistance", category: "Insurance" })}/>
    <section className="page-hero page-hero--compact tone-violet">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container">
        <Breadcrumbs label={t("Breadcrumb", "ब्रेडक्रंब", "ব্রেডক্রাম্ব")} items={[{ name: t("Home", "होम", "হোম"), path: home }, { name: t("Services", "सेवाएँ", "পরিষেবা"), path: lp(lang, "/services") }, { name: t("Insurance", "बीमा", "বিমা"), path: lp(lang, "/services/insurance") }, { name: t("Car & bike insurance", "कार और बाइक बीमा", "গাড়ি ও বাইক বিমা"), path }]}/>
        <h1>{t("Car & bike insurance, ", "कार और बाइक बीमा, ", "গাড়ি ও বাইক বিমা, ")}<span className="grad-text">{t("sorted.", "आसान।", "সহজ।")}</span></h1>
        <p className="page-hero__lead">{t("New policy, renewal, expired policy or a claim: tell us once, we compare quotes from several insurers and do the paperwork. We stay with you until the claim is settled.", "नई पॉलिसी, नवीनीकरण, समाप्त पॉलिसी या क्लेम: हमें एक बार बताइए, हम कई बीमा कंपनियों के कोटेशन की तुलना करते हैं और कागज़ी काम करते हैं। क्लेम निपटने तक हम आपके साथ रहते हैं।", "নতুন পলিসি, নবীকরণ, মেয়াদোত্তীর্ণ পলিসি বা ক্লেম: আমাদের একবার জানান, আমরা একাধিক বিমা কোম্পানির কোটেশন তুলনা করি ও কাগজপত্রের কাজ করি। ক্লেম নিষ্পত্তি না হওয়া পর্যন্ত আমরা আপনার পাশে থাকি।")}</p>
        <div className="page-hero__ctas">
          <a className="btn btn--primary btn--lg" href="#quote">{t("Get my quotes", "मेरे कोटेशन पाएँ", "আমার কোটেশন পান")} <ArrowRight size={18}/></a>
          <a className="btn btn--wa btn--lg" href={whatsappLink(t("Hi NiSE COMPORT, I need help with vehicle insurance.", "नमस्ते NiSE COMPORT, मुझे वाहन बीमा में मदद चाहिए।", "নমস্কার NiSE COMPORT, গাড়ির বিমায় আমার সাহায্য দরকার।"))} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/> WhatsApp</a>
          <a className="btn btn--glass btn--lg" href={`tel:${site.phones.primary.e164}`}><Phone size={18}/> {t("Call", "कॉल करें", "কল করুন")}</a>
        </div>
      </div>
    </section>

    <div className="container ins-layout">
      <section className="ins-main" id="quote">
        <InsuranceForm initialPurpose={purpose} initialVehicle={vehicle}/>
      </section>
      <aside className="ins-aside">
        <div className="ins-card ins-card--trust"><ShieldCheck size={20}/><div><b>{t("How we work", "हम कैसे काम करते हैं", "আমরা কীভাবে কাজ করি")}</b><p>{facilitator}</p></div></div>
        <div className="ins-card"><b>{t("Renewal in short", "नवीनीकरण संक्षेप में", "নবীকরণ সংক্ষেপে")}</b><ul>{renewal.slice(0, 4).map((item) => <li key={item}><CircleCheck size={15}/>{item}</li>)}</ul></div>
        <SiteBanners placement="service-page" category="insurance"/>
      </aside>
    </div>

    <section className="section container ins-knowledge">
      <div className="section-head"><span className="eyebrow">{t("INSURERS", "बीमा कंपनियाँ", "বিমা কোম্পানি")}</span><h2>{t("Quotes from several insurers", "कई बीमा कंपनियों के कोटेशन", "একাধিক বিমা কোম্পানির কোটেশন")}</h2><p className="muted">{t("We compare what the insurers we work with offer for your vehicle: premium, IDV, add-ons, cashless garages near Jamshedpur and claim service. Which insurers we can quote depends on our partner tie-ups at the time.", "हम जिन बीमा कंपनियों के साथ काम करते हैं, वे आपके वाहन के लिए जो देती हैं उसकी तुलना करते हैं: प्रीमियम, IDV, ऐड-ऑन, जमशेदपुर के पास कैशलेस गैरेज और क्लेम सेवा। हम किन कंपनियों का कोटेशन दे सकते हैं, यह उस समय हमारी साझेदारियों पर निर्भर करता है।", "আমরা যেসব বিমা কোম্পানির সঙ্গে কাজ করি তারা আপনার গাড়ির জন্য কী দেয় তা তুলনা করি: প্রিমিয়াম, IDV, অ্যাড-অন, জামশেদপুরের কাছে ক্যাশলেস গ্যারেজ ও ক্লেম পরিষেবা। আমরা কোন কোম্পানির কোটেশন দিতে পারি তা সেই সময়ের আমাদের অংশীদারির উপর নির্ভর করে।")}</p></div>
      {logos.length ? <div className="insurer-logos">{logos.map((logo) => logo.image ? <InsurerLogo key={logo.id} src={logo.image} name={logo.title.en}/> : <span key={logo.id} className="insurer-chip">{logo.title.en}</span>)}</div>
        : <div className="insurer-names">{INSURERS.map((name) => <span key={name} className="insurer-chip">{name}</span>)}</div>}
      <p className="fine">{t("Names and logos belong to their owners. Listing an insurer doesn’t mean it endorses NiSE COMPORT.", "नाम और लोगो उनके स्वामियों के हैं। किसी बीमा कंपनी का नाम होने का मतलब यह नहीं कि वह NiSE COMPORT का समर्थन करती है।", "নাম ও লোগো তাদের মালিকদের। কোনও বিমা কোম্পানির নাম থাকা মানে এই নয় যে তারা NiSE COMPORT-কে সমর্থন করে।")}</p>

      <div className="ins-grid">
        {policyTypes.map((type) => <article key={type.id} className="ins-card"><b>{type.name}</b><p>{type.text}</p></article>)}
      </div>

      <div className="ins-two">
        <article className="ins-card"><h3>{t("What’s covered", "क्या कवर होता है", "কী কভার হয়")}</h3><ul>{covered.map((item) => <li key={item}><CircleCheck size={15}/>{item}</li>)}</ul></article>
        <article className="ins-card"><h3>{t("What’s not covered", "क्या कवर नहीं होता", "কী কভার হয় না")}</h3><ul className="is-no">{notCovered.map((item) => <li key={item}><CircleX size={15}/>{item}</li>)}</ul></article>
      </div>

      <h3 className="ins-h3">{t("Add-ons worth knowing", "जानने लायक ऐड-ऑन", "জানার মতো অ্যাড-অন")}</h3>
      <div className="ins-grid ins-grid--tight">{addOns.map((item) => <article key={item.id} className="ins-card"><b>{item.name}</b><p>{item.text}</p></article>)}</div>

      <div className="ins-tables">
        <article className="ins-card"><h3>{t("No Claim Bonus (NCB)", "नो क्लेम बोनस (NCB)", "নো ক্লেম বোনাস (NCB)")}</h3><p className="muted">{t("Discount on the own-damage premium for every claim-free year. It belongs to you, so it moves with you if you change insurer.", "हर क्लेम-मुक्त वर्ष पर ओन-डैमेज प्रीमियम में छूट। यह आपका है, इसलिए बीमा कंपनी बदलने पर आपके साथ जाता है।", "প্রতিটি ক্লেম-মুক্ত বছরে ওন-ডেমেজ প্রিমিয়ামে ছাড়। এটি আপনার, তাই বিমা কোম্পানি বদলালে আপনার সঙ্গে যায়।")}</p>
          <table className="ins-table"><tbody>{NCB_SLABS.map((row, index) => <tr key={row.years}><td>{x?.ncbYears[index] ?? row.years}</td><td>{row.discount}%</td></tr>)}</tbody></table></article>
        <article className="ins-card"><h3>{t("IDV depreciation", "IDV मूल्यह्रास", "IDV অবচয়")}</h3><p className="muted">{t("IDV = showroom price (plus declared accessories) minus this depreciation. Over 5 years, the value is agreed with the insurer.", "IDV = शोरूम मूल्य (घोषित एक्सेसरीज़ सहित) घटा यह मूल्यह्रास। 5 साल से ऊपर मूल्य बीमा कंपनी के साथ तय होता है।", "IDV = শোরুম মূল্য (ঘোষিত অ্যাকসেসরিজসহ) বিয়োগ এই অবচয়। ৫ বছরের বেশি হলে মূল্য বিমা কোম্পানির সঙ্গে ঠিক হয়।")}</p>
          <table className="ins-table"><tbody>{IDV_DEPRECIATION.map((row, index) => <tr key={row.age}><td>{x?.idvAges[index] ?? row.age}</td><td>{row.percent}%</td></tr>)}</tbody></table></article>
        <article className="ins-card"><h3>{t("Bike third-party premium", "बाइक थर्ड-पार्टी प्रीमियम", "বাইক থার্ড-পার্টি প্রিমিয়াম")}</h3><p className="muted">{t("Fixed by IRDAI for every insurer (before GST). Car rates depend on engine size; we share the exact figure with your quote.", "हर बीमा कंपनी के लिए IRDAI द्वारा तय (GST से पहले)। कार की दरें इंजन के आकार पर निर्भर हैं; सही आँकड़ा हम आपके कोटेशन के साथ बताते हैं।", "প্রতিটি বিমা কোম্পানির জন্য IRDAI-এর নির্ধারিত (GST-র আগে)। গাড়ির দর ইঞ্জিনের আকারের উপর নির্ভর করে; সঠিক অঙ্ক আমরা আপনার কোটেশনের সঙ্গে জানাই।")}</p>
          <table className="ins-table"><thead><tr><th>{t("Engine", "इंजन", "ইঞ্জিন")}</th><th>{t("1 year", "1 वर्ष", "১ বছর")}</th><th>{t("5 years", "5 वर्ष", "৫ বছর")}</th></tr></thead><tbody>{BIKE_TP_RATES.map((row) => <tr key={row.engine}><td>{row.engine}</td><td>₹{row.oneYear.toLocaleString("en-IN")}</td><td>₹{row.fiveYear.toLocaleString("en-IN")}</td></tr>)}</tbody></table></article>
      </div>

      <div className="ins-two">
        <article className="ins-card"><h3>{t("Renewing: what to know", "नवीनीकरण: क्या जानें", "নবীকরণ: কী জানবেন")}</h3><ul>{renewal.map((item) => <li key={item}><BadgeCheck size={15}/>{item}</li>)}</ul></article>
        <article className="ins-card"><h3>{t("What decides your premium", "आपका प्रीमियम क्या तय करता है", "আপনার প্রিমিয়াম কী ঠিক করে")}</h3><ul>{premium.map((item) => <li key={item}><CircleCheck size={15}/>{item}</li>)}</ul></article>
      </div>

      <div className="ins-grid ins-grid--three">
        <article className="ins-card"><h3>{t("Documents: new vehicle", "दस्तावेज़: नया वाहन", "নথি: নতুন গাড়ি")}</h3><ol>{docs.new.map((item) => <li key={item}>{item}</li>)}</ol></article>
        <article className="ins-card"><h3>{t("Documents: renewal", "दस्तावेज़: नवीनीकरण", "নথি: নবীকরণ")}</h3><ol>{docs.renew.map((item) => <li key={item}>{item}</li>)}</ol></article>
        <article className="ins-card"><h3>{t("Documents: claim", "दस्तावेज़: क्लेम", "নথি: ক্লেম")}</h3><ol>{docs.claim.map((item) => <li key={item}>{item}</li>)}</ol></article>
      </div>

      <div className="ins-two">
        <article className="ins-card"><h3>{t("How a claim works", "क्लेम कैसे काम करता है", "ক্লেম কীভাবে কাজ করে")}</h3><ol>{claimSteps.map((item) => <li key={item}>{item}</li>)}</ol><p className="muted">{t("We help at every step; the insurer’s surveyor and claims team decide the amount.", "हम हर चरण में मदद करते हैं; राशि बीमा कंपनी का सर्वेयर और क्लेम टीम तय करती है।", "আমরা প্রতিটি ধাপে সাহায্য করি; অঙ্ক ঠিক করে বিমা কোম্পানির সার্ভেয়ার ও ক্লেম টিম।")}</p></article>
        <article className="ins-card"><h3>{t("Common reasons claims are refused", "क्लेम अस्वीकार होने के आम कारण", "ক্লেম নাকচ হওয়ার সাধারণ কারণ")}</h3><ul className="is-no">{rejections.map((item) => <li key={item}><CircleX size={15}/>{item}</li>)}</ul></article>
      </div>
      <p className="ins-cta"><a className="btn btn--primary" href="#quote">{t("Get my quotes", "मेरे कोटेशन पाएँ", "আমার কোটেশন পান")} <ArrowRight size={16}/></a> <Link className="btn btn--ghost" href={lp(lang, "/services/health-life-insurance")}>{t("Health & life insurance help", "स्वास्थ्य और जीवन बीमा में मदद", "স্বাস্থ্য ও জীবন বিমায় সাহায্য")}</Link></p>
      <p className="fine">{solicitation} {facilitator}</p>
    </section>
    <FaqSection faqs={faqs} title={t("Motor insurance questions", "मोटर बीमा के सवाल", "মোটর বিমার প্রশ্ন")} eyebrow={t("QUESTIONS CUSTOMERS ASK", "ग्राहक जो सवाल पूछते हैं", "গ্রাহকেরা যে প্রশ্ন করেন")} lang={LOCALE_META[lang].htmlLang}/>
  </main>;
}

function InsurerLogo({ src, name }: { src: string; name: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- logo uploaded by the owner in Admin → Site content
  return <span className="insurer-logo"><img src={src} alt={name} loading="lazy"/></span>;
}
