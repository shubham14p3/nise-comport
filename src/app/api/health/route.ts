import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { smtpConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

/** For uptime monitors: 200 when the database answers, 503 otherwise. Reveals no secrets. */
export async function GET() {
  const started = Date.now();
  let database = false;
  try { await db.execute(sql`select 1`); database = true; } catch (error) { console.error("[health] database check failed", error); }
  const otpSecret = Boolean(process.env.OTP_SECRET && process.env.OTP_SECRET.length >= 32);
  const body = { ok: database, database, smtpConfigured: smtpConfigured(), otpSecretConfigured: otpSecret, cronSecretConfigured: Boolean(process.env.CRON_SECRET), responseMs: Date.now() - started };
  return NextResponse.json(body, { status: database ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
