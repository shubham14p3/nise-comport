import { serializeJsonLd } from "@/lib/structured-data";

/** Renders schema.org JSON-LD. Pass one object, or several (null entries are skipped). */
export default function JsonLd({ data }: { data: object | (object | null)[] | null }) {
  const items = (Array.isArray(data) ? data : [data]).filter((item): item is object => Boolean(item));
  if (!items.length) return null;
  const payload = items.length === 1 ? { "@context": "https://schema.org", ...items[0] } : { "@context": "https://schema.org", "@graph": items };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(payload) }} />;
}
