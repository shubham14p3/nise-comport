import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata("Privacy Policy", "How NISE COMPORT collects, uses, shares, stores and deletes your personal information and documents, how we keep them safe, and your rights under Indian law.", "/privacy");

export default function PrivacyPage() {
  const phone = site.phones.primary.display;
  return <LegalPage path="/privacy" crumb="Privacy Policy" eyebrow="YOUR INFORMATION DESERVES CARE" title="Privacy" em="Policy." updated="October 2026"
    intro={<p>Your documents are personal. We handle them only to do the work you ask for, keep them as safely as we can, and delete them when they are no longer needed. This policy explains what we collect, why, who sees it and what you can do. It is written to meet the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, as they apply to us.</p>}
    sections={[
      { id: "who", title: "Who is responsible", body: <>
        <p><b>{site.name}</b>, {site.address.oneLine}, decides why and how your personal data is used, and is responsible for it. Contact: <a href={`mailto:${site.email}`}>{site.email}</a>, {phone}.</p></> },
      { id: "what", title: "What we collect", body: <>
        <ul>
          <li><b>Account details:</b> name, email, phone / WhatsApp number, address, city, state and PIN code, and a password (stored only as a one-way hash).</li>
          <li><b>Request details:</b> the service you ask for, the form answers you give, and notes.</li>
          <li><b>Documents you upload or hand over:</b> for example Aadhaar, PAN, photographs, certificates, bank or vehicle documents, as the service needs. We ask only for what the service needs.</li>
          <li><b>Payment records:</b> amount, date, method, payment or UPI reference and status. We do <b>not</b> receive or store your card number, UPI PIN or net-banking password.</li>
          <li><b>Messages:</b> emails, WhatsApp messages and chat with our assistant, and call notes.</li>
          <li><b>Technical data:</b> IP address, browser and device type, and pages visited, in security and server logs. Cookies are described below.</li>
          <li><b>Reviews and photos</b> you choose to share with us.</li>
        </ul>
        <p>We do not intentionally collect or store fingerprints, iris scans or other biometric data on this website.</p></> },
      { id: "why", title: "Why we use it", body: <>
        <ul>
          <li>To check, prepare and submit your request, and to contact the authority, bank, insurer or provider you asked us to deal with.</li>
          <li>To keep you updated about your request and payments by email, WhatsApp, SMS or call.</li>
          <li>To take payments, give receipts, handle refunds and keep accounts as the law requires.</li>
          <li>To keep your account and our systems secure, prevent fraud and misuse, and fix problems.</li>
          <li>To answer questions and complaints, and to improve our services.</li>
          <li>To send offers and updates, only where you have agreed. You can say STOP any time.</li>
          <li>To comply with the law and legal requests from authorities.</li>
        </ul>
        <p>We do not sell your personal data, and we do not use your documents for advertising.</p></> },
      { id: "consent", title: "Your consent and lawful use", body: <>
        <p>We use your data mainly because <b>you give it to us for a service and agree to its use for that purpose</b>. You can withdraw consent at any time; this does not affect what was done before, and we may not be able to continue a service that needs the data. We may also use data without consent where the law allows, for example to comply with the law, to respond to a medical or safety emergency, or for purposes you voluntarily gave the data for.</p>
        <p>Our services are for adults. If you are under 18, a parent or guardian must use the service for you and gives consent for you. We do not knowingly collect a child&rsquo;s data for any other purpose.</p></> },
      { id: "sharing", title: "Who we share it with", body: <>
        <p>We share data only as needed for your request and only with:</p>
        <ul>
          <li><b>Government departments, portals, banks, insurers and other providers</b> you ask us to deal with. They have their own privacy rules.</li>
          <li><b>Payment partners</b> (such as Razorpay or Cashfree) and your bank, to process online payments.</li>
          <li><b>Couriers</b>, for your name, address and phone number when we send a card or document.</li>
          <li><b>Service providers</b> that run our website and communications: hosting and database, email delivery, WhatsApp / Meta Business messaging, Google Maps and Places for address search and reviews, and analytics and search tools. They may process data only for us.</li>
          <li><b>Authorities</b> when the law requires us to, or to protect our rights or others&rsquo; safety.</li>
          <li><b>Staff</b> who need it to do their job. Access to private documents is limited to authorised staff.</li>
        </ul>
        <p>Some of these providers keep data on servers outside India. We choose reputable providers and share only what is needed. If our business changes hands, your data may pass to the new owner under this policy.</p></> },
      { id: "retention", title: "How long we keep it", body: <>
        <ul>
          <li><b>Uploaded documents:</b> deleted after <b>30 days</b>, or after the related request is completed or cancelled if that is later, unless the law or an ongoing dispute needs us to keep them.</li>
          <li><b>Request and payment records:</b> kept for as long as accounting, tax and other laws require and for handling disputes, then deleted or anonymised.</li>
          <li><b>Account details:</b> until you delete your account. Records we must keep for completed services are kept without your contact details.</li>
          <li><b>Sign-in codes and sessions:</b> short-lived; expired ones are removed automatically.</li>
          <li><b>WhatsApp and chat messages:</b> kept while useful for your service and support, then deleted.</li>
          <li><b>Server logs:</b> kept for a short period for security.</li>
        </ul></> },
      { id: "security", title: "How we protect it", body: <>
        <p>We use reasonable security practices: encrypted connections, passwords stored as one-way hashes, short-lived sign-in codes, limits on repeated failed attempts, private file storage, an encrypted channel between your browser and our servers, signed payment confirmations, and access rules so that staff see only what they need. No system is perfectly secure, and we cannot promise absolute security. You can help by keeping your password private, signing out on shared devices and never sharing OTPs.</p>
        <p>If a breach affects your personal data, we will tell you and the authorities as the law requires.</p></> },
      { id: "rights", title: "Your rights and choices", body: <>
        <p>Under Indian law you can ask us to: tell you what personal data we hold and how it is used; correct or complete it; erase it; and nominate someone to act for you if you cannot. You can also withdraw consent to messages and to data use, and make a complaint.</p>
        <ul>
          <li>View and correct your details in <b>Profile</b>; change your password or sign-in email; sign out of other devices.</li>
          <li>Delete your account under <b>Profile → Sign-in &amp; privacy</b>. This removes your name, email, phone and saved addresses.</li>
          <li>For anything else, email <a href={`mailto:${site.email}`}>{site.email}</a> or call {phone}. We may need to confirm who you are first. We reply within 30 days or sooner.</li>
        </ul>
        <p>Some data must be kept by law even after you ask for deletion; we will tell you what and why.</p></> },
      { id: "cookies", title: "Cookies and analytics", body: <>
        <p>We use cookies and similar storage that keep you signed in, protect forms and the site from attacks, and remember settings such as language. We may use privacy-friendly analytics and search tools to understand how the site is found and used; they are not used to sell your data. You can block cookies in your browser, but sign-in may then not work.</p></> },
      { id: "third-party", title: "Links and third-party sites", body: <>
        <p>Our pages link to official portals and other websites. We do not control them and are not responsible for their content or privacy practices. Please read their policies before you enter your details.</p></> },
      { id: "grievance", title: "Grievance officer and complaints", body: <>
        <p>Please raise a privacy concern with our Grievance Officer (the owner of NISE COMPORT) at <a href={`mailto:${site.email}`}>{site.email}</a> or {phone}. We acknowledge it within 48 hours and aim to resolve it within one month. If you are not satisfied, you may complain to the Data Protection Board of India once it is functioning, or to any other authority that has jurisdiction.</p></> },
      { id: "changes", title: "Changes to this policy", body: <>
        <p>We may update this policy as our services or the law change. The effective date at the top shows the latest version, and for important changes we will tell you on the website or by message.</p></> },
    ]}/>;
}
