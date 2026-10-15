/**
 * Local gallery items. Google Business Profile photos are added automatically on /gallery when
 * GOOGLE_MAPS_API_KEY and GOOGLE_PLACE_ID are set (see src/lib/google-places.ts).
 *
 * To add your own shop photos (counter, team, customers with permission): put a JPG/WebP in
 * public/images/gallery/ and add an entry with tag "shop". Your own photos cost nothing to show and
 * never expire.
 */
import { galleryPhotos, type GalleryPhoto } from "./gallery-photos.ts";

export type GalleryTag = "shop" | "services";
export type LocalGalleryItem = { src: string; width: number; height: number; title: string; alt: string; tag: GalleryTag; href?: string };

export const localGallery: LocalGalleryItem[] = [
  { src: "/images/gallery/pan-card.webp", width: 1200, height: 900, title: "PAN card, sorted", alt: "Illustration: PAN card help at NISE COMPORT, Telco", tag: "services", href: "/services/pan-card" },
  { src: "/images/gallery/certificates.webp", width: 1200, height: 900, title: "Income, caste & residence certificates", alt: "Illustration: Jharkhand certificate application help", tag: "services", href: "/services/income-caste-residence-certificate" },
  { src: "/images/gallery/aeps-banking.webp", width: 1200, height: 900, title: "Cash withdrawal & money transfer", alt: "Illustration: AEPS banking and money transfer", tag: "services", href: "/services/aeps-money-transfer" },
  { src: "/images/gallery/insurance.webp", width: 1200, height: 900, title: "Bike, car & health insurance", alt: "Illustration: insurance help with participating insurers", tag: "services", href: "/services/insurance" },
  { src: "/images/gallery/print-from-phone.webp", width: 1200, height: 900, title: "Print from your phone", alt: "Illustration: upload a document from your phone and collect the print", tag: "services", href: "/print" },
  { src: "/images/gallery/student-forms.webp", width: 1200, height: 900, title: "Exam, job & scholarship forms", alt: "Illustration: student and exam form filling help", tag: "services", href: "/services/education" },
  { src: "/images/gallery/bills-recharge.webp", width: 1200, height: 900, title: "Bills & recharge with a receipt", alt: "Illustration: bill payment and recharge", tag: "services", href: "/services/bill-payment-recharge" },
  { src: "/images/gallery/track-live.webp", width: 1200, height: 900, title: "Track every request live", alt: "Illustration: request tracking in your NISE COMPORT account", tag: "services", href: "/profile#requests" },
];

/** Illustration used on service pages that don't have their own image. */
const CATEGORY_POSTER: Record<string, string> = {
  "government-services": "/images/gallery/certificates.webp",
  banking: "/images/gallery/aeps-banking.webp",
  insurance: "/images/gallery/insurance.webp",
  education: "/images/gallery/student-forms.webp",
  "fee-payments": "/images/gallery/bills-recharge.webp",
  "form-filing": "/images/gallery/certificates.webp",
  "it-services": "/images/gallery/print-from-phone.webp",
  travel: "/images/gallery/track-live.webp",
};
const SERVICE_POSTER: Record<string, string> = {
  "pan-card": "/images/gallery/pan-card.webp",
  "printing-scanning": "/images/gallery/print-from-phone.webp",
  "bill-payment-recharge": "/images/gallery/bills-recharge.webp",
};

export function posterFor(slug: string, category?: string) {
  return SERVICE_POSTER[slug] ?? CATEGORY_POSTER[category ?? slug] ?? "/images/gallery/track-live.webp";
}

/** Your own photos (npm run photos), newest first. */
export const ownPhotos: GalleryPhoto[] = galleryPhotos.filter((photo) => !photo.hidden).reverse();

/** Your photos for one service page (newest first). */
export function photosForService(slug: string) {
  return ownPhotos.filter((photo) => photo.service === slug);
}
