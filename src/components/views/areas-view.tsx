import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, MessagesSquare, Navigation, Route } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import SiteHeader from "@/components/site-header";
import { areas, type AreaZone } from "@/lib/areas";
import { LOCALE_META, type Locale } from "@/lib/i18n";
import { directionsFrom, site } from "@/lib/site";
import { webPageLd } from "@/lib/structured-data";
import { areaText } from "@/lib/translations/places";
import { lp, tr } from "@/lib/tr";

export function AreasView({ lang }: { lang: Locale }) {
  const t = tr(lang);
  const home = lang === "en" ? "/" : `/${lang}`;
  const address = lang === "hi" ? site.address.hindi : lang === "bn" ? site.address.bengali : site.address.oneLine;
  const popular = [
    { href: "/services/pan-card", label: t("PAN card", "पैन कार्ड", "প্যান কার্ড") },
    { href: "/services/aadhaar", label: t("Aadhaar update help", "आधार अपडेट में मदद", "আধার আপডেটে সাহায্য") },
    { href: "/services/income-caste-residence-certificate", label: t("Income, caste & residence certificates", "आय, जाति और निवास प्रमाण पत्र", "আয়, জাতি ও বাসস্থান সার্টিফিকেট") },
    { href: "/services/aeps-money-transfer", label: t("AEPS & money transfer", "AEPS और पैसे ट्रांसफ़र", "AEPS ও টাকা ট্রান্সফার") },
    { href: "/services/printing-scanning", label: t("Printing & photocopy", "प्रिंटिंग और फ़ोटोकॉपी", "প্রিন্টিং ও ফটোকপি") },
    { href: "/services/voter-id", label: t("Voter ID", "वोटर आईडी", "ভোটার আইডি") },
    { href: "/services/passport-driving-licence", label: t("Passport & driving licence", "पासपोर्ट और ड्राइविंग लाइसेंस", "পাসপোর্ট ও ড্রাইভিং লাইসেন্স") },
    { href: "/services/ration-card", label: t("Ration card", "राशन कार्ड", "রেশন কার্ড") },
    { href: "/services/ayushman-card", label: t("Ayushman card", "आयुष्मान कार्ड", "আয়ুষ্মান কার্ড") },
    { href: "/services/insurance", label: t("Insurance", "बीमा", "বিমা") },
    { href: "/services/computer-repair", label: t("Computer & laptop repair", "कंप्यूटर और लैपटॉप मरम्मत", "কম্পিউটার ও ল্যাপটপ মেরামত") },
  ];
  const zones: { name: AreaZone; blurb: string }[] = [
    { name: "Telco and nearby", blurb: t("Our own neighbourhood. Walk in any time during opening hours.", "हमारा अपना मोहल्ला। खुलने के समय में कभी भी सीधे आइए।", "আমাদের নিজের পাড়া। খোলার সময়ে যেকোনো সময় সরাসরি আসুন।") },
    { name: "Central Jamshedpur", blurb: t("Sakchi, Bistupur, Sonari, Kadma and the city centre.", "साकची, बिष्टुपुर, सोनारी, कदमा और शहर का केंद्र।", "সাকচি, বিষ্টুপুর, সোনারি, কদমা ও শহরের কেন্দ্র।") },
    { name: "East and south", blurb: t("Mango, Golmuri, Baridih and the neighbourhoods beyond.", "मानगो, गोलमुरी, बारीडीह और उसके आगे के मोहल्ले।", "মানগো, গোলমুরি, বারিডিহ ও তার পরের পাড়াগুলি।") },
    { name: "Beyond the city", blurb: t("Adityapur, Gamharia, Ghatshila and further. Start online, visit only when needed.", "आदित्यपुर, गम्हरिया, घाटशिला और उससे आगे। ऑनलाइन शुरू कीजिए, ज़रूरत पर ही आइए।", "আদিত্যপুর, গামহারিয়া, ঘাটশিলা ও আরও দূরে। অনলাইনে শুরু করুন, দরকার হলেই আসুন।") },
  ];
  const howFar = [
    { icon: MessagesSquare, title: t("Message us first", "पहले हमें संदेश भेजिए", "আগে আমাদের মেসেজ করুন"), text: t("Send your service and a photo of your documents on WhatsApp. We tell you exactly what to bring and whether you need to come at all.", "WhatsApp पर अपनी सेवा और दस्तावेज़ों की फ़ोटो भेजिए। हम ठीक-ठीक बताते हैं कि क्या लाना है और आपको आना भी है या नहीं।", "WhatsApp-এ আপনার পরিষেবা ও নথির ছবি পাঠান। আমরা ঠিক জানাই কী আনতে হবে এবং আপনাকে আদৌ আসতে হবে কি না।") },
    { icon: Mail, title: t("Start online", "ऑनलाइन शुरू कीजिए", "অনলাইনে শুরু করুন"), text: t("Many services can begin with an online request, so your visit is short or not needed.", "कई सेवाएँ ऑनलाइन अनुरोध से शुरू हो सकती हैं, इसलिए आपका आना छोटा होता है या ज़रूरी नहीं होता।", "অনেক পরিষেবা অনলাইন অনুরোধ দিয়ে শুরু করা যায়, তাই আপনার আসা ছোট হয় বা দরকারই হয় না।") },
    { icon: Route, title: t("Come once", "एक बार आइए", "একবারই আসুন"), text: t("Use the directions link for your area, bring the originals we listed, and we finish the work in one visit.", "अपने इलाके के लिए दिशा-निर्देश का लिंक इस्तेमाल कीजिए, हमारी बताई मूल प्रतियाँ लाइए, और हम काम एक ही बार में पूरा कर देते हैं।", "আপনার এলাকার দিকনির্দেশ লিঙ্ক ব্যবহার করুন, আমাদের বলা আসল নথি আনুন, আর আমরা একবারেই কাজ শেষ করে দিই।") },
  ];
  return <main className="content-page" lang={LOCALE_META[lang].htmlLang}><SiteHeader/>
    <JsonLd data={webPageLd({ name: t("Areas served by NiSE COMPORT", "NiSE COMPORT जिन इलाकों में सेवा देता है", "NiSE COMPORT যেসব এলাকায় পরিষেবা দেয়"), description: "Neighbourhoods in Jamshedpur served by the NiSE COMPORT CSC / Pragya Kendra desk in Kharangajhar, Telco.", path: lp(lang, "/areas-we-serve") })}/>
    <section className="content-hero"><div className="container">
      <Breadcrumbs label={t("Breadcrumb", "ब्रेडक्रंब", "ব্রেডক্রাম্ব")} items={[{ name: t("Home", "होम", "হোম"), path: home }, { name: t("Areas we serve", "हम जहाँ सेवा देते हैं", "আমরা যেখানে পরিষেবা দিই"), path: lp(lang, "/areas-we-serve") }]}/>
      <span className="eyebrow eyebrow-muted">{t("ONE DESK · ALL OF JAMSHEDPUR", "एक डेस्क · पूरा जमशेदपुर", "একটি ডেস্ক · পুরো জামশেদপুর")}</span>
      <h1>{t("Areas we serve", "हम जहाँ सेवा देते हैं,", "আমরা যেসব এলাকায় পরিষেবা দিই,")}<br/><em>{t("across Jamshedpur.", "पूरे जमशेदपुर में।", "পুরো জামশেদপুরে।")}</em></h1>
      <p>{t("Our only service desk is in Kharangajhar, Telco. People visit us from across Jamshedpur and nearby Jharkhand. Pick your area to open directions in Google Maps, or send a request online first so we can confirm what to bring.", "हमारा एकमात्र सर्विस डेस्क खरंगाझार, टेल्को में है। लोग पूरे जमशेदपुर और झारखंड के आसपास से हमारे पास आते हैं। Google Maps में रास्ता खोलने के लिए अपना इलाका चुनिए, या पहले ऑनलाइन अनुरोध भेजिए ताकि हम बता सकें क्या लाना है।", "আমাদের একমাত্র সার্ভিস ডেস্ক খরংগাঝাড়, টেলকোয়। পুরো জামশেদপুর ও ঝাড়খণ্ডের আশপাশ থেকে মানুষ আমাদের কাছে আসেন। Google Maps-এ দিকনির্দেশ খুলতে আপনার এলাকা বাছুন, বা আগে অনলাইনে অনুরোধ পাঠান যাতে আমরা জানাতে পারি কী আনতে হবে।")}</p>
      <div className="content-location"><MapPin size={15}/> {address}</div>
    </div></section>
    {zones.map((zone) => {
      const list = areas.filter((area) => area.zone === zone.name);
      if (!list.length) return null;
      return <section className="container area-zone" key={zone.name}>
        <div className="section-head section-head--left"><h2>{areaText(list[0], lang).zone}</h2><p>{zone.blurb}</p></div>
        <div className="area-grid">{list.map((area) => {
          const text = areaText(area, lang);
          return <article className="area-card" id={area.slug} key={area.slug}>
            <h3>{text.name} {lang === "en" && <span lang="hi">{area.hindi}</span>}</h3>
            <p>{text.note}</p>
            <a className="arrow-link" href={directionsFrom(area.name)} target="_blank" rel="noopener noreferrer"><Navigation size={14}/> {t(`Directions from ${area.name}`, `${text.name} से रास्ता`, `${text.name} থেকে দিকনির্দেশ`)}</a>
          </article>;
        })}</div>
      </section>;
    })}
    <section className="container area-zone">
      <div className="section-head section-head--left"><h2>{t("Living further away?", "और दूर रहते हैं?", "আরও দূরে থাকেন?")}</h2><p>{t("You do not have to be in Jamshedpur to use NiSE COMPORT. Here is how it works from a distance.", "NiSE COMPORT का उपयोग करने के लिए जमशेदपुर में होना ज़रूरी नहीं। दूर से यह इस तरह काम करता है।", "NiSE COMPORT ব্যবহার করতে জামশেদপুরে থাকতে হবে না। দূর থেকে এটি এভাবে কাজ করে।")}</p></div>
      <ol className="about-steps">{howFar.map((step, index) => <li key={step.title}><span className="about-steps__n">{index + 1}</span><step.icon size={22} aria-hidden="true"/><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
    </section>
    <section className="container related-services"><span className="eyebrow eyebrow-muted">{t("MOST REQUESTED", "सबसे ज़्यादा माँगी जाने वाली", "সবচেয়ে বেশি চাওয়া")}</span><h2>{t("Popular services", "लोकप्रिय सेवाएँ", "জনপ্রিয় পরিষেবা")}</h2><div className="related-links">{popular.map((item) => <Link key={item.href} href={lp(lang, item.href)}>{item.label} <ArrowUpRight size={13}/></Link>)}</div></section>
    <section className="container provider-note"><p>{t("Not sure whether your work needs a visit? Call ", "पक्का नहीं कि आपके काम के लिए आना ज़रूरी है? कॉल कीजिए ", "নিশ্চিত নন আপনার কাজের জন্য আসা দরকার কি না? কল করুন ")}{site.phones.primary.display}{t(" or ", " या ", " বা ")}<Link href={lp(lang, "/contact")}>{t("contact us", "हमसे संपर्क कीजिए", "আমাদের সঙ্গে যোগাযোগ করুন")}</Link>.{lang === "en" && <> हिन्दी में जानकारी के लिए <Link href="/hi" lang="hi">यहाँ देखें</Link>।</>}</p></section>
  </main>;
}
