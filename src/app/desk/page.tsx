import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminDashboard from "@/components/admin-dashboard";
import { permissionsOf } from "@/lib/permissions";
import { publishedServiceDetails } from "@/lib/services";
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
  // Service list for the Counter desk popup (public service names only).
  const services = publishedServiceDetails.map((service) => ({ slug: service.slug, title: service.title }));
  return <AdminDashboard me={{ id: user.id, name: user.name, role: user.role, permissions: permissionsOf(user) }} viewAsStaff={viewAsStaff} services={services}/>;
}
