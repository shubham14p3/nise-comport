import React, { useEffect, useState } from "react";
import Header from "../layouts/header";
import Footer from "../layouts/footer";
import Layout from "../layouts";
import { getPrintOrders, updatePrintOrderStatus } from "../features/print/orderStore";
import "../assets/css/print-service.css";

const nextActions = {
  paid: ["queued", "PREPARE JOB"], queued: ["printing", "START PRINTING"],
  printing: ["ready_for_pickup", "MARK READY"], needs_customer_confirmation: ["queued", "CUSTOMER REPLIED"],
  ready_for_pickup: ["completed", "COMPLETE PICKUP"], out_for_delivery: ["completed", "COMPLETE DELIVERY"]
};

export default function StaffPrintPage() {
  const [orders, setOrders] = useState([]);
  const refresh = () => setOrders(getPrintOrders());
  useEffect(refresh, []);
  const advance = (order) => { const action = nextActions[order.status]; if (action) { updatePrintOrderStatus(order.orderNumber, action[0]); refresh(); } };
  return <Layout><div className="wrapper nise-print"><Header/><main className="container staff-print-page">
    <div className="orders-heading"><span className="print-kicker">Staff workspace</span><h1>Print queue</h1><p>Every card tells you the next action. No need to interpret customer instructions.</p></div>
    <div className="staff-queue">{orders.map((order) => <article className="staff-job" key={order.orderNumber}>
      <header><div><small>{order.orderNumber}</small><h2>{order.customerName || "Online customer"}</h2></div><strong>₹{order.total}</strong></header>
      {(order.files || []).map((file) => <div className="staff-file" key={file.name}><strong>{file.name}</strong><span>Print: {file.selection}</span><span>Colour: {file.colourSelection || "None"}</span><span>{file.copies} cop{Number(file.copies) === 1 ? "y" : "ies"} · {file.sides} sided · {file.paperSize}</span></div>)}
      <footer><span>{order.fulfilment === "pickup" ? `Pickup · ${order.pickupSlot || "slot pending"}` : "Home delivery"}</span>{nextActions[order.status] && <button onClick={() => advance(order)}>{nextActions[order.status][1]}</button>}</footer>
    </article>)}</div>
  </main><Footer/></div></Layout>;
}
