import React from 'react';

export default function TasteProfile() {
  return (
    <>
      {/* ========================================
           DISCOVER YOUR TASTE — white section
      ======================================== */}
      <section id="taste-intro">
        <div className="ti-eyebrow">Your Taste · Your World</div>
        <h2 className="ti-h">Discover Your Taste.</h2>
        <p className="ti-sub">Find restaurants, cafés and hidden gems that match your unique taste — not just your location.</p>
        <div className="ti-btns">
          <a href="#final-cta" className="btn-cta">🍴 Discover Food That Finds You</a>
          <a href="#discover" className="btn-ghost" style={{ color: 'var(--ink)', borderColor: 'rgba(0,0,0,.2)' }}>Explore FUZO</a>
        </div>
      </section>

      {/* ========================================
           SEC 1 — TASTE PROFILE (warm bg)
      ======================================== */}
      <section id="taste">
        <div className="two-col sec-inner-p">
          {/* Copy */}
          <div className="sl">
            <div className="eyebrow" style={{ color: 'var(--gold)' }}>
              <span style={{ width: '22px', height: '1.5px', background: 'var(--gold)', display: 'block', flexShrink: 0 }}></span>
              Taste Profile
            </div>
            <h2 className="sec-h" style={{ color: '#fff' }}>Every Taste<br />Is Different.</h2>
            <p className="sec-sub" style={{ color: 'rgba(255,255,255,.55)' }}>
              No two people enjoy food the same way.<br />FUZO starts by learning yours.
            </p>
            <div className="feature-list" style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Cuisine preferences', 'Spice level & dietary needs', 'Budget & dining style', 'Favourite dishes & places'].map(item => (
                <div key={item} className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--sora)', fontSize: '.9rem', fontWeight: 300, color: 'rgba(255,255,255,.7)' }}>
                  <span style={{ color: 'var(--gold)', fontSize: '1rem' }}>✓</span> {item}
                </div>
              ))}
            </div>
            <a href="#final-cta" className="btn-cta" style={{ marginTop: '32px', display: 'inline-flex', fontSize: '.82rem', padding: '14px 34px' }}>
              Discover Food That Finds You
            </a>
          </div>

          {/* Right — Phone + DNA image */}
          <div className="srr d2" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '600px' }}>
            {/* DNA image behind */}
            <div style={{
              position: 'absolute', right: '-20px', top: 0, width: '260px', height: '420px',
              borderRadius: '24px', overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,.4)',
              animation: 'phoneHover 6s 1s ease-in-out infinite',
              transform: 'rotate(4deg)',
              zIndex: 1
            }}>
              <img src="/v6/food-card2.png" alt="Food DNA" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                background: 'rgba(0,0,0,.65)', borderRadius: '8px',
                padding: '5px 10px', fontFamily: 'var(--sora)',
                fontSize: '.6rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '.1em'
              }}>YOUR FOOD DNA</div>
            </div>

            {/* Taste profile phone — in front */}
            <div className="phone-wrap" style={{ position: 'relative', zIndex: 2 }}>
              <div className="phone-frame" style={{ width: '260px', height: '530px' }}>
                <div className="tp-top">
                  <h3>Your Taste Profile</h3>
                  <p>Tell us what you love</p>
                </div>
                <div className="tp-scroll">
                  <div>
                    <div className="tp-lbl">Cuisines You Love</div>
                    <div className="chips">
                      <div className="chip sel">🇯🇵 Japanese</div>
                      <div className="chip">🇮🇳 Indian</div>
                      <div className="chip sel">🇹🇭 Thai</div>
                      <div className="chip">🇮🇹 Italian</div>
                      <div className="chip g">🌮 Mexican</div>
                      <div className="chip">🇰🇷 Korean</div>
                      <div className="chip sel">☕ Café</div>
                    </div>
                  </div>
                  <div>
                    <div className="tp-lbl">Spice Level</div>
                    <div className="spice-row">
                      <div className="sdot">🧊</div>
                      <div className="sdot">🌿</div>
                      <div className="sdot on">🌶️</div>
                      <div className="sdot">🔥</div>
                      <div className="sdot">💀</div>
                    </div>
                  </div>
                  <div>
                    <div className="tp-lbl">Dietary</div>
                    <div className="chips">
                      <div className="chip sel">No restrictions</div>
                      <div className="chip">Vegetarian</div>
                      <div className="chip">Halal</div>
                    </div>
                  </div>
                  <div>
                    <div className="tp-lbl">Budget per meal</div>
                    <div className="bbar"><div className="bfill" id="bFill"></div></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontFamily: 'var(--sora)', fontSize: '.58rem', color: 'var(--gray2)' }}>$5</span>
                      <span style={{ fontFamily: 'var(--sora)', fontSize: '.6rem', fontWeight: 700, color: 'var(--cta2)' }}>~$25</span>
                      <span style={{ fontFamily: 'var(--sora)', fontSize: '.58rem', color: 'var(--gray2)' }}>$100+</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pop badges */}
              <div className="pop-badge" style={{ top: '-16px', left: '-44px', animationDelay: '.2s' }}>
                <span className="pb-e">🌶️</span><span>Medium Spice</span>
              </div>
              <div className="pop-badge" style={{ bottom: '60px', left: '-40px', animationDelay: '1.1s', animationDuration: '5.2s' }}>
                <span className="pb-e">💰</span><span>$25 avg</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
