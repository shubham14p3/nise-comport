"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload } from "lucide-react";

export default function RequestServiceForm({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json();
      if (!session.user) { router.push(`/login?next=/services/${slug}`); return; }
      let fileId: string | undefined;
      if (file) {
        const upload = new FormData(); upload.set("file", file);
        const uploaded = await fetch("/api/uploads", { method: "POST", body: upload });
        const uploadResult = await uploaded.json();
        if (!uploaded.ok) throw new Error(uploadResult.error);
        fileId = uploadResult.file.id;
      }
      const response = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceSlug: slug, description, fileId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.push(`/profile?request=${result.request.reference}`); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not submit this request."); }
    finally { setBusy(false); }
  }
  return <form className="request-service-form" onSubmit={submit}>
    <span className="eyebrow eyebrow-muted">REQUEST A CALLBACK</span><h3>How can we help?</h3>
    <p>Tell us what you need for {title.toLowerCase()}. Our team will confirm the document checklist and any service charge before starting.</p>
    <label className="form-label">What do you need help with?<textarea required minLength={8} maxLength={1500} value={description} onChange={event => setDescription(event.target.value)} placeholder={`Describe your ${title.toLowerCase()} request`}/></label>
    <label className="request-file"><Upload size={16}/><span>{file ? file.name : "Attach a supporting document (optional)"}</span><input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf" onChange={event => setFile(event.target.files?.[0] ?? null)}/></label>
    {error && <div className="form-alert error-alert" role="alert">{error}</div>}
    <button className="button button-green" disabled={busy}>{busy ? "Submitting…" : "Submit service request"}<ArrowRight size={15}/></button>
  </form>;
}
