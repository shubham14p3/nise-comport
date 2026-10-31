

/** Next.js route-level fallback, also used for slow first-load development builds. */
export default function Loading() {
  return <main className="nc-loading-page" role="status" aria-label="NiSE COMPORT loading the page">
    <span className="nc-loading-page__mark"><span className="nc-lettermark nc-lettermark--large" aria-hidden="true"><span>N</span><span>i</span><span>S</span><span>E</span></span></span>
    <b>NiSE COMPORT</b>
    <p>Loading your page…</p>
  </main>;
}
