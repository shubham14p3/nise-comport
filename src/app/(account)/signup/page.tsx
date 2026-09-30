import { redirect } from "next/navigation";
import AuthPanel from "@/components/auth-panel";
import { getCurrentUser } from "@/lib/auth";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Create your account", "Create your NISE COMPORT account with secure email verification.");

export default async function SignupPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/profile");
  return <AuthPanel mode="signup"/>;
}
