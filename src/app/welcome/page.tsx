import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import WelcomeLinks from "@/components/welcome-links";
import WelcomeLeadForm from "@/components/welcome-lead-form";
import { qrWelcomeMessage, site, whatsappLink } from "@/lib/site";

// A scan landing page, not something to find on Google.
export const metadata: Metadata = { title: "Welcome to NISE COMPORT", robots: { index: false, follow: true } };

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  const { src } = await searchParams;
  return <main className="content-page"><SiteHeader/>
    <section className="container welcome">
      <h1>Welcome to NISE COMPORT</h1>
      <p className="welcome__sub">स्वागत है · স্বাগতম</p>
      <p>Thank you for scanning. We are a CSC / Pragya Kendra in Kharangajhar, Telco. Tell us what you need and our team will reply.</p>
      <WelcomeLinks source={src}
        email={site.email}
        subject="Hello from your QR code"
        body="Hi NISE COMPORT, I scanned your QR code. I need help with: "
        waHref={whatsappLink("Hi NISE COMPORT, I scanned your QR code.")}
        loginHref="/login"/>
      <details className="welcome__brochure"><summary>Shop services, contact details, timings and social profiles</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit" }}>{qrWelcomeMessage()}</pre></details>
      <WelcomeLeadForm source={src}/>
      <p className="welcome__hint">For our own records we count QR scans and button taps, with your device type. We do not record your name or number from a scan, only if you fill in the call-back box above. See our <Link href="/privacy">privacy policy</Link>.</p>
      <p className="welcome__hint">Sign in with your email and mobile number to get a ₹50 welcome balance (₹30 + ₹20) for bike and car insurance.</p>
    </section>
  </main>;
}
