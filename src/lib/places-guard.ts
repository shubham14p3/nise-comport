import { clientIp } from "@/lib/http";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";

/** Per-visitor limits for the Google-backed address endpoints. */
export async function guardPlaces(request: Request) {
  const key = identity("ip", clientIp(request));
  await enforceRate(RATE_RULES.placesPerIpHour, key, "Too many address searches. Please type the address instead.");
  await enforceRate(RATE_RULES.placesPerIpDay, key, "Too many address searches today. Please type the address instead.");
}
