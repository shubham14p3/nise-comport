import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { placesConfigured, reverseGeocode } from "@/lib/google-places";
import { apiError, readJson } from "@/lib/http";
import { guardPlaces } from "@/lib/places-guard";

/** India only (roughly), so the endpoint can't be used as a free worldwide geocoder. */
const schema = z.object({ latitude: z.number().min(6).max(37.5), longitude: z.number().min(68).max(98) });

/** Address for "use my current location" (Google reverse geocoding). Reached only through the encrypted gateway. */
export async function POST(request: NextRequest) {
  try {
    if (!placesConfigured()) return NextResponse.json({ available: false, address: null });
    const input = schema.parse(await readJson(request, 1024));
    await guardPlaces(request);
    return NextResponse.json({ available: true, address: await reverseGeocode(input.latitude, input.longitude) });
  } catch (error) { return apiError(error); }
}
