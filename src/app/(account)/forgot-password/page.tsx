import ForgotPasswordPanel from "@/components/forgot-password-panel";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Reset your password", "Reset your NISE COMPORT account password with a code sent to your email.");

export default function ForgotPasswordPage() {
  return <ForgotPasswordPanel/>;
}
