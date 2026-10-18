import { publicTestimonials } from "@/lib/testimonials";
import { site } from "@/lib/site";
import { avatarSrc } from "@/lib/avatar";

/**
 * Real reviews, curated by staff from the Google Business Profile (Admin → Testimonials) since
 * the public Places API only ever surfaces up to 5. Omit serviceSlug for the homepage's general
 * mix; pass one on a service page to also show reviews tagged to that service.
 */
export default async function TestimonialsSection({ serviceSlug, heading = "customers" }: { serviceSlug?: string; heading?: string }) {
  const items = await publicTestimonials({ serviceSlug, limit: serviceSlug ? 6 : 9 });
  if (!items.length) return null;
  return <section className="section section--tint" id="reviews">
    <div className="container">
      <div className="section-head section-head--split">
        <div><span className="eyebrow">GOOGLE REVIEWS</span><h2>What <span className="grad-text">{heading}</span> say</h2></div>
        {site.reviewUrl && <a className="btn btn--ghost" href={site.reviewUrl} target="_blank" rel="noopener noreferrer">Leave a review</a>}
      </div>
      <div className="svc-grid">{items.map((item) => <article key={item.id} className="pan-card">
        <p aria-hidden="true" style={{ color: "#f5a623", letterSpacing: 2 }}>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</p>
        <p>“{item.body}”</p>
        <p className="muted pan-card__by">
          {/* eslint-disable-next-line @next/next/no-img-element -- static pre-generated SVG, no Image optimization needed */}
          <img src={avatarSrc(item.authorName)} alt="" width={36} height={36} className="avatar-initials" loading="lazy"/>
          <span><b>{item.authorName}</b>{item.reviewedOn ? ` · ${new Date(item.reviewedOn).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : ""} · Google review</span>
        </p>
      </article>)}</div>
    </div>
  </section>;
}
