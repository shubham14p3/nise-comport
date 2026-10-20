/**
 * Portable Country → State → City lookup. No dependencies, no framework code: copy the whole `src/data/geo` folder
 * into any other repo and it works there.
 *
 *   import { geo } from "@/data/geo";
 *   geo.countries()                 // [{ id, name, dialCode, iso }]
 *   geo.states(101)                 // [{ id, name }]            (101 = India, MSG91 country ids)
 *   geo.cities(101, 16)             // [{ id, name }]            (16 = Jharkhand)
 *   geo.findCountry("india")        // by name, ISO code (IN) or id
 *   geo.findState(101, "jharkhand") // by name or id
 *
 * The ids are MSG91's own, so they stay stable if you ever pull fresh data with scripts/build-geo-from-har.mjs.
 */
export type GeoCountry = { id: number; name: string; dialCode: string; iso: string };
export type GeoCity = { id: number; name: string };
export type GeoState = { id: number; name: string; cities: GeoCity[] };
export type GeoWorld = Record<string, { states: GeoState[] }>;

export const INDIA_COUNTRY_ID = 101;

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function createGeo(countryRows: GeoCountry[], world: GeoWorld) {
  const statesOf = (countryId: number) => world[String(countryId)]?.states ?? [];
  return {
    countries: () => countryRows,
    findCountry(query: string | number): GeoCountry | undefined {
      return countryRows.find((row) => (typeof query === "number" ? row.id === query : same(row.name, query) || same(row.iso, query)));
    },
    states: (countryId: number): { id: number; name: string }[] => statesOf(countryId).map(({ id, name }) => ({ id, name })),
    findState(countryId: number, query: string | number) {
      return statesOf(countryId).find((state) => (typeof query === "number" ? state.id === query : same(state.name, query)));
    },
    cities(countryId: number, stateQuery: string | number): GeoCity[] {
      const state = this.findState(countryId, stateQuery);
      return state ? state.cities : [];
    },
  };
}
