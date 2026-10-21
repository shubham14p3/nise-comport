"use client";

import { useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";

type Row = { day: string; source: string; device: string; scans: number; clicks: Record<string, number> };
type Data = { days: number; rows: Row[] };

/** Admin → QR scans: how often the welcome QR is scanned and which buttons people tap. Anonymous counts only. */
export default function QrScansPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { secureApi<Data>("Q4r8S2nV6kT9").then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load QR scans.")); }, []);
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (!data) return <p>Loading…</p>;
  const sum = (pick: (row: Row) => number, filter: (row: Row) => boolean = () => true) => data.rows.filter(filter).reduce((total, row) => total + pick(row), 0);
  const click = (name: string) => sum((row) => row.clicks?.[name] ?? 0);
  const devices = ["ios", "android", "desktop"];
  return <section className="admin-card">
    <h2>QR scans · last {data.days} days</h2>
    <p className="field__hint">Counts only. No names, phone numbers or locations are saved. A person only becomes known if they sign in or message us themselves.</p>
    <p><strong>{sum((row) => row.scans)}</strong> scans · {devices.map((name) => `${name} ${sum((row) => row.scans, (row) => row.device === name)}`).join(" · ")}</p>
    <p>Taps: WhatsApp {click("whatsapp")} · Gmail {click("gmail")} · Email {click("email")} · Sign in {click("login")}</p>
    <div className="table-wrap"><table><thead><tr><th>Day</th><th>Source</th><th>Device</th><th>Scans</th><th>WhatsApp</th><th>Gmail</th><th>Email</th><th>Sign in</th></tr></thead>
      <tbody>{data.rows.map((row) => <tr key={`${row.day}${row.source}${row.device}`}><td>{row.day}</td><td>{row.source}</td><td>{row.device}</td><td>{row.scans}</td><td>{row.clicks?.whatsapp ?? 0}</td><td>{row.clicks?.gmail ?? 0}</td><td>{row.clicks?.email ?? 0}</td><td>{row.clicks?.login ?? 0}</td></tr>)}</tbody></table></div>
  </section>;
}
