# Geo dataset (Country → State → City)

Source: MSG91 location API responses captured from the browser's network tab (HAR). Ids are MSG91's ids.

| File | What |
|---|---|
| `countries.json` | 246 countries: `{ id, name, dialCode, iso }` |
| `states-cities.json` | `{ "<countryId>": { states: [{ id, name, cities: [{ id, name }] }] } }` (India = 101) |
| `geo.ts` | Tiny lookup helper, no dependencies (`createGeo`) |
| `index.ts` | Ready-made `geo` object (needs `resolveJsonModule`, on by default in Next.js) |

## Use in another repo
Copy this folder and `scripts/build-geo-from-har.mjs`. Then `import { geo } from "./geo"`.
Or use only the JSON files from any language.

## Add more data later
Save a new HAR (or the JSON response) and run:
`node scripts/build-geo-from-har.mjs --har new.har` — it only adds, never removes.
Missing in the first capture: Maharashtra (id 22) cities, and cities for non-India countries.
In the browser's network tab open `getCitiesByStateId/22`, then "Save all as HAR".

## Known data quirks
- Not real states: Kenmore, Narora, Natwar, Paschim Medinipur, Vaishali (no cities).
- Some towns sit under the wrong state (e.g. Telangana/Andaman places under Andhra Pradesh).
- NISE COMPORT's dropdowns clean this up in `src/lib/india-geo.ts`.
