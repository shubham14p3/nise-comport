import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { autocompleteAddress, placesConfigured } from "@/lib/google-places";
import { apiError, readJson } from "@/lib/http";
import { guardPlaces } from "@/lib/places-guard";

const schema = z.object({ input: z.string().trim().min(3).max(120), sessionToken: z.string().trim().min(8).max(64) });

/** Address suggestions (Google Places Autocomplete). Reached only through the encrypted gateway. */
export async function POST(request: NextRequest) {
  try {
    if (!placesConfigured()) return NextResponse.json({ available: false, suggestions: [] });
    const input = schema.parse(await readJson(request, 4096));
    await guardPlaces(request);
    const suggestions = await autocompleteAddress(input.input, input.sessionToken);
    return NextResponse.json({ available: true, suggestions: suggestions ?? [] });
  } catch (error) { return apiError(error); }
}
