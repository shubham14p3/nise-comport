import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileDashboard from "@/components/profile-dashboard";
import DemoProfile from "@/components/demo-profile";
import { currentImpersonation, getCurrentUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/permissions";
import LinkRecords from "@/components/link-records";

export const metadata: Metadata = { title: "Customer profile", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "demo") return <DemoProfile/>;
  // Staff, and anyone viewing an account for support, do not get the link button.
  const supportView = isStaffRole(user.role) || Boolean(await currentImpersonation());
  // No customer record, request, wallet or identifier is serialized into the RSC payload.
  // The authenticated workspace loads its private data through the encrypted browser transport.
  return (
    <>
      {isStaffRole(user.role) ? (
        <div className="admin-entry"><Link className="btn btn--ghost" href="/admin">Open admin dashboard</Link></div>
      ) : null}
      {supportView ? null : <div className="link-records-slot"><LinkRecords/></div>}
      <ProfileDashboard/>
    </>
  );
}
