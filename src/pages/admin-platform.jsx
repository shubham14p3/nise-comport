import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../layouts/header";
import Footer from "../layouts/footer";
import Layout from "../layouts";
import { adminApi, printApi } from "../features/print/api";
import "../assets/css/nise-platform.css";

export default function AdminPlatformPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [editors, setEditors] = useState({});
  const [coupon, setCoupon] = useState({ code: "", kind: "flat", value: 1000, minOrderPaise: 0, maxDiscountPaise: "" });
  const [state, setState] = useState({ loading: true, message: "", error: "" });

  const load = async () => {
    try {
      const [data, analyticsData] = await Promise.all([adminApi.config(), adminApi.analytics()]);
      setConfig(data.config);
      setAnalytics(analyticsData);
      setEditors(Object.fromEntries(Object.entries(data.config).map(([key,value]) => [key, JSON.stringify(value,null,2)])));
      setState({ loading: false, message: "", error: "" });
    } catch (error) {
      if (error.status === 401) return navigate("/login?returnTo=/admin/platform");
      if (error.status === 403) return navigate("/profile");
      setState({ loading: false, message: "", error: error.message });
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (key) => {
    try {
      const value = JSON.parse(editors[key]);
      await adminApi.updateConfig(key, value);
      setState({ loading: false, message: `${key} saved`, error: "" });
      setConfig((c) => ({ ...c, [key]: value }));
    } catch (error) { setState((s) => ({ ...s, message: "", error: error.message })); }
  };

  const createCoupon = async (event) => {
    event.preventDefault();
    try {
      await adminApi.createCoupon({
        ...coupon,
        value: Number(coupon.value),
        minOrderPaise: Number(coupon.minOrderPaise || 0),
        maxDiscountPaise: coupon.maxDiscountPaise ? Number(coupon.maxDiscountPaise) : null,
      });
      setState({ loading: false, message: `Coupon ${coupon.code.toUpperCase()} created`, error: "" });
      setCoupon({ code: "", kind: "flat", value: 1000, minOrderPaise: 0, maxDiscountPaise: "" });
    } catch (error) { setState((s) => ({ ...s, message: "", error: error.message })); }
  };

  return <Layout><div className="wrapper nise-platform"><Header/><main className="ops-shell">
    <div className="ops-hero"><div><span className="platform-kicker">NISE Owner</span><h1>Platform controls</h1><p>Change pricing and operational rules without touching code.</p></div></div>
    {state.error && <div className="form-error">{state.error}</div>}
    {state.message && <div className="loading-panel" style={{marginBottom:16}}>{state.message}</div>}
    {state.loading ? <div className="loading-panel">Loading platform settings…</div> : <>
      <div className="analytics-strip">
        <div><small>Customers</small><strong>{analytics?.summary?.customers || 0}</strong></div>
        <div><small>Orders · 30 days</small><strong>{analytics?.summary?.orders_30d || 0}</strong></div>
        <div><small>Paid value</small><strong>₹{((Number(analytics?.summary?.paid_value_paise || 0))/100).toFixed(0)}</strong></div>
        <div><small>Repeat customers</small><strong>{analytics?.summary?.repeat_customers || 0}</strong></div>
      </div>
      <div className="admin-grid">
      {Object.keys(config || {}).map((key) => <section className="dashboard-card" key={key}>
        <div className="section-title-row"><h2>{key.replaceAll("_"," ")}</h2><button className="primary-action" onClick={() => save(key)}>Save</button></div>
        <textarea className="json-editor" value={editors[key]} onChange={(e) => setEditors((x) => ({...x,[key]:e.target.value}))} />
      </section>)}
      <section className="dashboard-card">
        <div className="section-title-row"><h2>Create coupon</h2></div>
        <form onSubmit={createCoupon} style={{display:"grid",gap:12}}>
          <label>Code<input required value={coupon.code} onChange={(e)=>setCoupon({...coupon,code:e.target.value})}/></label>
          <label>Type<select value={coupon.kind} onChange={(e)=>setCoupon({...coupon,kind:e.target.value})}><option value="flat">Flat amount in paise</option><option value="percent">Percent</option></select></label>
          <label>Value<input type="number" min="1" required value={coupon.value} onChange={(e)=>setCoupon({...coupon,value:e.target.value})}/></label>
          <label>Minimum order (paise)<input type="number" min="0" value={coupon.minOrderPaise} onChange={(e)=>setCoupon({...coupon,minOrderPaise:e.target.value})}/></label>
          <label>Maximum discount (paise)<input type="number" min="0" value={coupon.maxDiscountPaise} onChange={(e)=>setCoupon({...coupon,maxDiscountPaise:e.target.value})}/></label>
          <button className="primary-action">Create coupon</button>
        </form>
      </section>
      <section className="dashboard-card">
        <div className="section-title-row"><h2>Shop QR</h2></div>
        <p>Print this at the counter: “Skip the queue — upload & pay online. Collect when ready.”</p>
        <img src={printApi.shopQrUrl()} alt="QR code to start a NISE print order" style={{width:220,maxWidth:"100%",background:"#fff"}}/>
        <div className="ops-actions"><a href={printApi.shopQrUrl()} download="nise-print-qr.svg">Download QR</a></div>
      </section>

      <section className="dashboard-card">
        <div className="section-title-row"><h2>Acquisition</h2></div>
        {(analytics?.sources || []).map((item)=><div className="ledger-row" key={item.source}><span>{item.source}</span><strong>{item.count}</strong></div>)}
      </section>
    </div></>}
  </main><Footer/></div></Layout>;
}
