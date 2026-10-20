import countries from "./countries.json";
import statesCities from "./states-cities.json";
import { createGeo, type GeoCountry, type GeoWorld } from "./geo";

export * from "./geo";
export const geo = createGeo(countries as GeoCountry[], statesCities as unknown as GeoWorld);
