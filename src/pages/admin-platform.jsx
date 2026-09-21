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
  const [staff, setStaff] = useState([]);
  const [editors, setEditors] = useState({});
  const [coupon, setCoupon] = useState({ code: "", kind: "flat", value: 1000, minOrderPaise: 0, maxDiscountPaise: "" });
  const [staffForm, setStaffForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [state, setState] = useState({ loading: true, message: "", error: "" });

  const load = async () => {
    try {
      const [data, analyticsData, staffData] = await Promise.all([
        adminApi.config(),
        adminApi.analytics(),
        adminApi.staff(),
      ]);
      setConfig(data.config);
      setAnalytics(analyticsData);
      setStaff(staffData.staff || []);
      setEditors(Object.fromEntries(Object.entries(data.config).map(([key, value]) => [key, JSON.stringify(value, null, 2)])));
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
      setConfig((current) => ({ ...current, [key]: value }));
    } catch (error) {
      setState((current) => ({ ...current, message: "", error: error.message }));
    }
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
    } catch (error) {
      setState((current) => ({ ...current, message: "", error: error.message }));
    }
  };

  const createStaff = async (event) => {
    event.preventDefault();
    try {
      await adminApi.createStaff(staffForm);
      const refreshed = await adminApi.staff();
      setStaff(refreshed.staff || []);
      setStaffForm({ name: "", email: "", mobile: "", password: "" });
      setState({ loading: false, message: "Staff account created", error: "" });
    } catch (error) {
      setState((current) => ({ ...current, message: "", error: error.message }));
    }
  };

  const demoteStaff = async (id, name) => {
    if (!window.confirm(`Remove staff access for ${name}?`)) return;
    try {
      await adminApi.demoteStaff(id);
      setStaff((items) => items.filter((item) => item.id !== id));
      setState({ loading: false, message: `${name} no longer has staff access`, error: "" });
    } catch (error) {
      setState((current) => ({ ...current, message: "", error: error.message }));
    }
  };

  return <Layout><div className="wrapper nise-platform"><Header/><main className="ops-shell">
    <div className="ops-hero"><div><span className="platform-kicker">NISE Owner</span><h1>Platform controls</h1><p>Pricing, operations, staff access, offers and acquisition in one place.</p></div></div>
    {state.error && <div className="form-error">{state.error}</div>}
    {state.message && <div className="loading-panel" style={{marginBottom:16}}>{state.message}</div>}
    {state.loading ? <div className="loading-panel">Loading platform settings…</div> : <>
      <div className="analytics-strip">
        <div><small>Customers</small><strong>{analytics?.summary?.customers || 0}</strong></div>
        <div><small>Orders · 30 days</small><strong>{analytics?.summary?.orders_30d || 0}</strong></div>
        <div><small>Paid value</small><strong>₹{((Number(analytics?.summary?.paid_value_paise || 0)) / 100).toFixed(0)}</strong></div>
        <div><small>Repeat customers</small><strong>{analytics?.summary?.repeat_customers || 0}</strong></div>
      </div>

      <div className="admin-grid">
        <section className="dashboard-card">
          <div className="section-title-row"><h2>Staff accounts</h2></div>
          {staff.map((person) => <div className="ledger-row" key={person.id}>
            <div><strong>{person.name}</strong><br/><small>{person.email || person.mobile || "No contact"} · {person.role}</small></div>
            {person.role === "STAFF" && <button className="danger-link" type="button" style={{border:0,background:"transparent"}} onClick={() => demoteStaff(person.id, person.name)}>Remove access</button>}
          </div>)}
          <form onSubmit={createStaff} style={{display:"grid",gap:10,marginTop:14}}>
            <input required placeholder="Staff name" value={staffForm.name} onChange={(e)=>setStaffForm({...staffForm,name:e.target.value})}/>
            <div className="auth-two">
              <input type="email" placeholder="Email" value={staffForm.email} onChange={(e)=>setStaffForm({...staffForm,email:e.target.value})}/>
              <input inputMode="tel" placeholder="Mobile" value={staffForm.mobile} onChange={(e)=>setStaffForm({...staffForm,mobile:e.target.value})}/>
            </div>
            <input type="password" minLength="8" required placeholder="Temporary password (8+ characters)" value={staffForm.password} onChange={(e)=>setStaffForm({...staffForm,password:e.target.value})}/>
            <button className="primary-action">Create staff login</button>
          </form>
        </section>

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
          {!(analytics?.sources || []).length && <p>No acquisition data yet.</p>}
        </section>

        {Object.keys(config || {}).map((key) => <section className="dashboard-card" key={key}>
          <div className="section-title-row"><h2>{key.replaceAll("_"," ")}</h2><button className="primary-action" onClick={() => save(key)}>Save</button></div>
          <textarea className="json-editor" value={editors[key]} onChange={(e)=>setEditors((current) => ({...current,[key]:e.target.value}))}/>
        </section>)}
      </div>
    </>}
  </main><Footer/></div></Layout>;
}
