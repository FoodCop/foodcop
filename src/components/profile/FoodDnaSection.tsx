'use client';

import { useEffect, useState } from 'react';

// Ported from the old app's dna.html ("FUZO — Taste Profile"): DNA score
// bars, the animated fingerprint radar, Flavor DNA + Top Cuisines bars, Food
// Stats counters, Match card, and Badges row. Uses the same demo/fallback
// values dna.html itself renders when there's no live Supabase session yet.
//
// Onboarding only ever collects cuisines/dietary/a quiz-derived personality
// result - nowhere near enough to honestly back DNA-axis scores, an
// exploration score, visit/review counters, or badges. So `personality`,
// `cuisines`, and `dietary` (when passed in) replace their sections with
// real data; everything else stays the original showcase content, tagged
// "Demo preview" so it doesn't read as this user's real activity.

export type FoodDnaRealData = {
  cuisines?: string[];
  dietary?: string[];
  personality?: { icon: string; title: string; desc: string } | null;
};

const REAL_CUISINE_COLORS = ['#7C3AED', '#F43F5E', '#22C55E', '#F59E0B', '#EF4444'];

const DNA_SCORES = [
  { key: 'adventure', label: 'Adventure', emoji: '🌍', iconBg: '#EDE8FF', from: '#7C3AED', to: '#A855F7', value: 85 },
  { key: 'luxury', label: 'Luxury', emoji: '⭐', iconBg: '#FFE8F0', from: '#F59E0B', to: '#FBBF24', value: 60 },
  { key: 'comfort', label: 'Comfort', emoji: '🍲', iconBg: '#FFE8F0', from: '#F43F5E', to: '#FB7185', value: 40 },
  { key: 'social', label: 'Social', emoji: '👥', iconBg: '#FFF5E0', from: '#F97316', to: '#FB923C', value: 75 },
  { key: 'health', label: 'Health', emoji: '🥗', iconBg: '#E8F5E9', from: '#22C55E', to: '#4ADE80', value: 30 },
];

const CUISINES = [
  { name: 'Indian', flag: '🇮🇳', pct: 78, color: '#7C3AED' },
  { name: 'Thai', flag: '🇹🇭', pct: 62, color: '#F43F5E' },
  { name: 'Mexican', flag: '🇲🇽', pct: 48, color: '#22C55E' },
  { name: 'Japanese', flag: '🇯🇵', pct: 40, color: '#F59E0B' },
  { name: 'Italian', flag: '🇮🇹', pct: 35, color: '#EF4444' },
];

const FLAVORS = [
  { name: 'Spicy', value: 2, color: '#E8472B' },
  { name: 'Savory', value: 2, color: '#F2A93B' },
  { name: 'Smoky', value: 2, color: '#8B7355' },
  { name: 'Tangy', value: 2, color: '#22C55E' },
  { name: 'Salty', value: 2, color: '#5B9BD5' },
  { name: 'Crunchy', value: 2, color: '#D4609A' },
  { name: 'Fresh', value: 2, color: '#4ADE80' },
  { name: 'Bitter', value: 2, color: '#6B7280' },
  { name: 'Creamy', value: 2, color: '#FCD34D' },
  { name: 'Sweet', value: 2, color: '#EC4899' },
];

const FOOD_EMOJI = ['🌶️', '🍛', '🧆', '🫕', '🍢', '🍗', '🌯', '🍜', '🧆', '🥙', '🫔', '🌮', '🥩', '🥩', '🥗', '🥗', '🍲', '🫚', '🫙', '🔥', '🔥', '🌶️', '🫕', '🍚'];

const RINGS = [
  { rx: 28, ry: 40, n: 4, fs: 18 },
  { rx: 56, ry: 78, n: 7, fs: 20 },
  { rx: 86, ry: 120, n: 11, fs: 22 },
  { rx: 118, ry: 162, n: 14, fs: 22 },
  { rx: 152, ry: 207, n: 17, fs: 24 },
  { rx: 186, ry: 248, n: 20, fs: 24 },
];
const CX = 220;
const CY = 280;

function getRingPoints() {
  const pts: { x: number; y: number; angle: number; fs: number }[] = [];
  RINGS.forEach((ring) => {
    for (let i = 0; i < ring.n; i++) {
      const t = (i / ring.n) * 2 * Math.PI - Math.PI / 2;
      const x = CX + ring.rx * Math.cos(t);
      const y = CY + ring.ry * Math.sin(t);
      const dx = -ring.rx * Math.sin(t);
      const dy = ring.ry * Math.cos(t);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      pts.push({ x, y, angle, fs: ring.fs });
    }
  });
  return pts;
}
const RING_POINTS = getRingPoints();

const STATS = [
  { emoji: '🍽️', target: 42, label: 'Restaurants Explored' },
  { emoji: '📝', target: 18, label: 'Reviews Written' },
  { emoji: '📍', target: 14, label: 'Avg Food Radius km' },
  { emoji: '📅', target: 23, label: 'Days Active This Month' },
];

const BADGES = [
  { emoji: '🌍', label: 'World Food Explorer', bg: 'linear-gradient(135deg,#4338CA,#6D28D9)' },
  { emoji: '🌶️', label: 'Spice Warrior', bg: 'linear-gradient(135deg,#DC2626,#EF4444)' },
  { emoji: '☕', label: 'Café Hunter', bg: 'linear-gradient(135deg,#92400E,#B45309)' },
  { emoji: '🍔', label: 'Burger Buff', bg: 'linear-gradient(135deg,#D97706,#F59E0B)' },
  { emoji: '🍣', label: 'Sushi Scout', bg: 'linear-gradient(135deg,#065F46,#059669)' },
  { emoji: '🍕', label: 'Pizza Fan', bg: 'linear-gradient(135deg,#1E3A5F,#2563EB)' },
];

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(ease * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

export default function FoodDnaSection({ cuisines, dietary, personality }: FoodDnaRealData = {}) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(t);
  }, []);

  const score = useCountUp(87, animate, 1400);
  const realCuisines = cuisines && cuisines.length > 0 ? cuisines.slice(0, 5) : null;

  return (
    <div>
      {personality && (
        <div className="section">
          <div className="section-title">Your Food Personality</div>
          <div className="personality-card">
            <div className="personality-card__icon">
              <img src={personality.icon} alt="" />
            </div>
            <div>
              <div className="personality-card__title">{personality.title}</div>
              <div className="personality-card__desc">{personality.desc}</div>
            </div>
          </div>
        </div>
      )}

      {dietary && dietary.length > 0 && (
        <div className="section">
          <div className="section-title">Dietary Preferences</div>
          <div className="dietary-chips">
            {dietary.map((d) => (
              <span className="dietary-chip" key={d}>
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="section" style={{ textAlign: 'center' }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          <span className="demo-tag">Demo preview</span>
        </div>
        <div className="score-icon">🔥</div>
        <div className="score-num" style={{ fontSize: 32 }}>
          {score}
        </div>
        <div className="score-label">Exploration Score</div>
      </div>

      <div className="section">
        <div className="section-title">
          Food DNA™<span className="demo-tag">Demo preview</span>
        </div>
        <div className="dna-grid">
          {DNA_SCORES.map((d) => (
            <div className="dna-row" key={d.key}>
              <div className="dna-label">
                <div className="icon" style={{ background: d.iconBg }}>
                  {d.emoji}
                </div>
                {d.label}
              </div>
              <div className="dna-track">
                <div
                  className="dna-fill"
                  style={{ width: animate ? `${d.value}%` : '0%', background: `linear-gradient(90deg,${d.from},${d.to})` }}
                />
              </div>
              <div className="dna-pct">{d.value}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col">
        <div className="half-section" style={{ background: '#0F0B1E' }}>
          <div className="half-title" style={{ color: '#fff', textAlign: 'center' }}>
            Food DNA™ Fingerprint<span className="demo-tag">Demo preview</span>
          </div>
          <Fingerprint animate={animate} />
        </div>

        <div className="half-section">
          <div className="half-title">
            Flavor DNA<span className="demo-tag">Demo preview</span>
          </div>
          <div className="flavor-rows">
            {FLAVORS.map((f) => (
              <div className="flavor-row" key={f.name}>
                <div className="flavor-row__head">
                  <span className="flavor-row__name">{f.name}</span>
                  <span className="flavor-row__val" style={{ color: f.color }}>
                    {f.value.toFixed(1)}
                  </span>
                </div>
                <div className="flavor-track">
                  <div
                    className="flavor-fill"
                    style={{ width: animate ? `${(f.value / 5) * 100}%` : '0%', background: `linear-gradient(90deg,${f.color}99,${f.color})` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <hr style={{ border: 'none', borderTop: '1px dashed #EDE8F5', margin: '20px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="half-title" style={{ marginBottom: 0 }}>
              Top Cuisines{!realCuisines && <span className="demo-tag">Demo preview</span>}
            </div>
            {!realCuisines && <span className="view-all">View all</span>}
          </div>
          {(realCuisines
            ? realCuisines.map((name, i) => ({ name, pct: 100 - i * 20, color: REAL_CUISINE_COLORS[i % REAL_CUISINE_COLORS.length] }))
            : CUISINES
          ).map((c, i) => (
            <div className="cuisine-row" key={c.name}>
              <div className="cuisine-rank">{i + 1}</div>
              {!realCuisines && <div className="cuisine-flag">{(c as (typeof CUISINES)[number]).flag}</div>}
              <div className="cuisine-info">
                <div className="cuisine-name">{c.name}</div>
                <div className="cuisine-bar-wrap">
                  <div className="cuisine-bar" style={{ width: animate ? `${c.pct}%` : '0%', background: c.color }} />
                </div>
              </div>
              {!realCuisines && <div className="cuisine-pct">{c.pct}%</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">
          Food Stats<span className="demo-tag">Demo preview</span>
        </div>
        <div className="stats-grid">
          {STATS.map((s) => (
            <StatItem key={s.label} {...s} animate={animate} />
          ))}
        </div>
      </div>

      <div className="match-card">
        <div className="match-header">
          <div>
            <div className="match-title">
              MATCHES YOU&rsquo;LL LOVE<span className="demo-tag" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>Demo preview</span>
            </div>
            <div className="match-sub">Based on your taste profile</div>
          </div>
          <div className="best-match">
            <div className="best-match-label">Best Match</div>
            <div className="best-match-pct">92%</div>
          </div>
        </div>
        <div className="match-content">
          <div className="match-thumb">🍛</div>
          <div className="match-info">
            <div className="match-name">The Spice Route</div>
            <div className="match-meta">Modern Indian · 2.1 km</div>
            <div className="match-tag">⭐ Highly matches your taste</div>
          </div>
          <button className="view-rest-btn" type="button">
            View
            <br />
            Restaurant
          </button>
        </div>
      </div>

      <div className="section">
        <div className="badges-header">
          <div className="section-title" style={{ marginBottom: 0 }}>
            Badges<span className="demo-tag">Demo preview</span>
          </div>
          <span className="view-all">View all</span>
        </div>
        <div className="badges-row">
          {BADGES.map((b) => (
            <div className="badge-item" key={b.label}>
              <div className="badge-circle" style={{ background: b.bg }}>
                {b.emoji}
              </div>
              <div className="badge-label">{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatItem({ emoji, target, label, animate }: { emoji: string; target: number; label: string; animate: boolean }) {
  const value = useCountUp(target, animate, 1000);
  return (
    <div className="stat-item">
      <div className="stat-icon">{emoji}</div>
      <div className="stat-num">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Fingerprint({ animate }: { animate: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, [animate]);

  return (
    <div className="fp-wrap">
      <div className="fp-glow" style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, #E8472B55, transparent)' }} />
      <svg className="fp-svg" viewBox="0 0 440 560" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="fp-cg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E8472B" stopOpacity=".25" />
            <stop offset="100%" stopColor="#E8472B" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={CX} cy={CY} rx={160} ry={210} fill="url(#fp-cg)" />
        {RINGS.map((ring, i) => (
          <ellipse
            key={i}
            cx={CX}
            cy={CY}
            rx={ring.rx}
            ry={ring.ry}
            fill="none"
            stroke="#E8472B"
            strokeWidth={1.5}
            opacity={0.15 + i * 0.04}
            strokeDasharray="3 4"
          />
        ))}
      </svg>
      <div className="fp-foods">
        {RING_POINTS.map((pt, i) => (
          <div
            key={i}
            className="food-item"
            title={FOOD_EMOJI[i % FOOD_EMOJI.length]}
            style={{
              left: `${(pt.x / 440) * 100}%`,
              top: `${(pt.y / 560) * 100}%`,
              fontSize: pt.fs,
              opacity: show ? 1 : 0,
              transform: `translate(-50%,-50%) rotate(${pt.angle.toFixed(1)}deg) scale(${show ? 1 : 0})`,
              transitionDelay: `${i * 14}ms`,
            }}
          >
            {FOOD_EMOJI[i % FOOD_EMOJI.length]}
          </div>
        ))}
      </div>
    </div>
  );
}
