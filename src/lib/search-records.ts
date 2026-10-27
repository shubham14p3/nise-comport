import { normaliseSearch } from "@/lib/search-terms";

/** Known search records per service, loaded once from /search-records.json when someone starts searching. */
export type SearchRecords = Map<string, Set<string>>;

let cache: Promise<SearchRecords> | null = null;

export function loadSearchRecords(): Promise<SearchRecords> {
  cache ??= fetch("/search-records.json")
    .then((response) => (response.ok ? response.json() : {}))
    .then((data: Record<string, string[]>) => new Map(Object.entries(data).map(([slug, list]) => [slug, new Set(list.map(normaliseSearch))] as const)))
    .catch(() => new Map());
  return cache;
}

/** True when the typed text is one of the stored records for this service. */
export function isKnownRecord(records: SearchRecords | null, slug: string, query: string): boolean {
  const key = normaliseSearch(query);
  return Boolean(key) && Boolean(records?.get(slug)?.has(key));
}
