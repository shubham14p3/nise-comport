import { intakeSections, type DetailedIntake } from "@/lib/detailed-intake";
/** Contact, visit, offer and coupon details added by the step-by-step request flow. */
export default function RequestExtras({ details, fallback }: { details: Record<string, unknown>; fallback: string }) {
  const visit = details.visit && typeof details.visit === "object" ? details.visit as Record<string, unknown> : null;
  const offer = details.offer && typeof details.offer === "object" ? details.offer as { title?: string } : null;
  const coupon = details.coupon && typeof details.coupon === "object" ? details.coupon as { code?: string; value?: number; minimum?: number; title?: string } : null;
  const rows: [string, string][] = [];
  rows.push(["Your note", typeof details.description === "string" ? details.description : fallback || "No additional note."]);
  if (typeof details.contactPhone === "string") rows.push(["Contact", `${typeof details.contactName === "string" ? `${details.contactName} · ` : ""}${details.contactPhone}${typeof details.preferredContact === "string" ? ` · prefers ${details.preferredContact}` : ""}`]);
  if (visit) {
    const modes: Record<string, string> = { walkin: "Visit the centre", callback: "Call me back first", doorstep: "Doorstep help", online: "Mostly online" };
    const day = typeof visit.day === "string" ? new Date(`${visit.day}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }) : "";
    const slot = typeof visit.slot === "string" ? visit.slot.charAt(0).toUpperCase() + visit.slot.slice(1) : "";
    rows.push(["Visit", [modes[String(visit.mode)] ?? String(visit.mode ?? ""), day, slot, typeof visit.address === "string" ? visit.address : ""].filter(Boolean).join(" · ")]);
  }
  if (offer?.title) rows.push(["Offer", offer.title]);
  if (coupon?.code) rows.push(["Coupon", `${coupon.code}${coupon.title ? ` · ${coupon.title}` : ""} · ₹${coupon.value ?? 0} off the service charge${coupon.minimum ? ` (when it is ₹${coupon.minimum} or more)` : ""}`]);
  const intake = details.intake && typeof details.intake === "object" ? details.intake as Partial<DetailedIntake> & {error?:string} : null;
  return <>
    <dl className="summary summary--plain">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    {intake?.error && <p role="alert">{intake.error}</p>}
    {intake?.kind && intake.answers && <section className="detailed-intake__summary">
      <h3>{intake.kind.toUpperCase()} applicant details (staff assistance)</h3>
      {intakeSections(intake.kind).map(section => {
        const provided = section.fields.filter(f => intake.answers?.[f.id]);
        return provided.length ? <details key={section.title} className="detailed-intake__section" open><summary>{section.title}</summary>
          <dl className="pan-review">{provided.map(f => <div key={f.id}><dt>{f.label}</dt><dd>{intake.answers?.[f.id]}</dd></div>)}</dl>
        </details> : null;
      })}
      {intake.photoFileId && <p>Photograph uploaded (available through authorized request file access).</p>}
      {intake.documents?.length ? <details className="detailed-intake__section" open><summary>Supporting documents available</summary><ul>{intake.documents.map(item=> <li key={item}>{item}</li>)}</ul></details> : null}
      <p className="field__hint">Collected for NISE COMPORT staff review only. Official portal submission and acknowledgement are separate.</p>
    </section>}
  </>;
}
