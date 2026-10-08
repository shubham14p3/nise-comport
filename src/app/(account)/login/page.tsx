import { redirect } from "next/navigation";
import AuthPanel from "@/components/auth-panel";
import RecordsSignIn from "@/components/records-signin";
import { getCurrentUser, isDemoAuthEnabled } from "@/lib/auth";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Sign in", "Sign in to your NISE COMPORT account to manage your profile and track requests.");

/** Where to go afterwards is kept in the browser tab (see src/lib/after-login.ts), not in the URL. */
export default async function LoginPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/profile");
  return <>
    <AuthPanel mode="signin" demoEnabled={isDemoAuthEnabled() && process.env.NEXT_PUBLIC_SHOW_DEMO_CARD === "true"}/>
    <RecordsSignIn/>
  </>;
}
