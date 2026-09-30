"use client";
import { FormEvent, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload } from "lucide-react";
import { newIdempotencyKey } from "@/lib/client-id";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const draftKey = (slug: string) => `nise-request-draft:${slug}`;

function readDraft(slug: string) {
  try { return window.sessionStorage.getItem(draftKey(slug)) ?? ""; } catch { return ""; }
}
function writeDraft(slug: string, value: string) {
  try { if (value) window.sessionStorage.setItem(draftKey(slug), value); else window.sessionStorage.removeItem(draftKey(slug)); } catch { /* storage unavailable (private mode): ignore */ }
}
const noopSubscribe = () => () => undefined;

/**
 * Service enquiry form. Signed-out visitors are sent to sign in and their typed description
 * is kept for this browser tab, so nothing is lost on the way back.
 */
export default function RequestServiceForm({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const savedDraft = useSyncExternalStore(noopSubscribe, () => readDraft(slug), () => "");
  const [description, setDescription] = useState<string | null>(null);
  const [preferredContact, setPreferredContact] = useState<"email" | "phone" | "whatsapp">("email");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef<string | null>(null);
  const text = description ?? savedDraft;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (text.trim().length < 8) { setError("Please describe what you need in a few words (at least 8 characters)."); return; }
    if (file && file.size > MAX_FILE_BYTES) { setError("The attachment is larger than 20 MB. Please attach a smaller file or bring it to the desk."); return; }
    setBusy(true);
    try {
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await sessionResponse.json().catch(() => ({ user: null }));
      if (!session.user) {
        writeDraft(slug, text);
        router.push(`/login?next=${encodeURIComponent(`/services/${slug}#request-form`)}`);
        return;
      }
      if (session.user.role === "demo") { setError("The local demo account can’t send requests. Create a real account to continue."); return; }
      idempotencyKey.current ??= newIdempotencyKey();
      let fileId: string | undefined;
      if (file) {
        const upload = new FormData(); upload.set("file", file);
        const uploaded = await fetch("/api/uploads", { method: "POST", body: upload });
        const uploadResult = await uploaded.json().catch(() => ({}));
        if (!uploaded.ok) throw new Error(uploadResult.error ?? "The attachment could not be uploaded.");
        fileId = uploadResult.file.id;
      }
      const response = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceSlug: slug, description: text, preferredContact, fileId, idempotencyKey: idempotencyKey.current }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Could not submit this request.");
      writeDraft(slug, "");
      router.push(`/profile/requests/${encodeURIComponent(result.request.reference)}`); router.refresh();
    } catch (reason) {
      setError(reason instanceof TypeError ? "You appear to be offline. Your text is still here; try again when you’re connected." : reason instanceof Error ? reason.message : "Could not submit this request.");
    } finally { setBusy(false); }
  }

  return <form className="request-service-form" onSubmit={submit} noValidate>
    <span className="eyebrow eyebrow-muted">REQUEST A CALLBACK</span><h3>How can we help?</h3>
    <p>Tell us what you need for {title.toLowerCase()}. Our team will confirm the document checklist and any service charge before starting. Don’t include OTPs, PINs, passwords or full Aadhaar/PAN numbers.</p>
    <label className="form-label">What do you need help with?<textarea required minLength={8} maxLength={1500} value={text} onChange={event => { setDescription(event.target.value); }} placeholder={`Describe your ${title.toLowerCase()} request`}/><small className="field-hint">{text.length}/1500</small></label>
    <label className="form-label">How should we contact you?<select value={preferredContact} onChange={event => setPreferredContact(event.target.value as "email" | "phone" | "whatsapp")}><option value="email">Email</option><option value="phone">Phone call</option><option value="whatsapp">WhatsApp</option></select></label>
    <label className="request-file"><Upload size={16}/><span>{file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : "Attach a supporting document (optional, up to 20 MB)"}</span><input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf" onChange={event => { setFile(event.target.files?.[0] ?? null); idempotencyKey.current = null; }}/></label>
    {error && <div className="form-alert error-alert" role="alert">{error}</div>}
    <button className="button button-green" disabled={busy}>{busy ? "Submitting…" : "Submit service request"}<ArrowRight size={15}/></button>
  </form>;
}
