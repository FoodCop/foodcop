import React from 'react';

export default function Grow() {
  const cards = [
    { ico: '📢', title: 'Promote', desc: 'Reach customers who already love your cuisine with targeted, taste-based promotion.' },
    { ico: '📸', title: 'Moments', desc: 'Showcase your best dishes through beautiful food moments that live on customer profiles.' },
    { ico: '📅', title: 'Events', desc: 'Announce special menus, tasting nights and pop-up events directly to interested diners.' },
    { ico: '📈', title: 'Insights', desc: 'Understand exactly what brings customers through your door and how to keep them coming back.' },
  ];

  return (
    <section id="grow">
      <div className="sec-inner-p" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Head */}
        <div className="sr" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 64px' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>For Restaurants</div>
          <h2 className="sec-h" style={{ textAlign: 'center' }}>Helping Great Food<br />Get Discovered.</h2>
          <p className="sec-sub" style={{ margin: '16px auto 0', textAlign: 'center', maxWidth: '500px' }}>
            Whether you&apos;re a restaurant, café, chef or food truck — FUZO gives you the tools to grow your business.
          </p>
        </div>

        <div className="grow-inner">
          {/* Left: restaurant image + explore button */}
          <div className="sc d1">
            <div className="grow-hero-img">
              <img src="/v6/restaurant.png" alt="Restaurants on FUZO" />
              <a href="#final-cta" className="explore-btn">🍽️ Get Listed Free</a>
            </div>
          </div>

          {/* Right: vertical stacking cards */}
          <div className="vstack">
            {cards.map((c, i) => (
              <div key={c.title} className={`gcard-outer sr d${i + 1}`}>
                <div className="gcard">
                  <div className="gc-ico">{c.ico}</div>
                  <div className="gc-t">{c.title}</div>
                  <p className="gc-d">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
