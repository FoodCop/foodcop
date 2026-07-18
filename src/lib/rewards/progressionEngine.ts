// Pure gamification math for the compact 5-track/4-tier badge model. One
// counter per role (no multi-stat AND-conditions), threshold-based tiers.
import type { Role } from '@/types/rewards';

// Mirrors the 200-points-per-level constant in award_points() (supabase/
// migrations/20260719000000_points_and_gamification.sql) - points_level
// itself is always read from the DB (single source of truth); this is only
// used client-side to render the progress ring toward the next level.
export const POINTS_PER_LEVEL = 200;

const ROMAN_NUMERALS = ['0', 'I', 'II', 'III', 'IV'];

export function getLevelProgress(points: number): number {
  return (points % POINTS_PER_LEVEL) / POINTS_PER_LEVEL;
}

export function badgeProgress(threshold: number, count: number): number {
  return Math.max(0, Math.min(1, count / threshold));
}

export function isBadgeEarned(threshold: number, count: number): boolean {
  return count >= threshold;
}

export function roleEarnedCount(role: Role, counters: Record<string, number>): number {
  const count = counters[role.statKey] || 0;
  return role.badges.filter((b) => isBadgeEarned(b.threshold, count)).length;
}

export function roleRankLabel(role: Role, counters: Record<string, number>): string {
  const earned = roleEarnedCount(role, counters);
  return earned === 0 ? `${role.rankName} — Unranked` : `${role.rankName} ${ROMAN_NUMERALS[earned]}`;
}
