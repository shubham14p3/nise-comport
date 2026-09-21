import React, { useMemo, useState } from "react";
import SEO from "../components/seo";
import Header from "../layouts/header";
import Footer from "../layouts/footer";
import Layout from "../layouts";
import { calculatePrintPrice, printPricing } from "../data/printService";
import "../assets/css/print-service.css";

const PrintPage = () => {
  const [files, setFiles] = useState([]);
  const [bwPages, setBwPages] = useState(1);
  const [colourPages, setColourPages] = useState(0);
  const [fulfilment, setFulfilment] = useState("pickup");
  const pricing = useMemo(() => calculatePrintPrice({
    blackAndWhitePages: Number(bwPages) || 0,
    colourPages: Number(colourPages) || 0,
  }), [bwPages, colourPages]);

  return (
    <Layout>
      <SEO title="Online Printout in Telco, Jamshedpur | NISE COMPORT" />
      <div className="wrapper nise-print">
        <Header />
        <main>
          <section className="print-hero">
            <div className="container print-hero-grid">
              <div>
                <span className="print-kicker">NISE Print Online</span>
                <h1>Upload now. Print exactly what you need. Collect when it is ready.</h1>
                <p>Upload PDF, Word or image files, choose pages and print settings, see the price before ordering, and avoid waiting at the counter.</p>
                <div className="print-trust">
                  <span>Private files</span><span>Clear pricing</span><span>Pickup or delivery</span>
                </div>
              </div>
              <div className="print-price-card">
                <span>Black & white from</span>
                <strong>₹2/page</strong>
                <small>Volume pricing applies automatically.</small>
              </div>
            </div>
          </section>

          <section className="container print-builder">
            <div className="print-form-card">
              <div className="step-title"><span>1</span><div><h2>Add your files</h2><p>PDF, DOC, DOCX, JPG and PNG. Multiple files are welcome.</p></div></div>
              <label className="upload-zone">
                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                <strong>Choose files</strong>
                <span>or drop them here from your phone or computer</span>
              </label>
              {files.length > 0 && <div className="file-list">{files.map((file) => <div key={file.name}><span>{file.name}</span><small>{(file.size / 1024 / 1024).toFixed(2)} MB</small></div>)}</div>}

              <div className="step-title section-gap"><span>2</span><div><h2>Tell us what to print</h2><p>This first checkpoint previews pricing. Exact per-file page selection comes next.</p></div></div>
              <div className="print-options">
                <label>Black & white pages<input min="0" type="number" value={bwPages} onChange={(e) => setBwPages(e.target.value)} /></label>
                <label>Colour pages<input min="0" type="number" value={colourPages} onChange={(e) => setColourPages(e.target.value)} /></label>
              </div>

              <div className="step-title section-gap"><span>3</span><div><h2>How do you want it?</h2><p>Choose collection now; scheduling and delivery zones will attach to the order.</p></div></div>
              <div className="fulfilment-grid">
                <button className={fulfilment === "pickup" ? "selected" : ""} onClick={() => setFulfilment("pickup")}><strong>Shop pickup</strong><span>Choose a pickup slot</span></button>
                <button className={fulfilment === "delivery" ? "selected" : ""} onClick={() => setFulfilment("delivery")}><strong>Home delivery</strong><span>Local delivery, fee calculated at checkout</span></button>
              </div>
            </div>

            <aside className="order-summary">
              <span className="summary-label">Live estimate</span>
              <h2>Your print order</h2>
              <div><span>B&W ({bwPages || 0} pages × ₹{pricing.bwRate})</span><strong>₹{(Number(bwPages) || 0) * pricing.bwRate}</strong></div>
              <div><span>Colour ({colourPages || 0} pages × ₹{printPricing.colourPricePerPage})</span><strong>₹{(Number(colourPages) || 0) * printPricing.colourPricePerPage}</strong></div>
              <div className="summary-total"><span>Printing total</span><strong>₹{pricing.subtotal}</strong></div>
              <div className="wallet-preview"><span>You could earn</span><strong>₹{pricing.cashback} NISE Credit</strong><small>Credited after completed pickup/delivery.</small></div>
              <button className="continue-print" disabled={!files.length}>Continue to configure pages</button>
              <small className="summary-note">You will review the exact order before payment.</small>
            </aside>
          </section>
        </main>
        <Footer />
      </div>
    </Layout>
  );
};

export default PrintPage;
