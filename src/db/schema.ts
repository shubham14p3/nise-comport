import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, numeric, uniqueIndex, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull(), email: text("email").notNull(),
  phone: text("phone"), passwordHash: text("password_hash").notNull(), emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  role: text("role").notNull().default("customer"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceRequests = pgTable("service_requests", {
  id: uuid("id").defaultRandom().primaryKey(), reference: text("reference").notNull().unique(), userId: uuid("user_id").notNull().references(() => users.id),
  serviceSlug: text("service_slug").notNull(), serviceName: text("service_name").notNull(), status: text("status").notNull().default("submitted"),
  details: jsonb("details").notNull().default({}), serviceFee: numeric("service_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  externalFee: numeric("external_fee", { precision: 10, scale: 2 }).notNull().default("0"), notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("service_requests_user_created_idx").on(table.userId, table.createdAt)]);

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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("print_jobs_user_created_idx").on(table.userId, table.createdAt)]);

export const coupons = pgTable("coupons", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), discountType: text("discount_type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(), minimumAmount: numeric("minimum_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  active: boolean("active").notNull().default(true), expiresAt: timestamp("expires_at", { withTimezone: true }),
});

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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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
