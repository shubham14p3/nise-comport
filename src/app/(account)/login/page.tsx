import { redirect } from "next/navigation";
import AuthPanel from "@/components/auth-panel";
import { getCurrentUser, isDemoAuthEnabled } from "@/lib/auth";
import { privateMetadata } from "@/lib/seo";
import { isStaffRole, STAFF_HOME } from "@/lib/staff-routes";

export const metadata = privateMetadata("Sign in", "Sign in to your NISE COMPORT account to manage your profile and track requests.");

/** Where to go afterwards is kept in the browser tab (see src/lib/after-login.ts), not in the URL. */
export default async function LoginPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect(isStaffRole(user.role) ? STAFF_HOME : "/profile");
  return <AuthPanel mode="signin" demoEnabled={isDemoAuthEnabled()}/>;
}
