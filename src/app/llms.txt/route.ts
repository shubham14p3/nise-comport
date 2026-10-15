import { articles } from "@/lib/content";
import { hindiServices } from "@/lib/hindi";
import { publishedServiceDetails, serviceSeoDescription } from "@/lib/services";
import { absoluteUrl, site } from "@/lib/site";
import { summarizeHours } from "@/lib/hours";

export const dynamic = "force-static";

/** llms.txt: a plain summary of the site for AI search assistants (ChatGPT, Perplexity, Gemini…). */
export function GET() {
  const hours = summarizeHours(site.openingHours);
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `- Address: ${site.address.oneLine}`,
    `- Phone: ${site.phones.primary.display}, ${site.phones.secondary.display}; landline ${site.phones.landline.display}`,
    `- Email: ${site.email}`,
    `- Hours: ${hours.length ? hours.join("; ") : "Monday to Saturday (call to confirm timings)"}`,
    "- Languages: English, Hindi",
    "- Status: independent CSC / Pragya Kendra service centre; not a government office. Official fees are separate from the service charge.",
    "",
    "## Services",
    ...publishedServiceDetails.map((service) => `- [${service.title}](${absoluteUrl(`/services/${service.slug}`)}): ${serviceSeoDescription(service)}`),
    "",
    "## Guides",
    ...articles.map((article) => `- [${article.title}](${absoluteUrl(`/blog/${article.slug}`)}): ${article.excerpt}`),
    "",
    "## Hindi pages",
    `- [हिन्दी होम](${absoluteUrl("/hi")})`,
    ...hindiServices.map((service) => `- [${service.title}](${absoluteUrl(`/hi/services/${service.slug}`)})`),
    "",
    "## Key pages",
    `- [Contact and directions](${absoluteUrl("/contact")})`,
    `- [PAN help centre](${absoluteUrl("/pan")})`,
    `- [Areas we serve](${absoluteUrl("/areas-we-serve")})`,
    `- [FAQs](${absoluteUrl("/faq")})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
