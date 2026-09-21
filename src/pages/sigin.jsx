import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../layouts/header";
import Footer from "../layouts/footer";
import Layout from "../layouts";
import { authApi } from "../features/print/api";
import "../assets/css/nise-platform.css";

export default function Signin() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo") || "/profile";
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", mobile: "", identifier: "", password: "", marketingConsent: false, whatsappConsent: true });
  const [status, setStatus] = useState({ loading: false, error: "" });

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: "" });
    try {
      if (mode === "register") {
        await authApi.register({
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          password: form.password,
          marketingConsent: form.marketingConsent,
          whatsappConsent: form.whatsappConsent,
        });
      } else {
        await authApi.login({ identifier: form.identifier, password: form.password });
      }
      navigate(returnTo, { replace: true });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
      return;
    }
    setStatus({ loading: false, error: "" });
  };

  return <Layout><div className="wrapper nise-platform"><Header/><main className="auth-shell">
    <section className="auth-copy">
      <span className="platform-kicker">My NISE</span>
      <h1>One account for your print orders and everyday services.</h1>
      <p>Track work, keep your receipts and NISE Credit, and get notified when your order is ready.</p>
      <div className="auth-benefits"><span>✓ Order tracking</span><span>✓ NISE Credit wallet</span><span>✓ Pickup notifications</span><span>✓ Saved service history</span></div>
    </section>
    <section className="auth-card">
      <div className="auth-tabs">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button>
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Create account</button>
      </div>
      <form onSubmit={submit}>
        {mode === "register" && <>
          <label>Full name<input required autoComplete="name" value={form.name} onChange={set("name")} placeholder="Your name" /></label>
          <div className="auth-two"><label>Email<input type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@example.com" /></label><label>Mobile<input inputMode="tel" autoComplete="tel" value={form.mobile} onChange={set("mobile")} placeholder="10-digit mobile" /></label></div>
        </>}
        {mode === "login" && <label>Email or mobile<input required autoComplete="username" value={form.identifier} onChange={set("identifier")} placeholder="Email or mobile" /></label>}
        <label>Password<input required minLength="8" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={form.password} onChange={set("password")} placeholder="Minimum 8 characters" /></label>
        {mode === "register" && <div className="consent-box">
          <label className="check-line"><input type="checkbox" checked={form.whatsappConsent} onChange={set("whatsappConsent")} /><span>Send useful order/status updates on WhatsApp.</span></label>
          <label className="check-line"><input type="checkbox" checked={form.marketingConsent} onChange={set("marketingConsent")} /><span>I want occasional NISE offers. Optional.</span></label>
        </div>}
        {status.error && <div className="form-error">{status.error}</div>}
        <button className="primary-action" disabled={status.loading}>{status.loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create my account"}</button>
      </form>
      <p className="auth-footnote">Operational updates and marketing consent are kept separate. You can use NISE without opting into promotions.</p>
    </section>
  </main><Footer/></div></Layout>;
}
