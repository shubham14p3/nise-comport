/** Prints the titles needed for share images as JSON (used by scripts/generate-og-images.py). */
import { articles } from "../src/lib/content.ts";
import { hindiServices } from "../src/lib/hindi.ts";
import { publishedServiceDetails, serviceCatalog } from "../src/lib/services.ts";

const out = {
  services: publishedServiceDetails.map((service) => ({ slug: service.slug, title: service.title.replace(/ in Jamshedpur$/i, ""), category: serviceCatalog.find((group) => group.slug === service.categorySlug)?.title ?? "Services" })),
  guides: articles.map((article) => ({ slug: article.slug, title: article.seoTitle ?? article.title, category: article.category })),
  hindi: hindiServices.map((service) => ({ slug: service.slug, title: service.title })),
};
console.log(JSON.stringify(out));
