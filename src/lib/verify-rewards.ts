import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rewardReference, VERIFY_REWARD_RUPEES } from "@/lib/mobile-login-core";

/**
 * One-time wallet credit for proving a mobile number or an email address. A unique index on the reference
 * (wallet_entries_verify_reward_unique) makes it safe to call twice: the second call does nothing.
 */
export async function grantVerifyReward(userId: string, kind: "phone" | "email") {
  const amount = VERIFY_REWARD_RUPEES[kind];
  const label = kind === "phone" ? "mobile number" : "email address";
  const rows = await db.execute(sql`insert into wallet_entries (user_id, amount, kind, description, reference) values (${userId}, ${amount.toFixed(2)}, 'credit', ${`Thank you for verifying your ${label}`}, ${rewardReference(kind, userId)}) on conflict (reference) where reference like 'verify:%' do nothing returning id`);
  return (rows.rows?.length ?? 0) > 0;
}
