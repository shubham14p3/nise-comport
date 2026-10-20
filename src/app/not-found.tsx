import SiteHeader from "@/components/site-header";
import NotFoundContent from "@/components/not-found-content";

/** Friendly 404 that still returns HTTP 404 (Next adds noindex automatically), so search engines drop dead URLs. */
export default function NotFound() {
  return <main className="content-page"><SiteHeader/>
    <section className="content-hero"><NotFoundContent/></section>
  </main>;
}
