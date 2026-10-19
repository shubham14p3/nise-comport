import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import MailClient from "@/components/mail-client";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Messages", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Customer message centre. Not linked from the public menu. Anyone who is not signed in is sent to sign-up;
 * staff with the Messages permission work in the staff desk, where the same screen is the "Messages" tab.
 */
export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signup");
  if (user.role === "demo") redirect("/profile");
  if (hasPermission(user, "mail")) redirect("/desk#mail");
  // No ticket, name or file is placed in the page itself; everything loads over the encrypted channel.
  return <main className="page page--app mbx-page"><SiteHeader/>
    <div className="container mbx-page__inner"><MailClient mode="customer"/></div>
  </main>;
}
