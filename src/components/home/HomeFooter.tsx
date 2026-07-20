import React from 'react';

export default function HomeFooter() {
  return (
    <footer>
      <div className="foot-top">
        <div>
          <div className="foot-logo-wrap">
            <img src="/fuzo_logo.svg" alt="FUZO" />
          </div>
          <div className="foot-taglines" style={{ marginTop: '16px' }}>
            <span>Your Taste.</span>
            <span>Your Journey.</span>
            <span>Your Food World.</span>
          </div>
        </div>
        <div className="foot-cols">
          <div className="foot-col">
            <h4>Product</h4>
            <a href="#">Discover</a>
            <a href="#">Food Cards</a>
            <a href="#">Scout Maps</a>
            <a href="#">Tako AI</a>
          </div>
          <div className="foot-col">
            <h4>Restaurants</h4>
            <a href="#">Get Listed</a>
            <a href="#">Promote</a>
            <a href="#">Insights</a>
            <a href="#">Events</a>
          </div>
          <div className="foot-col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
          <div className="foot-col">
            <h4>Download</h4>
            <a href="#">App Store</a>
            <a href="#">Google Play</a>
            <div className="foot-soc" style={{ marginTop: '14px' }}>
              <a href="#" title="Instagram">📸</a>
              <a href="#" title="TikTok">🎵</a>
              <a href="#" title="LinkedIn">💼</a>
            </div>
          </div>
        </div>
      </div>
      <div className="foot-bot">
        <span>© 2025 FUZO. All rights reserved.</span>
        <span>Discover Food That Finds You.</span>
      </div>
    </footer>
  );
}
