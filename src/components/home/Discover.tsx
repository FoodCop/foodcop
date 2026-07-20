import React from 'react';

export default function Discover() {
  return (
    <section id="discover">
      <div className="two-col reverse sec-inner-p">
        <div className="sl">
          <div className="eyebrow">Discover</div>
          <h2 className="sec-h">Discover More<br />Than Restaurants.</h2>
          <p className="sec-sub">Explore cafés, food trucks, bakeries, desserts and hidden gems curated around your taste.</p>
          <div className="cat-wrap">
            {['☕ Cafés', '🚚 Food Trucks', '🥐 Bakeries', '🍰 Desserts', '🍣 Fine Dining', '🌮 Street Food', '🍺 Bars & Pubs'].map(cat => (
              <div key={cat} className="cat-pill">{cat}</div>
            ))}
          </div>
        </div>
        <div className="discover-vis sc d2">
          <img src="/v6/discover.png" alt="Discover cafés and restaurants near you" />
          <div className="disc-overlay">
            <div className="do-icon">📍</div>
            <div className="do-text">
              <b>12 places match your taste</b>
              <span>Within 2km · Open now</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
