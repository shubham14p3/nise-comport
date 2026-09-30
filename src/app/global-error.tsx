"use client";

/** Last-resort error screen if the root layout itself fails. Keep it dependency-free. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en-IN"><body style={{ fontFamily: "Arial, sans-serif", background: "#f7f5ed", color: "#202923", padding: "48px 20px" }}>
    <main style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1>NISE COMPORT is temporarily unavailable</h1>
      <p>Please try again in a minute. For urgent help call <a href="tel:+919771219893">+91 97712 19893</a>.</p>
      <button type="button" onClick={() => reset()} style={{ padding: "10px 18px", borderRadius: 999, border: 0, background: "#24533c", color: "#fffefa", fontWeight: 700 }}>Try again</button>
    </main>
  </body></html>;
}
