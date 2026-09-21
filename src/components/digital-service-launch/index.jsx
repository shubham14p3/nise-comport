import React from "react";
import { Link } from "react-router-dom";
import "../../assets/css/nise-platform.css";

export default function DigitalServiceLaunch() {
  return <section className="digital-home-hero">
    <div className="container digital-home-grid">
      <div className="digital-home-copy">
        <span className="platform-kicker">NISE COMPORT · Telco, Jamshedpur</span>
        <h1>One place for your everyday services.</h1>
        <p>Print online, track your request, and get experienced help for documentation, banking, insurance, travel and digital services.</p>
        <div className="digital-home-actions">
          <Link className="digital-primary" to="/print?src=homepage">Print online</Link>
          <Link className="digital-secondary" to="/all-services">Explore all services</Link>
        </div>
        <div className="digital-proof"><span>10+ years serving locally</span><span>Real shop · real staff</span><span>Online + walk-in</span></div>
      </div>

      <div className="digital-home-panel">
        <div className="digital-panel-head"><div><small>Skip the queue</small><h2>Start from your phone</h2></div><Link to="/profile">My NISE →</Link></div>
        <Link className="featured-service" to="/print?src=homepage-card"><div className="service-icon">P</div><div><strong>Print & Xerox online</strong><span>Upload · choose pages · pickup/delivery</span></div><b>→</b></Link>
        <div className="service-shortcuts">
          <Link to="/all-services"><strong>Certificates</strong><span>Income · residential · caste</span></Link>
          <Link to="/all-services"><strong>PAN & IDs</strong><span>Application assistance</span></Link>
          <Link to="/all-services"><strong>Insurance</strong><span>Bike · car · other help</span></Link>
          <Link to="/all-services"><strong>Banking</strong><span>Assisted digital services</span></Link>
        </div>
        <div className="track-strip"><span>Already placed an order?</span><Link to="/print/orders">Track status</Link></div>
      </div>
    </div>
  </section>;
}
