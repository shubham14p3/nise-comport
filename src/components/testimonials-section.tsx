import { publicTestimonials } from "@/lib/testimonials";
import { site } from "@/lib/site";
import { avatarSrc } from "@/lib/avatar";

/**
 * Real reviews, curated by staff from the Google Business Profile (Admin → Testimonials) since
 * the public Places API only ever surfaces up to 5. Omit serviceSlug for the homepage's general
 * mix; pass one on a service page to also show reviews tagged to that service.
 */
function Card({ item }: { item: Awaited<ReturnType<typeof publicTestimonials>>[number] }) {
  return <article className="testimonial-card">
    <span className="testimonial-card__quote" aria-hidden="true">“</span>
    <div className="testimonial-card__stars" aria-hidden="true">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</div>
    <p className="testimonial-card__body">{item.body}</p>
    <div className="testimonial-card__by">
      {/* eslint-disable-next-line @next/next/no-img-element -- static pre-generated/captured avatar file, no Image optimization needed */}
      <img src={avatarSrc(item.authorName)} alt="" width={40} height={40} className="avatar-initials" loading="lazy"/>
      <div>
        <b>{item.authorName}</b>
        <small>{item.reviewedOn ? new Date(item.reviewedOn).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) + " · " : ""}Google review</small>
      </div>
    </div>
  </article>;
}

/**
 * Real reviews, curated by staff from the Google Business Profile (Admin → Testimonials) since
 * the public Places API only ever surfaces up to 5. Omit serviceSlug for the homepage's general
 * mix; pass one on a service page to also show reviews tagged to that service. Renders as a
 * continuously auto-scrolling slider (pure CSS, pauses on hover/focus) rather than a static grid,
 * so it stays lively without needing any client-side JS.
 */
export default async function TestimonialsSection({ serviceSlug, heading = "customers" }: { serviceSlug?: string; heading?: string }) {
  const items = await publicTestimonials({ serviceSlug, limit: serviceSlug ? 10 : 16 });
  if (!items.length) return null;
  // Slider needs enough cards to not look sparse mid-loop; fall back to the plain grid otherwise.
  const asSlider = items.length >= 5;
  return <section className="section section--tint" id="reviews">
    <div className="container">
      <div className="section-head section-head--split">
        <div><span className="eyebrow">GOOGLE REVIEWS</span><h2>What <span className="grad-text">{heading}</span> say</h2></div>
        {site.reviewUrl && <a className="btn btn--ghost" href={site.reviewUrl} target="_blank" rel="noopener noreferrer">Leave a review</a>}
      </div>
    </div>
    {asSlider
      ? <div className="testimonial-slider">
          <div className="testimonial-track">
            {items.map((item) => <Card key={item.id} item={item}/>)}
            {items.map((item) => <Card key={`${item.id}-dup`} item={item}/>)}
          </div>
        </div>
      : <div className="container"><div className="svc-grid">{items.map((item) => <Card key={item.id} item={item}/>)}</div></div>}
  </section>;
}
