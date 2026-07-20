import React from 'react';

export default function TakoChat() {
  return (
    <section id="tako">
      <div className="two-col reverse sec-inner-p">
        {/* Tako phones */}
        <div className="tako-phones sc">
          {/* Left side phone */}
          <div className="tphone side" style={{ marginBottom: '32px' }}>
            <div className="tako-screen">
              <div className="ts-head">
                <div className="tshl">TAKO AI</div>
                <div className="tsht">Discover</div>
              </div>
              <div className="ts-body">
                <div className="ts-bubble ts-t">
                  <span className="tsn">TAKO</span>
                  Based on your taste, here are today&apos;s picks 🍽️
                </div>
                <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: '10px', overflow: 'hidden', marginTop: '4px' }}>
                  <img src="/v6/ramen.png" alt="Shin Ramen" style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'var(--sora)', fontSize: '.62rem', fontWeight: 700, color: '#fff' }}>Shin Ramen</div>
                    <div style={{ fontFamily: 'var(--sora)', fontSize: '.55rem', color: 'rgba(255,255,255,.5)', marginTop: '2px' }}>0.3km · 96% match · Open</div>
                  </div>
                </div>
                <div className="ts-bubble ts-t"><span className="tsn">TAKO</span>Want to book a table?</div>
              </div>
            </div>
          </div>

          {/* Main phone */}
          <div className="tphone main">
            <div className="tako-screen">
              <div className="ts-head">
                <div className="tshl">TAKO AI</div>
                <div className="tsht">Your Food Companion</div>
              </div>
              <div className="ts-body">
                <div className="ts-bubble ts-u">I&apos;m craving spicy ramen 🍜</div>
                <div className="ts-bubble ts-t">
                  <span className="tsn">TAKO</span>
                  Five hidden ramen spots nearby, all within 2km and open now 🎉
                </div>
                <div className="ts-bubble ts-u">Book the closest one!</div>
                <div className="ts-bubble ts-t">
                  <span className="tsn">TAKO</span>
                  Done ✅ Shin Ramen, 7:30pm. They know you like it extra spicy 🌶️
                </div>
                <div className="typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side phone */}
          <div className="tphone side" style={{ marginTop: '32px' }}>
            <div className="tako-screen">
              <div className="ts-head">
                <div className="tshl">TAKO AI</div>
                <div className="tsht">Weekly Picks</div>
              </div>
              <div className="ts-body">
                <div className="ts-bubble ts-t"><span className="tsn">TAKO</span>Your week in food 🍽️</div>
                {[
                  { emoji: '🍕', name: "Tony's Pizza", detail: 'Tue · Italian', highlight: false },
                  { emoji: '🥗', name: 'Green Bowl', detail: 'Thu · Healthy', highlight: false },
                  { emoji: '🍜', name: 'Shin Ramen · Tonight', detail: '7:30pm · Booked', highlight: true },
                ].map(item => (
                  <div key={item.name} style={{
                    background: item.highlight ? 'rgba(255,201,9,.15)' : 'rgba(255,255,255,.08)',
                    borderRadius: '9px', padding: '7px 9px', display: 'flex', alignItems: 'center', gap: '7px',
                    border: item.highlight ? '1px solid rgba(255,201,9,.3)' : 'none'
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>{item.emoji}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--sora)', fontSize: '.58rem', fontWeight: 700, color: item.highlight ? 'var(--gold)' : '#fff' }}>{item.name}</div>
                      <div style={{ fontFamily: 'var(--sora)', fontSize: '.52rem', color: 'rgba(255,255,255,.4)' }}>{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copy + chat */}
        <div className="srr">
          <div className="eyebrow" style={{ color: 'var(--cta2)' }}>
            <span style={{ width: '22px', height: '1.5px', background: 'var(--cta2)', display: 'block', flexShrink: 0 }}></span>
            Tako AI
          </div>
          <h2 className="sec-h">Meet Tako.</h2>
          <p className="sec-sub" style={{ color: 'rgba(0,0,0,.55)' }}>
            Your personal food companion that understands your cravings and helps you discover your next favourite meal.
          </p>
          {/* Chat animation */}
          <div className="tako-chat-wrap">
            <div className="tmsg u" id="tm1">I&apos;m craving spicy ramen 🍜</div>
            <div className="tmsg t" id="tm2"><span className="tn">TAKO</span>Here are five hidden ramen spots nearby — all open right now. Want me to book a table? 🎉</div>
            <div className="tmsg u" id="tm3">Yes! The closest one.</div>
            <div className="tmsg t" id="tm4"><span className="tn">TAKO</span>Done ✅ Shin Ramen, 0.3km, 7:30pm. They know you prefer extra spicy.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
