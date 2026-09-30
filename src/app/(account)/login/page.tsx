import { redirect } from "next/navigation";
import AuthPanel from "@/components/auth-panel";
import { getCurrentUser, isDemoAuthEnabled } from "@/lib/auth";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Sign in", "Sign in to your NISE COMPORT account to manage your profile and track requests.");

export default async function LoginPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/profile");
  return <AuthPanel mode="signin" demoEnabled={isDemoAuthEnabled()}/>;
}
