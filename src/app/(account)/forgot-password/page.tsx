import ForgotPasswordPanel from "@/components/forgot-password-panel";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Reset your password", "Reset your NISE COMPORT account password with a code sent to your email.");

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return <ForgotPasswordPanel initialEmail={typeof email === "string" ? email.slice(0, 254) : ""}/>;
}
