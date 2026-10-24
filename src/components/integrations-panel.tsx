"use client";

import { useCallback, useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";

type Provider = "instagram" | "facebook" | "whatsapp" | "email";
type Status = { provider: Provider; configured: boolean; updatedAt: string | null };
const fields: Record<Provider, { name: string; keys: { id: string; label: string; secret?: boolean }[]; help: string }> = {
  instagram: { name: "Instagram", help: "Meta professional account and Page connection required for publishing.", keys: [
    { id: "appId", label: "Meta App ID" }, { id: "appSecret", label: "Meta App Secret", secret: true },
    { id: "accessToken", label: "Instagram access token", secret: true }, { id: "instagramUserId", label: "Instagram Business Account ID" },
  ] },
  facebook: { name: "Facebook", help: "Use a Page access token with the required approved Page permissions.", keys: [
    { id: "appId", label: "Meta App ID" }, { id: "appSecret", label: "Meta App Secret", secret: true },
    { id: "pageId", label: "Facebook Page ID" }, { id: "pageAccessToken", label: "Page access token", secret: true },
  ] },
  whatsapp: { name: "WhatsApp OTP", help: "Requires an approved Meta authentication template and Cloud API credentials.", keys: [
    { id: "token", label: "System-user access token", secret: true }, { id: "phoneId", label: "WhatsApp phone number ID" },
    { id: "template", label: "Approved OTP template name" }, { id: "language", label: "Template language (e.g. en)" },
  ] },
  email: { name: "Email OTP", help: "Use cPanel → Email Accounts → Connect Devices for SMTP details.", keys: [
    { id: "host", label: "SMTP host" }, { id: "port", label: "SMTP port (465 or 587)" },
    { id: "user", label: "SMTP username" }, { id: "password", label: "SMTP password", secret: true },
    { id: "from", label: "From email address" },
  ] },
};
export default function IntegrationsPanel() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [provider, setProvider] = useState<Provider>("instagram");
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    const result = await secureApi<{ integrations: Status[] }>("I8n3T5gR2sV7", {});
    setStatuses(result.integrations);
  }, []);
  useEffect(() => { void load().catch(() => setNotice("Unable to load integrations. Check the server configuration.")); }, [load]);
  const current = fields[provider];
  async function submit(action: "save" | "delete") {
    if (action === "delete" && !window.confirm("Remove this provider's stored credentials?")) return;
    setBusy(true); setNotice("");
    try {
      await secureApi("I4n9S6vC1pT8", { provider, action, ...(action === "save" ? { credentials: values } : {}) });
      setValues({});
      await load();
      setNotice(action === "save" ? "Credentials encrypted and saved. Provider connection is not yet verified." : "Stored credentials removed.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save credentials."); }
    finally { setBusy(false); }
  }
  return <section className="panel" style={{ maxWidth: 850 }}>
    <h2>Integrations &amp; credentials</h2>
    <p>Only the owner can manage these settings. Stored secrets are never returned to the browser. Leave a field blank to retain its saved value.</p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "18px 0" }}>
      {(Object.keys(fields) as Provider[]).map(key => <button type="button" key={key} className={provider === key ? "btn btn--primary btn--sm" : "btn btn--ghost btn--sm"} onClick={() => { setProvider(key); setValues({}); setNotice(""); }}>
        {fields[key].name} · {statuses.find(item => item.provider === key)?.configured ? "Saved" : "Not set"}
      </button>)}
    </div>
    <h3>{current.name}</h3><p>{current.help}</p>
    <form onSubmit={event => { event.preventDefault(); void submit("save"); }} autoComplete="off">
      <div style={{ display: "grid", gap: 14, margin: "16px 0" }}>
        {current.keys.map(field => <label key={field.id} style={{ display: "grid", gap: 5 }}>
          <span>{field.label}</span>
          <input className="input" type={field.secret ? "password" : "text"} value={values[field.id] ?? ""} placeholder={field.secret ? "Leave blank to keep saved secret" : "Enter value"} onChange={event => setValues(old => ({ ...old, [field.id]: event.target.value }))} maxLength={4096} />
        </label>)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button className="btn btn--primary" disabled={busy || !Object.values(values).some(Boolean)} type="submit">Save encrypted credentials</button>
        {statuses.find(item => item.provider === provider)?.configured && <button className="btn btn--ghost" disabled={busy} type="button" onClick={() => void submit("delete")}>Remove credentials</button>}
      </div>
    </form>
    {notice && <p role="status" style={{ marginTop: 12 }}>{notice}</p>}
    <p style={{ marginTop: 20, fontSize: 13 }}>Encryption master key must be configured in cPanel as INTEGRATIONS_ENCRYPTION_KEY. Saving credentials does not grant Meta permissions or activate publishing automatically.</p>
  </section>;
}
