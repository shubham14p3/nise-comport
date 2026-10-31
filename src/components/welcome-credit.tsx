"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { secureApi } from "@/lib/secure-api-client";

/** Gateway code for POST /api/welcome-credit (see src/app/api/x7q9m2/route.ts). */
const WELCOME_OP = "V8h4T2mK9xLa";
const NUDGE_SESSION_KEY = "nc-welcome-nudged";

type Status = {
  firstTime: boolean; verified: boolean; granted: boolean; amountRupees: number; celebrate: boolean; nudgeCount: number; nudgeable: boolean;
};
type NudgeResult = { show: boolean; popup: boolean; nudgeCount: number };

/** Celebration once the credit is granted; a verify nudge on sign-in for first-time, unverified accounts. */
export default function WelcomeCredit() {
  const [celebrate, setCelebrate] = useState(false);
  const [amount, setAmount] = useState(100);
  const [nudge, setNudge] = useState<NudgeResult | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await secureApi<Status>(WELCOME_OP, { action: "status" });
        if (cancelled) return;
        if (status.celebrate) { setAmount(status.amountRupees); setCelebrate(true); return; }
        if (!status.nudgeable) return;
        // One nudge per browser session, so reloading the profile doesn't count as a new sign-in.
        let alreadyNudged = false;
        try { alreadyNudged = sessionStorage.getItem(NUDGE_SESSION_KEY) === "1"; } catch { alreadyNudged = false; }
        if (alreadyNudged) { setNudge({ show: true, popup: false, nudgeCount: status.nudgeCount }); return; }
        const result = await secureApi<NudgeResult>(WELCOME_OP, { action: "nudge" });
        try { sessionStorage.setItem(NUDGE_SESSION_KEY, "1"); } catch { /* storage blocked: the nudge may repeat, which is harmless */ }
        if (!cancelled && result.show) setNudge(result);
      } catch {
        // Not signed in, or the check failed: show nothing rather than an error.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function closeCelebration() {
    setCelebrate(false);
    try { await secureApi(WELCOME_OP, { action: "celebrated" }); } catch { /* the popup may show once more; harmless */ }
  }

  if (celebrate) {
    return <div role="dialog" aria-modal="true" aria-labelledby="welcome-title" style={overlay}>
      <div className="confetti" aria-hidden="true">{Array.from({ length: 36 }, (_, index) => <i key={index} style={{ left: `${(index * 37) % 100}%`, animationDelay: `${(index % 9) * 0.15}s` }}/>)}</div>
      <div style={card}>
        <p style={{ fontSize: 40, margin: 0 }}>🎉</p>
        <h2 id="welcome-title" style={{ margin: "8px 0 4px" }}>Welcome to NiSE COMPORT!</h2>
        <p style={{ fontSize: 22, fontWeight: 700, margin: "6px 0" }}>₹{amount} welcome credit</p>
        <p style={{ margin: "6px 0 16px" }}>It gives you 10% off every bill at the shop, on every service.</p>
        <button type="button" className="btn btn--primary" onClick={() => void closeCelebration()}>Lovely, thank you</button>
      </div>
    </div>;
  }

  if (!nudge || dismissed) return null;

  if (nudge.popup) {
    return <div role="dialog" aria-modal="true" aria-labelledby="verify-title" style={overlay}>
      <div style={card}>
        <p style={{ fontSize: 36, margin: 0 }}>🎁</p>
        <h2 id="verify-title" style={{ margin: "8px 0 4px" }}>Unlock your ₹{100} welcome credit</h2>
        <p style={{ margin: "6px 0 16px" }}>Verify your mobile number or your email address. Then ₹100 is added to your wallet, and it gives you 10% off every bill.</p>
        <button type="button" className="btn btn--primary" onClick={() => setDismissed(true)}>Verify later</button>
      </div>
    </div>;
  }

  return <div className="alert alert--info" role="status" style={{ margin: "12px 0" }}>
    <span>Verify your mobile or email to unlock your ₹100 welcome credit (10% off every bill).</span>
    <button type="button" className="text-link" onClick={() => setDismissed(true)} style={{ marginLeft: 10 }}>Dismiss</button>
  </div>;
}

const overlay: CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", padding: 16, zIndex: 60 };
const card: CSSProperties = { position: "relative", background: "var(--surface, #fff)", maxWidth: 420, width: "100%", padding: 24, borderRadius: 16, textAlign: "center" };
