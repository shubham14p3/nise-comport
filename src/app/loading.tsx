import Image from "next/image";

/** Next.js route-level fallback, also used for slow first-load development builds. */
export default function Loading() {
  return <main className="nc-loading-page" role="status" aria-label="NiSE COMPORT loading the page">
    <span className="nc-loading-page__mark"><Image src="/images/logo/logo-footer.png" alt="" width={165} height={55} priority/></span>
    <b>NiSE COMPORT</b>
    <p>Loading your page…</p>
  </main>;
}
