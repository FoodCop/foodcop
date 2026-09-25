'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import type { DnaAxis } from '@/lib/recommendation/dna';
import type { FoodCardRecord, FlavorAxis } from '@/lib/types/foodCard';
import { useProfileKpis } from '@/lib/hooks/useProfileKpis';
import { DNA_AXES, DNA_PROFILE, computePersonality, type BadgeProgress } from '@/lib/profile/kpi/compute';
import DnaGlobe from './DnaGlobe';

// Food DNA tab - the "three stories" layout from the Profile KPI spec:
//   1. Who am I as a food person?   Personality + Fingerprint, Food DNA, Flavor DNA, Top Cuisines
//   2. How much have I explored?    Exploration Score + Food Stats
//   3. What have I achieved?        Badges
// Every number comes from src/lib/profile/kpi/compute.ts (pure, spec-driven);
// this file only renders it. Missing data shows an honest empty/CTA state,
// never showcase numbers.

export type FoodDnaRealData = {
  cuisines?: string[];
  dietary?: string[];
  personality?: { icon: string; title: string; desc: string } | null;
  dnaScores?: Record<DnaAxis, number> | null;
  /** Kept for callers that still pass it; the KPI engine reads its own signals now. */
  gamification?: { points: number; level: number; counters: Record<string, number> } | null;
  homeLocation?: { lat: number; lng: number } | null;
};

// Shared visual metadata per DNA axis - reused as-is by the real quiz's
// Results screen (src/components/dna-quiz/DnaQuizWizard.tsx).
export const DNA_AXIS_META: Record<DnaAxis, { label: string; emoji: string; iconBg: string; from: string; to: string }> = {
  adventure: { label: 'Adventure', emoji: '🌍', iconBg: '#EDE8FF', from: '#7C3AED', to: '#A855F7' },
  luxury: { label: 'Luxury', emoji: '⭐', iconBg: '#FFE8F0', from: '#F59E0B', to: '#FBBF24' },
  comfort: { label: 'Comfort', emoji: '🍲', iconBg: '#FFE8F0', from: '#F43F5E', to: '#FB7185' },
  social: { label: 'Social', emoji: '👥', iconBg: '#FFF5E0', from: '#F97316', to: '#FB923C' },
  health: { label: 'Health', emoji: '🥗', iconBg: '#E8F5E9', from: '#22C55E', to: '#4ADE80' },
};

// Shooting stars on the Food DNA hero's space backdrop. Staggered, co-prime-ish
// cycles so ~1-2 streak across per second without ever syncing up.
const SHOOTING_STARS = [
  { top: '8%', left: '6%', len: 120, dur: 3.1, delay: 0, angle: 18 },
  { top: '22%', left: '38%', len: 90, dur: 3.7, delay: 0.6, angle: 24 },
  { top: '55%', left: '12%', len: 100, dur: 4.3, delay: 1.3, angle: 14 },
  { top: '5%', left: '62%', len: 140, dur: 4.9, delay: 2.1, angle: 30 },
  { top: '70%', left: '44%', len: 80, dur: 3.4, delay: 2.7, angle: 20 },
  { top: '35%', left: '72%', len: 110, dur: 5.3, delay: 0.9, angle: 26 },
  { top: '80%', left: '2%', len: 95, dur: 4.1, delay: 3.4, angle: 12 },
];

// Flavor DNA's 10 axes (spec order + emoji). Colours are food-semantic, from the brand family.
const FLAVOR_META: { axis: FlavorAxis; name: string; emoji: string; color: string }[] = [
  { axis: 'spicy', name: 'Spicy', emoji: '🌶️', color: '#e8472b' },
  { axis: 'savory', name: 'Savoury', emoji: '🍖', color: '#f2a93b' },
  { axis: 'smoky', name: 'Smoky', emoji: '🔥', color: '#8b7355' },
  { axis: 'tangy', name: 'Tangy', emoji: '🍋', color: '#8fbb2a' },
  { axis: 'salty', name: 'Salty', emoji: '🧂', color: '#5b9bd5' },
  { axis: 'crunchy', name: 'Crunchy', emoji: '🥨', color: '#d4609a' },
  { axis: 'fresh', name: 'Fresh', emoji: '🥗', color: '#4ade80' },
  { axis: 'bitter', name: 'Bitter', emoji: '☕', color: '#6b7280' },
  { axis: 'creamy', name: 'Creamy', emoji: '🥛', color: '#e0b93c' },
  { axis: 'sweet', name: 'Sweet', emoji: '🍰', color: '#ec4899' },
];

const MEDALS = ['🥇', '🥈', '🥉', '4', '5'];

function useCountUp(target: number, active: boolean, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

export default function FoodDnaSection({
  cuisines,
  dietary,
  personality,
  dnaScores,
  myCards,
  userId,
  isOwner = true,
}: FoodDnaRealData & { myCards?: FoodCardRecord[]; userId?: string; isOwner?: boolean }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(t);
  }, []);

  const { kpis, preferredCuisines, isLoading } = useProfileKpis({
    userId,
    isOwner,
    cards: myCards ?? [],
    fallbackDnaScores: dnaScores ?? null,
    fallbackCuisines: cuisines ?? null,
  });

  const { stats, exploration, foodDna, flavorDna, topCuisines, foodStats, badges } = kpis;
  const persona = computePersonality(foodDna);
  const hasDna = !!foodDna.scores;

  return (
    <div className="fz-dna">
      {/* ── Personality + Fingerprint ─────────────────────────────────── */}
      <section className="fz-dna-hero">
        {/* Deep-space backdrop: star fields + shooting stars (pure CSS, decorative). */}
        <div className="fz-dna-hero__space" aria-hidden="true">
          {SHOOTING_STARS.map((star, i) => (
            <span
              key={i}
              className="fz-dna-hero__shooting"
              style={{
                top: star.top,
                left: star.left,
                width: star.len,
                '--shoot-dur': `${star.dur}s`,
                '--shoot-delay': `${star.delay}s`,
                '--shoot-angle': `${star.angle}deg`,
              } as CSSProperties}
            />
          ))}
        </div>
        <div className="fz-dna-hero__body">
          <div className="fz-dna-eyebrow fz-dna-eyebrow--on-dark">Your Food Personality</div>
          {persona && foodDna.scores ? (
            <>
              <h2 className="fz-dna-hero__title">
                <span aria-hidden>{DNA_PROFILE[persona.primary].emoji}</span> {DNA_PROFILE[persona.primary].primary}
              </h2>
              {persona.secondary && (
                <span className="fz-dna-hero__chip">
                  <span aria-hidden>{DNA_PROFILE[persona.secondary].emoji}</span> Also {DNA_PROFILE[persona.secondary].secondary}
                </span>
              )}
              <p className="fz-dna-hero__desc">{DNA_PROFILE[persona.primary].desc}</p>
              <p className="fz-dna-hero__quote">“{DNA_PROFILE[persona.primary].quote}”</p>
            </>
          ) : personality ? (
            <>
              <h2 className="fz-dna-hero__title">{personality.title}</h2>
              <p className="fz-dna-hero__desc">{personality.desc}</p>
            </>
          ) : (
            <>
              <h2 className="fz-dna-hero__title">Discover your Food DNA</h2>
              <p className="fz-dna-hero__desc">A 2-minute quiz maps your Adventurer, Comfort, Health, Luxury and Social sides - then your real activity keeps it up to date.</p>
            </>
          )}
          {isOwner && (
            <Link href="/dna-quiz" className="fz-dna-hero__cta">
              {hasDna ? 'Retake quiz' : 'Take the 2-min quiz →'}
            </Link>
          )}
        </div>

        {foodDna.scores && (
          <div className="fz-dna-hero__print">
            <div className="fz-dna-hero__print-label">DNA Fingerprint</div>
            <DnaGlobe
              animate={animate}
              ariaLabel="Food DNA fingerprint"
              axes={DNA_AXES.map((a) => ({
                label: DNA_PROFILE[a].label,
                emoji: DNA_PROFILE[a].emoji,
                value: (foodDna.scores as Record<DnaAxis, number>)[a] / 100,
              }))}
            />
          </div>
        )}
      </section>

      {dietary && dietary.length > 0 && (
        <div className="fz-dna-chips" aria-label="Dietary preferences">
          {dietary.map((d) => (
            <span className="fz-dna-chip" key={d}>{d}</span>
          ))}
        </div>
      )}

      {/* ── KPI tiles ─────────────────────────────────────────────────── */}
      <section className="fz-dna-tiles" aria-busy={isLoading}>
        <Tile emoji="📍" label="Places Explored" value={stats.placesExplored} animate={animate} index={0} />
        <Tile emoji="🌎" label="Cuisines Explored" value={stats.cuisinesExplored} animate={animate} index={1} />
        <Tile emoji="🔖" label="Food Cards Saved" value={stats.cardsSaved} animate={animate} index={2} />
        <Tile emoji="⭐" label="Reviews Posted" value={stats.reviewsPosted} animate={animate} index={3} />
        <Tile emoji="🎬" label="Content Created" value={stats.contentCreated} animate={animate} index={4} />
        <Tile emoji="🔗" label="Food Shared" value={stats.foodShared} animate={animate} index={5} />
      </section>

      {/* ── Story 1: who am I ─────────────────────────────────────────── */}
      <StoryHeading eyebrow="Identity" title="Who you are as a food person" note="Evolves slowly" />
      <div className="fz-dna-grid">
        <Card title="Food DNA" className="fz-dna-card--fill" aside={foodDna.scores && foodDna.behaviourWeight > 0 ? `${Math.round(foodDna.behaviourWeight * 100)}% from your activity` : undefined}>
          {foodDna.scores ? (
            <ul className="fz-dna-axes">
              {foodDna.ranked.map((axis, i) => {
                const pct = (foodDna.scores as Record<DnaAxis, number>)[axis];
                const role = i === 0 ? 'Primary' : persona?.secondary === axis ? 'Secondary' : null;
                return (
                  <li key={axis} className={`fz-dna-axis${i === 0 ? ' is-primary' : ''}`}>
                    <span className="fz-dna-axis__icon" aria-hidden>{DNA_PROFILE[axis].emoji}</span>
                    <div className="fz-dna-axis__main">
                      <div className="fz-dna-axis__top">
                        <span className="fz-dna-axis__name">
                          {DNA_PROFILE[axis].label}
                          {role && <span className="fz-dna-axis__role">{role}</span>}
                        </span>
                        <span className="fz-dna-axis__pct">{pct}<small>%</small></span>
                      </div>
                      <span className="fz-dna-track fz-dna-track--thick"><span className="fz-dna-fill" style={{ width: animate ? `${pct}%` : '0%' }} /></span>
                      <span className="fz-dna-axis__trait">{DNA_PROFILE[axis].trait}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty emoji="🧬" title="No Food DNA yet" sub={isOwner ? 'Take the quiz to see your five DNA scores.' : 'This member has not taken the quiz yet.'} />
          )}
        </Card>

        <Card title="Flavor DNA" className="fz-dna-card--fill">
          {flavorDna ? (
            <>
              {flavorDna.top.length > 0 && (
                <p className="fz-dna-note">
                  Your strongest flavours:{' '}
                  <strong>{flavorDna.top.map((a) => FLAVOR_META.find((f) => f.axis === a)?.name).join(' · ')}</strong>
                </p>
              )}
              <ul className="fz-dna-rings">
                {/* The engine's own top-3 leads (so ties match the "strongest flavours" line), then the rest by score. */}
                {[...FLAVOR_META]
                  .sort((a, b) => {
                    const ta = flavorDna.top.indexOf(a.axis);
                    const tb = flavorDna.top.indexOf(b.axis);
                    if (ta !== -1 || tb !== -1) return (ta === -1 ? 99 : ta) - (tb === -1 ? 99 : tb);
                    return flavorDna.scores[b.axis] - flavorDna.scores[a.axis];
                  })
                  .map((f) => (
                    <FlavorRing key={f.axis} emoji={f.emoji} name={f.name} pct={flavorDna.scores[f.axis]} color={f.color} isTop={flavorDna.top.includes(f.axis)} animate={animate} />
                  ))}
              </ul>
            </>
          ) : (
            <Empty emoji="🌶️" title="No Flavor DNA yet" sub="Pick flavours in onboarding, save dishes or publish a card and it builds itself." />
          )}
        </Card>

        <Card title="Top Cuisines" className="fz-dna-card--wide">
          {topCuisines.length > 0 ? (
            <ol className="fz-dna-cuisines">
              {topCuisines.map((c, i) => (
                <li key={c.name} className="fz-dna-cuisine">
                  <span className="fz-dna-cuisine__rank" aria-hidden>{MEDALS[i]}</span>
                  <span className="fz-dna-cuisine__name">{c.name}</span>
                  <span className="fz-dna-track"><span className="fz-dna-fill" style={{ width: animate ? `${c.score}%` : '0%' }} /></span>
                  <span className="fz-dna-cuisine__pct">{c.score}%</span>
                </li>
              ))}
            </ol>
          ) : preferredCuisines ? (
            <>
              <p className="fz-dna-note">Your preferred cuisines - visit or save places to see your real affinity.</p>
              <div className="fz-dna-chips">
                {preferredCuisines.slice(0, 8).map((c) => <span className="fz-dna-chip" key={c}>{c}</span>)}
              </div>
            </>
          ) : (
            <Empty emoji="🌎" title="No cuisine data yet" sub="Visit, save or review places and your top cuisines appear here." />
          )}
        </Card>
      </div>

      {/* ── Story 2: how much have I explored ─────────────────────────── */}
      <StoryHeading eyebrow="Activity" title="How much you’ve explored" note="Updates as you go" />
      <div className="fz-dna-grid">
        <ExplorationCard exploration={exploration} animate={animate} />
        <Card title="Food Stats">
          <div className="fz-dna-mini-tiles">
            <MiniTile label="Restaurants Explored" value={foodStats.restaurantsExplored} animate={animate} />
            <MiniTile label="Reviews Written" value={foodStats.reviewsWritten} animate={animate} />
            <MiniTile label={`Days Active in ${exploration.monthLabel}`} value={foodStats.daysActive} animate={animate} />
          </div>
          <p className="fz-dna-note fz-dna-note--foot">Only meaningful activity counts - saves, visits, reviews, shares and posts. Opening the app doesn’t.</p>
        </Card>
      </div>

      {/* ── Story 3: achievements ─────────────────────────────────────── */}
      <StoryHeading eyebrow="Achievements" title="What you’ve accomplished" action={<Link href="/rewards" className="fz-dna-link">View all rewards</Link>} />
      <BadgeShelf badges={badges} />

      {/* ── Next bite CTA ─────────────────────────────────────────────── */}
      <section className="fz-dna-next">
        <div>
          <div className="fz-dna-eyebrow fz-dna-eyebrow--on-dark">Your Next Bite</div>
          <p className="fz-dna-next__sub">We found places that match your Food DNA.</p>
        </div>
        <Link href="/scout" className="fz-dna-hero__cta fz-dna-hero__cta--solid">Explore Places →</Link>
      </section>
    </div>
  );
}

// ───────────────────────────── building blocks ─────────────────────────────

function StoryHeading({ eyebrow, title, note, action }: { eyebrow: string; title: string; note?: string; action?: React.ReactNode }) {
  return (
    <div className="fz-dna-story">
      <div>
        <div className="fz-dna-eyebrow">{eyebrow}{note ? <span className="fz-dna-eyebrow__note">· {note}</span> : null}</div>
        <h3 className="fz-dna-story__title">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function Card({ title, aside, className, children }: { title: string; aside?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`fz-dna-card${className ? ` ${className}` : ''}`}>
      <div className="fz-dna-card__head">
        <h4 className="fz-dna-card__title">{title}</h4>
        {aside && <span className="fz-dna-card__aside">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Empty({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div className="fz-empty-state">
      <div className="fz-empty-state__icon">{emoji}</div>
      <div className="fz-empty-state__title">{title}</div>
      <div className="fz-empty-state__sub">{sub}</div>
    </div>
  );
}

// Flip card: front = icon + label, back = the number. A mouse flips it on
// hover (and back on leave); touch/pen and keyboard toggle it on tap/Enter,
// since those have no hover. Native <button> keeps it keyboard-operable;
// aria-pressed tells assistive tech which side is showing. The count-up runs
// each time the back comes into view.
function Tile({ emoji, label, value, animate, index }: { emoji: string; label: string; value: number | null; animate: boolean; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const inputKind = useRef<'mouse' | 'other'>('other');
  const shown = useCountUp(value ?? 0, flipped && value != null, 900);
  return (
    <button
      type="button"
      className={`fz-dna-tile${flipped ? ' is-flipped' : ''}${animate ? ' is-in' : ''}`}
      style={{ ['--tile-i' as string]: index }}
      aria-pressed={flipped}
      aria-label={`${label}: ${flipped ? (value == null ? 'not available' : value) : 'activate to reveal'}`}
      onPointerEnter={(e) => {
        inputKind.current = e.pointerType === 'mouse' ? 'mouse' : 'other';
        if (e.pointerType === 'mouse') setFlipped(true);
      }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setFlipped(false); }}
      onPointerDown={(e) => { inputKind.current = e.pointerType === 'mouse' ? 'mouse' : 'other'; }}
      onKeyDown={() => { inputKind.current = 'other'; }}
      onBlur={() => { if (inputKind.current !== 'mouse') setFlipped(false); }}
      // A mouse click would otherwise flip the card straight back while hovering.
      onClick={() => { if (inputKind.current !== 'mouse') setFlipped((f) => !f); }}
    >
      <span className="fz-dna-tile__inner">
        <span className="fz-dna-tile__face fz-dna-tile__front">
          <span className="fz-dna-tile__icon" aria-hidden>{emoji}</span>
          <span className="fz-dna-tile__label">{label}</span>
          <span className="fz-dna-tile__hint" aria-hidden>
            <span className="fz-dna-tile__hint--touch">Tap to reveal</span>
            <span className="fz-dna-tile__hint--hover">Hover to reveal</span>
          </span>
        </span>
        <span className="fz-dna-tile__face fz-dna-tile__back" aria-hidden>
          <span className="fz-dna-tile__num">{value == null ? '—' : shown}</span>
          <span className="fz-dna-tile__label">{label}</span>
          {value == null && <span className="fz-dna-tile__hint">Only visible to the owner</span>}
        </span>
      </span>
    </button>
  );
}

function MiniTile({ label, value, animate }: { label: string; value: number; animate: boolean }) {
  const shown = useCountUp(value, animate);
  return (
    <div className="fz-dna-mini">
      <div className="fz-dna-mini__num">{shown}</div>
      <div className="fz-dna-mini__label">{label}</div>
    </div>
  );
}

// One flavour as a progress ring with its emoji in the centre. The top three
// get a tinted card so the "strongest flavours" line is visible at a glance.
const RING_R = 25;
const RING_C = 2 * Math.PI * RING_R;
function FlavorRing({ emoji, name, pct, color, isTop, animate }: { emoji: string; name: string; pct: number; color: string; isTop: boolean; animate: boolean }) {
  return (
    <li className={`fz-dna-ring${isTop ? ' is-top' : ''}`} style={{ ['--ring-color' as string]: color }} title={`${name} ${pct}%`}>
      <span className="fz-dna-ring__dial">
        <svg viewBox="0 0 60 60" aria-hidden>
          <circle className="fz-dna-ring__track" cx="30" cy="30" r={RING_R} />
          <circle
            className="fz-dna-ring__arc"
            cx="30"
            cy="30"
            r={RING_R}
            strokeDasharray={RING_C}
            strokeDashoffset={animate ? RING_C * (1 - pct / 100) : RING_C}
          />
        </svg>
        <span className="fz-dna-ring__emoji" aria-hidden>{emoji}</span>
      </span>
      <span className="fz-dna-ring__name">{name}</span>
      <span className="fz-dna-ring__pct">{pct}%</span>
    </li>
  );
}

function ExplorationCard({ exploration, animate }: { exploration: ReturnType<typeof useProfileKpis>['kpis']['exploration']; animate: boolean }) {
  const score = useCountUp(exploration.score, animate, 1300);
  const { deltaPct } = exploration;
  return (
    <Card title="Exploration Score">
      <div className="fz-dna-explore">
        <div className="fz-dna-explore__score">
          <span className="fz-dna-explore__num">{score}</span>
          <span className="fz-dna-explore__of">/ 100</span>
        </div>
        <div className="fz-dna-explore__meta">
          <div className="fz-dna-explore__month">This month · {exploration.monthLabel}</div>
          {deltaPct != null ? (
            <div className={`fz-dna-delta ${deltaPct >= 0 ? 'fz-dna-delta--up' : 'fz-dna-delta--down'}`}>
              {deltaPct >= 0 ? '↑' : '↓'} {Math.abs(deltaPct)}% from last month
            </div>
          ) : (
            <div className="fz-dna-delta">No score last month yet</div>
          )}
        </div>
      </div>
      <div className="fz-dna-bars fz-dna-bars--tight">
        {exploration.breakdown.map((row) => (
          <div className="fz-dna-bar" key={row.key}>
            <span className="fz-dna-bar__label">{row.label}</span>
            <span className="fz-dna-track"><span className="fz-dna-fill" style={{ width: animate ? `${(row.value / row.max) * 100}%` : '0%' }} /></span>
            <span className="fz-dna-bar__pct">{row.value}/{row.max}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BadgeShelf({ badges }: { badges: BadgeProgress[] }) {
  const earned = badges.filter((b) => b.earned);
  // Next-up: the closest unearned badge in each group, so progress feels reachable.
  const nextUp = Object.values(
    badges.filter((b) => !b.earned).reduce<Record<string, BadgeProgress>>((acc, b) => {
      const best = acc[b.group];
      if (!best || b.current / b.target > best.current / best.target) acc[b.group] = b;
      return acc;
    }, {}),
  );

  return (
    <div className="fz-dna-card">
      {earned.length === 0 && (
        <p className="fz-dna-note">No badges yet - your first is a few places away.</p>
      )}
      <div className="fz-dna-badges">
        {earned.map((b) => (
          <div className="fz-dna-badge fz-dna-badge--earned" key={b.id} title={b.requirement}>
            <span className="fz-dna-badge__icon" aria-hidden>{b.emoji}</span>
            <span className="fz-dna-badge__title">{b.title}</span>
            <span className="fz-dna-badge__req">{b.group}</span>
          </div>
        ))}
        {nextUp.map((b) => (
          <div className="fz-dna-badge fz-dna-badge--locked" key={b.id} title={b.requirement}>
            <span className="fz-dna-badge__icon" aria-hidden>{b.emoji}</span>
            <span className="fz-dna-badge__title">{b.title}</span>
            <span className="fz-dna-badge__req">{b.requirement}</span>
            <span className="fz-dna-badge__progress">
              <span style={{ width: `${Math.min(100, (b.current / b.target) * 100)}%` }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
