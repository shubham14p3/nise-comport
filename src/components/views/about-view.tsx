import SiteHeader from "@/components/site-header";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, FileText, HandCoins, HeartHandshake, MapPin, MessagesSquare, ShieldCheck, Users } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import PartnerMarks from "@/components/partner-marks";
import TeamGrid from "@/components/team-grid";
import { CategoryIcon } from "@/components/icons";
import { areas } from "@/lib/areas";
import { categoryMeta } from "@/lib/categories";
import { LOCALE_META, type Locale } from "@/lib/i18n";
import { site, whatsappLink } from "@/lib/site";
import { webPageLd } from "@/lib/structured-data";
import { publicTeam } from "@/lib/team";
import SiteQrCards from "@/components/site-qr-cards";
import { WHATSAPP_NUMBER } from "@/lib/public-contact";
import { areaText } from "@/lib/translations/places";
import { lp, tr } from "@/lib/tr";

export async function AboutView({ lang }: { lang: Locale }) {
  const t = tr(lang);
  const team = await publicTeam();
  const home = lang === "en" ? "/" : `/${lang}`;
  const address = lang === "hi" ? site.address.hindi : lang === "bn" ? site.address.bengali : site.address.oneLine;
  const steps = [
    { icon: MessagesSquare, title: t("Tell us what you need", "बताइए आपको क्या चाहिए", "জানান আপনার কী দরকার"), text: t("Walk in, call, WhatsApp or send a request online. We explain the route, the documents and the charges first.", "सीधे आइए, कॉल कीजिए, WhatsApp कीजिए या ऑनलाइन अनुरोध भेजिए। हम पहले रास्ता, दस्तावेज़ और शुल्क समझा देते हैं।", "সরাসরি আসুন, কল করুন, WhatsApp করুন বা অনলাইনে অনুরোধ পাঠান। আমরা আগে পথ, নথি ও চার্জ বুঝিয়ে দিই।") },
    { icon: FileText, title: t("We prepare it with you", "हम आपके साथ तैयार करते हैं", "আমরা আপনার সঙ্গে তৈরি করি"), text: t("We check documents, fill the forms and let you review every detail before anything is submitted.", "हम दस्तावेज़ जाँचते हैं, फ़ॉर्म भरते हैं और कुछ भी जमा होने से पहले आपको हर विवरण देखने देते हैं।", "আমরা নথি দেখি, ফর্ম পূরণ করি এবং কিছু জমা দেওয়ার আগে আপনাকে প্রতিটি তথ্য দেখতে দিই।") },
    { icon: BadgeCheck, title: t("We submit and follow up", "हम जमा करते हैं और फ़ॉलो-अप करते हैं", "আমরা জমা দিই ও ফলো-আপ করি"), text: t("We submit on the official portal, give you the acknowledgement and tell you where to track it.", "हम आधिकारिक पोर्टल पर जमा करते हैं, पावती देते हैं और बताते हैं कि उसे कहाँ ट्रैक करना है।", "আমরা সরকারি পোর্টালে জমা দিই, প্রাপ্তিস্বীকার দিই এবং কোথায় ট্র্যাক করবেন তা জানাই।") },
    { icon: HandCoins, title: t("Clear charges, clear receipt", "साफ़ शुल्क, साफ़ रसीद", "স্পষ্ট চার্জ, স্পষ্ট রসিদ"), text: t("Our service charge is shown separately from government or portal fees, and you get a receipt.", "हमारा सेवा शुल्क सरकारी या पोर्टल शुल्क से अलग दिखाया जाता है, और आपको रसीद मिलती है।", "আমাদের সার্ভিস চার্জ সরকারি বা পোর্টাল ফি থেকে আলাদা দেখানো হয়, এবং আপনি রসিদ পান।") },
  ];
  const promises = [
    { icon: HeartHandshake, title: t("Honest service, fair price", "ईमानदार सेवा, उचित दाम", "সৎ পরিষেবা, ন্যায্য দাম"), text: t("The same ethic we started with in 1995: serve every person honestly, at the best price available in the market.", "वही उसूल जिससे हमने 1995 में शुरुआत की: हर व्यक्ति की ईमानदारी से सेवा, बाज़ार में उपलब्ध सबसे अच्छे दाम पर।", "১৯৯৫ সালে যে নীতি নিয়ে শুরু করেছিলাম তাই: প্রতিটি মানুষের সৎভাবে সেবা, বাজারে পাওয়া সেরা দামে।") },
    { icon: ShieldCheck, title: t("Your documents stay private", "आपके दस्तावेज़ निजी रहते हैं", "আপনার নথি গোপন থাকে"), text: t("Files are kept privately, used only for your request and deleted on schedule. Staff never ask for your OTP or PIN.", "फ़ाइलें निजी रखी जाती हैं, केवल आपके अनुरोध के लिए उपयोग होती हैं और समय पर हटा दी जाती हैं। स्टाफ़ कभी आपका OTP या PIN नहीं माँगता।", "ফাইল গোপনে রাখা হয়, শুধু আপনার অনুরোধের জন্য ব্যবহৃত হয় এবং নির্দিষ্ট সময়ে মুছে ফেলা হয়। কর্মীরা কখনও আপনার OTP বা PIN চান না।") },
    { icon: Users, title: t("Real people, in person", "असली लोग, आमने-सामने", "সত্যিকারের মানুষ, সামনাসামনি"), text: t("A friendly desk you can walk up to, in Hindi or English, with the same faces you saw last time.", "एक अपनापन भरा डेस्क जहाँ आप सीधे आ सकते हैं, हिन्दी या अंग्रेज़ी में, उन्हीं चेहरों के साथ जो आपने पिछली बार देखे थे।", "একটি আন্তরিক ডেস্ক যেখানে সরাসরি আসতে পারেন, হিন্দি, বাংলা বা ইংরেজিতে, আগের বার দেখা সেই একই মুখগুলির সঙ্গে।") },
  ];
  return <main className="content-page about-page" lang={LOCALE_META[lang].htmlLang}><SiteHeader/>
    <JsonLd data={webPageLd({ name: t("About NISE COMPORT", "NISE COMPORT के बारे में", "NISE COMPORT সম্পর্কে"), description: site.description, path: lang === "en" ? "/about" : `/${lang}/about`, type: "AboutPage" })}/>

    <section className="content-hero about-hero"><div className="container about-hero__grid">
      <div>
        <Breadcrumbs label={t("Breadcrumb", "ब्रेडक्रंब", "ব্রেডক্রাম্ব")} items={[{ name: t("Home", "होम", "হোম"), path: home }, { name: t("About", "हमारे बारे में", "আমাদের সম্পর্কে"), path: lp(lang, "/about") }]}/>
        <span className="eyebrow eyebrow-muted">{t("SINCE 1995 · KHARANGAJHAR, TELCO", "1995 से · खरंगाझार, टेल्को", "১৯৯৫ থেকে · খরংগাঝাড়, টেলকো")}</span>
        <h1>{t("Your neighbourhood", "आपका अपना मोहल्ले का", "আপনার পাড়ার")}<br/><em>{t("digital seva kendra.", "डिजिटल सेवा केंद्र।", "ডিজিটাল সেবা কেন্দ্র।")}</em></h1>
        <p>{t("NISE COMPORT is an independent CSC / Pragya Kendra service centre in Jamshedpur. We help you reach government, banking, insurance and digital services without the running around: clear steps, careful attention and a friendly face.", "NISE COMPORT जमशेदपुर का एक स्वतंत्र CSC / प्रज्ञा केंद्र सेवा केंद्र है। हम आपको भागदौड़ के बिना सरकारी, बैंकिंग, बीमा और डिजिटल सेवाओं तक पहुँचने में मदद करते हैं: साफ़ चरण, ध्यान से किया गया काम और एक अपनापन भरा चेहरा।", "NISE COMPORT জামশেদপুরের একটি স্বাধীন CSC / প্রজ্ঞা কেন্দ্র পরিষেবা কেন্দ্র। আমরা ছোটাছুটি ছাড়াই সরকারি, ব্যাংকিং, বিমা ও ডিজিটাল পরিষেবায় পৌঁছাতে আপনাকে সাহায্য করি: স্পষ্ট ধাপ, যত্নশীল মনোযোগ আর একটি আন্তরিক মুখ।")}</p>
        <div className="about-hero__actions">
          <Link className="btn btn--primary" href="/request">{t("Start a request", "अनुरोध शुरू करें", "অনুরোধ শুরু করুন")} <ArrowRight size={16}/></Link>
          <a className="btn btn--ghost" href={whatsappLink(t("Hello NISE COMPORT, I need help with a service.", "नमस्ते NISE COMPORT, मुझे एक सेवा में मदद चाहिए।", "নমস্কার NISE COMPORT, একটি পরিষেবায় আমার সাহায্য দরকার।"))} target="_blank" rel="noopener noreferrer">{t("WhatsApp us", "हमें WhatsApp करें", "আমাদের WhatsApp করুন")}</a>
        </div>
      </div>
      <Image className="about-hero__photo" src="/images/about/2.png" alt={t("NISE COMPORT service desk illustration", "NISE COMPORT सर्विस डेस्क का चित्र", "NISE COMPORT সার্ভিস ডেস্কের ছবি")} width={538} height={516} priority sizes="(max-width: 860px) 70vw, 420px"/>
    </div></section>

    <section className="container about-stats" aria-label={t("NISE COMPORT at a glance", "NISE COMPORT एक नज़र में", "NISE COMPORT এক নজরে")}>
      <div><b>1995</b><span>{t("Serving Jamshedpur since", "से जमशेदपुर की सेवा में", "থেকে জামশেদপুরের সেবায়")}</span></div>
      <div><b>{categoryMeta.length}</b><span>{t("Service categories under one roof", "एक छत के नीचे सेवा श्रेणियाँ", "এক ছাদের নীচে পরিষেবা বিভাগ")}</span></div>
      <div><b>{areas.length}+</b><span>{t("Neighbourhoods we serve", "मोहल्ले जहाँ हम सेवा देते हैं", "যেসব পাড়ায় আমরা পরিষেবা দিই")}</span></div>
      <div><b>हिन्दी · বাংলা · English</b><span>{t("Help in your language", "आपकी भाषा में मदद", "আপনার ভাষায় সাহায্য")}</span></div>
    </section>

    <section className="container about-story">
      <div className="section-head section-head--left"><span className="eyebrow">{t("OUR STORY", "हमारी कहानी", "আমাদের গল্প")}</span><h2>{t("From NISE to NISE COMPORT", "NISE से NISE COMPORT तक", "NISE থেকে NISE COMPORT")}</h2></div>
      <div className="about-story__body">
        {lang === "en" && <>
          <p>We began as <b>NISE</b> in 1995, a small computer and digital-services desk for our neighbourhood in Kharangajhar, Telco. People came for a print-out or a form, and stayed because someone patiently explained what to do next.</p>
          <p>Over the years that grew into <b>NISE COMPORT</b>: a CSC / Pragya Kendra service centre where families, students, shopkeepers and senior citizens find PAN and Aadhaar help, Jharkhand certificates, banking and AEPS, insurance, online forms, printing, and computer sales and repair, all in one place.</p>
        </>}
        {lang === "hi" && <>
          <p>हमने 1995 में <b>NISE</b> के रूप में शुरुआत की, खरंगाझार, टेल्को में अपने मोहल्ले के लिए एक छोटा कंप्यूटर और डिजिटल सेवा डेस्क। लोग प्रिंट-आउट या फ़ॉर्म के लिए आते थे, और इसलिए रुके क्योंकि कोई धैर्य से समझाता था कि आगे क्या करना है।</p>
          <p>सालों में यह <b>NISE COMPORT</b> बन गया: एक CSC / प्रज्ञा केंद्र सेवा केंद्र, जहाँ परिवार, छात्र, दुकानदार और वरिष्ठ नागरिक एक ही जगह पैन और आधार में मदद, झारखंड के प्रमाण पत्र, बैंकिंग और AEPS, बीमा, ऑनलाइन फ़ॉर्म, प्रिंटिंग तथा कंप्यूटर की बिक्री और मरम्मत पाते हैं।</p>
        </>}
        {lang === "bn" && <>
          <p>আমরা ১৯৯৫ সালে <b>NISE</b> নামে শুরু করেছিলাম, খরংগাঝাড়, টেলকোয় আমাদের পাড়ার জন্য একটি ছোট কম্পিউটার ও ডিজিটাল পরিষেবা ডেস্ক। মানুষ আসত প্রিন্ট-আউট বা ফর্মের জন্য, আর থেকে যেত কারণ কেউ ধৈর্য ধরে বুঝিয়ে দিত পরে কী করতে হবে।</p>
          <p>বছরের পর বছর তা হয়ে উঠল <b>NISE COMPORT</b>: একটি CSC / প্রজ্ঞা কেন্দ্র পরিষেবা কেন্দ্র, যেখানে পরিবার, ছাত্রছাত্রী, দোকানদার ও প্রবীণ নাগরিকেরা এক জায়গায় প্যান ও আধারে সাহায্য, ঝাড়খণ্ডের সার্টিফিকেট, ব্যাংকিং ও AEPS, বিমা, অনলাইন ফর্ম, প্রিন্টিং এবং কম্পিউটার বিক্রি ও মেরামত পান।</p>
        </>}
        <p className="about-story__quote">{t("“We have made our way from NISE to NISE COMPORT because of you. We have never forgotten our ethic: serve every person honestly, at the best price available today.”", "“आपकी वजह से हम NISE से NISE COMPORT तक पहुँचे हैं। हमने अपना उसूल कभी नहीं भुलाया: हर व्यक्ति की ईमानदारी से सेवा, आज उपलब्ध सबसे अच्छे दाम पर।”", "“আপনাদের জন্যই আমরা NISE থেকে NISE COMPORT-এ পৌঁছেছি। আমাদের নীতি আমরা কখনও ভুলিনি: প্রতিটি মানুষের সৎভাবে সেবা, আজ পাওয়া সেরা দামে।”")}</p>
        <p>{t("We look forward to continuing to serve our community, and to adding more services that help it grow.", "हम अपने समुदाय की सेवा जारी रखने और ऐसी और सेवाएँ जोड़ने की आशा रखते हैं जो उसे आगे बढ़ाएँ।", "আমরা আমাদের সমাজের সেবা চালিয়ে যেতে এবং তার বিকাশে সাহায্য করে এমন আরও পরিষেবা যোগ করতে উন্মুখ।")}</p>
      </div>
    </section>

    <section className="section section--tint"><div className="container">
      <div className="section-head"><span className="eyebrow">{t("WHAT WE DO", "हम क्या करते हैं", "আমরা কী করি")}</span><h2>{t("Everything in one visit", "एक ही बार में सब कुछ", "একবারেই সব")}</h2><p>{t("From government work to your laptop, these are the services our desk handles every day.", "सरकारी काम से लेकर आपके लैपटॉप तक, ये वे सेवाएँ हैं जो हमारा डेस्क हर दिन सँभालता है।", "সরকারি কাজ থেকে আপনার ল্যাপটপ পর্যন্ত, এই পরিষেবাগুলি আমাদের ডেস্ক প্রতিদিন সামলায়।")}</p></div>
      <div className="about-services">{categoryMeta.map((category) => <Link key={category.slug} href={lp(lang, `/services/${category.slug}`)} className={`about-service tone-${category.tone}`}>
        <span className="about-service__icon"><CategoryIcon icon={category.icon} size={22}/></span>
        <b>{category.short[lang]}</b><small>{category.line[lang]}</small>
      </Link>)}</div>
    </div></section>

    <section className="container about-partners">
      <div className="section-head"><span className="eyebrow">{t("SERVICES WE HELP YOU ACCESS", "जिन सेवाओं तक हम आपको पहुँचाते हैं", "যেসব পরিষেবায় আমরা আপনাকে পৌঁছে দিই")}</span><h2>{t("We are the helping hand between you and these services", "आपके और इन सेवाओं के बीच हम मददगार हाथ हैं", "আপনার আর এই পরিষেবাগুলির মাঝে আমরা সাহায্যের হাত")}</h2><p>{t("The services and programmes below belong to their government departments, companies and providers. NISE COMPORT does not issue or approve them. We help you apply, prepare documents, submit and track.", "नीचे की सेवाएँ और योजनाएँ उनके सरकारी विभागों, कंपनियों और प्रदाताओं की हैं। NISE COMPORT उन्हें जारी या स्वीकृत नहीं करता। हम आवेदन करने, दस्तावेज़ तैयार करने, जमा करने और ट्रैक करने में मदद करते हैं।", "নীচের পরিষেবা ও প্রকল্পগুলি তাদের সরকারি দপ্তর, কোম্পানি ও প্রদানকারীর। NISE COMPORT সেগুলি ইস্যু বা অনুমোদন করে না। আমরা আবেদন, নথি তৈরি, জমা ও ট্র্যাকিংয়ে সাহায্য করি।")}</p></div>
      <PartnerMarks lang={lang}/>
      <p className="about-partners__note">{t("All names and logos belong to their respective owners. NISE COMPORT is an independent local facilitator; final decisions, fees and approvals rest with the relevant authority or provider.", "सभी नाम और लोगो उनके संबंधित स्वामियों के हैं। NISE COMPORT एक स्वतंत्र स्थानीय सहायक है; अंतिम निर्णय, शुल्क और स्वीकृति संबंधित प्राधिकरण या प्रदाता के पास हैं।", "সব নাম ও লোগো তাদের নিজ নিজ মালিকের। NISE COMPORT একটি স্বাধীন স্থানীয় সহায়ক; চূড়ান্ত সিদ্ধান্ত, ফি ও অনুমোদন সংশ্লিষ্ট কর্তৃপক্ষ বা প্রদানকারীর হাতে।")}</p>
    </section>

    <section className="section section--tint"><div className="container">
      <div className="section-head"><span className="eyebrow">{t("HOW WE WORK", "हम कैसे काम करते हैं", "আমরা কীভাবে কাজ করি")}</span><h2>{t("Simple, from the first question", "पहले सवाल से ही सरल", "প্রথম প্রশ্ন থেকেই সহজ")}</h2></div>
      <ol className="about-steps">{steps.map((step, index) => <li key={step.title}><span className="about-steps__n">{index + 1}</span><step.icon size={22} aria-hidden="true"/><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
    </div></section>

    <section className="container about-promises">{promises.map((item) => <article key={item.title}><item.icon size={24} aria-hidden="true"/><h3>{item.title}</h3><p>{item.text}</p></article>)}</section>

    <section className="container team-section">
      <div className="section-head"><span className="eyebrow">{t("THE PEOPLE", "हमारे लोग", "আমাদের মানুষ")}</span><h2>{t("Meet the team", "टीम से मिलिए", "টিমের সঙ্গে পরিচিত হন")}</h2><p>{t("The faces you will see when you visit, and the voices you will hear when you call.", "वे चेहरे जो आप आने पर देखेंगे, और वे आवाज़ें जो कॉल करने पर सुनेंगे।", "আপনি এলে যে মুখগুলি দেখবেন, আর কল করলে যে কণ্ঠস্বর শুনবেন।")}</p></div>
      <TeamGrid people={team.slice(0, 8)} lang={lang}/>
      {team.length > 8 && <p className="center"><Link className="arrow-link" href={lp(lang, "/team")}>{t("See the whole team", "पूरी टीम देखें", "পুরো টিম দেখুন")} <ArrowRight size={14}/></Link></p>}
    </section>

    <section className="container about-visit">
      <MapPin size={24} aria-hidden="true"/>
      <div><h2>{t("Visit us in Kharangajhar, Telco", "खरंगाझार, टेल्को में हमसे मिलिए", "খরংগাঝাড়, টেলকোয় আমাদের কাছে আসুন")}</h2><p>{address}. {t("We serve ", "हम सेवा देते हैं: ", "আমরা পরিষেবা দিই: ")}{areas.slice(0, 6).map((area) => areaText(area, lang).name).join(", ")}{t(" and the wider Jamshedpur area. ", " और पूरे जमशेदपुर क्षेत्र में। ", " এবং পুরো জামশেদপুর অঞ্চলে। ")}<Link href={lp(lang, "/areas-we-serve")}>{t("See all areas", "सभी इलाके देखें", "সব এলাকা দেখুন")}</Link>.</p></div>
      <Link className="btn btn--primary" href={lp(lang, "/contact")}>{t("Get directions", "रास्ता देखें", "দিকনির্দেশ পান")} <ArrowRight size={16}/></Link>
    </section>
    <section className="container about-qr" aria-labelledby="about-qr-title">
      <h2 id="about-qr-title">{t("Scan to sign in or chat with us", "साइन इन या चैट के लिए स्कैन करें", "সাইন ইন বা চ্যাটের জন্য স্ক্যান করুন")}</h2>
      <p>{t("Print these on a poster or share them with family. Each one opens straight away.", "इन्हें पोस्टर पर छापें या परिवार को भेजें। हर कोड सीधे खुलता है।", "পোস্টারে ছাপুন বা পরিবারকে পাঠান। প্রতিটি কোড সরাসরি খোলে।")}</p>
      <SiteQrCards download={t("Download", "डाउनलोड", "ডাউনলোড")} cards={[
        { title: t("Welcome", "स्वागत", "স্বাগতম"), hint: t("One code for every phone: WhatsApp, email and sign-in.", "हर फ़ोन के लिए एक कोड: WhatsApp, ईमेल और साइन-इन।", "সব ফোনের জন্য একটি কোড: WhatsApp, ইমেল ও সাইন-ইন।"), url: `${site.url}/welcome`, file: "nise-comport-welcome-qr.svg" },
        { title: t("Sign in", "साइन इन", "সাইন ইন"), hint: t("Opens the sign-in page with your mobile number.", "मोबाइल नंबर से साइन इन पेज खुलता है।", "মোবাইল নম্বর দিয়ে সাইন ইন পেজ খোলে।"), url: `${site.url}/login`, file: "nise-comport-login-qr.svg" },
        { title: "WhatsApp", hint: t("Starts a chat with our desk.", "हमारे डेस्क से चैट शुरू होती है।", "আমাদের ডেস্কের সাথে চ্যাট শুরু হয়।"), url: `https://wa.me/${WHATSAPP_NUMBER}`, file: "nise-comport-whatsapp-qr.svg" },
      ]}/>
    </section>
    <section className="container provider-note"><p>{t("We are not a government department and do not decide on applications. Our service charge is separate from any government or third-party fee. See ", "हम सरकारी विभाग नहीं हैं और आवेदनों पर फ़ैसला नहीं करते। हमारा सेवा शुल्क किसी भी सरकारी या तीसरे पक्ष के शुल्क से अलग है। देखें ", "আমরা সরকারি দপ্তর নই এবং আবেদনের সিদ্ধান্ত নিই না। আমাদের সার্ভিস চার্জ যেকোনো সরকারি বা তৃতীয় পক্ষের ফি থেকে আলাদা। দেখুন ")}<Link href={lp(lang, "/pricing")}>{t("pricing", "मूल्य", "মূল্য")}</Link>{t(" and our ", " और हमारी ", " এবং আমাদের ")}<Link href={lp(lang, "/refund-policy")}>{t("refund policy", "रिफ़ंड नीति", "রিফান্ড নীতি")}</Link>.</p></section>
  </main>;
}
