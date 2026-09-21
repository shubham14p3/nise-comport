import React, { useEffect, useState } from "react";
import Header from "../layouts/header";
import Footer from "../layouts/footer";
import Layout from "../layouts";
import { getPrintOrders } from "../features/print/orderStore";
import "../assets/css/print-service.css";

const label = (status) => ({
  awaiting_payment: "Awaiting payment", paid: "Paid", queued: "Ready to print",
  printing: "Printing", needs_customer_confirmation: "Needs confirmation",
  ready_for_pickup: "Ready for pickup", out_for_delivery: "Out for delivery",
  completed: "Completed"
}[status] || status);

export default function PrintOrdersPage() {
  const [orders, setOrders] = useState([]);
  useEffect(() => setOrders(getPrintOrders()), []);
  return <Layout><div className="wrapper nise-print"><Header/><main className="container orders-page">
    <div className="orders-heading"><span className="print-kicker">My NISE</span><h1>Your print orders</h1><p>Track printing, pickup and delivery from one place.</p></div>
    {!orders.length ? <div className="empty-orders"><h2>No print orders yet</h2><p>Your submitted print jobs will appear here.</p><a href="/print">Start a print order</a></div> :
    <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.orderNumber}>
      <div><small>{order.orderNumber}</small><h2>{order.files?.length || 0} file{order.files?.length === 1 ? "" : "s"}</h2><span className="status-pill">{label(order.status)}</span></div>
      <div className="order-card-meta"><span>{order.fulfilment === "pickup" ? "Shop pickup" : "Home delivery"}</span><strong>₹{order.total}</strong><small>{new Date(order.createdAt).toLocaleString()}</small></div>
    </article>)}</div>}
  </main><Footer/></div></Layout>;
}
