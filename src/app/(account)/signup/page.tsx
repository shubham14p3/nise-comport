import type { Metadata } from "next";
import AuthPanel from "@/components/auth-panel";
export const metadata: Metadata = { title: "Create your account", description: "Create your NISE COMPORT account with secure email verification.", robots: { index: false, follow: false } };
export default function SignupPage() { return <AuthPanel mode="signup"/>; }
