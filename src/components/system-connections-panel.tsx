"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleHelp, CreditCard, Mail, MessageCircle, RefreshCw, Settings2, ShieldAlert, Video } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";
import IntegrationsPanel from "@/components/integrations-panel";

type State = { configured: boolean; checked: boolean; state: string; lastSavedAt?: string | null };
type Snapshot = {
  vaultReady: boolean;
  integrations: Record<string, State>;
  delivery: { sms: boolean; whatsappOtp: boolean; smtpEnvironment: boolean };
  payments: { upi: boolean; upiAccounts: number; razorpay: boolean; razorpayWebhook: boolean;
    cashfree: boolean; cashfreeWebhook: boolean; cashfreeEnvironment: string; onlineFeePercent: number };
};
type Provider = "instagram" | "facebook" | "whatsapp" | "email";

const services: { id: string; title: string; hint: string }[] = [
  { id: "instagram", title: "Instagram", hint: "Meta professional publishing; requires an approved account and permissions" },
  { id: "facebook", title: "Facebook", hint: "Page publishing via Meta permissions" },
  { id: "whatsapp", title: "WhatsApp Cloud API", hint: "Verify Meta API token and phone ID; message delivery needs separate testing" },
  { id: "email", title: "Email SMTP", hint: "SMTP login validation; send a real email to test delivery" },
  { id: "youtube", title: "YouTube", hint: "No YouTube API publishing integration exists yet" },
];

export default function SystemConnectionsPanel() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState("");
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; detail: string }>>({});
  const [configure, setConfigure] = useState(false);

  const load = useCallback(async () => {
    try { setData(await secureApi<Snapshot>("S1y4H8nP6vC3")); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load connection status."); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]); // only mounts in owner connection tab

  async function test(provider: Provider) {
    setTesting(provider);
    try {
      const result = await secureApi<{ ok: boolean; message?: string; error?: string }>("I2t7V4mC9nK5", { provider });
      setTestResult((values) => ({ ...values, [provider]: { ok: result.ok === true, detail: result.message ?? result.error ?? "Check finished." } }));
    } catch (e) {
      setTestResult((values) => ({ ...values, [provider]: { ok: false, detail: e instanceof Error ? e.message : "Connection check failed." } }));
    } finally { setTesting(""); }
  }
  const readiness = (ok: boolean) => <span className={ok ? "status-pill status-pill--done" : "status-pill status-pill--warn"}>{ok ? "Configured" : "Not configured"}</span>;
  return <section className="admin-system">
    <div className="admin-panel-title"><div><span className="admin-eyebrow"><Settings2 size={14}/> Owner settings</span><h2>System &amp; connections</h2>
      <p>See which integrations are configured and test credentials on demand. Saving keys does not confirm that a live service is healthy.</p></div>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => void load()}><RefreshCw size={15}/> Refresh configuration</button>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!data && !error && <p>Reading server configuration…</p>}
    {data && <>
      {!data.vaultReady && <div className="alert alert--warn"><ShieldAlert size={16}/> Integration vault key is missing in the backend. Set INTEGRATIONS_ENCRYPTION_KEY in your private cPanel environment before saving credentials.</div>}
      <div className="admin-system__grid">{services.map((service) => {
        const status = data.integrations[service.id];
        const live = testResult[service.id];
        return <article className="admin-system__card" key={service.id}>
          <div className="admin-system__card-title"><b>{service.title}</b>{service.id === "youtube" ? <span className="status-pill">Coming soon</span> : live ? <span className={live.ok ? "status-pill status-pill--done" : "status-pill status-pill--warn"}>{live.ok ? "Token test passed" : "Test failed"}</span> : readiness(Boolean(status?.configured))}</div>
          <p>{service.hint}</p>
          {status?.lastSavedAt && <small>Credentials last saved: {new Date(status.lastSavedAt).toLocaleDateString("en-IN")}</small>}
          {live && <p className={live.ok ? "admin-system__ok" : "admin-system__error"}>{live.detail}</p>}
          {service.id !== "youtube" && status?.configured && <button className="btn btn--ghost btn--sm" type="button" disabled={Boolean(testing)} onClick={() => void test(service.id as Provider)}>{testing === service.id ? "Testing…" : "Test credentials"}</button>}
        </article>;
      })}</div>
      <p className="field__hint"><CircleHelp size={14}/> A Meta API ID check validates the token/account, not publishing, WhatsApp message delivery or webhook callbacks. Test end-to-end separately before marking a connection operational.</p>
      <div className="admin-system__section">
        <h3><MessageCircle size={17}/> Messaging readiness</h3>
        <div className="admin-system__status"><span>SMS OTP</span>{readiness(data.delivery.sms)}<span>WhatsApp OTP</span>{readiness(data.delivery.whatsappOtp)}<span>Server SMTP environment</span>{readiness(data.delivery.smtpEnvironment)}</div>
      </div>
      <div className="admin-system__section">
        <h3><CreditCard size={17}/> Payment configuration</h3>
        <p>Payment credentials are private server-side values in cPanel. Adding them to a browser form without a secure backend would expose sensitive keys. The existing payment and webhook integrations are preserved.</p>
        <div className="admin-system__status">
          <span>Business UPI IDs ({data.payments.upiAccounts})</span>{readiness(data.payments.upi)}
          <span>Razorpay keys</span>{readiness(data.payments.razorpay)}
          <span>Razorpay webhook secret</span>{readiness(data.payments.razorpayWebhook)}
          <span>Cashfree keys ({data.payments.cashfreeEnvironment})</span>{readiness(data.payments.cashfree)}
          <span>Cashfree webhook secret</span>{readiness(data.payments.cashfreeWebhook)}
        </div>
        <details className="admin-accordion"><summary>Where to configure payment gateways</summary>
          <div className="admin-system__instructions">
            <p><b>UPI:</b> cPanel environment → UPI_ID, UPI_ID_2, UPI_ID_3, UPI_PAYEE_NAME.</p>
            <p><b>Razorpay:</b> RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET. Configure your Razorpay webhook to /api/webhooks/razorpay.</p>
            <p><b>Cashfree:</b> CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV, CASHFREE_WEBHOOK_SECRET. Configure your Cashfree webhook to /api/webhooks/cashfree.</p>
            <p>Start in gateway sandbox; test a payment and webhook acknowledgement before using real transactions. Changes to environment variables require a Node.js restart.</p>
          </div>
        </details>
      </div>
      <div className="admin-system__section">
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setConfigure((open) => !open)} aria-expanded={configure}><Settings2 size={15}/>{configure ? "Close credential manager" : "Configure Instagram, Facebook, WhatsApp or email"}</button>
        {configure && <IntegrationsPanel/>}
      </div>
    </>}
    <p className="field__hint"><Mail size={14}/><CheckCircle2 size={14}/><Video size={14}/> Staff and customers never receive the owner credentials response.</p>
  </section>;
}
