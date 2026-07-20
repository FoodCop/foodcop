import React from 'react';

export default function FoodCards() {
  return (
    <section id="foodcards">
      <div className="two-col sec-inner-p">
        <div className="sl">
          <div className="eyebrow" style={{ color: 'var(--gold)' }}>
            <span style={{ width: '22px', height: '1.5px', background: 'var(--gold)', display: 'block', flexShrink: 0 }}></span>
            Food Cards
          </div>
          <h2 className="sec-h" style={{ color: '#fff' }}>Every Great Meal<br />Deserves To Be<br /><em>Remembered.</em></h2>
          <p className="sec-sub" style={{ color: 'rgba(255,255,255,.55)' }}>
            Save your favourite discoveries. Build your personal food collection. Come back anytime.
          </p>
          <div className="fc-icons">
            <div className="fc-icon-i"><span className="ico">❤️</span> Save</div>
            <div className="fc-icon-i"><span className="ico">📍</span> Location</div>
            <div className="fc-icon-i"><span className="ico">📤</span> Share</div>
            <div className="fc-icon-i"><span className="ico">📁</span> Collections</div>
          </div>
        </div>

        {/* Stacked food cards */}
        <div className="cards-stage sc d2" id="cardsStage">
          <div className="fcard" id="fc1" style={{ transform: 'rotate(-15deg) translate(-72px,44px)', zIndex: 1 }}>
            <img src="/v6/sushi.png" alt="Sushi" />
            <div className="fcard-meta"><b>Nobu Tokyo</b><span>Tokyo · Sushi</span></div>
          </div>
          <div className="fcard" id="fc2" style={{ transform: 'rotate(13deg) translate(72px,44px)', zIndex: 2 }}>
            <img src="/v6/restaurant.png" alt="Restaurant" />
            <div className="fcard-meta"><b>La Trattoria</b><span>NYC · Italian</span></div>
          </div>
          <div className="fcard" id="fc3" style={{ transform: 'rotate(-2deg)', zIndex: 3 }}>
            <img src="/v6/ramen.png" alt="Ramen" />
            <div className="hrt-badge">❤️ Saved</div>
            <div className="fcard-meta"><b>Shin Ramen</b><span>Your City</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
