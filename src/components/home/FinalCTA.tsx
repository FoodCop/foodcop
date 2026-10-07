import React from 'react';
import { Utensils } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section id="final-cta" style={{ background: 'var(--gold)', padding: '180px 48px', textAlign: 'center' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }} className="sr">
        <div className="eyebrow" style={{ color: 'var(--cta2)', justifyContent: 'center' }}>
          <span style={{ width: '22px', height: '1.5px', background: 'var(--cta2)', display: 'block', flexShrink: 0 }}></span>
          Get Started
        </div>
        <h2 className="fcta-h">Ready To Discover<br />Your Taste?</h2>
        <p className="fcta-sub">Create your Taste Profile today and start exploring restaurants you'll actually love.</p>
        <a href="#" className="btn-cta-lg"><Utensils size={17} className="hicon" /> Discover Food That Finds You</a>
      </div>
    </section>
  );
}
