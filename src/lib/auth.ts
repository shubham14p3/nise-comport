import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, count, desc, eq, gt, inArray, isNotNull, isNull, lt, ne, notInArray, sql } from "drizzle-orm";
import { hash, verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { addresses, emailOtps, notifications, printJobs, serviceRequests, sessions, storedFiles, users } from "@/db/schema";
import { sendAccountDeletedEmail, sendAccountExistsEmail, sendEmailChangedNotice, sendOtpEmail, sendPasswordChangedEmail, type OtpPurpose } from "@/lib/email";
import { isUniqueViolation, PublicError, RateLimitError, humanDuration } from "@/lib/errors";
import { clearRate, enforceRate, hitRate, identity, peekRate, RATE_RULES } from "@/lib/rate-limit";
import { secondsUntilWindowEnds } from "@/lib/rate-limit-core";
import { emailProblem, isSixDigitCode, looksLikeEmail, nameProblem, normalizeEmail, normalizePhone, normalizeWhatsapp, passwordProblem, whatsappProblem } from "@/lib/validation";
import { hasPermission, type Permission } from "@/lib/permissions";
import { findRecordMatch } from "@/lib/claims";
import { logActivity } from "@/lib/activity";

export type User = typeof users.$inferSelect;
export type SignupProfile = { firstName: string; lastName: string; password: string; phone?: string };

const SESSION_COOKIE = "nc_7x9k";
const DEMO_COOKIE = "nc_d4q8";
/** Holds the owner's own session while they view a customer account for support. HttpOnly, cleared on stop. */
const RETURN_COOKIE = "nc_return";
const SUPPORT_HINT_COOKIE = "nc_sv";
const IMPERSONATION_MINUTES = 30;
const SESSION_DAYS = 14;
const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
export const CLOSED_STATUSES = ["completed", "cancelled", "rejected", "closed"] as const;
export const DEMO_LOGIN = { email: "demo@nisecomport.test", password: "LocalDemo#2026" } as const;

const demoUser: User = {
  id: "00000000-0000-4000-8000-000000000001", name: "Demo Customer", firstName: "Demo", lastName: "Customer", email: DEMO_LOGIN.email, phone: null, passwordHash: "", emailVerifiedAt: new Date(0),
  city: null, state: null, postalCode: null, profileSummary: null, preferredContact: "email", role: "demo", createdAt: new Date(0), updatedAt: new Date(0),
  passwordChangedAt: null, disabledAt: null, deletedAt: null, permissions: [], whatsapp: null, inboxSeenAt: null, fromRecords: false,
};

const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");

function otpSecret() {
  const secret = process.env.OTP_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    console.error("[auth] OTP_SECRET is missing or shorter than 32 characters. Email codes are disabled until it is set.");
    throw new PublicError("Sign-in by email code is temporarily unavailable. Please try again later or call the service desk.", 503, { code: "otp_not_configured" });
  }
  return secret || "development-only-otp-secret-not-for-production";
}

function hashOtp(email: string, purpose: string, code: string) {
  return createHmac("sha256", otpSecret()).update(`${email}:${purpose}:${code}`).digest("hex");
}

function sameHash(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

let dummyHashPromise: Promise<string> | null = null;
/** A real Argon2 hash to verify against when the email doesn't exist, so response time doesn't reveal accounts. */
function dummyHash() {
  dummyHashPromise ??= hash(`timing-only-${randomBytes(16).toString("hex")}`);
  return dummyHashPromise;
}

function isActive(user: User | undefined | null): user is User {
  return Boolean(user && !user.deletedAt && !user.disabledAt);
}

async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

export function isDemoAuthEnabled() { return process.env.NODE_ENV === "development" && process.env.DEMO_AUTH_ENABLED !== "false"; }

export async function createDemoSession() {
  if (!isDemoAuthEnabled()) throw new PublicError("Demo sign-in is available only in local development.", 403);
  (await cookies()).set(DEMO_COOKIE, "preview", { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 });
  return { id: demoUser.id, name: demoUser.name, email: demoUser.email };
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(rawToken), expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt, priority: "high" });
}

async function currentTokenHash() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? hashToken(token) : null;
}

export function publicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/* ----------------------------------------------------------------------------------------------
 * Email codes (OTP)
 * -------------------------------------------------------------------------------------------- */

async function issueCode(email: string, purposeKey: string, template: OtpPurpose) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.delete(emailOtps).where(and(eq(emailOtps.email, email), eq(emailOtps.purpose, purposeKey)));
  const [challenge] = await db.insert(emailOtps).values({ email, codeHash: hashOtp(email, purposeKey, code), purpose: purposeKey, expiresAt: new Date(Date.now() + OTP_MINUTES * 60_000) }).returning({ id: emailOtps.id });
  try {
    await sendOtpEmail(email, code, template);
  } catch (error) {
    // Local development: don't block testing on a mail problem; print the code instead.
    if (process.env.NODE_ENV !== "production") {
      console.error("[auth] OTP email failed:", error instanceof Error ? error.message : error, "— check SMTP_HOST/SMTP_PASSWORD (npm run smtp:check).");
      console.warn(`[auth] DEV ONLY: email code for ${email} is ${code}`);
      return;
    }
    await db.delete(emailOtps).where(eq(emailOtps.id, challenge.id));
    console.error("[auth] OTP email failed", error);
    if (error instanceof PublicError) throw error;
    throw new PublicError("We couldn’t send the email right now. Please try again in a few minutes.", 503, { code: "email_failed" });
  }
}

async function limitCodeRequests(email: string, ip: string) {
  const emailId = identity("email", email);
  await enforceRate(RATE_RULES.otpSendPerIpHour, identity("ip", ip), "Too many codes were requested from this network.");
  await enforceRate(RATE_RULES.otpSendPerEmailMinute, emailId, "A code was sent to this email moments ago. Check your inbox and spam folder.");
  await enforceRate(RATE_RULES.otpSendPerEmailHour, emailId, "Too many codes were requested for this email.");
  await enforceRate(RATE_RULES.otpSendPerEmailDay, emailId, "Too many codes were requested for this email today.");
}

/**
 * Sends a sign-up, sign-in or password-reset code.
 * The response is identical whether or not an account exists, so the form can't be used to
 * discover who is registered. Registered emails that try to sign up get a "you already have an
 * account" email instead of a code.
 */
export async function requestEmailOtp(emailInput: string, purpose: "signup" | "signin" | "reset", ip = "unknown") {
  const problem = emailProblem(emailInput);
  if (problem) throw new PublicError(problem, 400, { fields: { email: problem } });
  const email = normalizeEmail(emailInput);
  otpSecret();
  await limitCodeRequests(email, ip);
  const user = await findUserByEmail(email);
  if (purpose === "signup") {
    if (user) {
      if (isActive(user)) {
        try { await sendAccountExistsEmail(email); } catch (error) { console.error("[auth] account-exists email failed", error); throw new PublicError("We couldn’t send the email right now. Please try again in a few minutes.", 503, { code: "email_failed" }); }
      }
      return;
    }
    await issueCode(email, "signup", "signup");
    return;
  }
  if (!isActive(user)) return;
  await issueCode(email, purpose, purpose);
}

async function consumeOtp(email: string, purposeKey: string, code: string, ip: string) {
  await enforceRate(RATE_RULES.otpVerifyPerIpHour, identity("ip", ip), "Too many verification attempts from this network.");
  if (!isSixDigitCode(code)) throw new PublicError("Enter the 6-digit code from the email.", 400, { fields: { code: "Enter the 6-digit code from the email." } });
  const [challenge] = await db.select().from(emailOtps).where(and(eq(emailOtps.email, email), eq(emailOtps.purpose, purposeKey), gt(emailOtps.expiresAt, new Date()))).orderBy(desc(emailOtps.createdAt)).limit(1);
  if (!challenge) throw new PublicError("This code has expired or a newer code was sent. Request a new code.", 400, { code: "otp_expired" });
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    await db.delete(emailOtps).where(eq(emailOtps.id, challenge.id));
    throw new PublicError("Too many incorrect attempts. Request a new code.", 400, { code: "otp_locked" });
  }
  if (!sameHash(hashOtp(email, purposeKey, code.trim()), challenge.codeHash)) {
    const [updated] = await db.update(emailOtps).set({ attempts: sql`${emailOtps.attempts} + 1` }).where(and(eq(emailOtps.id, challenge.id), lt(emailOtps.attempts, OTP_MAX_ATTEMPTS))).returning({ attempts: emailOtps.attempts });
    const left = OTP_MAX_ATTEMPTS - (updated?.attempts ?? OTP_MAX_ATTEMPTS);
    if (left <= 0) throw new PublicError("Too many incorrect attempts. Request a new code.", 400, { code: "otp_locked" });
    throw new PublicError(`That code doesn’t match. ${left} attempt${left === 1 ? "" : "s"} left.`, 400, { code: "otp_mismatch", fields: { code: "That code doesn’t match." } });
  }
  const consumed = await db.delete(emailOtps).where(eq(emailOtps.id, challenge.id)).returning({ id: emailOtps.id });
  if (!consumed.length) throw new PublicError("This code was already used. Request a new code if you still need one.", 409, { code: "otp_used" });
}

function validateSignupProfile(email: string, profile: SignupProfile) {
  const firstName = profile.firstName ?? "";
  const lastName = profile.lastName ?? "";
  const firstProblem = nameProblem(firstName, 2, "first name");
  if (firstProblem) throw new PublicError(firstProblem, 400, { fields: { firstName: firstProblem } });
  const lastProblem = nameProblem(lastName, 1, "last name");
  if (lastProblem) throw new PublicError(lastProblem, 400, { fields: { lastName: lastProblem } });
  const name = `${firstName} ${lastName}`;
  const problem = passwordProblem(profile.password ?? "", { email, name });
  if (problem) throw new PublicError(problem, 400, { fields: { password: problem } });
  const phone = normalizeWhatsapp(profile.phone ?? "");
  if (!phone) {
    const phoneMessage = whatsappProblem(profile.phone ?? "") ?? "Enter a valid WhatsApp number.";
    throw new PublicError(phoneMessage, 400, { fields: { phone: phoneMessage } });
  }
  return { firstName, lastName, name, phone };
}

export async function verifyEmailOtp(emailInput: string, code: string, purpose: "signup" | "signin", profile?: SignupProfile, ip = "unknown") {
  const email = normalizeEmail(emailInput);
  if (purpose === "signup") {
    if (!profile) throw new PublicError("Complete your account details to continue.", 400);
    const { firstName, lastName, name, phone } = validateSignupProfile(email, profile);
    await consumeOtp(email, "signup", code, ip);
    const passwordHash = await hash(profile.password);
    let created: User;
    try {
      [created] = await db.insert(users).values({ email, name, firstName, lastName, phone, whatsapp: phone, passwordHash, emailVerifiedAt: new Date(), passwordChangedAt: new Date() }).returning();
    } catch (error) {
      if (isUniqueViolation(error)) throw new PublicError("An account already exists for this email. Please sign in instead.", 409, { code: "account_exists" });
      throw error;
    }
    await createSession(created.id);
    return publicUser(created);
  }
  await consumeOtp(email, "signin", code, ip);
  const user = await findUserByEmail(email);
  if (!isActive(user)) throw new PublicError("This code has expired or a newer code was sent. Request a new code.", 400, { code: "otp_expired" });
  await db.update(users).set({ emailVerifiedAt: user.emailVerifiedAt ?? new Date() }).where(eq(users.id, user.id));
  await clearRate(RATE_RULES.passwordFailuresPerEmail15m, identity("email", email));
  await createSession(user.id);
  return publicUser(user);
}

/* ----------------------------------------------------------------------------------------------
 * Password sign-in, reset and change
 * -------------------------------------------------------------------------------------------- */

/** Accounts that use this mobile number (customers and staff alike). Used for sign-in by mobile. */
export async function accountsOnMobile(phone: string) {
  return db.select().from(users).where(and(eq(users.phone, phone), isNull(users.deletedAt), isNull(users.disabledAt))).limit(5);
}

/**
 * Password sign-in with an email OR a 10-digit mobile number.
 * A mobile number that belongs to several accounts is refused: the person must use the email instead.
 * Unverified email: a code is sent to that email first (the response includes the email to type it in).
 */
export async function signInWithPassword(identifierInput: string, password: string, ip = "unknown") {
  const raw = identifierInput.trim();
  const phone = raw.includes("@") ? null : normalizePhone(raw);
  const email = phone ? null : normalizeEmail(raw);
  const emailId = identity(phone ? "phone" : "email", phone ?? email ?? "");
  await enforceRate(RATE_RULES.passwordPerIp15m, identity("ip", ip), "Too many sign-in attempts from this network.");
  for (const rule of [RATE_RULES.passwordFailuresPerEmail15m, RATE_RULES.passwordFailuresPerEmailDay]) {
    if ((await peekRate(rule, emailId)) >= rule.limit) {
      const wait = secondsUntilWindowEnds(Date.now(), rule.windowSeconds);
      throw new RateLimitError(`Too many incorrect passwords for this email, so password sign-in is paused for ${humanDuration(wait)}. You can sign in with an email code or reset your password now.`, wait);
    }
  }
  let user: User | null = null;
  if (phone) {
    const candidates = await accountsOnMobile(phone);
    const matches: User[] = [];
    for (const candidate of candidates) if (await verify(candidate.passwordHash, password).catch(() => false)) matches.push(candidate);
    if (matches.length > 1) throw new PublicError("Several accounts use this mobile number. Sign in with the email address instead.", 409, { code: "several_accounts" });
    user = matches[0] ?? null;
    if (!user && !candidates.length) await verify(await dummyHash(), password).catch(() => false);
  } else {
    user = (await findUserByEmail(email ?? "")) ?? null;
    let valid = false;
    if (isActive(user)) valid = await verify(user.passwordHash, password).catch(() => false);
    else await verify(await dummyHash(), password).catch(() => false);
    if (!valid) user = null;
  }
  if (!user) {
    const recent = await hitRate(RATE_RULES.passwordFailuresPerEmail15m, emailId);
    await hitRate(RATE_RULES.passwordFailuresPerEmailDay, emailId);
    const left = RATE_RULES.passwordFailuresPerEmail15m.limit - recent.count;
    if (left <= 0) {
      const wait = secondsUntilWindowEnds(Date.now(), RATE_RULES.passwordFailuresPerEmail15m.windowSeconds);
      throw new RateLimitError(`Email or password is incorrect. Password sign-in is now paused for ${humanDuration(wait)}. You can sign in with an email code or reset your password.`, wait);
    }
    const warning = left > 0 && left <= 2 ? ` ${left} attempt${left === 1 ? "" : "s"} left before password sign-in is paused for 15 minutes.` : "";
    throw new PublicError(`Email or password is incorrect.${warning}`, 401, { code: "invalid_credentials" });
  }
  await clearRate(RATE_RULES.passwordFailuresPerEmail15m, emailId);
  if (!user.emailVerifiedAt) {
    // Mobile sign-in needs the email verified first; the code goes to that email.
    try { await issueCode(user.email, "signin", "signin"); } catch (error) { if (!(error instanceof RateLimitError)) throw error; }
    return { requiresOtp: true as const, email: user.email, viaMobile: Boolean(phone) };
  }
  await createSession(user.id);
  return { requiresOtp: false as const, user: publicUser(user) };
}

export async function requestPasswordReset(emailInput: string, ip = "unknown") {
  await requestEmailOtp(emailInput, "reset", ip);
}

export async function resetPasswordWithCode(emailInput: string, code: string, newPassword: string, ip = "unknown") {
  const email = normalizeEmail(emailInput);
  const problem = passwordProblem(newPassword, { email });
  if (problem) throw new PublicError(problem, 400, { fields: { password: problem } });
  await consumeOtp(email, "reset", code, ip);
  const user = await findUserByEmail(email);
  if (!isActive(user)) throw new PublicError("This code has expired or a newer code was sent. Request a new code.", 400, { code: "otp_expired" });
  const passwordHash = await hash(newPassword);
  await db.update(users).set({ passwordHash, passwordChangedAt: new Date(), updatedAt: new Date(), emailVerifiedAt: user.emailVerifiedAt ?? new Date() }).where(eq(users.id, user.id));
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  const emailId = identity("email", email);
  await clearRate(RATE_RULES.passwordFailuresPerEmail15m, emailId);
  await clearRate(RATE_RULES.passwordFailuresPerEmailDay, emailId);
  sendPasswordChangedEmail(user.email, user.name).catch((error) => console.error("[auth] password-changed email failed", error));
  await createSession(user.id);
  return publicUser(user);
}

export async function changePassword(user: User, currentPassword: string, newPassword: string) {
  await assertNotImpersonating();
  await enforceRate(RATE_RULES.accountChangePerUserHour, identity("user", user.id), "Too many account changes.");
  const [fresh] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!isActive(fresh) || !(await verify(fresh.passwordHash, currentPassword).catch(() => false))) throw new PublicError("Your current password is incorrect.", 400, { fields: { currentPassword: "Your current password is incorrect." } });
  if (currentPassword === newPassword) throw new PublicError("Choose a password you haven’t used for this account.", 400, { fields: { newPassword: "Choose a different password." } });
  const problem = passwordProblem(newPassword, { email: fresh.email, name: fresh.name });
  if (problem) throw new PublicError(problem, 400, { fields: { newPassword: problem } });
  await db.update(users).set({ passwordHash: await hash(newPassword), passwordChangedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, fresh.id));
  const signedOut = await revokeOtherSessions(fresh.id);
  sendPasswordChangedEmail(fresh.email, fresh.name).catch((error) => console.error("[auth] password-changed email failed", error));
  return { signedOut };
}

/* ----------------------------------------------------------------------------------------------
 * Email change
 * -------------------------------------------------------------------------------------------- */

export async function requestEmailChange(user: User, newEmailInput: string, password: string, ip = "unknown") {
  await assertNotImpersonating();
  await enforceRate(RATE_RULES.accountChangePerUserHour, identity("user", user.id), "Too many account changes.");
  const newEmail = normalizeEmail(newEmailInput);
  if (!looksLikeEmail(newEmail)) throw new PublicError("Enter a valid email address.", 400, { fields: { newEmail: "Enter a valid email address." } });
  if (newEmail === user.email) throw new PublicError("That is already your sign-in email.", 400, { fields: { newEmail: "That is already your sign-in email." } });
  const [fresh] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!isActive(fresh) || !(await verify(fresh.passwordHash, password).catch(() => false))) throw new PublicError("Your password is incorrect.", 400, { fields: { password: "Your password is incorrect." } });
  if (await findUserByEmail(newEmail)) throw new PublicError("That email is already used by another account.", 409, { fields: { newEmail: "That email is already used by another account." } });
  await limitCodeRequests(newEmail, ip);
  await issueCode(newEmail, `email-change:${user.id}`, "email-change");
}

export async function confirmEmailChange(user: User, newEmailInput: string, code: string, ip = "unknown") {
  await assertNotImpersonating();
  const newEmail = normalizeEmail(newEmailInput);
  await consumeOtp(newEmail, `email-change:${user.id}`, code, ip);
  const oldEmail = user.email;
  try {
    await db.update(users).set({ email: newEmail, emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
  } catch (error) {
    if (isUniqueViolation(error)) throw new PublicError("That email is already used by another account.", 409);
    throw error;
  }
  sendEmailChangedNotice(oldEmail, user.name, newEmail).catch((error) => console.error("[auth] email-changed notice failed", error));
  return { email: newEmail };
}

/* ----------------------------------------------------------------------------------------------
 * Full PAN reveal: staff confirm each view with a code sent to their own email.
 * -------------------------------------------------------------------------------------------- */

export async function requestRecordReveal(user: User, recordId: string, ip = "unknown") {
  await enforceRate(RATE_RULES.accountChangePerUserHour, identity("user", user.id), "Too many account changes.");
  await limitCodeRequests(user.email, ip);
  await issueCode(user.email, `reveal:${recordId}`, "reveal");
  return { emailHint: user.email.replace(/^(.).*(@.*)$/, "$1***$2") };
}

export async function confirmRecordReveal(user: User, recordId: string, code: string, ip = "unknown") {
  await consumeOtp(user.email, `reveal:${recordId}`, code, ip);
}

/* ----------------------------------------------------------------------------------------------
 * Sessions
 * -------------------------------------------------------------------------------------------- */

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  if (isDemoAuthEnabled() && cookieStore.get(DEMO_COOKIE)?.value === "preview") return demoUser;
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;
  const [session] = await db.select({ user: users }).from(sessions).innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()), isNull(users.deletedAt), isNull(users.disabledAt))).limit(1);
  return session?.user ?? null;
}

/** For API routes: the signed-in, real (non-demo) user, or a 401. */
export async function requireUser(options: { allowDemo?: boolean } = {}) {
  const user = await getCurrentUser();
  if (!user) throw new PublicError("Please sign in to continue.", 401, { code: "unauthenticated" });
  if (user.role === "demo" && !options.allowDemo) throw new PublicError("The local demo account can’t save changes. Create a real account to continue.", 403, { code: "demo" });
  return user;
}

export async function requireStaff(role: "staff" | "admin" = "staff") {
  const user = await getCurrentUser();
  const allowed = role === "admin" ? ["admin"] : ["admin", "staff"];
  if (!user || !allowed.includes(user.role)) throw new PublicError(role === "admin" ? "Administrator access is required." : "Staff access is required.", 403, { code: "forbidden" });
  return user;
}

/** Admin, or a staff member who has been given this permission. */
export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user || !(user.role === "admin" || user.role === "staff")) throw new PublicError("Staff access is required.", 403, { code: "forbidden" });
  if (!hasPermission(user, permission)) throw new PublicError("You don’t have access to this part of the admin area. Ask the owner to add it to your account.", 403, { code: "forbidden" });
  return user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  if (cookieStore.get(DEMO_COOKIE)) { cookieStore.delete(DEMO_COOKIE); return; }
  cookieStore.delete(RETURN_COOKIE);
  cookieStore.delete(SUPPORT_HINT_COOKIE);
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  // Always clear the cookie, even if the database is briefly unavailable.
  cookieStore.delete(SESSION_COOKIE);
  if (token) {
    try { await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token))); }
    catch (error) { console.error("[auth] could not delete session row; it will expire on its own", error); }
  }
}

export async function revokeOtherSessions(userId: string) {
  const current = await currentTokenHash();
  const removed = await db.delete(sessions).where(current ? and(eq(sessions.userId, userId), ne(sessions.tokenHash, current)) : eq(sessions.userId, userId)).returning({ id: sessions.id });
  return removed.length;
}

export async function activeSessionCount(userId: string) {
  const [row] = await db.select({ total: count() }).from(sessions).where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())));
  return Number(row?.total ?? 0);
}

/* ----------------------------------------------------------------------------------------------
 * Support view ("log in as a customer"). Owner only. Time-limited, logged, and blocked from
 * changing passwords, email, or deleting the account.
 * -------------------------------------------------------------------------------------------- */

async function impersonationRow(token: string | undefined) {
  if (!token || token.length > 128) return null;
  const [row] = await db.select().from(sessions)
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()), isNotNull(sessions.impersonatorId))).limit(1);
  return row ?? null;
}

export async function currentImpersonation() {
  const row = await impersonationRow((await cookies()).get(SESSION_COOKIE)?.value);
  if (!row?.impersonatorId) return null;
  const [target] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, row.userId)).limit(1);
  const [owner] = await db.select({ name: users.name }).from(users).where(eq(users.id, row.impersonatorId)).limit(1);
  return { targetName: target?.name ?? "Customer", targetEmail: target?.email ?? "", ownerName: owner?.name ?? "Owner", expiresAt: row.expiresAt.toISOString() };
}

export async function assertNotImpersonating() {
  if (await currentImpersonation()) throw new PublicError("This action is not available while you are viewing a customer’s account for support.", 403, { code: "impersonating" });
}

/** A customer by email, or by mobile number when that number has exactly one customer account. */
async function resolveCustomer(input: string) {
  const raw = input.trim();
  if (!raw.includes("@")) {
    const phone = normalizePhone(raw);
    if (!phone) throw new PublicError("Enter an email address or a 10-digit mobile number.", 400, { fields: { email: "Enter an email or a mobile number." } });
    const rows = await db.select().from(users).where(and(eq(users.phone, phone), eq(users.role, "customer"), isNull(users.deletedAt), isNull(users.disabledAt))).limit(5);
    if (!rows.length) throw new PublicError("No active customer account uses that mobile number.", 404, { fields: { email: "No customer account uses that number." } });
    if (rows.length > 1) throw new PublicError(`This number has ${rows.length} accounts (${rows.map((row) => row.name).join(", ")}). Type the email of the one you want.`, 409, { code: "several_accounts" });
    return rows[0];
  }
  const target = await findUserByEmail(normalizeEmail(raw));
  if (!isActive(target) || target.role !== "customer") throw new PublicError("No active customer account uses that email.", 404, { fields: { email: "No active customer account uses that email." } });
  return target;
}

export async function startImpersonation(owner: User, targetEmailInput: string, ip = "unknown") {
  if (owner.role !== "admin") throw new PublicError("Only the owner can view a customer’s account.", 403, { code: "forbidden" });
  if (await currentImpersonation()) throw new PublicError("Stop the current support view first.", 409);
  await enforceRate(RATE_RULES.accountChangePerUserHour, identity("user", owner.id), "Too many account changes.");
  const target = await resolveCustomer(targetEmailInput);
  const ownerToken = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!ownerToken) throw new PublicError("Please sign in again.", 401, { code: "unauthenticated" });

  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + IMPERSONATION_MINUTES * 60_000);
  await db.insert(sessions).values({ userId: target.id, tokenHash: hashToken(rawToken), expiresAt, impersonatorId: owner.id });
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(RETURN_COOKIE, ownerToken, { httpOnly: true, secure, sameSite: "lax", path: "/", expires: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000) });
  cookieStore.set(SESSION_COOKIE, rawToken, { httpOnly: true, secure, sameSite: "lax", path: "/", expires: expiresAt, priority: "high" });
  // Non-sensitive hint so the page only asks the server for the banner while a support view is open.
  cookieStore.set(SUPPORT_HINT_COOKIE, "1", { httpOnly: false, secure, sameSite: "lax", path: "/", expires: expiresAt });
  await logActivity({ kind: "impersonation", permission: "team", title: `Owner started viewing ${target.name}’s account`, detail: `Support view, ${IMPERSONATION_MINUTES} minutes. IP ${ip}.`, refType: "user", refId: target.id, actorId: owner.id });
  return { targetName: target.name, expiresAt: expiresAt.toISOString() };
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const row = await impersonationRow(token);
  if (!row?.impersonatorId) { cookieStore.delete(RETURN_COOKIE); return { stopped: false }; }
  await db.delete(sessions).where(eq(sessions.id, row.id));
  const ownerToken = cookieStore.get(RETURN_COOKIE)?.value;
  cookieStore.delete(RETURN_COOKIE);
  cookieStore.delete(SUPPORT_HINT_COOKIE);
  let restored = false;
  if (ownerToken && ownerToken.length <= 128) {
    const [owner] = await db.select({ id: sessions.id }).from(sessions)
      .where(and(eq(sessions.tokenHash, hashToken(ownerToken)), gt(sessions.expiresAt, new Date()))).limit(1);
    if (owner) {
      cookieStore.set(SESSION_COOKIE, ownerToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000), priority: "high" });
      restored = true;
    }
  }
  if (!restored) cookieStore.delete(SESSION_COOKIE);
  await logActivity({ kind: "impersonation", permission: "team", title: "Owner stopped viewing a customer’s account", refType: "user", refId: row.userId, actorId: row.impersonatorId });
  return { stopped: true, restored };
}

/* ----------------------------------------------------------------------------------------------
 * Account deletion (anonymisation)
 * -------------------------------------------------------------------------------------------- */

export async function openWorkCount(userId: string) {
  const [requests] = await db.select({ total: count() }).from(serviceRequests).where(and(eq(serviceRequests.userId, userId), notInArray(serviceRequests.status, [...CLOSED_STATUSES])));
  const [jobs] = await db.select({ total: count() }).from(printJobs).where(and(eq(printJobs.userId, userId), notInArray(printJobs.status, [...CLOSED_STATUSES])));
  return Number(requests?.total ?? 0) + Number(jobs?.total ?? 0);
}

/**
 * Closes an account. Service records must be kept for the business, so the user row is
 * anonymised (name, email, phone, address removed) instead of deleted.
 */
export async function deleteAccount(user: User, password: string, confirmation: string) {
  await assertNotImpersonating();
  if (confirmation.trim().toUpperCase() !== "DELETE") throw new PublicError("Type DELETE to confirm.", 400, { fields: { confirmation: "Type DELETE to confirm." } });
  await enforceRate(RATE_RULES.accountChangePerUserHour, identity("user", user.id), "Too many account changes.");
  const [fresh] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!isActive(fresh) || !(await verify(fresh.passwordHash, password).catch(() => false))) throw new PublicError("Your password is incorrect.", 400, { fields: { password: "Your password is incorrect." } });
  const open = await openWorkCount(fresh.id);
  if (open > 0) throw new PublicError(`You have ${open} open request${open === 1 ? "" : "s"}. Cancel ${open === 1 ? "it" : "them"} or wait until ${open === 1 ? "it is" : "they are"} completed, then delete your account.`, 409, { code: "open_requests" });
  const now = new Date();
  const linked = await db.select({ id: printJobs.addressId }).from(printJobs).where(and(eq(printJobs.userId, fresh.id), isNotNull(printJobs.addressId)));
  const linkedIds = [...new Set(linked.map((row) => row.id).filter((id): id is string => Boolean(id)))];
  await db.transaction(async (tx) => {
    await tx.update(users).set({
      name: "Deleted customer", email: `deleted-${fresh.id}@deleted.invalid`, phone: null, city: null, state: null, postalCode: null, profileSummary: null,
      passwordHash: await hash(randomBytes(32).toString("hex")), emailVerifiedAt: null, deletedAt: now, updatedAt: now,
    }).where(eq(users.id, fresh.id));
    await tx.delete(sessions).where(eq(sessions.userId, fresh.id));
    if (linkedIds.length) {
      await tx.update(addresses).set({ label: "Removed", line1: "Removed at customer request", line2: null, city: "-", state: "-", postalCode: "000000", isDefault: false })
        .where(and(eq(addresses.userId, fresh.id), inArray(addresses.id, linkedIds)));
      await tx.delete(addresses).where(and(eq(addresses.userId, fresh.id), notInArray(addresses.id, linkedIds)));
    } else {
      await tx.delete(addresses).where(eq(addresses.userId, fresh.id));
    }
    await tx.update(storedFiles).set({ retainUntil: now }).where(eq(storedFiles.userId, fresh.id));
    await tx.delete(notifications).where(and(eq(notifications.userId, fresh.id), eq(notifications.status, "queued")));
    await tx.delete(emailOtps).where(eq(emailOtps.email, fresh.email));
  });
  (await cookies()).delete(SESSION_COOKIE);
  sendAccountDeletedEmail(fresh.email, fresh.name).catch((error) => console.error("[auth] deletion email failed", error));
}

/** Placeholder password: never matches, so these accounts sign in only by checking a past record. */
export const NO_PASSWORD_HASH = "!records-account-no-password";

/** One account per mobile number, made from an imported register. The email is a reserved placeholder until the person adds a real one. */
export function recordAccountRow(phone: string, name: string) {
  const digits = phone.replace(/\D/g, "");
  return { name, email: `${digits}@records.nisecomport.invalid`, phone, whatsapp: phone, passwordHash: NO_PASSWORD_HASH, role: "customer", fromRecords: true };
}

export async function createRecordAccount(phone: string, name: string) {
  const [created] = await db.insert(users).values(recordAccountRow(phone, name)).onConflictDoNothing().returning();
  return created ?? null;
}

/**
 * Signs in the person who proves they own a past record: mobile + name + (receipt reference or PAN).
 * The account for that mobile is made if it does not exist yet.
 */
export async function signInWithRecords(mobileInput: string, nameInput: string, method: "reference" | "pan", value: string, ip = "unknown") {
  await enforceRate(RATE_RULES.passwordPerIp15m, identity("ip", ip), "Too many sign-in attempts from this network.");
  const phone = normalizePhone(mobileInput);
  if (!phone) throw new PublicError("Enter a valid 10-digit mobile number.", 400, { fields: { mobile: "Enter a valid 10-digit mobile number." } });
  const problem = nameProblem(nameInput, 2, "Name");
  if (problem) throw new PublicError(problem, 400, { fields: { name: problem } });
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, "");
  if (!cleaned) throw new PublicError(method === "pan" ? "Enter your PAN number." : "Enter the reference number from your receipt.", 400, { fields: { value: "Required." } });
  const match = await findRecordMatch(phone, nameInput, method, cleaned);
  if (!match) throw new PublicError("These details do not match a past record. Check the mobile number, name and number, or ask the centre.", 401, { code: "no_record_match" });

  const existing = await accountsOnMobile(phone);
  let user: User | null = existing.find((row) => row.role === "customer") ?? existing[0] ?? null;
  if (!user) user = await createRecordAccount(phone, match.name);
  if (!isActive(user)) throw new PublicError("This account is not active. Contact the centre.", 403, { code: "account_inactive" });
  await createSession(user.id);
  await logActivity({ kind: "status", permission: "records", category: "records", title: `${user.name} signed in with a past record`, detail: `Checked by ${method === "pan" ? "PAN" : "reference number"} · ${match.name}`, refType: "user", refId: user.id, actorId: user.id });
  return publicUser(user);
}
