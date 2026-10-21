import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, integer, smallint, boolean, jsonb, numeric, uniqueIndex, index, doublePrecision, date } from "drizzle-orm/pg-core";
import type { ServiceDetail } from "../lib/services";

/** Text in the three interface languages. */
type Text3 = { en: string; hi: string; bn: string };

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull(), email: text("email").notNull(),
  phone: text("phone"), whatsapp: text("whatsapp"), passwordHash: text("password_hash").notNull(), emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  city: text("city"), state: text("state"), postalCode: text("postal_code"), profileSummary: text("profile_summary"), preferredContact: text("preferred_contact").notNull().default("email"),
  role: text("role").notNull().default("customer"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
  /** True while the person still uses the temporary password the owner set; cleared when they choose their own. */
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  /** What a staff member may do in the admin area (see src/lib/permissions.ts). Admins can do everything. */
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  /** When this staff member last opened the admin inbox (unread count = newer activity). */
  inboxSeenAt: timestamp("inbox_seen_at", { withTimezone: true }),
  /** Set when the mobile number in `phone` was confirmed with an SMS code. */
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  /** Mobile sign-in: argon2 hash of the 6-digit PIN (wrong tries are counted in rate_limits). */
  loginPinHash: text("login_pin_hash"),
  /** "mobile" when the account was created with a mobile number (its email is a placeholder until one is added). */
  signupMethod: text("signup_method").notNull().default("email"),
}, (table) => [uniqueIndex("users_email_unique").on(table.email)]);

export const emailOtps = pgTable("email_otps", {
  id: uuid("id").defaultRandom().primaryKey(), email: text("email").notNull(), codeHash: text("code_hash").notNull(),
  purpose: text("purpose").notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("email_otps_email_purpose_idx").on(table.email, table.purpose)]);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull().default("Home"), line1: text("line1").notNull(), line2: text("line2"), city: text("city").notNull(),
  state: text("state").notNull(), postalCode: text("postal_code").notNull(), isDefault: boolean("is_default").notNull().default(false),
  /** From Google Places / "use my location" (optional; manual addresses leave these empty). */
  landmark: text("landmark"), latitude: doublePrecision("latitude"), longitude: doublePrecision("longitude"), googlePlaceId: text("google_place_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceRequests = pgTable("service_requests", {
  id: uuid("id").defaultRandom().primaryKey(), reference: text("reference").notNull().unique(), userId: uuid("user_id").notNull().references(() => users.id),
  serviceSlug: text("service_slug").notNull(), serviceName: text("service_name").notNull(), status: text("status").notNull().default("submitted"),
  details: jsonb("details").notNull().default({}), serviceFee: numeric("service_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  externalFee: numeric("external_fee", { precision: 10, scale: 2 }).notNull().default("0"), notes: text("notes"),
  idempotencyKey: text("idempotency_key"),
  // The internal `reference` above is NISE COMPORT's own tracking number, assigned the moment the
  // request is submitted on the site. Once staff actually file it with the real government portal
  // (ServicePlus, ECI) or insurer, that system issues its own number — application number,
  // certificate number, EPIC number, policy number. These three columns hold that *official* one,
  // added later by staff; both numbers are kept and shown side by side.
  officialReference: text("official_reference"),
  officialReferenceLabel: text("official_reference_label"),
  officialReferenceSetAt: timestamp("official_reference_set_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("service_requests_user_created_idx").on(table.userId, table.createdAt),
  index("service_requests_status_created_idx").on(table.status, table.createdAt),
  uniqueIndex("service_requests_user_idempotency_idx").on(table.userId, table.idempotencyKey),
]);

export const storedFiles = pgTable("stored_files", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestId: uuid("request_id").references(() => serviceRequests.id, { onDelete: "cascade" }), objectKey: text("object_key").notNull(),
  originalName: text("original_name").notNull(), mimeType: text("mime_type").notNull(), sizeBytes: integer("size_bytes").notNull(),
  retainUntil: timestamp("retain_until", { withTimezone: true }).notNull(), pageCount: integer("page_count"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const printJobs = pgTable("print_jobs", {
  id: uuid("id").defaultRandom().primaryKey(), reference: text("reference").notNull().unique(), userId: uuid("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("submitted"), fileId: uuid("file_id").references(() => storedFiles.id), pageCount: integer("page_count").notNull(), pageSelection: text("page_selection").notNull().default("all"),
  copies: integer("copies").notNull().default(1), blackWhitePages: integer("black_white_pages").notNull().default(0), colorPages: integer("color_pages").notNull().default(0), fileName: text("file_name").notNull(), couponCode: text("coupon_code"),
  sides: text("sides").notNull().default("single"), paperSize: text("paper_size").notNull().default("A4"), orientation: text("orientation").notNull().default("portrait"),
  fulfillment: text("fulfillment").notNull(), scheduledAt: timestamp("scheduled_at", { withTimezone: true }), addressId: uuid("address_id").references(() => addresses.id),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(), discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(), paymentStatus: text("payment_status").notNull().default("pending"),
  idempotencyKey: text("idempotency_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("print_jobs_user_created_idx").on(table.userId, table.createdAt),
  uniqueIndex("print_jobs_user_idempotency_idx").on(table.userId, table.idempotencyKey),
]);

/**
 * Coupon codes. `kind`:
 * - public   — a code the owner created by hand; anyone can type it in.
 * - festival — generated for a festival (DIWALI26), live 30 days before the day.
 * - sport    — generated for a sporting event where India plays (T20FEVER27), live until the final.
 * - welcome  — one customer's ₹50 sign-up coupon (user_id set), issued when the email is verified.
 * The daily offers sync (/api/cron/offers) creates and updates festival/sport rows by `event_key`;
 * it never changes `active`, and skips rows the owner edited (`locked`).
 */
export const coupons = pgTable("coupons", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), discountType: text("discount_type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(), minimumAmount: numeric("minimum_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  active: boolean("active").notNull().default(true), expiresAt: timestamp("expires_at", { withTimezone: true }),
  kind: text("kind").notNull().default("public"),
  title: jsonb("title").$type<Text3>(), description: jsonb("description").$type<Text3>(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  eventKey: text("event_key"), eventStarts: date("event_starts"), eventEnds: date("event_ends"),
  theme: text("theme"), emoji: text("emoji"),
  communities: jsonb("communities").$type<string[]>(), categories: jsonb("categories").$type<string[]>(),
  /** Uses allowed per customer (null = unlimited) and in total (null = unlimited). */
  perUserLimit: integer("per_user_limit"), maxRedemptions: integer("max_redemptions"),
  source: text("source"), tentative: boolean("tentative").notNull().default(false), locked: boolean("locked").notNull().default(false),
  /** Poster image URL per language ({ en, hi, bn }); shown on /offers and sent with WhatsApp campaigns. */
  posters: jsonb("posters").$type<Partial<Text3>>(),
  /** Services the code works on ({ categories, services }); null = everything. Set in Admin → Promotions. */
  appliesTo: jsonb("applies_to").$type<{ categories: string[]; services: string[] }>(),
  /** Upper limit for % codes, in rupees. */
  maxDiscount: numeric("max_discount", { precision: 10, scale: 2 }),
  /** Personal codes created together for a group of customers. */
  batchId: uuid("batch_id"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("coupons_event_key_unique").on(table.eventKey).where(sql`${table.eventKey} is not null`),
  uniqueIndex("coupons_welcome_user_unique").on(table.userId).where(sql`${table.kind} = 'welcome'`),
  index("coupons_kind_window_idx").on(table.kind, table.startsAt, table.expiresAt),
  index("coupons_batch_idx").on(table.batchId),
  index("coupons_user_idx").on(table.userId),
]);

/** A group of personal codes: one unique code per chosen customer, bound to their account. */
export const couponBatches = pgTable("coupon_batches", {
  id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull(), prefix: text("prefix").notNull(),
  title: jsonb("title").$type<Text3>().notNull(), discountType: text("discount_type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(), minimumAmount: numeric("minimum_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  maxDiscount: numeric("max_discount", { precision: 10, scale: 2 }), usesPerCode: integer("uses_per_code").notNull().default(1),
  appliesTo: jsonb("applies_to").$type<{ categories: string[]; services: string[] }>(),
  audience: jsonb("audience").$type<{ kind: string; values?: string[]; services?: string[] }>().notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }), expiresAt: timestamp("expires_at", { withTimezone: true }),
  issued: integer("issued").notNull().default(0), active: boolean("active").notNull().default(true),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Each use of a coupon on a print job or service request (for per-customer limits and reporting). */
export const couponRedemptions = pgTable("coupon_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  couponId: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestKind: text("request_kind").notNull(), requestId: uuid("request_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("coupon_redemptions_coupon_user_idx").on(table.couponId, table.userId),
  uniqueIndex("coupon_redemptions_request_unique").on(table.requestKind, table.requestId, table.couponId),
]);

/** A customer barred from one coupon (couponId set) or from every coupon (couponId null). Set in Admin → Coupon use. */
export const couponBlocks = pgTable("coupon_blocks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "cascade" }),
  reason: text("reason"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("coupon_blocks_user_coupon_unique").on(table.userId, table.couponId).where(sql`${table.couponId} is not null`),
  uniqueIndex("coupon_blocks_user_all_unique").on(table.userId).where(sql`${table.couponId} is null`),
]);

export const walletEntries = pgTable("wallet_entries", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id), amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  kind: text("kind").notNull(), description: text("description").notNull(), reference: text("reference"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("wallet_entries_user_created_idx").on(table.userId, table.createdAt)]);

export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(), referrerId: uuid("referrer_id").notNull().references(() => users.id),
  referredUserId: uuid("referred_user_id").references(() => users.id), code: text("code").notNull().unique(), status: text("status").notNull().default("invited"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(), kind: text("kind").notNull(), payload: jsonb("payload").notNull(), status: text("status").notNull().default("queued"),
  attempts: integer("attempts").notNull().default(0), lastError: text("last_error"), sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("notifications_status_created_idx").on(table.status, table.createdAt)]);

export const panImports = pgTable("pan_imports", {
  id: uuid("id").defaultRandom().primaryKey(), uploadedBy: uuid("uploaded_by").notNull().references(() => users.id), fileId: uuid("file_id").references(() => storedFiles.id, { onDelete: "set null" }),
  rowCount: integer("row_count").notNull().default(0), acceptedRows: integer("accepted_rows").notNull().default(0), rejectedRows: integer("rejected_rows").notNull().default(0),
  status: text("status").notNull().default("queued"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const panRecords = pgTable("pan_records", {
  id: uuid("id").defaultRandom().primaryKey(), panHash: text("pan_hash").notNull().unique(), encryptedPan: text("encrypted_pan").notNull(),
  holderName: text("holder_name").notNull(), recordStatus: text("record_status").notNull().default("imported"),
  importId: uuid("import_id").references(() => panImports.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("pan_records_name_idx").on(table.holderName)]);

/** Fixed-window counters for rate limiting and sign-in lockout (keys are hashed; no personal data). */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(), windowStart: timestamp("window_start", { withTimezone: true }).notNull(), count: integer("count").notNull().default(0),
}, (table) => [index("rate_limits_window_idx").on(table.windowStart)]);

/** Status history for service requests and print jobs: who changed what, and when. */
export const requestEvents = pgTable("request_events", {
  id: uuid("id").defaultRandom().primaryKey(), requestKind: text("request_kind").notNull(), requestId: uuid("request_id").notNull(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }), fromStatus: text("from_status"), toStatus: text("to_status").notNull(),
  note: text("note"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("request_events_request_idx").on(table.requestKind, table.requestId, table.createdAt)]);

/**
 * One rating + feedback per completed service request, collected from the /review/<reference>
 * page the customer gets emailed/WhatsApped once their request is marked "completed". A high
 * rating (4-5) is the moment we ask them to also post it on Google (site.reviewUrl); every rating
 * gives us their own "what could we do better" note, visible to staff in the request detail panel.
 */
export const serviceReviews = pgTable("service_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id").notNull().unique().references(() => serviceRequests.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), feedback: text("feedback"),
  postedGoogleReview: boolean("posted_google_review").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("service_reviews_user_idx").on(table.userId, table.createdAt)]);

/**
 * Google reviews curated by staff for display on the site (homepage + service pages), since the
 * public Places API only ever returns up to 5 "most relevant" reviews — nowhere near enough for a
 * business with hundreds. Staff copy the text from the real Google Business Profile by hand;
 * `category` is "general" for a broad shout-out, or a service slug for a review that mentions a
 * specific service, so it can show on that service's page too.
 */
export const testimonials = pgTable("testimonials", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorName: text("author_name").notNull(), rating: integer("rating").notNull().default(5),
  body: text("body").notNull(), category: text("category").notNull().default("general"),
  serviceSlug: text("service_slug"), source: text("source").notNull().default("google"),
  /** The Google review ID (or other source's id), so a re-import or the automated sync never
   * creates a duplicate — null for a testimonial typed straight into the admin panel. */
  sourceId: text("source_id"),
  reviewedOn: date("reviewed_on"), featured: boolean("featured").notNull().default(false), visible: boolean("visible").notNull().default(true),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("testimonials_visible_idx").on(table.visible, table.featured),
  index("testimonials_service_idx").on(table.serviceSlug),
  uniqueIndex("testimonials_source_unique_idx").on(table.source, table.sourceId),
]);

/** Poster images uploaded in the admin area. Public by design: served at /media/<id>. */
export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(), objectKey: text("object_key").notNull(), originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(), sizeBytes: integer("size_bytes").notNull(), title: text("title").notNull(),
  locale: text("locale"), category: text("category"), uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("media_created_idx").on(table.createdAt)]);

/**
 * People the shop may message on WhatsApp (imported lists, walk-in customers). `consent`:
 * unknown (never asked) | opted_in (replied YES) | opted_out (replied STOP; never messaged again).
 */
export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull(), phone: text("phone").notNull(),
  locale: text("locale").notNull().default("en"), area: text("area"),
  /** [{ service: "insurance", renewalOn: "2026-11-02", note }] */
  services: jsonb("services").$type<{ service: string; renewalOn?: string | null; note?: string | null }[]>().notNull().default([]),
  consent: text("consent").notNull().default("unknown"), consentAt: timestamp("consent_at", { withTimezone: true }),
  /** Email address and the person's email consent (unknown | opted_in | opted_out), separate from the WhatsApp YES/STOP. */
  email: text("email"), emailConsent: text("email_consent").notNull().default("unknown"), emailConsentAt: timestamp("email_consent_at", { withTimezone: true }),
  /** Birthday without the year (day and month are enough to wish someone). */
  birthMonth: smallint("birth_month"), birthDay: smallint("birth_day"),
  source: text("source"), notes: text("notes"), lastMessagedAt: timestamp("last_messaged_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("contacts_phone_unique").on(table.phone), index("contacts_consent_idx").on(table.consent), index("contacts_birthday_idx").on(table.birthMonth, table.birthDay)]);

/** One row per wish or reminder sent, so nobody gets the same one twice in a year. */
export const outreachLog = pgTable("outreach_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  /** birthday | renewal */
  kind: text("kind").notNull(), channel: text("channel").notNull(), year: integer("year").notNull(), ref: text("ref").notNull().default(""),
  status: text("status").notNull().default("sent"), error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("outreach_log_once").on(table.contactId, table.kind, table.channel, table.year, table.ref)]);

/** Admin switches for the daily automatic birthday wishes and renewal reminders. */
export const outreachSettings = pgTable("outreach_settings", {
  key: text("key").primaryKey(), value: jsonb("value").notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** WhatsApp campaigns: who gets what, and how fast (see src/lib/campaign-pacing.ts). */
export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull(),
  /** renewal | offer | optin */
  kind: text("kind").notNull(), service: text("service"),
  /** draft | test | running | paused | done */
  status: text("status").notNull().default("draft"),
  message: jsonb("message").$type<Text3>().notNull(), posters: jsonb("posters").$type<Partial<Text3>>(), couponCode: text("coupon_code"),
  audience: jsonb("audience").$type<{ renewalWithinDays?: number | null; locales?: string[] | null }>().notNull().default({}),
  testNumbers: jsonb("test_numbers").$type<string[]>().notNull().default([]),
  batchSize: integer("batch_size").notNull().default(10), gapMinMinutes: integer("gap_min_minutes").notNull().default(10), gapMaxMinutes: integer("gap_max_minutes").notNull().default(30),
  dailyLimit: integer("daily_limit").notNull().default(10), windowStart: integer("window_start").notNull().default(9), windowEnd: integer("window_end").notNull().default(20),
  /** manual (one-tap from the admin queue) | cloud (WhatsApp Business Cloud API) */
  provider: text("provider").notNull().default("manual"), templateName: text("template_name"),
  nextRoundAt: timestamp("next_round_at", { withTimezone: true }), round: integer("round").notNull().default(0),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  startedAt: timestamp("started_at", { withTimezone: true }), finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("campaigns_status_next_idx").on(table.status, table.nextRoundAt)]);

/** One WhatsApp message of a campaign. queued → scheduled → (ready →) sent | failed | skipped | opted_out */
export const campaignMessages = pgTable("campaign_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  phone: text("phone").notNull(), name: text("name").notNull(), locale: text("locale").notNull().default("en"),
  body: text("body").notNull(), posterUrl: text("poster_url"), test: boolean("test").notNull().default(false),
  status: text("status").notNull().default("queued"), round: integer("round"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }), sentAt: timestamp("sent_at", { withTimezone: true }),
  providerMessageId: text("provider_message_id"), error: text("error"), attempts: integer("attempts").notNull().default(0),
  sentBy: uuid("sent_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // A live campaign messages each number once; test sends can repeat.
  uniqueIndex("campaign_messages_campaign_phone_unique").on(table.campaignId, table.phone).where(sql`${table.test} = false`),
  index("campaign_messages_status_scheduled_idx").on(table.status, table.scheduledAt),
  index("campaign_messages_provider_idx").on(table.providerMessageId),
]);

/** Customers who left their number (chat "call me back", enquiry forms) so the shop can contact them. */
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull(), phone: text("phone").notNull(),
  topic: text("topic").notNull(), message: text("message"), source: text("source").notNull().default("chat"), page: text("page"),
  /** Structured answers, e.g. the car/bike insurance form. */
  details: jsonb("details"),
  locale: text("locale").notNull().default("en"), status: text("status").notNull().default("new"),
  handledBy: uuid("handled_by").references(() => users.id, { onDelete: "set null" }), handledAt: timestamp("handled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("leads_status_created_idx").on(table.status, table.createdAt), index("leads_phone_idx").on(table.phone)]);

/**
 * What happened in the shop: new requests and leads, status changes, imports, and every time a
 * staff member opened customer records. `permission` decides which staff see the entry.
 */
export const activityLog = pgTable("activity_log", {
  id: uuid("id").defaultRandom().primaryKey(), kind: text("kind").notNull(), permission: text("permission").notNull(),
  category: text("category"), title: text("title").notNull(), detail: text("detail"),
  refType: text("ref_type"), refId: text("ref_id"),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("activity_log_created_idx").on(table.createdAt), index("activity_log_permission_created_idx").on(table.permission, table.createdAt)]);

/** A signed-in person whose mobile number matches imported records. Records stay hidden until staff or a code approves it. */
export const recordClaims = pgTable("record_claims", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(), status: text("status").notNull().default("pending"), matchedCount: integer("matched_count").notNull().default(0),
  /** The PIN sealed for the staff reference; removed once the claim is decided. */
  pinEnc: text("pin_enc"), method: text("method"),
  codeHash: text("code_hash"), codeExpiresAt: timestamp("code_expires_at", { withTimezone: true }), codeAttempts: integer("code_attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), remindedAt: timestamp("reminded_at", { withTimezone: true }),
  decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }), decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("record_claims_status_idx").on(table.status, table.createdAt), index("record_claims_user_idx").on(table.userId)]);

/** "This isn't me": a customer says a record shown to them is not theirs. */
export const recordFlags = pgTable("record_flags", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  claimId: uuid("claim_id").references(() => recordClaims.id, { onDelete: "set null" }), recordId: uuid("record_id"), note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (table) => [index("record_flags_open_idx").on(table.resolvedAt, table.createdAt)]);

/** One uploaded Excel register and what came out of each sheet. */
export const recordImports = pgTable("record_imports", {
  id: uuid("id").defaultRandom().primaryKey(), fileName: text("file_name").notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  sheets: jsonb("sheets").notNull().default([]), totalRows: integer("total_rows").notNull().default(0),
  imported: integer("imported").notNull().default(0), duplicates: integer("duplicates").notNull().default(0),
  skipped: integer("skipped").notNull().default(0), contactsAdded: integer("contacts_added").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A customer row from an imported register. Everything personal is encrypted (AES-256-GCM);
 * mobile and PAN also get keyed hashes so people can be found and counted without decrypting.
 */
export const customerRecords = pgTable("customer_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  importId: uuid("import_id").references(() => recordImports.id, { onDelete: "set null" }),
  service: text("service").notNull(), source: text("source").notNull(), name: text("name").notNull(),
  mobileHash: text("mobile_hash"), mobileEnc: text("mobile_enc"), mobileLast4: text("mobile_last4"),
  panHash: text("pan_hash"), aadhaarHash: text("aadhaar_hash"),
  /** Keyed hashes of every number on the row (main, WhatsApp, alternate) and of the email, for search. */
  phoneHashes: text("phone_hashes").array().notNull().default(sql`'{}'::text[]`), emailHash: text("email_hash"),
  /** Sealed { whatsapp, altMobiles, email, address } for the people list. */
  contactEnc: text("contact_enc"),
  recordDate: date("record_date"), renewalOn: date("renewal_on"),
  /** Birthday (no year) and, for insurance, "bike" or "car", read from the register. */
  birthMonth: smallint("birth_month"), birthDay: smallint("birth_day"), vehicle: text("vehicle"),
  payloadEnc: text("payload_enc").notNull(), rowHash: text("row_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("customer_records_row_hash_unique").on(table.rowHash),
  index("customer_records_mobile_idx").on(table.mobileHash),
  index("customer_records_pan_idx").on(table.panHash),
  index("customer_records_service_idx").on(table.service),
  index("customer_records_name_idx").on(table.name),
  index("customer_records_renewal_idx").on(table.renewalOn),
  index("customer_records_phones_idx").using("gin", table.phoneHashes),
  index("customer_records_email_idx").on(table.emailHash),
]);

/** Banners the owner manages in Admin → Site content (top strip, home page, services, service pages). */
export const siteBanners = pgTable("site_banners", {
  id: uuid("id").defaultRandom().primaryKey(), placement: text("placement").notNull(),
  title: jsonb("title").$type<Text3>().notNull(), text: jsonb("text").$type<Text3>(), cta: jsonb("cta").$type<Text3>(),
  href: text("href"), image: text("image"), tone: text("tone").notNull().default("blue"),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  startsOn: date("starts_on"), endsOn: date("ends_on"), active: boolean("active").notNull().default(true), sortOrder: integer("sort_order").notNull().default(0),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("site_banners_placement_idx").on(table.placement, table.active)]);

/** Services added in the admin area (kind "service"), or built-in services hidden from the site (kind "hide"). */
export const customServices = pgTable("custom_services", {
  id: uuid("id").defaultRandom().primaryKey(), kind: text("kind").notNull().default("service"), slug: text("slug").notNull(),
  categorySlug: text("category_slug").notNull(), title: text("title").notNull(),
  data: jsonb("data").$type<ServiceDetail>().notNull(),
  published: boolean("published").notNull().default(true), sortOrder: integer("sort_order").notNull().default(0),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("custom_services_slug_unique").on(table.slug)]);

/** Hardware parts shown on /hardware, edited in Admin → Hardware parts. kind "item" = added part; kind "hide" = a built-in part switched off. */
export const hardwareItems = pgTable("hardware_items", {
  id: uuid("id").defaultRandom().primaryKey(), kind: text("kind").notNull().default("item"),
  groupSlug: text("group_slug").notNull(), name: text("name").notNull(), note: text("note").notNull().default(""), image: text("image"),
  published: boolean("published").notNull().default(true), sortOrder: integer("sort_order").notNull().default(0),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A half-filled request form, so a signed-in customer can continue on another visit or device. */
export const requestDrafts = pgTable("request_drafts", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Gallery photos uploaded in Admin → Gallery (objectKey set; served at /gallery/photo/<name>), and
 * staff edits to photos added with `npm run photos` (objectKey null; matched by src).
 */
export const galleryItems = pgTable("gallery_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  src: text("src").notNull(), objectKey: text("object_key"),
  tag: text("tag").notNull().default("shop"), title: text("title").notNull(), alt: text("alt").notNull(),
  width: integer("width").notNull().default(0), height: integer("height").notNull().default(0),
  hidden: boolean("hidden").notNull().default(false), hash: text("hash"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("gallery_items_src_unique").on(table.src), index("gallery_items_tag_idx").on(table.tag)]);

/**
 * People shown on the public Team page and the About page, managed in Admin → Team (website).
 * Separate from `users`: a person can be listed here without having a staff login, and the other way round.
 */
export const teamMembers = pgTable("team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), role: text("role").notNull(), bio: text("bio"), image: text("image"),
  /** Private contact details, shown to the owner only; never sent to the public site. */
  phone: text("phone"), email: text("email"),
  sortOrder: integer("sort_order").notNull().default(0), active: boolean("active").notNull().default(true),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("team_members_active_sort_idx").on(table.active, table.sortOrder)]);

/**
 * Money owed for a service request and how it was paid. Staff create a "due" row (Admin → Payments);
 * the customer pays on /pay/<reference> by UPI QR (staff confirm it) or online through Razorpay or
 * Cashfree (confirmed automatically). Amounts are in paise to avoid rounding errors.
 */
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id").notNull().references(() => serviceRequests.id, { onDelete: "cascade" }),
  reference: text("reference").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  amountPaise: integer("amount_paise").notNull(),
  feePaise: integer("fee_paise").notNull().default(0),
  status: text("status").notNull().default("due"),
  method: text("method"),
  providerOrderId: text("provider_order_id"),
  providerPaymentId: text("provider_payment_id"),
  utr: text("utr"),
  note: text("note"),
  failureReason: text("failure_reason"),
  issueNote: text("issue_note"),
  issueRaisedAt: timestamp("issue_raised_at", { withTimezone: true }),
  refundChoice: text("refund_choice"),
  refundStatus: text("refund_status"),
  refundDetails: text("refund_details"),
  refundPaise: integer("refund_paise"),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("payments_reference_idx").on(table.reference),
  index("payments_status_idx").on(table.status, table.createdAt),
  uniqueIndex("payments_utr_unique").on(table.utr),
  uniqueIndex("payments_provider_payment_unique").on(table.method, table.providerPaymentId),
]);

/** Our service charge per service, set in Admin → Prices. No row (or no amount) = nothing is shown publicly. */
export const servicePrices = pgTable("service_prices", {
  serviceSlug: text("service_slug").primaryKey(),
  amount: integer("amount"),
  kind: text("kind").notNull().default("fixed"),
  note: text("note"),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Every WhatsApp chat message (customer, bot and staff), so staff can see and continue conversations in Admin → Chats. */
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: text("phone").notNull(),
  direction: text("direction").notNull(),
  body: text("body").notNull(),
  sender: text("sender").notNull().default("customer"),
  name: text("name"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  needsHuman: boolean("needs_human").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("whatsapp_messages_phone_created_idx").on(table.phone, table.createdAt), index("whatsapp_messages_human_idx").on(table.needsHuman, table.createdAt)]);

/** Admin-edited text of the policy pages (terms, privacy, refund-policy). No row = the built-in text is used. */
export const legalPages = pgTable("legal_pages", {
  slug: text("slug").primaryKey(),
  body: text("body").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Thank-you credit rules edited in Admin → Loyalty credit (one row, id "main"). No row = the built-in rules. */
export const loyaltySettings = pgTable("loyalty_settings", {
  id: text("id").primaryKey(),
  settings: jsonb("settings").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One-time codes sent by SMS to prove a mobile number belongs to an account. */
export const phoneOtps = pgTable("phone_otps", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  purpose: text("purpose").notNull().default("verify"),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("phone_otps_user_idx").on(table.userId, table.createdAt)]);

/** Message centre: one row per conversation (ticket) between a customer and the service desk. */
export const mailTickets = pgTable("mail_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Public ticket number, shown as NC-T1001. */
  number: integer("number").generatedAlwaysAsIdentity({ startWith: 1001 }),
  /** Short secret in the email subject so a stranger can't add messages to someone else's ticket. */
  key: text("key").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("open"),
  source: text("source").notNull().default("site"),
  linkKind: text("link_kind"),
  linkId: uuid("link_id"),
  linkReference: text("link_reference"),
  staffUnread: boolean("staff_unread").notNull().default(true),
  customerUnread: boolean("customer_unread").notNull().default(false),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  lastCustomerAt: timestamp("last_customer_at", { withTimezone: true }),
  lastStaffAt: timestamp("last_staff_at", { withTimezone: true }),
  autoCloseAt: timestamp("auto_close_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  closeReason: text("close_reason"),
  closeNoticeSentAt: timestamp("close_notice_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("mail_tickets_number_unique").on(table.number),
  index("mail_tickets_user_last_idx").on(table.userId, table.lastMessageAt),
  index("mail_tickets_status_last_idx").on(table.status, table.lastMessageAt),
  index("mail_tickets_from_idx").on(table.fromEmail),
]);

export const mailMessages = pgTable("mail_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").notNull().references(() => mailTickets.id, { onDelete: "cascade" }),
  /** "in" = from the customer, "out" = from the service desk. */
  direction: text("direction").notNull(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name"),
  body: text("body").notNull(),
  source: text("source").notNull().default("site"),
  rfcMessageId: text("rfc_message_id"),
  /** For "out" messages: none | sent | failed. */
  emailStatus: text("email_status").notNull().default("none"),
  emailAttempts: integer("email_attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("mail_messages_ticket_idx").on(table.ticketId, table.createdAt),
  uniqueIndex("mail_messages_rfc_unique").on(table.rfcMessageId),
]);

export const mailAttachments = pgTable("mail_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").references(() => mailTickets.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").references(() => mailMessages.id, { onDelete: "cascade" }),
  uploaderId: uuid("uploader_id").references(() => users.id, { onDelete: "set null" }),
  objectKey: text("object_key").notNull(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("mail_attachments_message_idx").on(table.messageId), index("mail_attachments_ticket_idx").on(table.ticketId)]);

/** Where the support-mailbox reader stopped (one row, id "main"). */
export const mailSync = pgTable("mail_sync", {
  id: text("id").primaryKey(),
  uidValidity: text("uid_validity"),
  lastUid: integer("last_uid").notNull().default(0),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastError: text("last_error"),
  lastImported: integer("last_imported").notNull().default(0),
});
