"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";

type Snapshot = {
  reference: string; serviceName: string; status: string; statusLabel: string; completed: boolean;
  existing: { rating: number; feedback: string | null; postedGoogleReview: boolean } | null;
  googleReviewUrl: string | null;
};

/** Star picker + feedback for a completed request; nudges a 4-5 star rating toward the Google review link. */
export default function ReviewForm({ reference }: { reference: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedRating, setSavedRating] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    secureApi<Snapshot>("X3n6Q1vT8mK4", { reference })
      .then((result) => {
        if (!active) return;
        setSnapshot(result);
        if (result.existing) { setRating(result.existing.rating); setFeedback(result.existing.feedback ?? ""); setSavedRating(result.existing.rating); }
      })
      .catch((reason) => { if (active) setLoadError(reason instanceof Error ? reason.message : "Could not open this request."); });
    return () => { active = false; };
  }, [reference]);

  async function submit() {
    if (!rating) { setError("Pick a star rating first."); return; }
    setBusy(true); setError("");
    try {
      const result = await secureApi<{ ok: true; rating: number; googleReviewUrl: string | null }>("Y7k2V5pN9rD1", { reference, rating, feedback: feedback.trim() });
      setSavedRating(result.rating);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save your rating."); }
    finally { setBusy(false); }
  }

  if (loadError) return <div className="form-alert error-alert" role="alert">{loadError}</div>;
  if (!snapshot) return <p className="muted">Opening your request…</p>;
  if (!snapshot.completed) {
    return <div className="pan-card">
      <h3>{snapshot.serviceName}</h3>
      <p>{snapshot.reference} is currently “{snapshot.statusLabel}”. We&apos;ll ask you to rate it once it&apos;s marked complete.</p>
      <Link className="btn btn--ghost btn--sm" href="/profile#requests">Back to my requests</Link>
    </div>;
  }

  const shownRating = hoverRating || rating;
  const showGoogleNudge = savedRating !== null && savedRating >= 4 && Boolean(snapshot.googleReviewUrl);

  return <div className="pan-card">
    <h3>{snapshot.serviceName}</h3>
    <p className="muted">{snapshot.reference}</p>

    {savedRating === null ? <>
      <div role="radiogroup" aria-label="Star rating" style={{ display: "flex", gap: 6, margin: "8px 0 16px" }}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" aria-label={`${value} star${value === 1 ? "" : "s"}`} aria-pressed={rating === value}
            onMouseEnter={() => setHoverRating(value)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(value)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <Star size={32} fill={value <= shownRating ? "#f5a623" : "none"} color={value <= shownRating ? "#f5a623" : "var(--line-2)"} strokeWidth={1.5}/>
          </button>
        ))}
      </div>
      <label>What could we do better? (optional)<textarea maxLength={1000} rows={4} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Anything that could've gone smoother…"/></label>
      {error && <div className="form-alert error-alert" role="alert">{error}</div>}
      <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void submit()} style={{ marginTop: 12 }}>{busy ? "Saving…" : "Submit rating"}</button>
    </> : <>
      <div className="form-alert success-alert" role="status">Thanks for rating us {savedRating} star{savedRating === 1 ? "" : "s"}!</div>
      {feedback && <p>Your note: “{feedback}”</p>}
      {showGoogleNudge && snapshot.googleReviewUrl && <div className="note-card" style={{ marginTop: 16 }}>
        <Star size={20}/>
        <p>Glad we could help! Would you mind sharing this on Google too? It&apos;s the biggest way neighbours find honest local help.<br/>
          <a className="btn btn--primary btn--sm" style={{ marginTop: 10 }} href={snapshot.googleReviewUrl} target="_blank" rel="noopener noreferrer">Leave a Google review <ArrowUpRight size={16}/></a>
        </p>
      </div>}
      {!showGoogleNudge && <p className="muted">We&apos;ve passed your note to the team — thank you for taking the time.</p>}
      <Link className="profile-text-button" href="/profile#requests" style={{ marginTop: 12, display: "inline-block" }}>Back to my requests</Link>
    </>}
  </div>;
}
