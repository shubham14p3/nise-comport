import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminDashboard from "@/components/admin-dashboard";
import Link from "next/link";
import { hasPermission, permissionsOf } from "@/lib/permissions";
import { isStaffRole } from "@/lib/staff-routes";

export const metadata: Metadata = { title: "Staff dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isStaffRole(user.role)) redirect("/profile");
  // Queue/customer data is deliberately not serialized into the server-component payload;
  // only the signed-in person's name, role and permissions (which tabs to show).
  const { view } = await searchParams;
  // Only the owner can switch; a real staff account always sees its normal staff view.
  const viewAsStaff = user.role === "admin" && view === "staff";
  // Shown to the owner and to staff the owner has given the "counter" permission.
  const counterLink = hasPermission(user, "counter");
  return <>
    {counterLink && <nav aria-label="Counter" style={{ padding: "10px 16px" }}>
      <Link className="btn btn--primary btn--sm" href="/desk/counter">Counter desk</Link>
    </nav>}
    <AdminDashboard me={{ id: user.id, name: user.name, role: user.role, permissions: permissionsOf(user) }} viewAsStaff={viewAsStaff}/>
  </>;
}
