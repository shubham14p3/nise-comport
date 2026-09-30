import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { faqLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata("FAQs: Fees, Tracking, Documents & Privacy", "Answers about NISE COMPORT services in Telco, Jamshedpur: fees, what to bring, request tracking, document uploads, privacy, printing and accounts.", "/faq");

const groups: { heading: string; items: { question: string; answer: string }[] }[] = [
  { heading: "About NISE COMPORT", items: [
    { question: "Is NISE COMPORT a government office?", answer: "No. NISE COMPORT is an independent CSC / Pragya Kendra service centre that helps customers access government and digital services. Final decisions belong to the relevant authority." },
    { question: "Where are you located?", answer: `${site.address.oneLine}. Open Google Maps from the Contact page for directions.` },
    { question: "Which areas do you serve?", answer: "Walk-in customers come from Kharangajhar, Telco, Govindpur, Birsanagar, Golmuri, Sakchi, Mango and across Jamshedpur. Online requests can be sent from anywhere." },
    { question: "Can I talk to someone in Hindi?", answer: "Yes. Our team speaks Hindi and English, and key pages are available in Hindi at /hi." },
  ] },
  { heading: "Fees and approvals", items: [
    { question: "Are government fees included in your service charge?", answer: "No. We explain our service charge separately from any government, portal or third-party fee. The receipt should identify the charges collected." },
    { question: "Can you guarantee application approval?", answer: "No. Approval, processing time and decisions are controlled by the relevant government department, company or service provider." },
    { question: "Do you take online payment?", answer: "No payment is taken on this website. The team confirms any charge before work starts and you pay at the desk." },
  ] },
  { heading: "Requests and tracking", items: [
    { question: "How can I track a request?", answer: "Sign in to your customer profile to see request references and status updates. We also email you when the status changes. Keep any acknowledgement number issued by the official portal." },
    { question: "Can I cancel a request?", answer: "Yes, while it is submitted, being reviewed or waiting for you. Open the request in your profile and choose “Cancel this request”. After that stage, call or WhatsApp the desk." },
    { question: "I didn’t get the email code. What should I do?", answer: "Check spam or promotions, wait a minute and use “Resend code”. Only the newest code works, and each code expires after 10 minutes." },
    { question: "I forgot my password.", answer: "Use “Forgot password?” on the sign-in page. We email a 6-digit code; after you set a new password, every device is signed out for safety." },
  ] },
  { heading: "Documents, privacy and printing", items: [
    { question: "How does online printing work?", answer: "Upload your document, select pages and print preferences, review the estimate, and choose pickup or delivery. We confirm the file and availability before printing." },
    { question: "How long are uploaded documents kept?", answer: "Files are stored privately for service fulfilment and are scheduled for deletion after the retention period (30 days by default, longer only while a request is still open). Avoid uploading documents that are not needed for your request." },
    { question: "Should I share OTPs or PINs with staff?", answer: "Never. Enter OTPs, PINs and passwords yourself, only in the official process you started. Our staff will never ask for them." },
    { question: "Can I delete my account?", answer: "Yes. Go to Profile → Sign-in & privacy → Delete account. Open requests must be completed or cancelled first." },
  ] },
];

export default function FaqPage() {
  const all = groups.flatMap((group) => group.items);
  return <main className="content-page"><SiteHeader/>
    <section className="content-hero"><div className="container"><Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "FAQs", path: "/faq" }]}/><Link href="/" className="back-small"><ArrowLeft size={14}/> Home</Link><span className="eyebrow eyebrow-muted">GOOD QUESTIONS, CLEAR ANSWERS</span><h1>Frequently asked<br/><em>questions.</em></h1></div></section>
    {groups.map((group) => <section className="container faq-list" key={group.heading}><h2>{group.heading}</h2>{group.items.map((item) => <details key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</section>)}
    <JsonLd data={faqLd(all)}/>
  </main>;
}
