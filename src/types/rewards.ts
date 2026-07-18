// Compact gamification model: one real counter per role track (recipe_cards,
// restaurant_cards, video_cards, discovery_cards, cards_shared - see
// supabase/migrations/20260719000000_points_and_gamification.sql), 4 tiers
// each, no multi-stat AND-conditions. Replaces the earlier 6-role x 6-badge x
// 35-stat-counter demo model, which was never wired to real data.

export interface Badge {
  icon: string;
  title: string;
  threshold: number;
}

export interface Role {
  key: string;
  label: string;
  rankName: string;
  accent: string;
  accentDark: string;
  statKey: string;
  badges: Badge[];
}

export interface UserGamificationStats {
  points: number;
  level: number;
  counters: Record<string, number>;
}
