'use client';

/**
 * ============================================================================
 * REWARDS VIEW — Level, Role Tracks, Badges & Achievements (Next.js Port)
 * ============================================================================
 *
 * Ported from legacy/fuzoapp/src/features/rewards/components/RewardsView.tsx
 * Key changes:
 *   - Tailwind classes replaced with src/scss/_rewards.scss (this app has no
 *     Tailwind; see the equivalent Scout port for the same reasoning)
 *   - framer-motion (toast enter/exit, simulator collapse) replaced with
 *     plain CSS transitions - no motion library in this app's dependencies
 *   - Badge/achievement emoji glyphs replaced with real SVG icons ported
 *     from FUZO_V3's rewards.html reference (public/SVG/...)
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, PartyPopper } from 'lucide-react';

import type { GamificationState } from '@/types/rewards';
import { XP_ACTIONS, OTHER_ACTIONS, MANUAL_FLAGS, ROLES, ACHIEVEMENTS } from '@/lib/rewards/gamificationData';
import {
  getLevel,
  getLevelProgress,
  reqProgress,
  isBadgeEarned,
  roleEarnedCount,
  roleRankLabel,
  getNewlyUnlockedKeys,
  XP_PER_LEVEL
} from '@/lib/rewards/progressionEngine';

const initialStats = () => ({
  restaurantsVisited: 0, placesSaved: 0, locationsPinned: 0, cuisinesExplored: 0,
  reviewsWritten: 0, photosUploaded: 0, videosUploaded: 0, recipesUploaded: 0,
  likesReceived: 0, followers: 0, helpfulVotes: 0, bookmarksReceived: 0, followsGiven: 0,
  neighborhoodsExplored: 0, hiddenGemsVisited: 0, citiesExplored: 0, countriesVisited: 0,
  kmTraveled: 0, monthsActive: 0, posts: 0, profileVisits: 0, likesOnPosts: 0,
  travelStoriesPosted: 0, tutorialsPublished: 0, reviewAvgLength: 0,
  cafesVisited: 0, pizzaPlaces: 0, sushiTimes: 0, burgerVisits: 0, spicyReviews: 0,
  dessertsShared: 0, veganVisits: 0, streetFoodCheckins: 0,
  tasteProfileComplete: false, topReviewerInCity: false,
  invitationOrQualityBlogger: false, communityRecognitionTravel: false,
  highEngagementRecipe: false, invitationOrQualityInstructor: false
});

const RingSvg = ({ fraction, size, stroke, color, trackColor }: { fraction: number, size: number, stroke: number, color: string, trackColor: string }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, fraction)));
  const center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
      <circle
        cx={center} cy={center} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
    </svg>
  );
};

interface Toast { id: number; title: string; reward: string; in: boolean }

export default function RewardsView() {
  const [state, setState] = useState<GamificationState>({
    xp: 0,
    stats: initialStats(),
    activeRole: 'explorer',
    earnedBefore: {}
  });

  const [simOpen, setSimOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastIdRef = useRef(0);

  const showToast = (title: string, reward: string) => {
    const id = ++toastIdRef.current;
    setToast({ id, title, reward, in: false });
    requestAnimationFrame(() => {
      setToast(prev => (prev?.id === id ? { ...prev, in: true } : prev));
    });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? { ...prev, in: false } : prev));
    }, 2600);
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3000);
  };

  const applyEffect = (effect: Record<string, number | boolean>) => {
    setState(prev => {
      const nextStats = { ...prev.stats };
      Object.keys(effect).forEach(k => {
        if (typeof effect[k] === 'number') {
          nextStats[k] = (nextStats[k] as number || 0) + (effect[k] as number);
        } else {
          nextStats[k] = effect[k];
        }
      });
      return { ...prev, stats: nextStats };
    });
  };

  const simulateXpAction = (key: string) => {
    const action = XP_ACTIONS.find(a => a.key === key);
    if (!action) return;
    setState(prev => ({ ...prev, xp: prev.xp + action.xp }));
    applyEffect(action.effect);
  };

  const simulateOtherAction = (key: string) => {
    const action = OTHER_ACTIONS.find(a => a.key === key);
    if (action) applyEffect(action.effect);
  };

  const toggleManualFlag = (key: string) => {
    setState(prev => ({
      ...prev,
      stats: { ...prev.stats, [key]: !prev.stats[key] }
    }));
  };

  // Check for new unlocks when state changes
  useEffect(() => {
    const { keys, unlocked } = getNewlyUnlockedKeys(state, ROLES, ACHIEVEMENTS);
    if (unlocked.length > 0) {
      setState(prev => ({ ...prev, earnedBefore: { ...prev.earnedBefore, ...keys } }));
      unlocked.forEach((u, i) => {
        setTimeout(() => showToast(u.title, u.reward), i * 1000);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stats, state.xp]);

  const level = getLevel(state.xp);
  const pct = getLevelProgress(state.xp);
  const activeRoleData = ROLES.find(r => r.key === state.activeRole)!;
  const roleEarned = roleEarnedCount(activeRoleData, state.stats);
  const roleAccentStyle = { '--role-accent': activeRoleData.accent, '--role-accent-dark': activeRoleData.accentDark } as React.CSSProperties;

  return (
    <div className="rewards-page">
      {/* HEADER */}
      <header className="rewards-header">
        <h2 className="rewards-header__title">Rewards & Rank</h2>
        <p className="rewards-header__sub">Your universal level grows from everything you do.</p>
      </header>

      {/* TOAST */}
      {toast && (
        <div className={`rewards-toast${toast.in ? ' is-in' : ''}`}>
          <span className="rewards-toast__emoji">🎉</span>
          <div className="rewards-toast__title">{toast.title} Unlocked!</div>
          <div className="rewards-toast__reward">{toast.reward}</div>
        </div>
      )}

      {/* LEVEL CARD */}
      <div className="rewards-level-card">
        <div className="rewards-level-ring">
          <RingSvg fraction={pct} size={80} stroke={8} color="#f2a93b" trackColor="#292524" />
          <div className="rewards-level-ring__face">
            <span className="rewards-level-ring__num">{level}</span>
            <span className="rewards-level-ring__tag">Level</span>
          </div>
        </div>
        <div className="rewards-level-info">
          <h3 className="rewards-level-info__name">Your Fuzo Progress</h3>
          <p className="rewards-level-info__rank">{roleRankLabel(activeRoleData, state.stats)}</p>
          <p className="rewards-level-info__xp">
            Taste Score: {state.xp.toLocaleString()} XP &bull; {state.xp % XP_PER_LEVEL}/{XP_PER_LEVEL} to next
          </p>
          <div className="rewards-level-info__track">
            <div className="rewards-level-info__fill" style={{ width: `${pct * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ROLE SWITCHER */}
      <div className="rewards-role-row scout-hide-scrollbar">
        {ROLES.map(r => (
          <button
            key={r.key}
            onClick={() => setState(prev => ({ ...prev, activeRole: r.key }))}
            style={{ '--role-accent': r.accent, '--role-accent-dark': r.accentDark } as React.CSSProperties}
            className={`rewards-role-chip${state.activeRole === r.key ? ' is-active' : ''}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* BADGE TRACK */}
      <div className="rewards-section">
        <div className="rewards-section__head">
          <h3 className="rewards-section__title">{activeRoleData.label} Badges</h3>
          <span className="rewards-section__count">{roleEarned}/{activeRoleData.badges.length} Earned</span>
        </div>

        <div className="rewards-badge-list">
          {activeRoleData.badges.map((b, i) => {
            const earned = isBadgeEarned(b, state.stats);
            return (
              <div key={i} className={`rewards-badge-card${earned ? ' is-earned' : ''}`} style={roleAccentStyle}>
                <div className="rewards-badge-card__icon">
                  <img src={b.icon} alt="" />
                </div>
                <div className="rewards-badge-card__body">
                  <div className="rewards-badge-card__top">
                    <span className="rewards-badge-card__title">{i + 1}. {b.title}</span>
                    <span className={`rewards-badge-card__state${earned ? ' is-earned' : ''}`}>
                      {earned ? 'Earned ✓' : 'Locked'}
                    </span>
                  </div>

                  {b.reqs.map((req, j) => {
                    const p = reqProgress(req, state.stats);
                    const isBool = req.target === true;
                    const valText = isBool ? (state.stats[req.stat] ? 'Done' : 'Not yet') : `${Math.min((state.stats[req.stat] as number) || 0, req.target as number)}/${req.target}`;
                    return (
                      <div className="rewards-req" key={j}>
                        <div className={`rewards-req__labels${p >= 1 ? ' is-done' : ''}`}>
                          <span>{p >= 1 ? '✓ ' : ''}{req.label}</span>
                          <span>{valText}</span>
                        </div>
                        <div className="rewards-req__bar">
                          <div className="rewards-req__fill" style={{ width: `${p * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}

                  <div className="rewards-badge-card__reward">
                    <PartyPopper size={12} /> Reward: {b.reward}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACHIEVEMENTS */}
      <div className="rewards-section">
        <div className="rewards-section__head">
          <h3 className="rewards-section__title">Milestones</h3>
          <span className="rewards-section__count">
            {ACHIEVEMENTS.filter(a => !a.future && (state.stats[a.stat!] as number || 0) >= a.target!).length}/{ACHIEVEMENTS.length - 1} Unlocked
          </span>
        </div>

        <div className="rewards-ach-grid">
          {ACHIEVEMENTS.map((a, i) => {
            if (a.future) {
              return (
                <div key={i} className="rewards-ach-card is-future">
                  <div className="rewards-ach-ring">
                    <RingSvg fraction={0} size={48} stroke={4} color="#e7e5e4" trackColor="#f5f5f4" />
                    <span className="rewards-ach-ring__icon"><img src={a.icon} alt="" /></span>
                  </div>
                  <h4 className="rewards-ach-card__title">{a.title}</h4>
                  <div className="rewards-ach-card__sub">Coming Soon</div>
                </div>
              );
            }
            const val = (state.stats[a.stat!] as number) || 0;
            const p = Math.max(0, Math.min(1, val / a.target!));
            const done = val >= a.target!;
            return (
              <div key={i} className={`rewards-ach-card${done ? ' is-done' : ' is-locked'}`}>
                <div className="rewards-ach-ring">
                  <RingSvg fraction={p} size={48} stroke={4} color={done ? '#f2a93b' : '#1c1917'} trackColor="#f5f5f4" />
                  <span className="rewards-ach-ring__icon"><img src={a.icon} alt="" /></span>
                </div>
                <h4 className="rewards-ach-card__title">{a.title}</h4>
                <div className="rewards-ach-card__sub">
                  {done ? 'Unlocked ✓' : `${Math.min(val, a.target!)}/${a.target}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIMULATOR */}
      <div className="rewards-sim">
        <button onClick={() => setSimOpen(!simOpen)} className="rewards-sim-toggle">
          <span>🧪 Demo Simulator (Local Only)</span>
          {simOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <div className={`rewards-sim-panel${simOpen ? ' is-open' : ''}`}>
          <div className="rewards-sim-panel__inner">
            <div>
              <h4 className="rewards-sim-group__label">XP Actions</h4>
              <div className="rewards-sim-btns">
                {XP_ACTIONS.map(a => (
                  <button key={a.key} onClick={() => simulateXpAction(a.key)} className="rewards-sim-btn rewards-sim-btn--xp">
                    {a.label} (+{a.xp})
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="rewards-sim-group__label">Other Actions (Feeds Badges)</h4>
              <div className="rewards-sim-btns">
                {OTHER_ACTIONS.map(a => (
                  <button key={a.key} onClick={() => simulateOtherAction(a.key)} className="rewards-sim-btn">
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="rewards-sim-group__label">Manual / Judgment Flags</h4>
              <div className="rewards-sim-btns">
                {MANUAL_FLAGS.map(f => (
                  <button key={f.key} onClick={() => toggleManualFlag(f.key)} className={`rewards-sim-btn rewards-sim-btn--flag${state.stats[f.key] ? ' is-on' : ''}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rewards-sim-reset">
              <button onClick={() => setState({ xp: 0, stats: initialStats(), activeRole: 'explorer', earnedBefore: {} })} className="rewards-sim-reset__btn">
                Reset Demo Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
