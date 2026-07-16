// Local demo data for the profile visual scaffold - stands in for a real
// Supabase `users` row lookup, which is a follow-up pass.
export type DemoProfile = {
  name: string;
  handle: string;
  role: string;
  type: 'person' | 'restaurant';
  followers: number;
  following: number;
  bites: number;
};

export const DEMO_PROFILES: Record<'person' | 'restaurant', DemoProfile> = {
  person: {
    name: 'Amara Singh',
    handle: 'amara.eats',
    role: 'Food Explorer',
    type: 'person',
    followers: 1204,
    following: 342,
    bites: 24,
  },
  restaurant: {
    name: "Maya's Spice Trail Kitchen",
    handle: 'spicetrailkitchen',
    role: 'Restaurant',
    type: 'restaurant',
    followers: 4821,
    following: 12,
    bites: 58,
  },
};
