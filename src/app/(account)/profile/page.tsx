import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileDashboard from "@/components/profile-dashboard";
import DemoProfile from "@/components/demo-profile";
import { getCurrentUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/permissions";

export const metadata: Metadata = { title: "Customer profile", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "demo") return <DemoProfile/>;
  // No customer record, request, wallet or identifier is serialized into the RSC payload.
  // The authenticated workspace loads its private data through the encrypted browser transport.
  return (
    <>
      {isStaffRole(user.role) ? (
        <div className="admin-entry"><Link className="btn btn--ghost" href="/admin">Open admin dashboard</Link></div>
      ) : null}
      <ProfileDashboard/>
    </>
  );
}
