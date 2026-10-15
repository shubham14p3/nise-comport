import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Camera, MapPin, Star } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import GalleryGrid, { type GalleryEntry } from "@/components/gallery-grid";
import JsonLd from "@/components/json-ld";
import { localGallery } from "@/lib/gallery";
import { livePhotos } from "@/lib/gallery-store";
import { FESTIVAL_TAGS, tagGroup, tagLabel } from "@/lib/gallery-tags";
import { findService, shortServiceName } from "@/lib/services";
import { getPlaceSummary } from "@/lib/google-places";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";

export const revalidate = 43200;

export const metadata: Metadata = pageMetadata("Gallery – Our Desk & Services in Telco, Jamshedpur", "Photos of the NISE COMPORT CSC / Pragya Kendra desk in Kharangajhar, Telco, Jamshedpur from Google, plus illustrated guides to our services.", "/gallery");

export default async function GalleryPage() {
  const place = await getPlaceSummary();
  const googleItems: GalleryEntry[] = (place?.photos ?? []).map((photo) => ({
    key: `google-${photo.index}`, src: `/api/gallery/photo/${photo.index}`, width: photo.width, height: photo.height,
    title: "NISE COMPORT, Kharangajhar", alt: `Photo of NISE COMPORT, Telco, Jamshedpur by ${photo.author}`, tag: "google", author: photo.author, authorUri: photo.authorUri,
  }));
  const ownPhotos = await livePhotos();
  const mine: GalleryEntry[] = ownPhotos.map((photo) => {
    const service = tagGroup(photo.tag) === "service" ? findService(photo.tag) : undefined;
    return {
      key: photo.src, src: photo.src, width: photo.width, height: photo.height, title: photo.title, alt: photo.alt, tag: "shop" as const,
      group: tagGroup(photo.tag), service: photo.tag, serviceLabel: service ? shortServiceName(service.title) : tagLabel(photo.tag),
      ...(service ? { href: `/services/${service.slug}` } : FESTIVAL_TAGS[photo.tag] ? { href: "/offers" } : {}),
    };
  });
  const items: GalleryEntry[] = [...mine, ...googleItems, ...localGallery.map((item) => ({ ...item, key: item.src }))];
  const imageLd = [...ownPhotos.map((photo) => ({ "@type": "ImageObject", contentUrl: absoluteUrl(photo.src), name: photo.title, description: photo.alt, width: photo.width, height: photo.height, creator: { "@type": "Organization", name: site.name }, copyrightHolder: { "@type": "Organization", name: site.name } })), ...localGallery.map((item) => ({ "@type": "ImageObject", contentUrl: absoluteUrl(item.src), name: item.title, description: item.alt, creator: { "@type": "Organization", name: site.name } }))];

  return <main className="page"><SiteHeader/>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "ImageGallery", name: "NISE COMPORT gallery", url: absoluteUrl("/gallery"), image: imageLd }}/>
    <section className="page-hero page-hero--compact">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Gallery", path: "/gallery" }]}/>
        <h1>Our desk, <span className="grad-text">in pictures.</span></h1>
        <p className="page-hero__lead">Real photos from our Kharangajhar counter, plus quick visual guides to what we help with. Tap a service to see only its photos.</p>
        <div className="page-hero__chips">
          {place?.rating ? <a className="rating-chip" href={place.mapsUri ?? site.mapsUrl} target="_blank" rel="noopener noreferrer"><Star size={16} fill="currentColor"/> <b>{place.rating.toFixed(1)}</b> · {place.ratingCount} Google reviews</a> : null}
          <a className="btn btn--glass btn--sm" href={place?.mapsUri ?? site.mapsUrl} target="_blank" rel="noopener noreferrer"><Camera size={16}/>All photos on Google Maps</a>
        </div>
      </div>
    </section>
    <section className="section section--flush">
      <div className="container">
        <GalleryGrid items={items}/>
        {!googleItems.length && !mine.length && <p className="note-card"><MapPin size={20}/><span>Shop photos from our Google Business Profile appear here automatically once Google Maps is connected. Meanwhile, <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer">see us on Google Maps</a>.</span></p>}
        <div className="section-foot"><Link className="btn btn--primary" href="/request">Start a request <ArrowRight size={18}/></Link></div>
      </div>
    </section>
  </main>;
}
