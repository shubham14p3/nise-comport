import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactView } from "@/components/views/contact-view";
import { localizedMetadata } from "@/lib/localized-meta";
import { site } from "@/lib/site";
import { langFromParam } from "@/lib/tr";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = langFromParam((await params).lang);
  if (!lang) return {};
  return localizedMetadata(lang, "/contact",
    { hi: "संपर्क और रास्ता: खरंगाझार, टेल्को", bn: "যোগাযোগ ও দিকনির্দেশ: খরংগাঝাড়, টেলকো" },
    { hi: `${site.phones.primary.display} पर कॉल कीजिए, WhatsApp कीजिए या NiSE COMPORT आइए: ${site.address.hindi}। समय और रास्ता।`, bn: `${site.phones.primary.display}-এ কল করুন, WhatsApp করুন বা NiSE COMPORT-এ আসুন: ${site.address.bengali}। সময় ও দিকনির্দেশ।` });
}

export default async function LocalizedContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = langFromParam((await params).lang);
  if (!lang) notFound();
  return <ContactView lang={lang}/>;
}
