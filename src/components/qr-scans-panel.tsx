"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Download, QrCode, RefreshCw, Smartphone, MousePointerClick } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";
import { AdminPager, useAdminPagination } from "@/components/admin-pager";
import SiteQrCards from "@/components/site-qr-cards";
import { site } from "@/lib/site";

type Row = { day: string; source: string; device: string; scans: number; clicks: Record<string, number> };
type Data = { days: number; rows: Row[] };

/** QR creation + aggregate scan analytics. Downloads are static SVGs, not new database writes. */
export default function QrScansPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [device, setDevice] = useState("");
  const [assistantNumber, setAssistantNumber] = useState(process.env.NEXT_PUBLIC_WHATSAPP_ASSISTANT ?? "17111494523");
  const assistantDigits = assistantNumber.replace(/\D/g, "");
  const validAssistant = /^[1-9]\d{7,14}$/.test(assistantDigits);
  const [placement, setPlacement] = useState("poster");
  const [openDetails, setOpenDetails] = useState(false);
  async function refresh() {
    try { setData(await secureApi<Data>("Q4r8S2nV6kT9")); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load QR scans."); }
  }
  useEffect(() => { void Promise.resolve().then(refresh); }, []);
  const filtered = useMemo(() => (data?.rows ?? []).filter((row) =>
    (!source || row.source === source) && (!device || row.device === device)
  ), [data, source, device]);
  const paging = useAdminPagination(filtered);
  const scans = filtered.reduce((total, row) => total + row.scans, 0);
  const taps = (name: string) => filtered.reduce((total, row) => total + (row.clicks?.[name] ?? 0), 0);
  const sources = [...new Set((data?.rows ?? []).map((row) => row.source))].sort();
  const locations = [{ id: "poster", label: "Posters" }, { id: "counter", label: "Shop counter" }, { id: "card", label: "Visiting card" }];
  const cards = [
    { title: "Welcome QR", hint: "WhatsApp, email, sign in and callback on one page.", url: `${site.url}/welcome?src=${placement}`, file: `nise-welcome-${placement}.svg` },
    { title: "Sign-in QR", hint: "Customers can sign in with mobile number or email.", url: `${site.url}/login`, file: "nise-login.svg" },

  ];
  return <section className="admin-card admin-qr">
    <div className="admin-qr__header">
      <div><span className="admin-eyebrow"><QrCode size={15}/> QR management</span><h2>Create &amp; track QR codes</h2><p className="muted">Download print-ready QR codes for your shop, posters and visiting cards. Only anonymised scan totals are recorded.</p></div>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => void refresh()}><RefreshCw size={15}/> Refresh counts</button>
    </div>
    <div className="admin-qr__create">
      <label>Where will the welcome QR be used?
        <select value={placement} onChange={(event) => setPlacement(event.target.value)}>
          {locations.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <p className="muted">Each printed location gets a different QR source so you can compare its performance.</p>
      <SiteQrCards cards={cards} download="Download SVG"/>
      <div className="admin-qr__assistant">
        <div><span className="admin-eyebrow">🙏 नमस्ते · NiSE COMPORT</span><h3>WhatsApp QR — Online Assistant</h3>
          <p>सेवा की जानकारी और ऑनलाइन सहायता · Service enquiries and online assistance</p>
          <label className="field"><span className="field__label">Assistant WhatsApp number, including country code</span>
            <input type="tel" inputMode="tel" maxLength={24} value={assistantNumber} onChange={event => setAssistantNumber(event.target.value)} aria-describedby="assistant-qr-help"/></label>
          <p id="assistant-qr-help" className="field__hint">Use the actual API phone number, not its Meta Phone Number ID. This changes this QR only; it does not change your shop contact number or API credentials. Set NEXT_PUBLIC_WHATSAPP_ASSISTANT before building to change the initial value.</p>
          <p>Scan → open WhatsApp → tap Send. Scanning alone does not send a message.</p>
          <p><b>Documents / दस्तावेज़:</b> upload through your service request on our website. WhatsApp attachments are not saved in the website inbox yet.</p>
          <p className="field__hint">Direct WhatsApp QR scans are not included in the welcome-page scan counts. Reprint the QR after changing its destination.</p>
        </div>
        {validAssistant ? <SiteQrCards cards={[{ title: "ऑनलाइन सहायता", hint: "Scan करें और WhatsApp पर Send दबाएँ", url: `https://wa.me/${assistantDigits}?text=${encodeURIComponent("Hi NiSE COMPORT, I scanned your QR code. Namaste! Online seva ki jankari chahiye.")}`, file: "nise-whatsapp-online-assistant.svg", badge: "WhatsApp · Online Assistant", number: `+${assistantDigits}` }]} download="Download WhatsApp QR"/> : <p role="alert" className="form-error">Enter a valid international WhatsApp number to generate the QR.</p>}
      </div>
      <Link prefetch={false} className="btn btn--ghost btn--sm" href="/welcome" target="_blank">Preview welcome page</Link>
    </div>
    <div className="admin-qr__metrics">
      <div><QrCode size={18}/><b>{scans.toLocaleString("en-IN")}</b><small>Scans (last {data?.days ?? 30} days)</small></div>
      <div><MousePointerClick size={18}/><b>{(taps("whatsapp") + taps("gmail") + taps("email") + taps("login")).toLocaleString("en-IN")}</b><small>Total button taps</small></div>
      <div><Smartphone size={18}/><b>{filtered.filter((row) => row.device !== "desktop").reduce((n, row) => n + row.scans, 0)}</b><small>Mobile scans</small></div>
      <div><BarChart3 size={18}/><b>{sources.length}</b><small>QR sources tracked</small></div>
    </div>
    {error && <p role="alert" className="form-error">{error}</p>}
    <details className="admin-accordion" open={openDetails} onToggle={(event) => setOpenDetails(event.currentTarget.open)}>
      <summary>Scan analytics by day, source and device</summary>
      <div className="admin-filters">
        <label>Source<select value={source} onChange={(event) => { setSource(event.target.value); paging.reset(); }}><option value="">All sources</option>{sources.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Device<select value={device} onChange={(event) => { setDevice(event.target.value); paging.reset(); }}><option value="">All devices</option>{["android", "ios", "desktop"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>
      <AdminPager {...paging} label="QR scan days"/>
      {!data && !error ? <p>Loading scan totals…</p> : filtered.length === 0 ? <p className="admin-empty">No scans found for these filters.</p> :
        <div className="table-scroll"><table className="price-table"><thead><tr><th>Day</th><th>Source</th><th>Device</th><th>Scans</th><th>WhatsApp</th><th>Gmail</th><th>Email</th><th>Sign in</th></tr></thead>
          <tbody>{paging.items.map((row) => <tr key={`${row.day}-${row.source}-${row.device}`}><td>{row.day}</td><td>{row.source}</td><td>{row.device}</td><td>{row.scans}</td><td>{row.clicks?.whatsapp ?? 0}</td><td>{row.clicks?.gmail ?? 0}</td><td>{row.clicks?.email ?? 0}</td><td>{row.clicks?.login ?? 0}</td></tr>)}</tbody></table></div>}
      {filtered.length > paging.pageSize && <AdminPager {...paging} label="QR scan days"/>}
      <p className="field__hint"><Download size={13}/> QR downloads happen entirely in the browser and do not create server requests.</p>
    </details>
  </section>;
}
