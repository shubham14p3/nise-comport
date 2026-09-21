import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../layouts/header";
import Footer from "../layouts/footer";
import Layout from "../layouts";
import { staffApi } from "../features/print/api";
import "../assets/css/nise-platform.css";
import "../assets/css/print-service.css";

const label = (status = "") => status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const money = (paise = 0) => `₹${(Number(paise) / 100).toFixed(Number(paise) % 100 ? 2 : 0)}`;

const transitions = {
  PAID: [["QUEUED", "Prepare job"]],
  QUEUED: [["PRINTING", "Start printing"], ["NEEDS_CUSTOMER_CONFIRMATION", "Need customer"]],
  PRINTING: [["READY_FOR_PICKUP", "Ready for pickup"], ["OUT_FOR_DELIVERY", "Out for delivery"], ["NEEDS_CUSTOMER_CONFIRMATION", "Need customer"]],
  NEEDS_CUSTOMER_CONFIRMATION: [["QUEUED", "Customer replied"]],
  READY_FOR_PICKUP: [["COMPLETED", "Complete pickup"]],
  OUT_FOR_DELIVERY: [["COMPLETED", "Complete delivery"]],
};

export default function StaffPrintPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [details, setDetails] = useState({});
  const [filter, setFilter] = useState("");
  const [state, setState] = useState({ loading: true, error: "" });

  const load = async () => {
    try {
      const data = await staffApi.queue(filter);
      setOrders(data.orders || []);
      setState({ loading: false, error: "" });
    } catch (error) {
      if (error.status === 401) return navigate("/login?returnTo=/staff/print");
      if (error.status === 403) return navigate("/profile");
      setState({ loading: false, error: error.message });
    }
  };

  useEffect(() => { load(); }, [filter]);

  const open = async (number) => {
    try {
      if (details[number]) return setDetails((d) => ({ ...d, [number]: null }));
      const data = await staffApi.order(number);
      setDetails((d) => ({ ...d, [number]: data.order }));
    } catch (error) { setState((s) => ({ ...s, error: error.message })); }
  };

  const move = async (number, status) => {
    try { await staffApi.updateStatus(number, status); await load(); if (details[number]) { const data = await staffApi.order(number); setDetails((d) => ({ ...d, [number]: data.order })); } }
    catch (error) { setState((s) => ({ ...s, error: error.message })); }
  };

  const markPaid = async (number) => {
    try { await staffApi.markPaid(number); await load(); } catch (error) { setState((s) => ({ ...s, error: error.message })); }
  };

  return <Layout><div className="wrapper nise-platform"><Header/><main className="ops-shell">
    <div className="ops-hero"><div><span className="platform-kicker">NISE Staff</span><h1>Print queue</h1><p>The next action is visible on every job. Customer complexity stays out of the counter workflow.</p></div></div>
    <div className="ops-toolbar">
      {[["","All"],["PAID","Paid"],["QUEUED","Ready"],["PRINTING","Printing"],["NEEDS_CUSTOMER_CONFIRMATION","Need customer"],["READY_FOR_PICKUP","Pickup"],["OUT_FOR_DELIVERY","Delivery"]].map(([value,text]) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{text}</button>)}
    </div>
    {state.error && <div className="form-error">{state.error}</div>}
    {state.loading ? <div className="loading-panel">Loading print queue…</div> : <div className="ops-list">
      {orders.map((order) => <article className="ops-card" key={order.order_number}>
        <header><div><small>{order.order_number}</small><h2>{order.customer_name}</h2><div className="ops-meta"><span>{order.customer_mobile}</span><span>{order.file_count} files</span><span>{order.fulfilment === "pickup" ? "Pickup" : "Delivery"}</span><span>{label(order.status)}</span></div></div><div style={{textAlign:"right"}}><strong>{money(order.total_paise)}</strong><br/><small>{order.payment_status}</small></div></header>
        <div className="ops-actions">
          <button className="secondary" onClick={() => open(order.order_number)}>{details[order.order_number] ? "Hide job sheet" : "Open job sheet"}</button>
          {order.payment_status !== "paid" && <button onClick={() => markPaid(order.order_number)}>Mark paid at shop</button>}
          {(transitions[order.status] || []).map(([status,text]) => <button key={status} onClick={() => move(order.order_number,status)}>{text}</button>)}
        </div>
        {details[order.order_number] && <div className="ops-files">
          {details[order.order_number].files.map((file) => <div className="ops-file" key={file.id}>
            <div><strong>{file.name}</strong><br/><small>{file.totalPages} source pages</small></div>
            <div>{file.segments.map((s) => <div key={s.colourMode}><strong>{s.colourMode === "color" ? "Colour" : "B&W"}:</strong> {s.pageSelection}</div>)}</div>
            <div>{file.segments.map((s) => <div key={s.colourMode}>{s.copies}× · {s.sides} · {s.paperSize}</div>)}</div>
            <div className="ops-actions" style={{marginTop:0}}>{file.preparedBw && <a href={staffApi.downloadUrl(file.id,"bw")}>B&W file</a>}{file.preparedColor && <a href={staffApi.downloadUrl(file.id,"color")}>Colour file</a>}<a className="secondary" href={staffApi.downloadUrl(file.id,"source")}>Source</a></div>
          </div>)}
          {details[order.order_number].customer_note && <p><strong>Customer note:</strong> {details[order.order_number].customer_note}</p>}
        </div>}
      </article>)}
      {!orders.length && <div className="loading-panel">No print jobs in this queue.</div>}
    </div>}
  </main><Footer/></div></Layout>;
}
