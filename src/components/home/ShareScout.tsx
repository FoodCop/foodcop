import React from 'react';

export default function ShareScout() {
  return (
    <>
      {/* ========================================
           SEC 4 — SHARE (vanilla)
      ======================================== */}
      <section id="share">
        <div className="two-col reverse sec-inner-p">
          <div className="srr">
            <div className="eyebrow">Share</div>
            <h2 className="sec-h">Share Your<br />Food Story.</h2>
            <p className="sec-sub">Beautiful food cards designed to be shared with friends, family and your community.</p>
            <div className="s-icons-row">
              <div className="s-ico" title="Instagram">📸</div>
              <div className="s-ico" title="WhatsApp">💬</div>
              <div className="s-ico" title="Messenger">📨</div>
              <div className="s-ico" title="Copy Link">🔗</div>
            </div>
          </div>
          <div className="share-vis sc d2">
            <div className="share-vis-img">
              <img src="/v6/sharing.png" alt="Share your food stories" />
            </div>
            <div className="story-float">
              <img src="/v6/food-card1.png" alt="Food story" />
            </div>
            <div className="share-pills">
              <div className="spill"><span>📸</span>Instagram</div>
              <div className="spill"><span>💬</span>WhatsApp</div>
              <div className="spill"><span>🔗</span>Copy</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
           SEC 5 — SCOUT MAPS (warm bg)
      ======================================== */}
      <section id="scout">
        <div className="two-col sec-inner-p">
          <div className="sl">
            <div className="eyebrow" style={{ color: 'var(--gold)' }}>
              <span style={{ width: '22px', height: '1.5px', background: 'var(--gold)', display: 'block', flexShrink: 0 }}></span>
              Scout Maps
            </div>
            <h2 className="sec-h" style={{ color: '#fff' }}>Explore Your<br />City Differently.</h2>
            <p className="sec-sub" style={{ color: 'rgba(255,255,255,.55)' }}>
              Find nearby restaurants that match your taste — not just the closest ones.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '28px' }}>
              {[
                { dot: 'var(--cta1)', text: 'Shin Ramen · 0.3km · 96% match', delay: '0s', dur: '5s' },
                { dot: 'var(--gold)', text: 'Sakura Café · 0.7km · 91% match', delay: '.5s', dur: '5.2s' },
                { dot: '#fff', text: 'El Taco Loco · 1.1km · 88% match', delay: '1s', dur: '4.8s' },
              ].map(pin => (
                <div key={pin.text} className="spin" style={{ animationDelay: pin.delay, animationDuration: pin.dur }}>
                  <span className="spin-dot" style={{ background: pin.dot }}></span>
                  {pin.text}
                </div>
              ))}
            </div>
          </div>

          <div className="scout-vis sc d2">
            <img src="/v6/map.png" alt="Scout map showing nearby restaurants" />
            <div className="scout-pin-list">
              <div className="spin"><span className="spin-dot" style={{ background: 'var(--cta2)' }}></span>Shin Ramen · 0.3km</div>
              <div className="spin"><span className="spin-dot" style={{ background: 'var(--gold)' }}></span>Sakura Café · 0.7km</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
