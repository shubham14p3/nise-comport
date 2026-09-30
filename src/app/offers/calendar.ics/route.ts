import { NextRequest } from "next/server";
import { isLocale } from "@/lib/i18n";
import { getPromoCalendar } from "@/lib/promotions";
import { promoIcs } from "@/lib/promo-view";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * All festival and Team India promo codes as a calendar feed. Customers add it to Google
 * Calendar ("From URL" / the subscribe button on /offers) and new codes appear automatically.
 * ?lang=hi or ?lang=bn gives Hindi or Bengali event titles.
 */
export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");
  const { views } = await getPromoCalendar();
  const body = promoIcs(views, { siteUrl: site.url, locale: isLocale(lang) ? lang : "en" });
  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `${request.nextUrl.searchParams.has("download") ? "attachment" : "inline"}; filename="nise-comport-offers.ics"`,
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      "x-robots-tag": "noindex",
    },
  });
}
