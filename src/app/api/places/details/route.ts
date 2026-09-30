import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { placeAddress, placesConfigured } from "@/lib/google-places";
import { apiError, readJson } from "@/lib/http";
import { guardPlaces } from "@/lib/places-guard";

const schema = z.object({ placeId: z.string().trim().min(5).max(300).regex(/^[A-Za-z0-9_-]+$/), sessionToken: z.string().trim().max(64).optional() });

/** Full address for a chosen suggestion. Reached only through the encrypted gateway. */
export async function POST(request: NextRequest) {
  try {
    if (!placesConfigured()) return NextResponse.json({ available: false, address: null });
    const input = schema.parse(await readJson(request, 4096));
    await guardPlaces(request);
    return NextResponse.json({ available: true, address: await placeAddress(input.placeId, input.sessionToken || undefined) });
  } catch (error) { return apiError(error); }
}
