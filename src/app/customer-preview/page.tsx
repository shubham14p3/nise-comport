import { redirect } from "next/navigation";
import CustomerPreviewWorkspace from "@/components/customer-preview-workspace";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customer preview · NiSE COMPORT", robots: { index: false, follow: false } };
export default async function CustomerPreviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/profile");
  return <CustomerPreviewWorkspace/>;
}
