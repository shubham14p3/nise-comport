import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import WelcomeLinks from "@/components/welcome-links";
import WelcomeLeadForm from "@/components/welcome-lead-form";
import { qrWelcomeMessages, site, whatsappLink } from "@/lib/site";

// A scan landing page, not something to find on Google.
export const metadata: Metadata = { title: "Welcome to NiSE COMPORT", robots: { index: false, follow: true } };

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  const { src } = await searchParams;
  const brochures = qrWelcomeMessages();
  return <main className="content-page"><SiteHeader/>
    <section className="container welcome">
      <h1>Welcome to NiSE COMPORT</h1>
      <p className="welcome__sub">स्वागत है · স্বাগতম</p>
      <p>Thank you for scanning. We are a CSC / Pragya Kendra in Kharangajhar, Telco. Tell us what you need and our team will reply.</p>
      <WelcomeLinks source={src}
        email={site.email}
        subject="Hello from your QR code"
        body="Hi NiSE COMPORT, I scanned your QR code. I need help with: "
        waHref={whatsappLink("Hi NiSE COMPORT, I scanned your QR code. Please send me your services, hours and contact details.")}
        loginHref="/login"/>
      <section className="welcome__brochure" aria-label="Shop WhatsApp welcome information">
        <h2>Our services, contact and shop timings</h2>
        <p>View the complete information here. To receive these as two separate business WhatsApp messages, send the prefilled QR enquiry. Automatic replies require NiSE COMPORT’s official WhatsApp Cloud API to be active.</p>
        {brochures.map((message, index) => <article className="pan-card" key={index}><h3>{index === 0 ? "Services and contact" : "Shop address, timings and social accounts"}</h3>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit" }}>{message}</pre>
        </article>)}
      </section>
      <WelcomeLeadForm source={src}/>
      <p className="welcome__hint">For our own records we count QR scans and button taps, with your device type. We do not record your name or number from a scan, only if you fill in the call-back box above. See our <Link prefetch={false} href="/privacy">privacy policy</Link>.</p>
      <p className="welcome__hint">Sign in with your email and mobile number to get a ₹50 welcome balance (₹30 + ₹20) for bike and car insurance.</p>
    </section>
  </main>;
}
