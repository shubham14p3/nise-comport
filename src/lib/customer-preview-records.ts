import { and, desc, eq, sql } from "drizzle-orm";
import { customerRecords, recordClaims } from "@/db/schema";
import { db } from "@/lib/db";
import { blindIndex, vaultReady } from "@/lib/vault";
import { ownRecordView } from "@/lib/mobile-login-core";

/** Inspect the existing claim without creating/approving one or acting as the customer. */
export async function previewRecords(userId: string) {
  const [claim] = await db.select({ phone: recordClaims.phone, status: recordClaims.status, expiresAt: recordClaims.expiresAt })
    .from(recordClaims).where(eq(recordClaims.userId, userId)).orderBy(desc(recordClaims.createdAt)).limit(1);
  if (!claim) return { status: "none", records: [] };
  const status = claim.status === "pending" && claim.expiresAt < new Date() ? "expired" : claim.status;
  if (status !== "approved" || !vaultReady()) return { status, records: [] };
  const hash = blindIndex("mobile", claim.phone.replace(/^\+91/, ""));
  const rows = await db.select({ id: customerRecords.id, service: customerRecords.service, name: customerRecords.name,
    recordDate: customerRecords.recordDate, renewalOn: customerRecords.renewalOn, vehicle: customerRecords.vehicle })
    .from(customerRecords).where(and(sql`(${customerRecords.phoneHashes} && ARRAY[${hash}]::text[] or ${customerRecords.mobileHash} = ${hash})`))
    .orderBy(desc(customerRecords.recordDate)).limit(60);
  return { status, records: rows.map(ownRecordView) };
}
