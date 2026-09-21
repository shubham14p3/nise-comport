import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../layouts/header";
import Footer from "../layouts/footer";
import Layout from "../layouts";
import { printApi } from "../features/print/api";
import "../assets/css/print-service.css";
import "../assets/css/nise-platform.css";

const money = (paise = 0) => `₹${(Number(paise) / 100).toFixed(Number(paise) % 100 ? 2 : 0)}`;
const label = (status = "") => status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function PrintOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });

  const load = async () => {
    try {
      const data = await printApi.getMyOrders();
      setOrders(data.orders || []);
      setState({ loading: false, error: "" });
    } catch (error) {
      if (error.status === 401) return navigate("/login?returnTo=/print/orders");
      setState({ loading: false, error: error.message });
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (orderNumber) => {
    if (!window.confirm("Cancel this print order?")) return;
    try { await printApi.cancel(orderNumber); await load(); } catch (error) { setState((s) => ({ ...s, error: error.message })); }
  };

  return <Layout><div className="wrapper nise-print nise-platform"><Header/><main className="container orders-page">
    <div className="orders-heading"><span className="print-kicker">My NISE</span><h1>Your print orders</h1><p>See payment, printing, pickup and delivery status without asking on WhatsApp.</p></div>
    {state.error && <div className="form-error">{state.error}</div>}
    {state.loading ? <div className="loading-panel">Loading orders…</div> :
    !orders.length ? <div className="empty-orders"><h2>No print orders yet</h2><p>Upload from your phone and collect when NISE tells you it is ready.</p><Link to="/print">Start a print order</Link></div> :
    <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.order_number}>
      <div><small>{order.order_number}</small><h2>{order.file_count} file{order.file_count === 1 ? "" : "s"}</h2><span className="status-pill">{label(order.status)}</span>
        {order.pickup_starts_at && <small style={{display:"block",marginTop:8}}>Pickup: {new Date(order.pickup_starts_at).toLocaleString()}</small>}
      </div>
      <div className="order-card-meta"><span>{order.fulfilment === "pickup" ? "Shop pickup" : "Home delivery"}</span><strong>{money(order.total_paise)}</strong><small>{order.payment_status === "paid" ? "Paid" : "Payment pending"}</small><small>{new Date(order.created_at).toLocaleString()}</small>
        {["DRAFT","AWAITING_PAYMENT","PAID","QUEUED"].includes(order.status) && <button className="danger-link" style={{border:0,background:"transparent",padding:0}} onClick={() => cancel(order.order_number)}>Cancel order</button>}
      </div>
    </article>)}</div>}
  </main><Footer/></div></Layout>;
}
