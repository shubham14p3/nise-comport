import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../layouts/header";
import Footer from "../layouts/footer";
import Layout from "../layouts";
import { authApi, notificationApi, printApi, walletApi } from "../features/print/api";
import "../assets/css/nise-platform.css";

const money = (paise = 0) => `₹${(Number(paise) / 100).toFixed(Number(paise) % 100 ? 2 : 0)}`;
const label = (status = "") => status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function UserProfile() {
  const navigate = useNavigate();
  const [data, setData] = useState({ me: null, orders: [], wallet: null, ledger: [], notifications: [] });
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    (async () => {
      try {
        const [me, orders, wallet, ledger, notifications] = await Promise.all([
          authApi.me(), printApi.getMyOrders(), walletApi.get(), walletApi.ledger(), notificationApi.list(),
        ]);
        setData({
          me,
          orders: orders.orders || [],
          wallet,
          ledger: ledger.entries || [],
          notifications: notifications.notifications || [],
        });
        setState({ loading: false, error: "" });
      } catch (error) {
        if (error.status === 401) return navigate("/login?returnTo=/profile", { replace: true });
        setState({ loading: false, error: error.message });
      }
    })();
  }, [navigate]);

  const recentOrders = useMemo(() => data.orders.slice(0, 5), [data.orders]);
  const recentNotifications = useMemo(() => data.notifications.slice(0, 5), [data.notifications]);
  const recentLedger = useMemo(() => data.ledger.slice(0, 5), [data.ledger]);

  const logout = async () => {
    await authApi.logout();
    navigate("/home");
  };

  if (state.loading) return <Layout><div className="wrapper nise-platform"><Header/><main className="dashboard-shell"><div className="loading-panel">Loading your NISE account…</div></main><Footer/></div></Layout>;

  return <Layout><div className="wrapper nise-platform"><Header/><main className="dashboard-shell">
    <div className="dashboard-hero">
      <div><span className="platform-kicker">My NISE</span><h1>Hi, {data.me?.user?.name || "there"}.</h1><p>Your services, payments and rewards in one place.</p></div>
      <button className="primary-action" onClick={logout}>Sign out</button>
    </div>
    {state.error && <div className="form-error">{state.error}</div>}
    <div className="dashboard-grid">
      <section className="dashboard-card">
        <div className="section-title-row"><h2>Recent orders</h2><Link to="/print/orders">View all</Link></div>
        {!recentOrders.length && <p>No orders yet. <Link to="/print">Create your first print order.</Link></p>}
        {recentOrders.map((order) => <div className="mini-order" key={order.order_number}>
          <div><strong>{order.order_number}</strong><br/><small>{order.file_count} file{order.file_count === 1 ? "" : "s"} · {new Date(order.created_at).toLocaleString()}</small></div>
          <div style={{textAlign:"right"}}><span className="status-badge">{label(order.status)}</span><br/><strong>{money(order.total_paise)}</strong></div>
        </div>)}
      </section>

      <section className="dashboard-card wallet-card">
        <small>NISE Credit</small><div className="wallet-amount">{money(data.wallet?.balancePaise || 0)}</div>
        <p>Use eligible credit automatically on your next service. Promotional credit cannot be withdrawn or transferred.</p>
      </section>

      <section className="dashboard-card">
        <div className="section-title-row"><h2>Quick actions</h2></div>
        <div className="quick-actions"><Link to="/print">Print online</Link><Link to="/all-services">Browse services</Link><Link to="/print/orders">Track orders</Link><Link to="/contact">Contact NISE</Link></div>
      </section>

      <section className="dashboard-card">
        <div className="section-title-row"><h2>Wallet activity</h2></div>
        {!recentLedger.length && <p>No wallet activity yet.</p>}
        {recentLedger.map((entry) => <div className="ledger-row" key={entry.id}>
          <div><strong>{entry.reason}</strong><br/><small>{new Date(entry.created_at).toLocaleDateString()}</small></div>
          <strong>{Number(entry.amount_paise) >= 0 ? "+" : ""}{money(entry.amount_paise)}</strong>
        </div>)}
      </section>

      <section className="dashboard-card" style={{gridColumn:"1 / -1"}}>
        <div className="section-title-row"><h2>Notifications</h2></div>
        {!recentNotifications.length && <p>No notifications yet.</p>}
        {recentNotifications.map((item) => <div className="notification-row" key={item.id}>
          <div><strong>{item.title}</strong><br/><span>{item.body}</span></div>
          <small>{new Date(item.created_at).toLocaleString()}</small>
        </div>)}
      </section>
    </div>
  </main><Footer/></div></Layout>;
}
