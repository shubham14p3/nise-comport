import type { Metadata } from "next";
import AuthPanel from "@/components/auth-panel";
import { isDemoAuthEnabled } from "@/lib/auth";
export const metadata: Metadata = { title: "Sign in", description: "Sign in to your NISE COMPORT account to manage your profile and track requests.", robots: { index: false, follow: false } };
export default function LoginPage() { return <AuthPanel mode="signin" demoEnabled={isDemoAuthEnabled()}/>; }
