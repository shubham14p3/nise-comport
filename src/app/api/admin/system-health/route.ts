import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { integrationStatuses } from "@/lib/integration-vault";
import { paymentOptions } from "@/lib/payments";
import { otpChannels } from "@/lib/sms";
import { smtpConfigured } from "@/lib/email";
import { imapConnection } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One lightweight owner-only status snapshot. Configuration is NOT a live connection check. */
export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Owner access only." }, { status: 403 });
  const payments = paymentOptions();
  let integrations: { provider: string; configured: boolean; updatedAt: Date | null }[] = [];
  let vaultReady = false;
  try {
    vaultReady = /^[a-f0-9]{64}$/i.test(process.env.INTEGRATIONS_ENCRYPTION_KEY ?? "");
    if (vaultReady) integrations = await integrationStatuses();
  } catch {
    // Never leak secrets or the DB connection string in the owner dashboard.
  }
  const smtpEnvironment = smtpConfigured();
  const imap = await imapConnection();
  const saved = (provider: string) => integrations.find((item) => item.provider === provider);
  const status = (provider: string) => ({
    configured: Boolean(saved(provider)?.configured), lastSavedAt: saved(provider)?.updatedAt ?? null,
    checked: false, state: saved(provider)?.configured ? "not_tested" : "not_configured",
  });
  return NextResponse.json({
    vaultReady,
    integrations: {
      instagram: status("instagram"), facebook: status("facebook"),
      whatsapp: status("whatsapp"), email: { ...status("email"), configured: status("email").configured || smtpEnvironment || Boolean(imap) },
      youtube: { configured: false, checked: false, state: "not_integrated" },
    },
    delivery: {
      sms: otpChannels().includes("sms"), whatsappOtp: otpChannels().includes("whatsapp"),
      smtpEnvironment,
    },
    payments: {
      upi: Boolean(payments.upi?.length), upiAccounts: payments.upi?.length ?? 0,
      razorpay: payments.razorpay, razorpayWebhook: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
      cashfree: payments.cashfree, cashfreeEnvironment: process.env.CASHFREE_ENV === "production" ? "production" : "sandbox",
      cashfreeWebhook: Boolean(process.env.CASHFREE_WEBHOOK_SECRET), onlineFeePercent: payments.feePercent,
    },
  }, { headers: { "cache-control": "private, no-store" } });
}
