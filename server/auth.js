import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "./db.js";

const COOKIE_NAME = "nise_session";
const SESSION_DAYS = 14;

function jwtSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
    throw new Error("JWT_SECRET must be configured with at least 24 characters");
  }
  return process.env.JWT_SECRET;
}

export function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return email || null;
}

export function normalizeMobile(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  return String(value).trim();
}

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw Object.assign(new Error("Password must be at least 8 characters"), { status: 400 });
  }
  return bcrypt.hash(password, 12);
}

export function signSession(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name },
    jwtSecret(),
    { expiresIn: `${SESSION_DAYS}d`, issuer: "nise-comport" }
  );
}

export function setSessionCookie(res, user) {
  res.cookie(COOKIE_NAME, signSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export async function authOptional(req, _res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return next();
    const payload = jwt.verify(token, jwtSecret(), { issuer: "nise-comport" });
    const { rows } = await query(
      "SELECT id, role, name, email, mobile, marketing_consent, whatsapp_consent FROM users WHERE id=$1",
      [payload.sub]
    );
    req.user = rows[0] || null;
    next();
  } catch {
    req.user = null;
    next();
  }
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(Object.assign(new Error("Please sign in to continue"), { status: 401 }));
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(Object.assign(new Error("Please sign in to continue"), { status: 401 }));
    if (!roles.includes(req.user.role)) return next(Object.assign(new Error("You do not have access to this area"), { status: 403 }));
    next();
  };
}

export async function verifyCredentials(identifier, password) {
  const email = normalizeEmail(identifier);
  const mobile = normalizeMobile(identifier);
  const { rows } = await query(
    "SELECT id, role, name, email, mobile, password_hash, marketing_consent, whatsapp_consent FROM users WHERE lower(email)=lower($1) OR mobile=$2 LIMIT 1",
    [email || "", mobile || ""]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(String(password || ""), user.password_hash))) {
    throw Object.assign(new Error("Invalid email/mobile or password"), { status: 401 });
  }
  delete user.password_hash;
  return user;
}
