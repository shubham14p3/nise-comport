import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { liveBanners, type Banner, type BannerPlacement } from "@/lib/site-content";

type Lang = "en" | "hi" | "bn";

function BannerImage({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- poster from the admin library or uploads (any size)
  return <img src={src} alt="" loading="lazy"/>;
}

function BannerLink({ banner, children, className }: { banner: Banner; children: React.ReactNode; className: string }) {
  if (!banner.href) return <div className={className}>{children}</div>;
  if (banner.href.startsWith("/")) return <Link className={className} href={banner.href}>{children}</Link>;
  return <a className={className} href={banner.href} target={banner.href.startsWith("tel:") ? undefined : "_blank"} rel="noopener noreferrer">{children}</a>;
}

/**
 * Banners managed in Admin → Site content. Renders nothing when there are none, so pages look
 * exactly as before until the owner adds one.
 */
export default async function SiteBanners({ placement, category, lang = "en" }: { placement: BannerPlacement; category?: string | null; lang?: Lang }) {
  const banners = await liveBanners(placement, category);
  if (!banners.length) return null;
  if (placement === "strip") {
    const banner = banners[0];
    return <BannerLink banner={banner} className={`banner-strip tone-${banner.tone}`}>
      <span><b>{banner.title[lang]}</b>{banner.text ? ` ${banner.text[lang]}` : ""}</span>{banner.cta && <em>{banner.cta[lang]} <ArrowRight size={14}/></em>}
    </BannerLink>;
  }
  return <section className={`site-banners site-banners--${placement}${placement === "home" ? " container" : ""}`} aria-label="Announcements">
    {banners.slice(0, placement === "home" ? 3 : 2).map((banner) => <BannerLink key={banner.id} banner={banner} className={`site-banner tone-${banner.tone}${banner.image ? " has-image" : ""}`}>
      {banner.image && <BannerImage src={banner.image}/>}
      <span className="site-banner__body">
        <b>{banner.title[lang]}</b>
        {banner.text && <small>{banner.text[lang]}</small>}
        {banner.cta && <em>{banner.cta[lang]} <ArrowRight size={15}/></em>}
      </span>
    </BannerLink>)}
  </section>;
}
