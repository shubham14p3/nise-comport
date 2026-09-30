import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminDashboard from "@/components/admin-dashboard";

export const metadata: Metadata = { title: "Staff dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["admin", "staff"].includes(user.role)) redirect("/profile");
  // Queue/customer data is deliberately not serialized into the server-component payload.
  return <AdminDashboard/>;
}
