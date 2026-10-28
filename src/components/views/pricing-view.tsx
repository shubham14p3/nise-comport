import SiteHeader from "@/components/site-header";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import { LOCALE_META, type Locale } from "@/lib/i18n";
import { serviceName } from "@/lib/i18n-forms";
import { COLOR_PAGE_RATE } from "@/lib/print-pricing";
import { publicPrices, priceLabel } from "@/lib/service-prices";
import { publishedServiceDetails, shortServiceName } from "@/lib/services";
import { site, whatsappLink } from "@/lib/site";
import { lp, tr } from "@/lib/tr";

const blackWhite = [
  { pages: "1 – 10", rate: 5 },
  { pages: "11 – 50", rate: 3 },
  { pages: "51+", rate: 2 },
];

export async function PricingView({ lang }: { lang: Locale }) {
  const t = tr(lang);
  const set = await publicPrices().catch(() => []);
  const named = set.map((price) => ({ price, title: publishedServiceDetails.find((service) => service.slug === price.slug)?.title })).filter((row): row is { price: (typeof set)[number]; title: string } => Boolean(row.title));
  const home = lang === "en" ? "/" : `/${lang}`;
  const confirmed = [
    { service: t("PAN card, Aadhaar updates, certificates, voter ID", "पैन कार्ड, आधार अपडेट, प्रमाण पत्र, वोटर आईडी", "প্যান কার্ড, আধার আপডেট, সার্টিফিকেট, ভোটার আইডি"), note: t("Our assistance charge is confirmed on WhatsApp or at the desk before work starts. Government and portal fees, if any, are shown separately.", "काम शुरू होने से पहले हमारा सहायता शुल्क WhatsApp पर या डेस्क पर पक्का किया जाता है। सरकारी और पोर्टल शुल्क, यदि कोई हो, अलग दिखाए जाते हैं।", "কাজ শুরুর আগে আমাদের সহায়তা চার্জ WhatsApp-এ বা ডেস্কে নিশ্চিত করা হয়। সরকারি ও পোর্টাল ফি, যদি থাকে, আলাদা দেখানো হয়।") },
    { service: t("AEPS, money transfer, bill and fee payments", "AEPS, पैसे ट्रांसफ़र, बिल और फ़ीस भुगतान", "AEPS, টাকা ট্রান্সফার, বিল ও ফি পেমেন্ট"), note: t("A small service charge applies and is told to you before the transaction.", "एक छोटा सेवा शुल्क लगता है और लेन-देन से पहले आपको बता दिया जाता है।", "একটি ছোট সার্ভিস চার্জ লাগে এবং লেনদেনের আগে আপনাকে জানানো হয়।") },
    { service: t("Insurance, banking and student forms", "बीमा, बैंकिंग और छात्र फ़ॉर्म", "বিমা, ব্যাংকিং ও ছাত্রছাত্রীদের ফর্ম"), note: t("Our assistance charge is confirmed per form. Premiums and bank charges go to the insurer or bank.", "हमारा सहायता शुल्क हर फ़ॉर्म के हिसाब से पक्का किया जाता है। प्रीमियम और बैंक शुल्क बीमा कंपनी या बैंक को जाते हैं।", "আমাদের সহায়তা চার্জ প্রতিটি ফর্ম অনুযায়ী নিশ্চিত করা হয়। প্রিমিয়াম ও ব্যাংক চার্জ বিমা কোম্পানি বা ব্যাংকের।") },
    { service: t("Laptop, printer and PC repair, hardware", "लैपटॉप, प्रिंटर और पीसी मरम्मत, हार्डवेयर", "ল্যাপটপ, প্রিন্টার ও পিসি মেরামত, হার্ডওয়্যার"), note: t("Quoted after checking the device. Parts are priced on the day, so we send the latest price on WhatsApp.", "डिवाइस जाँचने के बाद दाम बताया जाता है। पुर्ज़ों के दाम उसी दिन तय होते हैं, इसलिए हम WhatsApp पर ताज़ा दाम भेजते हैं।", "ডিভাইস দেখার পর দাম জানানো হয়। যন্ত্রাংশের দাম সেদিনই ঠিক হয়, তাই আমরা WhatsApp-এ সর্বশেষ দাম পাঠাই।") },
  ];
  const labelFor = (price: (typeof set)[number]) => {
    const amount = `₹${price.amount}`;
    if (lang === "hi") return price.kind === "from" ? `${amount} से` : amount;
    if (lang === "bn") return price.kind === "from" ? `${amount} থেকে` : amount;
    return priceLabel(price);
  };
  return <main className="content-page" lang={LOCALE_META[lang].htmlLang}><SiteHeader/>
    <section className="content-hero"><div className="container">
      <Breadcrumbs label={t("Breadcrumb", "ब्रेडक्रंब", "ব্রেডক্রাম্ব")} items={[{ name: t("Home", "होम", "হোম"), path: home }, { name: t("Pricing", "मूल्य", "মূল্য"), path: lp(lang, "/pricing") }]}/>
      <span className="eyebrow eyebrow-muted">{t("HONEST, SEPARATE, CONFIRMED FIRST", "ईमानदार, अलग, पहले पक्का", "সৎ, আলাদা, আগে নিশ্চিত")}</span>
      <h1>{t("Simple pricing,", "सीधा मूल्य,", "সহজ মূল্য,")}<br/><em>{t("nothing hidden.", "कुछ भी छिपा नहीं।", "কিছুই লুকানো নেই।")}</em></h1>
      <p>{t("Our service charge is always shown separately from any government, portal, bank or insurer fee. You hear the amount before we start, and the receipt lists what was collected.", "हमारा सेवा शुल्क हमेशा किसी भी सरकारी, पोर्टल, बैंक या बीमा शुल्क से अलग दिखाया जाता है। शुरू करने से पहले आपको रकम बता दी जाती है, और रसीद में वसूली गई रकम लिखी होती है।", "আমাদের সার্ভিস চার্জ সবসময় যেকোনো সরকারি, পোর্টাল, ব্যাংক বা বিমা ফি থেকে আলাদা দেখানো হয়। শুরুর আগে আপনাকে অঙ্ক জানানো হয়, এবং রসিদে কী আদায় হয়েছে তা লেখা থাকে।")}</p>
    </div></section>

    <section className="container legal-content">
      <h2>{t("Printing and photocopy", "प्रिंटिंग और फ़ोटोकॉपी", "প্রিন্টিং ও ফটোকপি")}</h2>
      <p>{t("Rates for the online print order, per page. Black & white pricing depends on the total pages in the order. Walk-in single pages start higher (see Common charges).", "ऑनलाइन प्रिंट ऑर्डर की दरें, प्रति पेज। ब्लैक एंड व्हाइट का दाम ऑर्डर के कुल पेजों पर निर्भर करता है। सीधे आकर अकेले पेज छपवाने की दर ज़्यादा से शुरू होती है (सामान्य शुल्क देखिए)।", "অনলাইন প্রিন্ট অর্ডারের দর, পেজপ্রতি। সাদা-কালোর দাম অর্ডারের মোট পেজের উপর নির্ভর করে। সরাসরি এসে একক পেজ ছাপালে দর বেশি থেকে শুরু (সাধারণ চার্জ দেখুন)।")}</p>
      <table className="price-table"><thead><tr><th>{t("Type", "प्रकार", "ধরন")}</th><th>{t("Rate per page", "प्रति पेज दर", "পেজপ্রতি দর")}</th></tr></thead><tbody>
        {blackWhite.map((row) => <tr key={row.pages}><th scope="row">{t("Black & white", "ब्लैक एंड व्हाइट", "সাদা-কালো")}, {row.pages} {t("pages", "पेज", "পেজ")}</th><td>₹{row.rate}</td></tr>)}
        <tr><th scope="row">{t("Colour, any quantity", "रंगीन, कितनी भी संख्या", "রঙিন, যেকোনো সংখ্যা")}</th><td>₹{COLOR_PAGE_RATE}</td></tr>
      </tbody></table>
      <p>{t("Rates can change with the file, size and quantity, so ask us for the exact price before you print. ", "दरें फ़ाइल, साइज़ और संख्या के साथ बदल सकती हैं, इसलिए प्रिंट से पहले हमसे सही दाम पूछ लीजिए। ", "ফাইল, সাইজ ও সংখ্যা অনুযায়ী দর বদলাতে পারে, তাই প্রিন্টের আগে সঠিক দাম আমাদের জিজ্ঞাসা করুন। ")}<Link href="/print">{t("Ask for a printing price", "प्रिंटिंग का दाम पूछिए", "প্রিন্টিংয়ের দাম জিজ্ঞাসা করুন")} <ArrowRight size={13}/></Link></p>

      {named.length > 0 && <><h2>{t("Our service charges", "हमारे सेवा शुल्क", "আমাদের সার্ভিস চার্জ")}</h2>
      <p>{t("Our own charge for each service. Government, portal or courier fees are separate.", "हर सेवा का हमारा अपना शुल्क। सरकारी, पोर्टल या कूरियर शुल्क अलग हैं।", "প্রতিটি পরিষেবার জন্য আমাদের নিজস্ব চার্জ। সরকারি, পোর্টাল বা কুরিয়ার ফি আলাদা।")}</p>
      <table className="price-table"><tbody>{named.map((row) => <tr key={row.price.slug}><th scope="row"><Link href={lp(lang, `/services/${row.price.slug}`)}>{serviceName(row.price.slug, shortServiceName(row.title), lang)}</Link>{row.price.note && lang === "en" && <small><br/>{row.price.note}</small>}</th><td>{labelFor(row.price)}</td></tr>)}</tbody></table>
      <p>{t("No price listed for a service? Message or call us and we will quote it before any work starts.", "किसी सेवा का दाम नहीं लिखा? हमें संदेश या कॉल कीजिए; काम शुरू होने से पहले हम दाम बता देंगे।", "কোনও পরিষেবার দাম লেখা নেই? আমাদের মেসেজ বা কল করুন; কাজ শুরুর আগে আমরা দাম জানিয়ে দেব।")}</p></>}

      <h2>{t("Services quoted before work starts", "जिन सेवाओं का दाम काम शुरू होने से पहले बताया जाता है", "যেসব পরিষেবার দাম কাজ শুরুর আগে জানানো হয়")}</h2>
      <table className="price-table"><thead><tr><th>{t("Service", "सेवा", "পরিষেবা")}</th><th>{t("How it is priced", "दाम कैसे तय होता है", "দাম কীভাবে ঠিক হয়")}</th></tr></thead><tbody>
        {confirmed.map((row) => <tr key={row.service}><th scope="row">{row.service}</th><td>{row.note}</td></tr>)}
      </tbody></table>

      <h2>{t("What is never included", "क्या कभी शामिल नहीं होता", "কী কখনও অন্তর্ভুক্ত নয়")}</h2>
      <ul>
        <li>{t("Government, portal, court, bank, insurer or other third-party fees. These go to them, not to us.", "सरकारी, पोर्टल, अदालत, बैंक, बीमा कंपनी या अन्य तीसरे पक्ष के शुल्क। ये उन्हें जाते हैं, हमें नहीं।", "সরকারি, পোর্টাল, আদালত, ব্যাংক, বিমা কোম্পানি বা অন্য তৃতীয় পক্ষের ফি। এগুলি তাদের, আমাদের নয়।")}</li>
        <li>{t("Delivery charges for print orders, unless stated.", "प्रिंट ऑर्डर की डिलीवरी का शुल्क, जब तक लिखा न हो।", "প্রিন্ট অর্ডারের ডেলিভারি চার্জ, যদি না উল্লেখ থাকে।")}</li>
        <li>{t("Fees for correcting or re-filing an application that was wrong because of incomplete details.", "अधूरी जानकारी के कारण गलत हुए आवेदन को सुधारने या दोबारा फ़ाइल करने का शुल्क।", "অসম্পূর্ণ তথ্যের কারণে ভুল হওয়া আবেদন সংশোধন বা আবার ফাইল করার ফি।")}</li>
      </ul>

      <h2>{t("Offers", "ऑफ़र", "অফার")}</h2>
      <p>{t("Promo codes and welcome coupons reduce our service charge only, never government fees. See current ", "प्रोमो कोड और वेलकम कूपन केवल हमारे सेवा शुल्क में छूट देते हैं, सरकारी शुल्क में कभी नहीं। मौजूदा ", "প্রোমো কোড ও ওয়েলকাম কুপন শুধু আমাদের সার্ভিস চার্জে ছাড় দেয়, সরকারি ফি-তে কখনও নয়। বর্তমান ")}<Link href="/offers">{t("offers", "ऑफ़र", "অফার")}</Link>{t(".", " देखिए।", " দেখুন।")}</p>

      <h2>{t("Payment", "भुगतान", "পেমেন্ট")}</h2>
      <p>{t("You can pay at the desk in cash or UPI, or on your request's payment page: UPI QR is free (we confirm it manually, so it takes a little time), and instant card, net-banking or UPI payment adds a small payment-processing fee that is shown before you pay.", "आप डेस्क पर नकद या UPI से भुगतान कर सकते हैं, या अपने अनुरोध के भुगतान पेज पर: UPI QR मुफ़्त है (हम उसे हाथ से पक्का करते हैं, इसलिए थोड़ा समय लगता है), और तुरंत कार्ड, नेट-बैंकिंग या UPI भुगतान पर एक छोटा प्रोसेसिंग शुल्क जुड़ता है जो भुगतान से पहले दिखाया जाता है।", "আপনি ডেস্কে নগদ বা UPI-তে, অথবা আপনার অনুরোধের পেমেন্ট পেজে পেমেন্ট করতে পারেন: UPI QR বিনামূল্যে (আমরা হাতে নিশ্চিত করি, তাই একটু সময় লাগে), আর তাৎক্ষণিক কার্ড, নেট-ব্যাংকিং বা UPI পেমেন্টে একটি ছোট প্রসেসিং ফি যোগ হয় যা পেমেন্টের আগে দেখানো হয়।")}</p>

      <h2>{t("Cancellations and refunds", "रद्दीकरण और रिफ़ंड", "বাতিলকরণ ও রিফান্ড")}</h2>
      <p>{t("See the ", "देखिए ", "দেখুন ")}<Link href={lp(lang, "/refund-policy")}>{t("refund & cancellation policy", "रिफ़ंड और रद्दीकरण नीति", "রিফান্ড ও বাতিলকরণ নীতি")}</Link>{t(".", "।", "।")}</p>

      <p>{t("Need an exact figure? ", "सही रकम चाहिए? ", "সঠিক অঙ্ক দরকার? ")}<a href={whatsappLink(t("Hello NISE COMPORT, please tell me the charge for: ", "नमस्ते NISE COMPORT, कृपया इसका शुल्क बताइए: ", "নমস্কার NISE COMPORT, অনুগ্রহ করে এর চার্জ জানান: "))} target="_blank" rel="noopener noreferrer">{t("WhatsApp us", "हमें WhatsApp कीजिए", "আমাদের WhatsApp করুন")}</a>{t(" or call ", " या कॉल कीजिए ", " বা কল করুন ")}{site.phones.primary.display}.</p>
    </section>
    <section className="container legal-content" aria-labelledby="membership-soon">
      <h2 id="membership-soon">{t("Membership", "सदस्यता", "সদস্যপদ")} <small>({t("coming soon", "जल्द आ रहा है", "শীঘ্রই আসছে")})</small></h2>
      <p>{t("Membership plans are coming soon. Details will be announced here and at the shop.", "सदस्यता योजनाएँ जल्द आ रही हैं। विवरण यहाँ और दुकान पर बताया जाएगा।", "সদস্যপদ পরিকল্পনা শীঘ্রই আসছে। বিস্তারিত এখানে ও দোকানে জানানো হবে।")}</p>
    </section>
  </main>;
}
