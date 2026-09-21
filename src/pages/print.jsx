import React, { useMemo, useState } from "react";
import SEO from "../components/seo";
import Header from "../layouts/header";
import Footer from "../layouts/footer";
import Layout from "../layouts";
import { calculatePrintPrice, printPricing } from "../data/printService";
import { parsePageSelection } from "../features/print/pageSelection";
import "../assets/css/print-service.css";

const makePrintFile = (file) => ({
  id: `${file.name}-${file.size}-${file.lastModified}`,
  file,
  totalPages: 1,
  selection: "1",
  colourSelection: "",
  copies: 1,
  sides: "single",
  paperSize: "A4",
});

const PrintPage = () => {
  const [files, setFiles] = useState([]);
  const [fulfilment, setFulfilment] = useState("pickup");
  const [pickupSlot, setPickupSlot] = useState("today-evening");

  const totals = useMemo(() => files.reduce((acc, item) => {
    const selected = parsePageSelection(item.selection, Number(item.totalPages) || 1);
    const colour = new Set(parsePageSelection(item.colourSelection, Number(item.totalPages) || 1));
    const copies = Math.max(1, Number(item.copies) || 1);
    selected.forEach((page) => {
      if (colour.has(page)) acc.colour += copies;
      else acc.bw += copies;
    });
    return acc;
  }, { bw: 0, colour: 0 }), [files]);

  const pricing = useMemo(() => calculatePrintPrice({
    blackAndWhitePages: totals.bw,
    colourPages: totals.colour,
  }), [totals]);

  const addFiles = (event) => {
    const next = Array.from(event.target.files || []).map(makePrintFile);
    setFiles((existing) => [...existing, ...next]);
    event.target.value = "";
  };

  const updateFile = (id, patch) => {
    setFiles((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const removeFile = (id) => setFiles((items) => items.filter((item) => item.id !== id));

  return (
    <Layout>
      <SEO title="Online Printout in Telco, Jamshedpur | NISE COMPORT" />
      <div className="wrapper nise-print">
        <Header />
        <main>
          <section className="print-hero">
            <div className="container print-hero-grid">
              <div>
                <span className="print-kicker">NISE Print Online · Jamshedpur</span>
                <h1>Send the file. Choose the pages. Collect it when it is ready.</h1>
                <p>Configure mixed colour and black-and-white pages from your phone, get a clear estimate, and skip the counter queue.</p>
                <div className="print-trust"><span>Private files</span><span>Page-level choices</span><span>Pickup or delivery</span><span>NISE Credit rewards</span></div>
              </div>
              <div className="print-price-card">
                <span>Black & white from</span><strong>₹2/page</strong><small>₹5 up to 10 pages · ₹3 for 11–50 · ₹2 above 50.</small>
              </div>
            </div>
          </section>

          <section className="container print-builder">
            <div className="print-form-card">
              <div className="step-title"><span>1</span><div><h2>Add your files</h2><p>PDF, DOC, DOCX, JPG and PNG. Add several files to one order.</p></div></div>
              <label className="upload-zone">
                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={addFiles} />
                <strong>Choose files</strong><span>Tap here from your phone or computer</span>
              </label>

              {files.map((item, index) => (
                <article className="print-file-card" key={item.id}>
                  <div className="print-file-head">
                    <div><span className="file-number">{index + 1}</span><strong>{item.file.name}</strong><small>{(item.file.size / 1024 / 1024).toFixed(2)} MB</small></div>
                    <button type="button" onClick={() => removeFile(item.id)}>Remove</button>
                  </div>
                  <div className="file-config-grid">
                    <label>Total pages <input type="number" min="1" value={item.totalPages} onChange={(e) => updateFile(item.id, { totalPages: e.target.value, selection: `1-${Math.max(1, Number(e.target.value) || 1)}` })} /></label>
                    <label>Pages to print <input value={item.selection} placeholder="1-5,8,10-14" onChange={(e) => updateFile(item.id, { selection: e.target.value })} /></label>
                    <label>Colour pages <input value={item.colourSelection} placeholder="e.g. 1,4-6" onChange={(e) => updateFile(item.id, { colourSelection: e.target.value })} /><small>Other selected pages print B&W.</small></label>
                    <label>Copies <input type="number" min="1" value={item.copies} onChange={(e) => updateFile(item.id, { copies: e.target.value })} /></label>
                    <label>Print sides <select value={item.sides} onChange={(e) => updateFile(item.id, { sides: e.target.value })}><option value="single">Single sided</option><option value="double">Double sided</option></select></label>
                    <label>Paper <select value={item.paperSize} onChange={(e) => updateFile(item.id, { paperSize: e.target.value })}><option>A4</option><option>A3</option></select></label>
                  </div>
                </article>
              ))}

              <div className="step-title section-gap"><span>2</span><div><h2>Collection</h2><p>Tell us how you want to receive the completed print job.</p></div></div>
              <div className="fulfilment-grid">
                <button type="button" className={fulfilment === "pickup" ? "selected" : ""} onClick={() => setFulfilment("pickup")}><strong>Shop pickup</strong><span>Get notified when ready</span></button>
                <button type="button" className={fulfilment === "delivery" ? "selected" : ""} onClick={() => setFulfilment("delivery")}><strong>Home delivery</strong><span>Local delivery fee at checkout</span></button>
              </div>
              {fulfilment === "pickup" && <label className="pickup-slot">Preferred pickup window<select value={pickupSlot} onChange={(e) => setPickupSlot(e.target.value)}><option value="today-evening">Today · Evening</option><option value="tomorrow-morning">Tomorrow · Morning</option><option value="tomorrow-evening">Tomorrow · Evening</option></select></label>}
            </div>

            <aside className="order-summary">
              <span className="summary-label">Live estimate</span><h2>Your print order</h2>
              <div><span>B&W ({totals.bw} sides × ₹{pricing.bwRate})</span><strong>₹{totals.bw * pricing.bwRate}</strong></div>
              <div><span>Colour ({totals.colour} sides × ₹{printPricing.colourPricePerPage})</span><strong>₹{totals.colour * printPricing.colourPricePerPage}</strong></div>
              <div className="summary-total"><span>Printing total</span><strong>₹{pricing.subtotal}</strong></div>
              <div className="wallet-preview"><span>You could earn</span><strong>₹{pricing.cashback} NISE Credit</strong><small>Added after completed pickup/delivery.</small></div>
              <button className="continue-print" disabled={!files.length}>Continue to login & checkout</button>
              <small className="summary-note">Final page detection, validation and payment will be server verified before ordering.</small>
            </aside>
          </section>
        </main>
        <Footer />
      </div>
    </Layout>
  );
};

export default PrintPage;
