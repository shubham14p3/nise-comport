import { randomBytes, randomInt } from "node:crypto";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { hash, verify } from "@node-rs/argon2";
import { contacts, recordClaims, users } from "@/db/schema";
import { createSession, type User } from "@/lib/auth";
import { endSessions, ensureClaim, matchedRecordCount } from "@/lib/claims";
import { db } from "@/lib/db";
import { PublicError, isUniqueViolation } from "@/lib/errors";
import { logActivity } from "@/lib/activity";
import { checkMobile, generatePin, loginPinHashForAccount, pinProblem, placeholderEmail } from "@/lib/mobile-login-core";
import { clearRate, enforceRate, hitRate, identity, peekRate, RATE_RULES } from "@/lib/rate-limit";
import { cleanName, passwordProblem, looksLikeEmail, normalizeEmail } from "@/lib/validation";
import { seal } from "@/lib/vault";
import { RateLimitError, humanDuration } from "@/lib/errors";
import { secondsUntilWindowEnds } from "@/lib/rate-limit-core";

let dummy: Promise<string> | undefined;
const dummyHash = () => (dummy ??= hash(`pin-timing-${randomBytes(16).toString("hex")}`));

function mobileOrThrow(input: string) {
  const result = checkMobile(input);
  if (!result.ok) throw new PublicError(result.error, 400, { fields: { phone: result.error } });
  return result;
}

const SAME_ANSWER = "Mobile number or PIN is incorrect.";
const publicUser = (user: Pick<User, "id" | "name" | "email">) => ({ id: user.id, name: user.name, email: user.email });

/**
 * Sign in with a mobile number and the 6-digit PIN. Unknown numbers and wrong PINs give the same answer, and five wrong
 * tries for one number pause it for 15 minutes whether or not an account exists.
 */
export async function mobileSignIn(phoneInput: string, pin: string, ip: string) {
  const emailMode = phoneInput.includes("@");
  const email = emailMode ? normalizeEmail(phoneInput) : "";
  const mobile = emailMode ? null : mobileOrThrow(phoneInput);
  if (emailMode && !looksLikeEmail(email)) throw new PublicError("Enter a valid account email.", 400);
  const problem = pinProblem(pin);
  if (problem) throw new PublicError(problem, 400, { fields: { pin: problem } });
  await enforceRate(RATE_RULES.passwordPerIp15m, identity("ip", ip), "Too many sign-in attempts from this network.");
  // Rate limits use the complete selected identity, not just a shared phone's PIN.
  const failId = identity(emailMode ? "pin-email" : "pin-phone", emailMode ? email : mobile!.digits);
  if ((await peekRate(RATE_RULES.pinFailuresPerPhone15m, failId)) >= RATE_RULES.pinFailuresPerPhone15m.limit) {
    const wait = secondsUntilWindowEnds(Date.now(), RATE_RULES.pinFailuresPerPhone15m.windowSeconds);
    throw new RateLimitError(`Too many incorrect PINs. Try again in ${humanDuration(wait)}.`, wait);
  }
  // Never pick one of several accounts sharing a contact phone, even when only
  // one has a PIN. An email address is a unique identity for those accounts.
  const found = emailMode
    ? await db.select().from(users).where(and(eq(users.email, email), isNull(users.deletedAt), isNull(users.disabledAt))).limit(2)
    : await db.select().from(users).where(and(eq(users.phone, mobile!.e164), isNull(users.deletedAt), isNull(users.disabledAt))).limit(2);
  const user = found.length === 1 ? found[0] : null;
  const pinHash = loginPinHashForAccount(user);
  const valid = pinHash ? await verify(pinHash, pin).catch(() => false) : (await verify(await dummyHash(), pin).catch(() => false), false);
  if (!user || !valid) {
    const recent = await hitRate(RATE_RULES.pinFailuresPerPhone15m, failId);
    const left = RATE_RULES.pinFailuresPerPhone15m.limit - recent.count;
    if (left <= 0) {
      const wait = secondsUntilWindowEnds(Date.now(), RATE_RULES.pinFailuresPerPhone15m.windowSeconds);
      throw new RateLimitError(`Email/mobile or PIN is incorrect. Try again in ${humanDuration(wait)}.`, wait);
    }
    throw new PublicError(`Email/mobile or PIN is incorrect.${left <= 2 ? ` ${left} ${left === 1 ? "try" : "tries"} left before a 15-minute pause.` : ""}`, 401, { code: "invalid_credentials", fields: { pin: SAME_ANSWER } });
  }
  await clearRate(RATE_RULES.pinFailuresPerPhone15m, failId);
  await createSession(user.id);
  await ensureClaim(user).catch((error) => console.error("[claims] could not check records", error));
  return { user: publicUser(user) };
}

/**
 * Creates an account from a mobile number and a name, makes a random 6-digit PIN, signs the person in and returns the PIN
 * once (it is stored hashed). If records already exist under the number, a pending claim is opened for staff.
 */
export async function mobileSignUp(input: { phone: string; name: string; password?: string; whatsappConsent?: boolean; emailConsent?: boolean }, ip: string) {
  const { e164, digits } = mobileOrThrow(input.phone);
  const name = cleanName(input.name);
  if (name.length < 2 || name.length > 100) throw new PublicError("Enter your name (at least 2 letters).", 400, { fields: { name: "Enter your name (at least 2 letters)." } });
  if (input.password) {
    const problem = passwordProblem(input.password, { email: placeholderEmail(digits), name });
    if (problem) throw new PublicError(problem, 400, { fields: { password: problem } });
  }
  await enforceRate(RATE_RULES.mobileSignupPerIpHour, identity("ip", ip), "Too many accounts were created from this network.");
  const [taken] = await db.select({ id: users.id }).from(users).where(and(eq(users.phone, e164), isNull(users.deletedAt))).limit(1);
  if (taken) throw new PublicError("This number already has an account. Sign in with your own credentials. For a separate family member, register using their own email and leave the optional mobile blank; do not sign in to someone else’s account.", 409, { code: "account_exists", fields: { phone: "This number already has an account." } });
  const pin = generatePin((below) => randomInt(0, below));
  // Existing mobile sign-ups retain PIN-only behavior. Customers who opt in to
  // password access get their own password hash rather than an unknowable random password.
  const [loginPinHash, passwordHash] = await Promise.all([
    hash(pin), hash(input.password || randomBytes(32).toString("base64url")),
  ]);
  let created: User;
  try {
    [created] = await db.insert(users).values({ name, email: placeholderEmail(digits), phone: e164, passwordHash, loginPinHash, signupMethod: "mobile", preferredContact: "whatsapp", passwordChangedAt: new Date() }).returning();
  } catch (error) {
    if (isUniqueViolation(error)) throw new PublicError("This number already has an account. Sign in with your PIN.", 409, { code: "account_exists" });
    throw error;
  }
  await createSession(created.id);
  const claim = await ensureClaim(created, pin).catch((error) => { console.error("[claims] could not check records", error); return null; });
  // Consent is asked only from brand-new customers; people already in the registers are handled by the owner.
  if (!claim && !(await matchedRecordCount(e164).catch(() => 0)) && (input.whatsappConsent || input.emailConsent)) {
    const now = new Date();
    await db.insert(contacts).values({
      name: name.slice(0, 100), phone: digits, source: "website sign-up",
      ...(input.whatsappConsent ? { consent: "opted_in", consentAt: now } : {}), ...(input.emailConsent ? { emailConsent: "opted_in", emailConsentAt: now } : {}),
    }).onConflictDoNothing();
  }
  await logActivity({ kind: "signup", permission: "records", category: "records", title: `New sign-up: ${name}`, detail: `${e164} · mobile PIN account${claim ? " · has records" : ""}`, refType: "user", refId: created.id, actorId: created.id });
  return { user: publicUser(created), pin, hasRecords: Boolean(claim) };
}

/** Staff reset a customer's PIN: a new random PIN (shown once to staff), the old sessions end and the lock is cleared. */
export async function resetPin(staff: { id: string; name: string }, phoneInput: string) {
  const { e164, digits } = mobileOrThrow(phoneInput);
  // Staff may reset an explicitly enabled PIN regardless of original signup method.
  const found = await db.select().from(users).where(and(eq(users.phone, e164), isNotNull(users.loginPinHash), isNull(users.deletedAt), isNull(users.disabledAt))).limit(2);
  if (found.length !== 1) throw new PublicError("No unique active PIN account was found. For shared numbers, choose the exact account in Customers or Team and reset its PIN there.", 404);
  const pin = generatePin((below) => randomInt(0, below));
  await db.update(users).set({ loginPinHash: await hash(pin), updatedAt: new Date() }).where(eq(users.id, found[0].id));
  await db.update(recordClaims).set({ pinEnc: seal(pin) }).where(and(eq(recordClaims.userId, found[0].id), eq(recordClaims.status, "pending")));
  await endSessions(found[0].id);
  await clearRate(RATE_RULES.pinFailuresPerPhone15m, identity("pin-phone", digits));
  await logActivity({ kind: "staff", permission: "team", category: "records", title: `${staff.name} reset the PIN of ${found[0].name}`, detail: e164, refType: "user", refId: found[0].id, actorId: staff.id });
  return { pin, name: found[0].name };
}

