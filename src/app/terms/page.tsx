import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata("Terms and Conditions", "The terms for using NISE COMPORT, an independent CSC / Pragya Kendra service centre in Jamshedpur: what we do, fees, payments, your responsibilities, liability and how disputes are handled.", "/terms");

export default function TermsPage() {
  const phone = site.phones.primary.display;
  return <LegalPage path="/terms" crumb="Terms and Conditions" eyebrow="PLEASE READ BEFORE USING OUR SERVICES" title="Terms and" em="Conditions." updated="October 2026"
    intro={<p>These Terms and Conditions apply to your use of the NISE COMPORT website, WhatsApp chat and our service centre at {site.address.oneLine}. By creating an account, sending a request, paying us or using the website, you agree to them. If you do not agree, please do not use our services. These terms set out what you can expect from us and what we expect from you.</p>}
    sections={[
      { id: "who-we-are", title: "Who we are and what we do", body: <>
        <p>NISE COMPORT is an <b>independent CSC / Pragya Kendra service centre</b> in Kharangajhar, Telco, Jamshedpur, Jharkhand. We help individuals and small businesses with online forms and applications, documents, certificates, banking and payment assistance (including AEPS and bill payments), insurance paperwork, printing, scanning and photo services, and computer and IT hardware, repair and accessories.</p>
        <p><b>We are not a government department, bank, insurer, court, election office or any other authority.</b> Names such as CSC, Pragya Kendra, Digital India, Aadhaar, PAN, DigiLocker, Voter ID, Udyam or Passport belong to their owners. We use them only to describe the services we help customers use. We act as a facilitator between you and the relevant authority, portal or provider.</p></> },
      { id: "your-account", title: "Your account", body: <>
        <p>You must give true, complete and current details when you create an account or send a request. You are responsible for keeping your sign-in details safe and for everything done through your account. Tell us at once if you think someone else has used it. You must be at least 18 years old to create an account; a parent or guardian may use our services on behalf of a child and takes responsibility for the information given.</p>
        <p>We may suspend or close an account that gives false information, is used unlawfully, abuses our staff or breaks these terms.</p></> },
      { id: "requests", title: "Requests and how we work", body: <>
        <p>Sending a request is not a promise that we will accept it. We first check your details and documents. Where we need more information we will contact you by call, WhatsApp or email. Our service charge, any government or third-party fee, and any courier or printing cost are communicated to you where we can before work starts. Work begins once the charge is agreed and, where we ask for it, paid.</p>
        <p>We prepare and submit what you ask for using the details and documents you give us. You authorise us to enter that information on the relevant portal, to talk to the authority, insurer or bank on your behalf where the process allows, and to collect documents for the purpose of your request only.</p></> },
      { id: "your-responsibilities", title: "Your responsibilities", body: <>
        <ul>
          <li>Provide complete and accurate information and valid, genuine documents that belong to you or that you are allowed to share.</li>
          <li>Check the details in every form, draft or preview before we submit. Once submitted, many portals do not allow edits, and corrections may take extra time and cost.</li>
          <li>Keep any acknowledgement, application number, receipt or password issued to you.</li>
          <li>Respond quickly when we ask for more information. A request that waits for you for a long time may be closed.</li>
          <li>Never share OTPs, UPI PINs, card details or passwords with anyone. We will never ask for your UPI PIN or card number. We may ask you to enter an OTP yourself, or to read out one that you received for the official process you asked us to complete, only when that process requires it.</li>
        </ul></> },
      { id: "fees", title: "Fees and charges", body: <>
        <p>Our <b>service charge</b> is separate from <b>government, portal, bank, insurer, courier, printing and other third-party fees</b>. We show them separately wherever we can. Charges on our <Link href="/pricing">Pricing</Link> page are typical amounts; the exact charge for your request is confirmed to you first. If we have not published a price for a service, we will quote it after checking your case.</p>
        <p>Offers, promo codes, coupons and wallet credit reduce <b>our service charge only</b>, never government or third-party fees, and are subject to the terms shown with each offer. We may end or change an offer at any time, but not for a request already accepted on those terms.</p>
        <p>We do not charge GST separately unless we are registered for it and tell you so in writing.</p></> },
      { id: "payments", title: "Payments", body: <>
        <p>You can pay at our desk in cash or UPI, by the free UPI QR on your request&rsquo;s payment page, or, where available, through an online payment partner such as Razorpay or Cashfree. These partners are licensed payment providers; your card, UPI PIN and bank login details are handled only by them and your bank and are never seen or stored by us.</p>
        <ul>
          <li><b>UPI QR:</b> there is no extra charge. Because we confirm each payment manually against our bank record, it can take some time. Entering a wrong or reused reference number may delay confirmation.</li>
          <li><b>Online payment:</b> a payment-processing fee, shown before you pay, is added to cover the gateway&rsquo;s charges. Instant confirmation is provided by the payment partner, not by us.</li>
          <li>A request moves to the next step only after the payment is confirmed. A payment is final when it is shown as received on your request.</li>
          <li>If money has left your account but your payment shows as pending or failed, wait 24 hours (banks often reverse failed payments on their own), and then raise a ticket from your payment page. We will check with the payment provider.</li>
        </ul>
        <p>Refunds and cancellations are covered in our <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link>.</p></> },
      { id: "no-guarantee", title: "Approvals, timelines and third parties", body: <>
        <p>Approvals, rejections, processing times, fees and rules are decided by the relevant department, bank, insurer or provider, not by us. We <b>cannot guarantee</b> approval, a particular date or the availability of any third-party portal, which may be slow, changed or unavailable. Where a portal, courier or provider causes a delay, loss or error, we will help you follow it up but we are not responsible for their acts.</p>
        <p>Information on our website, guides and chat is general guidance only and is not legal, tax, financial or insurance advice. Official rules change; always check the official source. Where you rely on a deadline, tell us early.</p></> },
      { id: "special-services", title: "Services with extra conditions", body: <>
        <h3>Banking, AEPS and bill payments</h3>
        <p>Cash and transfer services are provided through the banking partners and rules applicable to our centre. Transaction limits, charges, failures and reversals follow those partners&rsquo; and the banks&rsquo; rules. Keep your slip. A failed transaction that debited your account is normally reversed by the bank within the period set by banking rules.</p>
        <h3>Insurance</h3>
        <p>Policies are issued by insurers; we help with comparison, forms, documents and renewals. Premiums, cover, exclusions, claims and renewals are decided by the insurer. Please read the policy wording. Disclose every relevant fact truthfully; wrong information can lead to a rejected claim.</p>
        <h3>Printing, scanning and photos</h3>
        <p>Print estimates depend on your selections and may change after we check the file. Please check spelling and layout in proofs before printing. Work done as you approved cannot be refunded, but we will reprint or refund an order with a fault that is ours. Files you upload are kept only as described in the <Link href="/privacy">Privacy Policy</Link>.</p>
        <h3>Computers, IT products and repair</h3>
        <p>Diagnosis, parts and repair charges are quoted before work. Products carry the manufacturer&rsquo;s warranty, if any, and are subject to its terms. Please <b>back up your data</b> before giving a device for repair; we are not responsible for data loss except as the law requires. Please collect repaired devices within 30 days of our &ldquo;ready&rdquo; message; after that we may charge reasonable storage and cannot be responsible for the device.</p></> },
      { id: "acceptable-use", title: "Acceptable use", body: <>
        <p>You must not: give false or forged documents or identity; use our services for anything unlawful, including money laundering, impersonation or cheating a government scheme; upload documents of another person without their permission; harass or threaten our staff; misuse promo codes, offers or the wallet; try to break, scrape, overload or test the security of our website; or send spam through our channels. We may refuse or stop a request, and may report suspected unlawful activity to the authorities as the law requires.</p></> },
      { id: "messages", title: "Calls, WhatsApp and email", body: <>
        <p>By sending a request or giving us your number, you agree that we may contact you by call, SMS, WhatsApp and email about your request, payments and account. For offers and updates we ask for your consent; you can reply STOP on WhatsApp or tell us to stop at any time. We may use an automated assistant on WhatsApp to answer common questions and pass other messages to our team; chats are saved so our staff can follow up.</p></> },
      { id: "wallet-coupons", title: "Wallet credit and coupons", body: <>
        <p>Wallet credit and coupons have no cash value, cannot be transferred or sold, and can be used only toward our service charges or print totals as the offer allows. Credit given as a refund stays in your account until used. We may withdraw credit or coupons obtained by misuse or by error.</p></> },
      { id: "intellectual-property", title: "Our website and content", body: <>
        <p>The website, its design, text, guides and logo belong to NISE COMPORT or are used with permission. You may view and use them for your own personal purposes, but not copy, resell or republish them without our written permission. Third-party names and logos remain with their owners.</p></> },
      { id: "liability", title: "Disclaimers and limits of liability", body: <>
        <p>We take care over our work, but our services depend on information from you and on third parties. To the fullest extent the law allows: the website and our guidance are provided &ldquo;as is&rdquo;; we are not liable for losses caused by wrong information or documents you gave us, by third-party portals, banks, insurers, couriers or networks, or by events outside our control such as power or internet failure, strikes, natural events or changes in law; and we are not liable for indirect or consequential loss, loss of profit or opportunity.</p>
        <p>Where we are found responsible for a loss in connection with a request, our total liability for that request is limited to the amount of service charge you paid us for it, <b>except</b> where the law does not allow a limit, for example for fraud or wilful wrongdoing, or death or personal injury. <b>Nothing in these terms takes away your rights as a consumer under the Consumer Protection Act, 2019 or any other law.</b></p>
        <p>You agree to compensate us for loss caused by your giving false information or documents, or by your breaking these terms or the law.</p></> },
      { id: "complaints", title: "Complaints and grievance officer", body: <>
        <p>We want to put things right. Please first tell us at the centre, by phone or WhatsApp on {phone}, or by email at <a href={`mailto:${site.email}`}>{site.email}</a>, with your request reference. Our <b>Grievance Officer</b> is the owner of NISE COMPORT, reachable at the same email and phone. We acknowledge a complaint within 48 hours and aim to resolve it within one month. If you remain unsatisfied, you may approach the consumer commission or other authority that has jurisdiction.</p></> },
      { id: "changes", title: "Changes to the website and these terms", body: <>
        <p>We may change, pause or stop any part of the website or services, and may update these terms. The effective date at the top shows the latest version. Using our services after a change means you accept it; for a request already accepted, the terms that applied when you sent it continue to apply.</p></> },
      { id: "general", title: "Governing law and general terms", body: <>
        <p>These terms are governed by the laws of India. Subject to your rights as a consumer, the courts at <b>Jamshedpur, Jharkhand</b> have jurisdiction. If any part of these terms is found unenforceable, the rest continue. Our failing to enforce a term is not a waiver of it. These terms, with the Privacy Policy, Refund &amp; Cancellation Policy and the price or offer shown for your request, are the whole agreement between you and us about our services. You may not transfer your rights under them. Electronic records, including emails, chats and payment records, may be used as evidence of what was agreed.</p></> },
      { id: "contact", title: "Contact", body: <>
        <p><b>{site.name}</b><br/>{site.address.oneLine}<br/>Phone / WhatsApp: {phone}<br/>Email: <a href={`mailto:${site.email}`}>{site.email}</a></p></> },
    ]}/>;
}
