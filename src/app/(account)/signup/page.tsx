import { redirect } from "next/navigation";
import AuthPanel from "@/components/auth-panel";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-redirect";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Create your account", "Create your NISE COMPORT account with secure email verification.");

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNextPath(next);
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect(target);
  return <AuthPanel mode="signup" nextPath={target}/>;
}
