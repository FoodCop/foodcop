// Local demo data for the profile visual scaffold - stands in for a real
// Supabase `users` row lookup, which is a follow-up pass.
export type DemoProfile = {
  name: string;
  handle: string;
  role: string;
  type: 'person' | 'restaurant';
  bites: number;
};

export const DEMO_PROFILES: Record<'person' | 'restaurant', DemoProfile> = {
  person: {
    name: 'Amara Singh',
    handle: 'amara.eats',
    role: 'Food Explorer',
    type: 'person',
    bites: 24,
  },
  restaurant: {
    name: "Maya's Spice Trail Kitchen",
    handle: 'spicetrailkitchen',
    role: 'Restaurant',
    type: 'restaurant',
    bites: 58,
  },
};
