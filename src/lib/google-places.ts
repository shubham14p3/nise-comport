/**
 * Server-only helpers for Google Maps Platform (Places API "New" and Geocoding API).
 * The API key never reaches the browser:
 *   GOOGLE_MAPS_API_KEY  – server key restricted to Places API (New) + Geocoding API
 *   GOOGLE_PLACE_ID      – the shop's Google Business Profile place ID (for photos and rating)
 * Every function returns null / [] when the key is missing or Google fails, so pages still render.
 */
// Server-side only: never import this file from browser (client) components.

const PLACES = "https://places.googleapis.com/v1";
const GEOCODE = "https://maps.googleapis.com/maps/api/geocode/json";
/** Bias searches to Jamshedpur (Telco / Kharangajhar area). */
export const JAMSHEDPUR = { latitude: 22.7925, longitude: 86.2476 };
const PHOTO_LIMIT = 12;

function key() {
  const value = process.env.GOOGLE_MAPS_API_KEY?.trim();
  return value ? value : null;
}

export function placesConfigured() {
  return Boolean(key());
}

export type PlacePhoto = { index: number; width: number; height: number; author: string; authorUri: string | null };
export type PlaceSummary = { rating: number | null; ratingCount: number; mapsUri: string | null; photos: PlacePhoto[]; photoNames: string[] };

/** Rating, review count and photo list of the shop (cached for 12 hours). */
export async function getPlaceSummary(): Promise<PlaceSummary | null> {
  const apiKey = key();
  const placeId = process.env.GOOGLE_PLACE_ID?.trim();
  if (!apiKey || !placeId) return null;
  try {
    const response = await fetch(`${PLACES}/places/${encodeURIComponent(placeId)}`, {
      headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,photos" },
      next: { revalidate: 43_200 },
    });
    if (!response.ok) { console.error("[places] details failed", response.status); return null; }
    const data = await response.json() as {
      rating?: number; userRatingCount?: number; googleMapsUri?: string;
      photos?: { name: string; widthPx?: number; heightPx?: number; authorAttributions?: { displayName?: string; uri?: string }[] }[];
    };
    const photos = (data.photos ?? []).slice(0, PHOTO_LIMIT);
    return {
      rating: typeof data.rating === "number" ? data.rating : null,
      ratingCount: data.userRatingCount ?? 0,
      mapsUri: data.googleMapsUri ?? null,
      photoNames: photos.map((photo) => photo.name),
      photos: photos.map((photo, index) => ({
        index,
        width: photo.widthPx ?? 1200,
        height: photo.heightPx ?? 900,
        author: photo.authorAttributions?.[0]?.displayName ?? "Google user",
        authorUri: photo.authorAttributions?.[0]?.uri ?? null,
      })),
    };
  } catch (error) {
    console.error("[places] details error", error instanceof Error ? error.message : "unknown");
    return null;
  }
}

/** Fetches the image bytes for one of the shop's photos (used by /api/gallery/photo/[index]). */
export async function fetchPlacePhoto(index: number, maxWidth = 1200) {
  const apiKey = key();
  const summary = await getPlaceSummary();
  const name = summary?.photoNames[index];
  if (!apiKey || !name) return null;
  const response = await fetch(`${PLACES}/${name}/media?maxWidthPx=${Math.min(1600, Math.max(200, maxWidth))}`, {
    headers: { "X-Goog-Api-Key": apiKey },
    redirect: "follow",
    next: { revalidate: 43_200 },
  });
  if (!response.ok) return null;
  return { bytes: await response.arrayBuffer(), type: response.headers.get("content-type") || "image/jpeg" };
}

export type AddressSuggestion = { placeId: string; main: string; secondary: string };

/** Address suggestions while typing (Places Autocomplete, New). */
export async function autocompleteAddress(input: string, sessionToken: string): Promise<AddressSuggestion[] | null> {
  const apiKey = key();
  if (!apiKey) return null;
  const response = await fetch(`${PLACES}/places:autocomplete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat" },
    body: JSON.stringify({
      input,
      sessionToken,
      includedRegionCodes: ["in"],
      languageCode: "en",
      regionCode: "in",
      locationBias: { circle: { center: JAMSHEDPUR, radius: 30_000 } },
    }),
    cache: "no-store",
  });
  if (!response.ok) { console.error("[places] autocomplete failed", response.status); return null; }
  const data = await response.json() as { suggestions?: { placePrediction?: { placeId: string; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } } }[] };
  return (data.suggestions ?? []).flatMap((item) => item.placePrediction ? [{
    placeId: item.placePrediction.placeId,
    main: item.placePrediction.structuredFormat?.mainText?.text ?? "",
    secondary: item.placePrediction.structuredFormat?.secondaryText?.text ?? "",
  }] : []).slice(0, 6);
}

export type ResolvedAddress = { line1: string; line2: string; city: string; state: string; postalCode: string; latitude: number | null; longitude: number | null; placeId: string | null };

type Component = { longText?: string; long_name?: string; types: string[] };

function pick(components: Component[], ...types: string[]) {
  for (const type of types) {
    const found = components.find((component) => component.types.includes(type));
    const text = found?.longText ?? found?.long_name;
    if (text) return text;
  }
  return "";
}

function toAddress(components: Component[], formatted: string, latitude: number | null, longitude: number | null, placeId: string | null, name = ""): ResolvedAddress {
  const premise = [pick(components, "premise", "subpremise"), pick(components, "street_number")].filter(Boolean).join(", ");
  const route = pick(components, "route");
  const area = [pick(components, "sublocality_level_2", "neighborhood"), pick(components, "sublocality_level_1", "sublocality")].filter(Boolean).filter((value, index, list) => list.indexOf(value) === index).join(", ");
  const line1 = [name && !formatted.startsWith(name) ? name : "", premise, route].filter(Boolean).join(", ") || formatted.split(",").slice(0, 2).join(",").trim();
  return {
    line1: line1.slice(0, 160),
    line2: area.slice(0, 160),
    city: pick(components, "locality", "administrative_area_level_3", "administrative_area_level_2") || "Jamshedpur",
    state: pick(components, "administrative_area_level_1") || "Jharkhand",
    postalCode: pick(components, "postal_code").replace(/\D/g, "").slice(0, 6),
    latitude, longitude, placeId,
  };
}

/** Full address for a chosen suggestion. The same session token closes the autocomplete session. */
export async function placeAddress(placeId: string, sessionToken?: string): Promise<ResolvedAddress | null> {
  const apiKey = key();
  if (!apiKey) return null;
  const url = `${PLACES}/places/${encodeURIComponent(placeId)}${sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : ""}`;
  const response = await fetch(url, {
    headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "id,displayName,formattedAddress,addressComponents,location" },
    cache: "no-store",
  });
  if (!response.ok) { console.error("[places] place details failed", response.status); return null; }
  const data = await response.json() as { id?: string; displayName?: { text?: string }; formattedAddress?: string; addressComponents?: Component[]; location?: { latitude: number; longitude: number } };
  return toAddress(data.addressComponents ?? [], data.formattedAddress ?? "", data.location?.latitude ?? null, data.location?.longitude ?? null, data.id ?? placeId, data.displayName?.text ?? "");
}

/** Address for "Use my current location" (Geocoding API, reverse). */
export async function reverseGeocode(latitude: number, longitude: number): Promise<ResolvedAddress | null> {
  const apiKey = key();
  if (!apiKey) return null;
  const response = await fetch(`${GEOCODE}?latlng=${latitude},${longitude}&region=in&language=en&key=${encodeURIComponent(apiKey)}`, { cache: "no-store" });
  if (!response.ok) return null;
  const data = await response.json() as { status: string; results?: { formatted_address: string; place_id: string; address_components: Component[] }[] };
  const first = data.results?.[0];
  if (data.status !== "OK" || !first) return null;
  return toAddress(first.address_components, first.formatted_address, latitude, longitude, first.place_id);
}
