import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { activityLog, phoneOtps, recordClaims, sessions, users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { generatePin } from "@/lib/mobile-login-core";
import { seal } from "@/lib/vault";
import { approveClaimsForVerifiedPhone } from "@/lib/claims";
import { grantVerifyReward } from "@/lib/verify-rewards";
import { grantWelcomeCredit } from "@/lib/welcome-credit";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { clearRate, enforceRate, hitRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { indianMobile, otpChannels, sendOtpSms } from "@/lib/sms";
import { isSixDigitCode, normalizePhone, passwordProblem } from "@/lib/validation";

const OTP_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function secret() {
  const value = process.env.OTP_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") throw new PublicError("SMS codes are temporarily unavailable.", 503, { code: "otp_not_configured" });
  return value || "development-only-otp-secret-not-for-production";
}
const hashCode = (phone: string, purpose: string, code: string) => createHmac("sha256", secret()).update(`${phone}:${purpose}:${code}`).digest("hex");
function same(a: string, b: string) { const x = Buffer.from(a, "hex"); const y = Buffer.from(b, "hex"); return x.length === y.length && timingSafeEqual(x, y); }

export function indianPhoneOrThrow(input: string) {
  const phone = normalizePhone(input);
  if (!phone || !indianMobile(phone)) throw new PublicError("Enter an Indian mobile number, e.g. 98765 43210.", 400, { fields: { phone: "Enter an Indian mobile number, e.g. 98765 43210." } });
  return phone;
}

async function issue(userId: string, phone: string, purpose: "verify" | "signin" | "reset-pin" | "reset-password", ip: string, channel?: string | null) {
  const available = otpChannels();
  if (!available.length || (channel && !available.includes(channel as "sms" | "whatsapp"))) {
    throw new PublicError("This verification method is not currently available.", 503, { code: "sms_not_configured" });
  }
  const phoneId = identity("phone", phone);
  await enforceRate(RATE_RULES.smsSendPerIpHour, identity("ip", ip), "Too many codes were requested from this network.");
  await enforceRate(RATE_RULES.smsSendPerPhoneMinute, phoneId, "A code was sent moments ago. Please wait a minute.");
  await enforceRate(RATE_RULES.smsSendPerPhoneDay, phoneId, "Too many codes were requested for this number today.");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.delete(phoneOtps).where(and(eq(phoneOtps.userId, userId), eq(phoneOtps.purpose, purpose)));
  const [row] = await db.insert(phoneOtps).values({ userId, phone, purpose, codeHash: hashCode(phone, purpose, code), expiresAt: new Date(Date.now() + OTP_MINUTES * 60_000) }).returning({ id: phoneOtps.id });
  try { await sendOtpSms(phone, code, channel); }
  catch (error) { await db.delete(phoneOtps).where(eq(phoneOtps.id, row.id)); throw error; }
}

async function consume(userId: string, phone: string, purpose: "verify" | "signin" | "reset-pin" | "reset-password", code: string, ip: string) {
  await enforceRate(RATE_RULES.smsVerifyPerIpHour, identity("ip", ip), "Too many attempts from this network.");
  if (!isSixDigitCode(code)) throw new PublicError("Enter the 6-digit code from the SMS.", 400, { fields: { code: "Enter the 6-digit code from the SMS." } });
  const [challenge] = await db.select().from(phoneOtps).where(and(eq(phoneOtps.userId, userId), eq(phoneOtps.purpose, purpose), eq(phoneOtps.phone, phone), isNull(phoneOtps.consumedAt), gt(phoneOtps.expiresAt, new Date()))).orderBy(desc(phoneOtps.createdAt)).limit(1);
  if (!challenge) throw new PublicError("This code has expired or a newer code was sent. Request a new code.", 400, { code: "otp_expired" });
  if (challenge.attempts >= MAX_ATTEMPTS) { await db.delete(phoneOtps).where(eq(phoneOtps.id, challenge.id)); throw new PublicError("Too many incorrect attempts. Request a new code.", 400, { code: "otp_locked" }); }
  if (!same(hashCode(phone, purpose, code.trim()), challenge.codeHash)) {
    const [updated] = await db.update(phoneOtps).set({ attempts: sql`${phoneOtps.attempts} + 1` }).where(eq(phoneOtps.id, challenge.id)).returning({ attempts: phoneOtps.attempts });
    const left = MAX_ATTEMPTS - (updated?.attempts ?? MAX_ATTEMPTS);
    throw new PublicError(left <= 0 ? "Too many incorrect attempts. Request a new code." : `That code doesn’t match. ${left} attempt${left === 1 ? "" : "s"} left.`, 400, { code: "otp_mismatch", fields: { code: "That code doesn’t match." } });
  }
  const used = await db.update(phoneOtps).set({ consumedAt: new Date() }).where(and(eq(phoneOtps.id, challenge.id), isNull(phoneOtps.consumedAt))).returning({ id: phoneOtps.id });
  if (!used.length) throw new PublicError("This code was already used.", 409, { code: "otp_used" });
}

/** Signed-in customer asks for a code to prove a mobile number is theirs. */
export async function requestPhoneVerification(userId: string, phoneInput: string, ip: string, channel?: string | null) {
  if (!otpChannels().length) throw new PublicError("SMS verification is coming soon.", 503, { code: "sms_not_configured" });
  const phone = indianPhoneOrThrow(phoneInput);
  const [taken] = await db.select({ id: users.id }).from(users).where(and(eq(users.phone, phone), sql`${users.phoneVerifiedAt} is not null`, ne(users.id, userId), isNull(users.deletedAt))).limit(1);
  if (taken) throw new PublicError("This number is already verified on another account.", 409, { code: "phone_taken", fields: { phone: "This number is already used on another account." } });
  await issue(userId, phone, "verify", ip, channel);
}

export async function confirmPhoneVerification(userId: string, phoneInput: string, code: string, ip: string) {
  const phone = indianPhoneOrThrow(phoneInput);
  await consume(userId, phone, "verify", code, ip);
  const [taken] = await db.select({ id: users.id }).from(users).where(and(eq(users.phone, phone), sql`${users.phoneVerifiedAt} is not null`, ne(users.id, userId), isNull(users.deletedAt))).limit(1);
  if (taken) throw new PublicError("This number is already verified on another account.", 409, { code: "phone_taken" });
  await db.transaction(async tx=>{
    await tx.update(users).set({phone,phoneVerifiedAt:new Date(),updatedAt:new Date()}).where(eq(users.id,userId));
    await tx.insert(activityLog).values({
      kind:"staff",permission:"team",category:"customer-profile",
      title:"Customer verified their mobile number",
      detail:`Verified mobile ending ${phone.slice(-4)}`,
      refType:"customer-profile",refId:userId,actorId:userId,
    });
  });
  // A proven number earns the one-time ₹20 credit and opens (or approves) the claim on any records under it.
  await grantVerifyReward(userId, "phone").catch((error) => console.error("[rewards] phone reward failed", error));
  await grantWelcomeCredit(userId).catch((error) => console.error("[welcome] credit not granted", error));
  await approveClaimsForVerifiedPhone(userId, phone).catch((error) => console.error("[claims] approve failed", error));
  return { phone };
}

async function verifiedOwner(phone: string) {
  const rows = await db.select({ id: users.id }).from(users).where(and(eq(users.phone, phone), sql`${users.phoneVerifiedAt} is not null`, isNull(users.deletedAt), isNull(users.disabledAt))).limit(2);
  return rows.length === 1 ? rows[0].id : null;
}

/** Sign-in by SMS. The reply is the same whether or not the number is registered. */
export async function requestSignInSms(phoneInput: string, ip: string, channel?: string | null) {
  if (!otpChannels().length) throw new PublicError("SMS sign-in is coming soon.", 503, { code: "sms_not_configured" });
  const phone = indianPhoneOrThrow(phoneInput);
  const owner = await verifiedOwner(phone);
  if (!owner) {
    // Same limits and the same answer, but nothing is sent.
    const phoneId = identity("phone", phone);
    await enforceRate(RATE_RULES.smsSendPerIpHour, identity("ip", ip), "Too many codes were requested from this network.");
    await enforceRate(RATE_RULES.smsSendPerPhoneMinute, phoneId, "A code was sent moments ago. Please wait a minute.");
    return;
  }
  await issue(owner, phone, "signin", ip, channel);
}

export async function signInWithSms(phoneInput: string, code: string, ip: string) {
  const phone = indianPhoneOrThrow(phoneInput);
  const owner = await verifiedOwner(phone);
  const failId = identity("phone-fail", phone);
  if (!owner) { await hitRate(RATE_RULES.passwordFailuresPerEmail15m, failId); throw new PublicError("That code doesn’t match or has expired.", 400, { code: "otp_mismatch", fields: { code: "That code doesn’t match." } }); }
  await consume(owner, phone, "signin", code, ip);
  await clearRate(RATE_RULES.passwordFailuresPerEmail15m, failId);
  await createSession(owner);
  const [user] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, owner)).limit(1);
  return { user };
}

/**
 * Password/PIN recovery never trusts a profile phone on its own: the phone
 * must already be verified, belong to exactly one active account, and pass an
 * actual 6-digit OTP delivery challenge. No SMS keys => no self-service reset.
 */
export type MobileResetKind = "pin" | "password";

async function recoveryOwner(phone: string, kind: MobileResetKind) {
  const rows = await db.select().from(users).where(and(
    eq(users.phone, phone), isNotNull(users.phoneVerifiedAt),
    isNull(users.deletedAt), isNull(users.disabledAt),
    kind === "pin" ? isNotNull(users.loginPinHash) : undefined,
  )).limit(2);
  return rows.length === 1 ? rows[0] : null;
}

export async function requestMobileCredentialReset(phoneInput: string, kind: MobileResetKind, ip: string, channel?: string) {
  if (!otpChannels().length) throw new PublicError("Mobile recovery is not available yet. Please contact our team after verifying your identity.", 503, { code: "sms_not_configured" });
  const phone = indianPhoneOrThrow(phoneInput);
  const owner = await recoveryOwner(phone, kind);
  if (owner) {
    await issue(owner.id, phone, kind === "pin" ? "reset-pin" : "reset-password", ip, channel);
  } else {
    // Keep the public response the same for unknown or unverified numbers.
    await enforceRate(RATE_RULES.smsSendPerIpHour, identity("ip", ip), "Too many codes were requested from this network.");
    await enforceRate(RATE_RULES.smsSendPerPhoneMinute, identity("phone", phone), "A code was sent moments ago. Please wait a minute.");
  }
}

export async function confirmMobileCredentialReset(phoneInput: string, kind: MobileResetKind, code: string, newPassword: string | undefined, ip: string) {
  if (!otpChannels().length) throw new PublicError("Mobile recovery is not available.", 503, { code: "sms_not_configured" });
  const phone = indianPhoneOrThrow(phoneInput);
  const owner = await recoveryOwner(phone, kind);
  if (!owner) throw new PublicError("The code is invalid or expired.", 400, { code: "otp_mismatch" });
  if (kind === "password") {
    const problem = passwordProblem(newPassword ?? "", { email: owner.email, name: owner.name });
    if (problem) throw new PublicError(problem, 400, { fields: { password: problem } });
  }
  await consume(owner.id, phone, kind === "pin" ? "reset-pin" : "reset-password", code, ip);
  if (kind === "pin") {
    const pin = generatePin((below) => randomInt(0, below));
    const hashed = await hash(pin);
    let encryptedPin: string | null = null;
    try { encryptedPin = seal(pin); } catch { /* records PIN display is optional; never break account recovery */ }
    await db.transaction(async (tx) => {
      await tx.update(users).set({ loginPinHash: hashed, updatedAt: new Date() }).where(eq(users.id, owner.id));
      await tx.delete(sessions).where(eq(sessions.userId, owner.id));
      if (encryptedPin) await tx.update(recordClaims).set({ pinEnc: encryptedPin }).where(and(eq(recordClaims.userId, owner.id), eq(recordClaims.status, "pending")));
    });
    await clearRate(RATE_RULES.pinFailuresPerPhone15m, identity("pin-phone", phone.slice(-10))).catch(() => undefined);
    return { pin };
  }
  const passwordHash = await hash(newPassword!);
  await db.transaction(async (tx) => {
    await tx.update(users).set({
      passwordHash, passwordChangedAt: new Date(),
      mustChangePassword: false, updatedAt: new Date(),
    }).where(eq(users.id, owner.id));
    await tx.delete(sessions).where(eq(sessions.userId, owner.id));
  });
  return { message: "Password updated. Sign in using your registered mobile number and new password." };
}
