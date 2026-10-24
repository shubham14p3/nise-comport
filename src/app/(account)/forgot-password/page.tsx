import ForgotPasswordPanel from "@/components/forgot-password-panel";
import { otpChannels } from "@/lib/sms";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Reset your password", "Reset your NISE COMPORT account password with a code sent to your email.");

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ method?: string }> }) {
  const channels = otpChannels();
  const { method } = await searchParams;
  return <ForgotPasswordPanel channels={channels} initialMethod={method === "mobile" ? "mobile" : "email"}/>;
}
