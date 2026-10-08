"use client";

import { FormEvent, useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";
import EmailPeoplePicker from "@/components/email-people-picker";

type Campaign = { id: string; subject: string; status: string; sendAt: string | null; total: number; sentCount: number; failedCount: number; hasImage: boolean; createdAt: string; createdBy: string | null };
type Listing = { campaigns: Campaign[]; eligible: number; dailyLimit: number };
const STATUS: Record<string, string> = { draft: "Draft", scheduled: "Scheduled", sending: "Sending", done: "Sent", cancelled: "Cancelled" };
const MAX_BYTES = 300 * 1024;

/** Email campaigns: only to contacts who said YES and have an email. Each email has an unsubscribe link. */
export default function EmailCampaignsPanel() {
  const [data, setData] = useState<Listing | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<{ type: string; data: string; name: string } | null>(null);
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [audience, setAudience] = useState<"yes" | "selected">("yes");
  const [picked, setPicked] = useState<string[]>([]);

  async function load() {
    try { setData(await secureApi<Listing>("Em4ilLis2tQ", {})); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load campaigns."); }
  }
  useEffect(() => {
    void (async () => {
      try { setData(await secureApi<Listing>("Em4ilLis2tQ", {})); }
      catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load campaigns."); }
    })();
  }, []);

  function pickImage(file: File | undefined) {
    setError("");
    if (!file) { setImage(null); return; }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Use a PNG, JPG or WebP image."); return; }
    if (file.size > MAX_BYTES) { setError("This image is larger than 300 KB. Save it smaller (for example, export at 600 px wide) and try again."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      setImage({ type: file.type, data: result.split(",")[1] ?? "", name: file.name });
    };
    reader.readAsDataURL(file);
  }

  async function create(event: FormEvent, schedule: boolean) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const created = await secureApi<{ id: string }>("Em4ilAct3ion", { action: "create", subject, body, image: image ? { type: image.type, data: image.data } : undefined, audience, audienceIds: audience === "selected" ? picked : undefined });
      if (schedule) {
        const sendAt = when ? new Date(when).toISOString() : null;
        const result = await secureApi<{ total: number }>("Em4ilAct3ion", { action: "schedule", id: created.id, sendAt });
        setNotice(`Scheduled for ${result.total} people${sendAt ? ` at ${new Date(sendAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` : " (next run)"}.`);
      } else {
        setNotice("Saved as a draft.");
      }
      setSubject(""); setBody(""); setImage(null); setWhen(""); setPicked([]);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the campaign."); }
    finally { setBusy(false); }
  }

  async function cancel(id: string) {
    setBusy(true); setError("");
    try { await secureApi("Em4ilAct3ion", { action: "cancel", id }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not cancel."); }
    finally { setBusy(false); }
  }

  return <section className="admin-queue email-campaigns" aria-labelledby="email-campaigns-title">
    <h3 id="email-campaigns-title">Email campaigns</h3>
    <p className="field__hint">Sent only to contacts who said YES and have an email address{data ? ` (${data.eligible.toLocaleString("en-IN")} people right now)` : ""}. Every email has an unsubscribe link. Up to {data?.dailyLimit ?? 200} emails a day.</p>
    <form className="email-campaigns__form" onSubmit={(event) => void create(event, true)}>
      <fieldset className="email-audience">
        <legend>Who gets it</legend>
        <label className="check"><input type="radio" name="audience" checked={audience === "yes"} onChange={() => setAudience("yes")}/> Everyone who said YES{data ? ` (${data.eligible.toLocaleString("en-IN")})` : ""}</label>
        <label className="check"><input type="radio" name="audience" checked={audience === "selected"} onChange={() => setAudience("selected")}/> Only the people I pick below ({picked.length} picked, and only those who said YES)</label>
      </fieldset>
      <label>Subject<input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} required/></label>
      <label>Message<textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} maxLength={5000} required placeholder="Write the message. Leave a blank line between paragraphs."/></label>
      <label>Poster or photo (optional, up to 300 KB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => pickImage(e.target.files?.[0])}/></label>
      {image ? <p className="field__hint">Image: {image.name} <button type="button" className="profile-text-button" onClick={() => setImage(null)}>Remove</button></p> : null}
      <label>Send at (leave empty to send at the next run)<input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}/></label>
      <div className="email-campaigns__actions">
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={(e) => void create(e as unknown as FormEvent, false)}>Save as draft</button>
        <button className="btn btn--primary" disabled={busy}>{busy ? "Saving…" : when ? "Schedule" : "Send at next run"}</button>
      </div>
    </form>
    <EmailPeoplePicker picked={picked} onChange={setPicked} onAsked={() => void load()}/>
    {error ? <div className="alert alert--error" role="alert">{error}</div> : null}
    {notice ? <div className="alert alert--success" role="status">{notice}</div> : null}
    {data && data.campaigns.length ? <ul className="email-campaigns__list">
      {data.campaigns.map((campaign) => <li key={campaign.id}>
        <div><b>{campaign.subject}</b> <span className={`email-status email-status--${campaign.status}`}>{STATUS[campaign.status] ?? campaign.status}</span></div>
        <small>{campaign.sendAt ? `Send ${new Date(campaign.sendAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` : "Created"} · {campaign.total} people · {campaign.sentCount} sent · {campaign.failedCount} failed{campaign.hasImage ? " · with image" : ""}</small>
        {campaign.status === "draft" || campaign.status === "scheduled" ? <button type="button" className="profile-text-button" disabled={busy} onClick={() => void cancel(campaign.id)}>Cancel</button> : null}
      </li>)}
    </ul> : null}
  </section>;
}
