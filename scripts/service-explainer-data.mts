/** Prints the content for the explainer slides and videos as JSON (used by scripts/generate-service-explainers.py). */
import { publishedServiceDetails } from "../src/lib/services.ts";
import { serviceEditorial } from "../src/lib/service-editorial.ts";

const slugs = (process.argv[2] ?? "").split(",").filter(Boolean);
const out = publishedServiceDetails
  .filter((service) => slugs.length === 0 || slugs.includes(service.slug))
  .map((service) => ({
    slug: service.slug,
    title: service.title.replace(/ in Jamshedpur$/i, ""),
    description: service.description,
    highlights: service.highlights,
    steps: service.steps,
    documents: service.documents,
    audience: serviceEditorial[service.slug]?.audience ?? "",
  }));
console.log(JSON.stringify(out));
