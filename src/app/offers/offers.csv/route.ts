import { NextRequest } from "next/server";
import { COMMUNITY_LABELS, type Community } from "@/lib/festivals";
import { isLocale } from "@/lib/i18n";
import { getPromoCalendar } from "@/lib/promotions";
import { promoCsv } from "@/lib/promo-view";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Every current and upcoming promo code as a spreadsheet. In Google Sheets:
 *   =IMPORTDATA("https://www.nisecomport.com/offers/offers.csv")
 * ?lang=hi|bn translates the columns; ?download=1 saves a file (with a BOM so Excel shows Hindi/Bengali).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lang = params.get("lang");
  const download = params.has("download");
  const { views } = await getPromoCalendar();
  const csv = promoCsv(views, {
    siteUrl: site.url, locale: isLocale(lang) ? lang : "en",
    communityLabel: (community, locale) => COMMUNITY_LABELS[community as Community]?.[locale] ?? community,
  });
  return new Response(download ? `﻿${csv}` : csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `${download ? "attachment" : "inline"}; filename="nise-comport-offers.csv"`,
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      "x-robots-tag": "noindex",
    },
  });
}
