// 5 role tracks, 4 tiers each (20 badges total) - one real counter per track,
// backed by user_stats.counters (see supabase/migrations/
// 20260719000000_points_and_gamification.sql). Badge titles/icons/accent
// colors borrow from the earlier 6-role legacy port where they fit a real
// counter; icon paths already exist in public/SVG/ from that earlier port.
import type { Role } from '@/types/rewards';

export const ROLES: Role[] = [
  {
    key: 'recipe', label: 'Recipe Creator', rankName: 'Recipe Rank', accent: '#B07FD4', accentDark: '#9560BC', statKey: 'recipe_cards',
    badges: [
      { icon: '/SVG/social/Book.svg', title: 'Home Cook', threshold: 1 },
      { icon: '/SVG/foodies/Professional Chef Male.svg', title: 'Recipe Builder', threshold: 5 },
      { icon: '/SVG/social/Fire.svg', title: 'Kitchen Expert', threshold: 15 },
      { icon: '/SVG/social/Star.svg', title: 'FUZO Master Chef', threshold: 30 },
    ],
  },
  {
    key: 'explorer', label: 'Food Explorer', rankName: 'Explorer Rank', accent: '#FF8C69', accentDark: '#F06B45', statKey: 'restaurant_cards',
    badges: [
      { icon: '/SVG/restaurant/Table Setting.svg', title: 'Curious Bite', threshold: 1 },
      { icon: '/SVG/foodies/Gourmet Walking Tour.svg', title: 'Local Explorer', threshold: 5 },
      { icon: '/SVG/social/Target.svg', title: 'City Food Hunter', threshold: 15 },
      { icon: '/SVG/social/Star.svg', title: 'FUZO Food Explorer', threshold: 30 },
    ],
  },
  {
    key: 'instructor', label: 'Cooking Instructor', rankName: 'Instructor Rank', accent: '#F0739B', accentDark: '#D8537E', statKey: 'video_cards',
    badges: [
      { icon: '/SVG/foodies/Video Instructions.svg', title: 'Mentor', threshold: 1 },
      { icon: '/SVG/social/Company.svg', title: 'Teacher', threshold: 5 },
      { icon: '/SVG/foodies/Professional Chef Male.svg', title: 'Instructor', threshold: 15 },
      { icon: '/SVG/social/Star.svg', title: 'FUZO Academy Mentor', threshold: 30 },
    ],
  },
  {
    key: 'blogger', label: 'Food Blogger', rankName: 'Blogger Rank', accent: '#F2B23E', accentDark: '#D9961E', statKey: 'discovery_cards',
    badges: [
      { icon: '/SVG/social/Camera.svg', title: 'First Post', threshold: 1 },
      { icon: '/SVG/foodies/Food Network.svg', title: 'Storyteller', threshold: 5 },
      { icon: '/SVG/social/Fire.svg', title: 'Community Voice', threshold: 15 },
      { icon: '/SVG/social/Star.svg', title: 'FUZO Featured Creator', threshold: 30 },
    ],
  },
  {
    key: 'connector', label: 'Community Connector', rankName: 'Connector Rank', accent: '#5E8FE0', accentDark: '#4570C4', statKey: 'cards_shared',
    badges: [
      { icon: '/SVG/social/Group.svg', title: 'First Share', threshold: 1 },
      { icon: '/SVG/map/Radar.svg', title: 'Connector', threshold: 5 },
      { icon: '/SVG/social/Earth.svg', title: 'Networker', threshold: 15 },
      { icon: '/SVG/social/Star.svg', title: 'Super Connector', threshold: 30 },
    ],
  },
];
