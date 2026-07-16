// Ported from legacy/fuzoapp/src/features/rewards/types/gamification.ts
// Change: `emoji: string` badge/achievement glyphs replaced with `icon: string`
// (a /SVG/... path into the icon set ported from FUZO_V3) - see gamificationData.ts.

export interface Requirement {
  label: string;
  stat: string;
  target: number | boolean;
}

export interface Badge {
  icon: string;
  title: string;
  reward: string;
  reqs: Requirement[];
}

export interface Role {
  key: string;
  label: string;
  rankName: string;
  accent: string;
  accentDark: string;
  badges: Badge[];
}

export interface Achievement {
  icon: string;
  title: string;
  stat: string | null;
  target: number | null;
  future?: boolean;
}

export interface GamificationState {
  xp: number;
  stats: Record<string, number | boolean>;
  activeRole: string;
  earnedBefore: Record<string, boolean>;
}

export interface XpAction {
  key: string;
  label: string;
  xp: number;
  effect: Record<string, number | boolean>;
}

export interface OtherAction {
  key: string;
  label: string;
  effect: Record<string, number | boolean>;
}

export interface ManualFlag {
  key: string;
  label: string;
}
