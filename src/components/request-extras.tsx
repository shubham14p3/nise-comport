/** Contact, visit and offer details added by the step-by-step request flow. */
export default function RequestExtras({ details, fallback }: { details: Record<string, unknown>; fallback: string }) {
  const visit = details.visit && typeof details.visit === "object" ? details.visit as Record<string, unknown> : null;
  const offer = details.offer && typeof details.offer === "object" ? details.offer as { title?: string } : null;
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
  return <dl className="summary summary--plain">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
