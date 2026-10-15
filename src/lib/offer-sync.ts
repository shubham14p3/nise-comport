/**
 * Writes festival and sports promo codes into the `coupons` table.
 *
 * Used by the daily job (/api/cron/offers), the admin "Sync now" button and
 * `npm run offers:sync`. It takes a plain `query(text, params)` function (a pg Pool works) so the
 * same code runs inside Next.js and from a Node script.
 *
 * Rules:
 * - Rows are matched by `event_key` (e.g. "diwali-2026"), never by code.
 * - New rows are created active. `active` is never changed afterwards: switching a code off in
 *   the admin panel sticks.
 * - Rows the owner edited (`locked = true`) are left alone.
 * - A code already used by a hand-made coupon is reported as a conflict and skipped.
 */
import { istDayEnd, istDayStart, type EventPromo } from "./festivals.ts";
import { fetchHolidayFeed, matchFestivals } from "./festival-calendar.ts";
import { eventPromos } from "./promo-calendar.ts";

export type QueryFn = (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

/** ₹50 sign-up coupon for every account that verifies its email. */
export const WELCOME_COUPON = { discount: 50, minimum: 150, validDays: 90 };

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** "WELCOME-7K3P9Q": no 0/O or 1/I so it is easy to read out at the counter. */
export function welcomeCode(randomIndex: (max: number) => number) {
  let suffix = "";
  for (let index = 0; index < 6; index++) suffix += CODE_ALPHABET[randomIndex(CODE_ALPHABET.length)];
  return `WELCOME-${suffix}`;
}

const COLUMNS = [
  "code", "discount_type", "discount_value", "minimum_amount", "active", "starts_at", "expires_at", "kind", "title", "description",
  "event_key", "event_starts", "event_ends", "theme", "emoji", "communities", "categories", "per_user_limit", "source", "tentative",
] as const;

/** Values in COLUMNS order. */
export function eventCouponValues(promo: EventPromo): unknown[] {
  return [
    promo.code, "fixed", promo.discount.toFixed(2), promo.minimum.toFixed(2), true,
    istDayStart(promo.startsOn).toISOString(), istDayEnd(promo.endsOn).toISOString(), promo.kind,
    JSON.stringify(promo.names), promo.blurb ? JSON.stringify(promo.blurb) : null,
    promo.key, promo.eventStarts, promo.eventEnds, promo.theme, promo.emoji,
    JSON.stringify(promo.communities), promo.categories ? JSON.stringify(promo.categories) : null,
    promo.perUserLimit, promo.source, Boolean(promo.tentative),
  ];
}

const JSONB = new Set(["title", "description", "communities", "categories"]);
const placeholders = COLUMNS.map((column, index) => `$${index + 1}${JSONB.has(column) ? "::jsonb" : ""}`).join(", ");
const UPDATABLE = ["discount_value", "minimum_amount", "starts_at", "expires_at", "title", "description", "event_starts", "event_ends", "theme", "emoji", "communities", "categories", "per_user_limit", "source", "tentative"];

export const UPSERT_EVENT_COUPON = `INSERT INTO coupons (${COLUMNS.join(", ")}) VALUES (${placeholders})
ON CONFLICT (event_key) WHERE event_key IS NOT NULL DO UPDATE SET ${UPDATABLE.map((column) => `${column} = EXCLUDED.${column}`).join(", ")}, updated_at = now()
WHERE coupons.locked = false AND (${UPDATABLE.map((column) => `coupons.${column} IS DISTINCT FROM EXCLUDED.${column}`).join(" OR ")})
RETURNING (xmax = 0) AS inserted`;

function literal(value: unknown, column: string) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  const text = `'${String(value).replace(/'/g, "''")}'`;
  return JSONB.has(column) ? `${text}::jsonb` : text;
}

/** Plain SQL that inserts the given promos, skipping any that already exist (used for the migration seed). */
export function eventCouponSeedSql(promos: EventPromo[]) {
  const rows = promos.map((promo) => `(${eventCouponValues(promo).map((value, index) => literal(value, COLUMNS[index])).join(", ")})`);
  return `INSERT INTO "coupons" (${COLUMNS.map((column) => `"${column}"`).join(", ")}) VALUES\n${rows.join(",\n")}\nON CONFLICT DO NOTHING;`;
}

export type SyncReport = {
  feed: { ok: boolean; status: number; events: number; matched: number };
  promos: number; created: number; updated: number; unchanged: number;
  conflicts: string[];
};

/** Fetches the holiday feed, builds every promo up to the horizon and upserts them. */
export async function syncEventCoupons(query: QueryFn, options: { now?: Date; fetchImpl?: Parameters<typeof fetchHolidayFeed>[0] } = {}): Promise<SyncReport> {
  const now = options.now ?? new Date();
  const feed = await fetchHolidayFeed(options.fetchImpl);
  const matched = matchFestivals(feed.events);
  const promos = eventPromos(matched, now);
  const report: SyncReport = { feed: { ok: feed.ok, status: feed.status, events: feed.events.length, matched: matched.length }, promos: promos.length, created: 0, updated: 0, unchanged: 0, conflicts: [] };
  for (const promo of promos) {
    try {
      const result = await query(UPSERT_EVENT_COUPON, eventCouponValues(promo));
      const row = result.rows[0];
      if (!row) report.unchanged++;
      else if (row.inserted) report.created++;
      else report.updated++;
    } catch (error) {
      // 23505 = unique violation on `code`: a hand-made coupon already uses this code.
      if ((error as { code?: string }).code === "23505") report.conflicts.push(promo.code);
      else throw error;
    }
  }
  return report;
}
