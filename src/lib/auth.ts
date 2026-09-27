import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { hash, verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { emailOtps, sessions, users } from "@/db/schema";
import { sendOtpEmail } from "@/lib/email";

const SESSION_COOKIE = "nise_session";
const SESSION_DAYS = 14;
const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
const hashOtp = (email: string, purpose: string, code: string) => createHmac("sha256", process.env.OTP_SECRET ?? process.env.SMTP_PASSWORD ?? "development-only").update(`${email}:${purpose}:${code}`).digest("hex");

export async function requestEmailOtp(emailInput: string, purpose: "signup" | "signin") {
  const email = emailInput.trim().toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (purpose === "signup" && existing) throw new Error("An account with this email already exists.");
  if (purpose === "signin" && !existing) throw new Error("No account was found for this email.");
  const [lastCode] = await db.select().from(emailOtps).where(and(eq(emailOtps.email, email), eq(emailOtps.purpose, purpose))).orderBy(desc(emailOtps.createdAt)).limit(1);
  if (lastCode && Date.now() - lastCode.createdAt.getTime() < 60_000) throw new Error("Please wait one minute before requesting another code.");
  const code = String(randomInt(100000, 1000000));
  const [challenge] = await db.insert(emailOtps).values({ email, codeHash: hashOtp(email, purpose, code), purpose, expiresAt: new Date(Date.now() + 10 * 60_000) }).returning({ id: emailOtps.id });
  try { await sendOtpEmail(email, code); } catch (error) {
    await db.delete(emailOtps).where(eq(emailOtps.id, challenge.id));
    console.error("OTP email failed", error);
    throw new Error("We could not send your email code. Please try again shortly.");
  }
}

export async function verifyEmailOtp(emailInput: string, code: string, purpose: "signup" | "signin", profile?: { name: string; password: string; phone?: string }) {
  const email = emailInput.trim().toLowerCase();
  const [challenge] = await db.select().from(emailOtps).where(and(eq(emailOtps.email, email), eq(emailOtps.purpose, purpose), gt(emailOtps.expiresAt, new Date()))).orderBy(desc(emailOtps.createdAt)).limit(1);
  if (!challenge || challenge.attempts >= 5) throw new Error("This code has expired. Request a new one.");
  if (hashOtp(email, purpose, code) !== challenge.codeHash) {
    await db.update(emailOtps).set({ attempts: sql`${emailOtps.attempts} + 1` }).where(and(eq(emailOtps.id, challenge.id), lt(emailOtps.attempts, 5)));
    throw new Error("That code doesn’t match. Check it and try again.");
  }
  await db.delete(emailOtps).where(eq(emailOtps.email, email));
  let user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
  if (purpose === "signup") {
    if (!profile) throw new Error("Complete your account details to continue.");
    if (user) throw new Error("An account with this email already exists.");
    const passwordHash = await hash(profile.password);
    [user] = await db.insert(users).values({ email, name: profile.name.trim(), phone: profile.phone?.trim(), passwordHash, emailVerifiedAt: new Date() }).returning();
  } else {
    if (!user) throw new Error("No account was found for this email.");
    await db.update(users).set({ emailVerifiedAt: user.emailVerifiedAt ?? new Date() }).where(eq(users.id, user.id));
  }
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000);
  await db.insert(sessions).values({ userId: user.id, tokenHash: hashToken(rawToken), expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
  return { id: user.id, name: user.name, email: user.email };
}

export async function signInWithPassword(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verify(user.passwordHash, password))) throw new Error("Email or password is incorrect.");
  if (!user.emailVerifiedAt) { await requestEmailOtp(email, "signin"); return { requiresOtp: true as const }; }
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000);
  await db.insert(sessions).values({ userId: user.id, tokenHash: hashToken(rawToken), expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
  return { requiresOtp: false as const, user: { id: user.id, name: user.name, email: user.email } };
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [session] = await db.select({ user: users }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()))).limit(1);
  return session?.user ?? null;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  cookieStore.delete(SESSION_COOKIE);
}
