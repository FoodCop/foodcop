'use client';

/**
 * ============================================================================
 * REWARDS VIEW — Level & Role Badge Tracks (real data)
 * ============================================================================
 *
 * Previously a 100%-local "Demo Simulator" with no real inputs (see
 * STATUS_REPORT.md). Now reads real points/level/counters from PointsService,
 * fed by publishing food cards and sharing them with friends (see
 * src/lib/services/foodCardService.ts's awardCardPoints and
 * src/components/profile/FoodCardDetailModal.tsx's share flow).
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ROLES } from '@/lib/rewards/gamificationData';
import { getLevelProgress, isBadgeEarned, badgeProgress, roleEarnedCount, roleRankLabel, POINTS_PER_LEVEL } from '@/lib/rewards/progressionEngine';
import { PointsService, type UserPointsStats } from '@/lib/services/pointsService';

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

export default function RewardsView() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserPointsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRole, setActiveRole] = useState(ROLES[0].key);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    PointsService.getUserStats(user.id).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) setStats(result.data);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="rewards-page text-center py-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const points = stats?.points ?? 0;
  const level = stats?.level ?? 1;
  const counters = stats?.counters ?? {};
  const pct = getLevelProgress(points);
  const activeRoleData = ROLES.find((r) => r.key === activeRole)!;
  const activeCount = counters[activeRoleData.statKey] || 0;
  const roleEarned = roleEarnedCount(activeRoleData, counters);
  const roleAccentStyle = { '--role-accent': activeRoleData.accent, '--role-accent-dark': activeRoleData.accentDark } as React.CSSProperties;

  return (
    <div className="rewards-page">
      {/* HEADER */}
      <header className="rewards-header">
        <h2 className="rewards-header__title">Rewards & Rank</h2>
        <p className="rewards-header__sub">Your level grows from every card you publish and share.</p>
      </header>

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
          <p className="rewards-level-info__rank">{roleRankLabel(activeRoleData, counters)}</p>
          <p className="rewards-level-info__xp">
            {points.toLocaleString()} pts &bull; {points % POINTS_PER_LEVEL}/{POINTS_PER_LEVEL} to next level
          </p>
          <div className="rewards-level-info__track">
            <div className="rewards-level-info__fill" style={{ width: `${pct * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ROLE SWITCHER */}
      <div className="rewards-role-row scout-hide-scrollbar">
        {ROLES.map((r) => (
          <button
            key={r.key}
            onClick={() => setActiveRole(r.key)}
            style={{ '--role-accent': r.accent, '--role-accent-dark': r.accentDark } as React.CSSProperties}
            className={`rewards-role-chip${activeRole === r.key ? ' is-active' : ''}`}
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
            const earned = isBadgeEarned(b.threshold, activeCount);
            const p = badgeProgress(b.threshold, activeCount);
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

                  <div className="rewards-req">
                    <div className={`rewards-req__labels${earned ? ' is-done' : ''}`}>
                      <span>{Math.min(activeCount, b.threshold)}/{b.threshold}</span>
                    </div>
                    <div className="rewards-req__bar">
                      <div className="rewards-req__fill" style={{ width: `${p * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
