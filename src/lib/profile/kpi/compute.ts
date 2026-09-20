// FUZO Profile KPI engine - pure functions, no I/O. Implements the "Profile KPI
// Architecture" spec (Exploration Score, Food DNA, Flavor DNA, Top Cuisines,
// Food Stats, Badges). The data layer (src/lib/services/profileKpiService.ts)
// gathers the inputs; nothing in here touches Supabase, so every formula can
// be unit-checked in isolation.
//
// Three stories, three update speeds (spec's "strongest recommendation"):
//   Identity     (slow)   Food DNA, Fingerprint, Flavor DNA, Top Cuisines
//   Activity     (fast)   Exploration Score, Food Stats
//   Achievement           Badges
//
// Where the spec leaves a number open, the choice is named and commented at its
// constant below - change the constant, not the formula.

import { familyOf, FLAVOR_AXES, type FlavorAxis, type FlavorVector, type FoodCardRecord } from '@/lib/types/foodCard';
import type { DnaAxis } from '@/lib/recommendation/dna';

// ─────────────────────────────── inputs ───────────────────────────────

/** A saved_items row, with the food card it points at resolved when it is one. */
export interface SavedSignal {
  itemType: string;
  createdAt: string;
  cuisine: string | null;
  card: FoodCardRecord | null;
}

/** A user_events row, with the food card resolved for card events. */
export interface EventSignal {
  type: 'card_viewed' | 'card_skipped' | 'search';
  createdAt: string;
  card: FoodCardRecord | null;
  query?: string;
}

export interface KpiInput {
  now: Date;
  /** Only the owner can read saves/shares/events/crews (RLS); for a visitor these are null = unavailable. */
  isOwner: boolean;
  /** The profile's own food_cards (drafts are ignored). */
  cards: FoodCardRecord[];
  saved: SavedSignal[] | null;
  /** content_shared: one entry per share, from points_ledger('share_card'). */
  shares: { createdAt: string }[] | null;
  events: EventSignal[];
  crewCount: number | null;
  rsvpCount: number | null;
  questionnaire: {
    dnaScores: Record<DnaAxis, number> | null;
    flavors: string[] | null;
    cuisines: string[] | null;
  };
}

// ─────────────────────────────── outputs ───────────────────────────────

export interface ExplorationBreakdownRow {
  key: 'restaurants' | 'cuisines' | 'areas' | 'diversity' | 'community';
  label: string;
  value: number;
  max: number;
}

export interface ExplorationScore {
  score: number;
  breakdown: ExplorationBreakdownRow[];
  previousScore: number;
  /** null when last month had no score to compare against. */
  deltaPct: number | null;
  monthLabel: string;
}

export interface FoodDna {
  /** Blended questionnaire + behaviour, 0-100 per axis. null until there is any data. */
  scores: Record<DnaAxis, number> | null;
  behaviour: Record<DnaAxis, number | null>;
  questionnaire: Record<DnaAxis, number> | null;
  /** 0-0.6: how much behaviour currently outweighs the questionnaire. */
  behaviourWeight: number;
  ranked: DnaAxis[];
}

export interface CuisineAffinity {
  name: string;
  score: number;
}

export interface BadgeProgress {
  id: string;
  group: 'Exploration' | 'Cuisine' | 'Flavour' | 'Social';
  emoji: string;
  title: string;
  requirement: string;
  current: number;
  target: number;
  earned: boolean;
}

export interface ProfileKpis {
  stats: {
    placesExplored: number;
    cuisinesExplored: number;
    cardsSaved: number | null;
    reviewsPosted: number;
    contentCreated: number;
    foodShared: number | null;
  };
  exploration: ExplorationScore;
  foodDna: FoodDna;
  flavorDna: { scores: Record<FlavorAxis, number>; top: FlavorAxis[]; behaviourWeight: number } | null;
  topCuisines: CuisineAffinity[];
  foodStats: { restaurantsExplored: number; reviewsWritten: number; daysActive: number };
  badges: BadgeProgress[];
}

// ─────────────────────────── constants (tunable) ───────────────────────────

export const DNA_AXES: DnaAxis[] = ['adventure', 'comfort', 'health', 'luxury', 'social'];

const EXPLORATION = {
  // Spec section 1: weights are the caps; points-per-unit are the spec's examples.
  restaurant: { perUnit: 5, cap: 35 },
  cuisine: { perUnit: 10, cap: 25 },
  area: { perUnit: 5, cap: 15 }, // spec gives no per-unit value; 3 new areas fills the bucket
  diversity: { cap: 15, fullAtDistinct: 6 }, // 6 distinct cuisines in a month = full marks
  community: { cap: 10 },
  communityPoints: { content: 1, photo: 1.5, review: 2, qualityReview: 1, share: 0.5 },
  qualityCaptionChars: 40,
  // A neighbourhood is approximated as a ~2 km grid cell (no geocoder in the
  // data path) - reads as "moved to a different part of town".
  areaCellDegrees: 0.02,
} as const;

const DNA_BLEND = {
  maxBehaviourWeight: 0.6, // spec: questionnaire 100% -> 40% over time
  signalsForMaxWeight: 25, // meaningful events before behaviour reaches its max weight
  minInteractions: 3, // below this an axis has no behaviour score yet (avoids 1-visit noise)
  premiumSaturation: 0.4, // 40% premium visits = Luxury 100
  healthSaturation: 0.5, // half of your food being diet/fresh tagged = Health 100
  shareSaturation: 10,
  crewSaturation: 3,
  rsvpSaturation: 3,
  secondaryMinScore: 50,
} as const;

// Spec "Event weighting": viewed 1x, liked 2x, saved 3x, reviewed 4x, visit 5x.
// FUZO has no separate "like" (a feed swipe-right IS a save), so 2x is used
// for the user's own published non-visit, non-review cards.
const FLAVOR_WEIGHT = { view: 1, ownContent: 2, save: 3, review: 4, visit: 5 } as const;
const FLAVOR_BLEND = { maxBehaviourWeight: 0.6, weightForMax: 30, questionnaireSelected: 85, questionnaireUnselected: 20, skipInfluence: 0.15, minSkips: 3 } as const;

// Onboarding flavour picks -> Flavor DNA axes (onboarding offers Umami/Sour/Cheesy, the KPI axes don't).
const ONBOARDING_FLAVOR_TO_AXIS: Record<string, FlavorAxis> = {
  sweet: 'sweet', spicy: 'spicy', savory: 'savory', umami: 'savory', tangy: 'tangy', sour: 'tangy',
  bitter: 'bitter', smoky: 'smoky', creamy: 'creamy', cheesy: 'creamy',
};

// Spec "Cuisine Affinity" weights. "Liked" has no data source in FUZO (see FLAVOR_WEIGHT),
// so it is omitted and the remaining weights are renormalised.
const CUISINE_WEIGHT = { visited: 40, saved: 25, reviewed: 10, searched: 10 } as const;

const HEALTH_SEARCH = /\b(health|healthy|salad|vegan|vegetarian|organic|light|low[- ]?cal|protein|fresh)\b/i;
const PREMIUM_PRICE = new Set(['$$$', '$$$$']);

// ─────────────────────────────── helpers ───────────────────────────────

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round = (n: number) => Math.round(n);
const norm = (s: string) => s.trim().toLowerCase();
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const dayKey = (d: Date) => `${monthKey(d)}-${String(d.getDate()).padStart(2, '0')}`;
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const cuisinesOf = (c: FoodCardRecord | null | undefined): string[] =>
  (c?.tags?.cuisine ?? []).map(norm).filter(Boolean);

const published = (cards: FoodCardRecord[]) => cards.filter((c) => c.status === 'PUBLISHED');

const hasCoords = (c: FoodCardRecord) => typeof c.lat === 'number' && typeof c.lng === 'number';

interface Visit {
  at: Date;
  place: string;
  area: string | null;
  cuisines: string[];
  card: FoodCardRecord;
}

/**
 * place_visited: a published restaurant-family card (visit / café / street food),
 * or a published review anchored to a place. Merely viewing a restaurant never
 * counts (spec: "meaningful exploration").
 */
function visitsOf(cards: FoodCardRecord[]): Visit[] {
  const out: Visit[] = [];
  for (const c of published(cards)) {
    const isVisit = familyOf(c.card_type) === 'restaurant';
    const isPlaceReview = c.card_type === 'FOOD_REVIEW' && (!!c.place_id || hasCoords(c));
    if (!isVisit && !isPlaceReview) continue;
    const place = c.place_id || (hasCoords(c) ? `${(c.lat as number).toFixed(3)},${(c.lng as number).toFixed(3)}` : `title:${norm(c.title)}`);
    const cell = EXPLORATION.areaCellDegrees;
    const area = hasCoords(c) ? `${Math.round((c.lat as number) / cell)}:${Math.round((c.lng as number) / cell)}` : null;
    out.push({ at: new Date(c.created_at), place, area, cuisines: cuisinesOf(c), card: c });
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Earliest date each key was seen - "new" always means first-ever, not first-this-month. */
function firstSeen(entries: { key: string; at: Date }[]): Map<string, Date> {
  const m = new Map<string, Date>();
  for (const e of entries) {
    const prev = m.get(e.key);
    if (!prev || e.at < prev) m.set(e.key, e.at);
  }
  return m;
}

const inMonth = (d: Date, year: number, month: number) => d.getFullYear() === year && d.getMonth() === month;
const countFirstsInMonth = (m: Map<string, Date>, year: number, month: number) =>
  [...m.values()].filter((d) => inMonth(d, year, month)).length;

// ───────────────────────── 1. exploration score ─────────────────────────

function explorationFor(input: KpiInput, visits: Visit[], year: number, month: number) {
  const places = firstSeen(visits.map((v) => ({ key: v.place, at: v.at })));
  const cuisines = firstSeen(visits.flatMap((v) => v.cuisines.map((c) => ({ key: c, at: v.at }))));
  const areas = firstSeen(visits.filter((v) => v.area).map((v) => ({ key: v.area as string, at: v.at })));

  const restaurants = clamp(countFirstsInMonth(places, year, month) * EXPLORATION.restaurant.perUnit, 0, EXPLORATION.restaurant.cap);
  const cuisine = clamp(countFirstsInMonth(cuisines, year, month) * EXPLORATION.cuisine.perUnit, 0, EXPLORATION.cuisine.cap);
  const area = clamp(countFirstsInMonth(areas, year, month) * EXPLORATION.area.perUnit, 0, EXPLORATION.area.cap);

  // Food Diversity: distinct cuisines touched this month across visits, saves and own content.
  const touched = new Set<string>();
  for (const v of visits) if (inMonth(v.at, year, month)) v.cuisines.forEach((c) => touched.add(c));
  for (const c of published(input.cards)) if (inMonth(new Date(c.created_at), year, month)) cuisinesOf(c).forEach((x) => touched.add(x));
  for (const s of input.saved ?? []) {
    if (!inMonth(new Date(s.createdAt), year, month)) continue;
    (s.card ? cuisinesOf(s.card) : s.cuisine ? [norm(s.cuisine)] : []).forEach((x) => touched.add(x));
  }
  const diversity = EXPLORATION.diversity.cap * clamp(touched.size / EXPLORATION.diversity.fullAtDistinct, 0, 1);

  // Community: quality-weighted contribution, not raw volume.
  const P = EXPLORATION.communityPoints;
  let community = 0;
  for (const c of published(input.cards)) {
    if (!inMonth(new Date(c.created_at), year, month)) continue;
    community += P.content;
    if (c.image_url) community += P.photo;
    if (c.card_type === 'FOOD_REVIEW') {
      community += P.review;
      if ((c.caption ?? '').trim().length >= EXPLORATION.qualityCaptionChars) community += P.qualityReview;
    }
  }
  for (const s of input.shares ?? []) if (inMonth(new Date(s.createdAt), year, month)) community += P.share;
  community = clamp(community, 0, EXPLORATION.community.cap);

  const breakdown: ExplorationBreakdownRow[] = [
    { key: 'restaurants', label: 'New restaurants', value: round(restaurants), max: EXPLORATION.restaurant.cap },
    { key: 'cuisines', label: 'New cuisines', value: round(cuisine), max: EXPLORATION.cuisine.cap },
    { key: 'areas', label: 'New areas', value: round(area), max: EXPLORATION.area.cap },
    { key: 'diversity', label: 'Food diversity', value: round(diversity), max: EXPLORATION.diversity.cap },
    { key: 'community', label: 'Community', value: round(community), max: EXPLORATION.community.cap },
  ];
  return { breakdown, score: breakdown.reduce((s, r) => s + r.value, 0) };
}

export function computeExplorationScore(input: KpiInput): ExplorationScore {
  const visits = visitsOf(input.cards);
  const y = input.now.getFullYear();
  const m = input.now.getMonth();
  const cur = explorationFor(input, visits, y, m);
  const prevDate = new Date(y, m - 1, 1);
  const prev = explorationFor(input, visits, prevDate.getFullYear(), prevDate.getMonth());
  return {
    score: cur.score,
    breakdown: cur.breakdown,
    previousScore: prev.score,
    deltaPct: prev.score > 0 ? round(((cur.score - prev.score) / prev.score) * 100) : null,
    monthLabel: input.now.toLocaleString('en-US', { month: 'long' }),
  };
}

// ───────────────────────────── 2. food dna ─────────────────────────────

function behaviourScores(input: KpiInput, visits: Visit[]): { scores: Record<DnaAxis, number | null>; signals: number } {
  const own = published(input.cards);
  const savedCards = (input.saved ?? []).map((s) => s.card).filter((c): c is FoodCardRecord => !!c);
  const shares = input.shares?.length ?? 0;
  const searches = input.events.filter((e) => e.type === 'search');
  const skips = input.events.filter((e) => e.type === 'card_skipped').length;
  const views = input.events.filter((e) => e.type === 'card_viewed').length;
  const signals = visits.length + (input.saved?.length ?? 0) + own.length + shares + skips + views;

  const scores: Record<DnaAxis, number | null> = { adventure: null, comfort: null, health: null, luxury: null, social: null };

  // Adventurer: new cuisines + unfamiliar (not-yet-repeated) restaurants.
  const uniquePlaces = new Set(visits.map((v) => v.place)).size;
  const cuisineSet = new Set<string>([...visits.flatMap((v) => v.cuisines), ...savedCards.flatMap(cuisinesOf), ...(input.saved ?? []).filter((s) => !s.card && s.cuisine).map((s) => norm(s.cuisine as string))]);
  if (visits.length + cuisineSet.size >= DNA_BLEND.minInteractions) {
    const novelty = visits.length ? uniquePlaces / visits.length : 0;
    scores.adventure = round(100 * (0.5 * novelty + 0.5 * clamp(cuisineSet.size / 10, 0, 1)));
  }

  // Comfort: returning to the same places / sticking to one cuisine.
  if (visits.length >= DNA_BLEND.minInteractions) {
    const repeat = 1 - uniquePlaces / visits.length;
    const counts = new Map<string, number>();
    for (const v of visits) for (const c of v.cuisines) counts.set(c, (counts.get(c) ?? 0) + 1);
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    const topShare = total ? Math.max(...counts.values()) / total : 0;
    scores.comfort = round(100 * (0.6 * clamp(repeat / 0.5, 0, 1) + 0.4 * topShare));
  }

  // Health: share of food you engage with that is diet-tagged / fresh, plus healthy searches.
  const engaged = [...visits.map((v) => v.card), ...savedCards, ...own];
  const healthySearches = searches.filter((s) => s.query && HEALTH_SEARCH.test(s.query)).length;
  if (engaged.length >= DNA_BLEND.minInteractions || healthySearches > 0) {
    const healthy = engaged.filter((c) => (c.tags?.diet?.length ?? 0) > 0 || (c.flavor_profile?.fresh ?? 0) >= 4).length;
    const share = engaged.length ? healthy / engaged.length : 0;
    scores.health = round(clamp(100 * clamp(share / DNA_BLEND.healthSaturation, 0, 1) + healthySearches * 5, 0, 100));
  }

  // Luxury: share of price-tagged places/saves that are premium.
  const priced = [...visits.map((v) => v.card), ...savedCards].filter((c) => !!c.tags?.price_level);
  if (priced.length >= 1) {
    const premium = priced.filter((c) => PREMIUM_PRICE.has(c.tags.price_level as string)).length;
    scores.luxury = round(100 * clamp(premium / priced.length / DNA_BLEND.premiumSaturation, 0, 1));
  }

  // Social: shares + crews + group outings. Needs owner-only data, so unknown for visitors.
  if (input.shares !== null && input.crewCount !== null) {
    const s = 50 * clamp(shares / DNA_BLEND.shareSaturation, 0, 1)
      + 30 * clamp(input.crewCount / DNA_BLEND.crewSaturation, 0, 1)
      + 20 * clamp((input.rsvpCount ?? 0) / DNA_BLEND.rsvpSaturation, 0, 1);
    scores.social = round(s);
  }

  return { scores, signals };
}

export function computeFoodDna(input: KpiInput): FoodDna {
  const visits = visitsOf(input.cards);
  const { scores: behaviour, signals } = behaviourScores(input, visits);
  const q = input.questionnaire.dnaScores;
  const bw = DNA_BLEND.maxBehaviourWeight * clamp(signals / DNA_BLEND.signalsForMaxWeight, 0, 1);

  const hasBehaviour = DNA_AXES.some((a) => behaviour[a] !== null);
  if (!q && !hasBehaviour) return { scores: null, behaviour, questionnaire: null, behaviourWeight: 0, ranked: [] };

  const scores = {} as Record<DnaAxis, number>;
  for (const axis of DNA_AXES) {
    const qv = q ? q[axis] : null;
    const bv = behaviour[axis];
    if (qv != null && bv != null) scores[axis] = round((1 - bw) * qv + bw * bv);
    else scores[axis] = round((qv ?? bv) ?? 0);
  }
  const ranked = [...DNA_AXES].sort((a, b) => scores[b] - scores[a]);
  return { scores, behaviour, questionnaire: q, behaviourWeight: q ? bw : 1, ranked };
}

// Spec: primary "The Adventurer", secondary "The Social Explorer".
export const DNA_PROFILE: Record<DnaAxis, { emoji: string; label: string; primary: string; secondary: string; trait: string; desc: string; quote: string }> = {
  adventure: { emoji: '🧭', label: 'Adventurer', primary: 'The Adventurer', secondary: 'The Curious Explorer', trait: 'Tries new cuisines and places', desc: 'You chase new cuisines, unfamiliar places and bold flavours.', quote: 'You’d rather try something unfamiliar than order the same thing twice.' },
  comfort: { emoji: '🏠', label: 'Comfort', primary: 'The Comfort Seeker', secondary: 'The Loyal Regular', trait: 'Returns to trusted favourites', desc: 'You know what feels like home and you go back for it.', quote: 'The best meal is the one that feels familiar.' },
  health: { emoji: '🥗', label: 'Health', primary: 'The Mindful Eater', secondary: 'The Wellness Seeker', trait: 'Leans fresh and nutritious', desc: 'You choose food that makes you feel good, without giving up flavour.', quote: 'You read the menu for what makes you feel good, not just what sounds good.' },
  luxury: { emoji: '✨', label: 'Luxury', primary: 'The Connoisseur', secondary: 'The Refined Palate', trait: 'Drawn to premium dining', desc: 'Premium ingredients and elevated experiences - the meal is the occasion.', quote: 'A tasting menu beats a quick bite, every time.' },
  social: { emoji: '🥂', label: 'Social', primary: 'The Social Foodie', secondary: 'The Social Explorer', trait: 'Eats out with people', desc: 'Food is how you connect - sharing plates, swapping tips, planning outings.', quote: 'A great meal is even better with people around the table.' },
};

export function computePersonality(dna: FoodDna) {
  if (!dna.scores || dna.ranked.length === 0) return null;
  const [p, s] = dna.ranked;
  const secondary = s && dna.scores[s] >= DNA_BLEND.secondaryMinScore ? s : null;
  return { primary: p, secondary };
}

// ───────────────────────────── 3. flavor dna ─────────────────────────────

const asFlavorVector = (v: Partial<FlavorVector> | null | undefined): FlavorVector | null => {
  if (!v) return null;
  const vec = {} as FlavorVector;
  let any = false;
  for (const a of FLAVOR_AXES) {
    const n = Number(v[a] ?? 0);
    vec[a] = Number.isFinite(n) ? n : 0;
    if (vec[a] > 0) any = true;
  }
  return any ? vec : null;
};

export function computeFlavorDna(input: KpiInput): ProfileKpis['flavorDna'] {
  const pos = { sum: {} as Record<FlavorAxis, number>, weight: 0 };
  const skip = { sum: {} as Record<FlavorAxis, number>, n: 0 };
  for (const a of FLAVOR_AXES) { pos.sum[a] = 0; skip.sum[a] = 0; }

  const add = (card: FoodCardRecord | null | undefined, w: number) => {
    const v = asFlavorVector(card?.flavor_profile);
    if (!v) return;
    for (const a of FLAVOR_AXES) pos.sum[a] += v[a] * w;
    pos.weight += w;
  };

  for (const c of published(input.cards)) {
    const w = familyOf(c.card_type) === 'restaurant' ? FLAVOR_WEIGHT.visit
      : c.card_type === 'FOOD_REVIEW' ? FLAVOR_WEIGHT.review
      : FLAVOR_WEIGHT.ownContent;
    add(c, w);
  }
  for (const s of input.saved ?? []) add(s.card, FLAVOR_WEIGHT.save);
  for (const e of input.events) {
    if (e.type === 'card_viewed') add(e.card, FLAVOR_WEIGHT.view);
    if (e.type === 'card_skipped') {
      const v = asFlavorVector(e.card?.flavor_profile);
      if (v) { for (const a of FLAVOR_AXES) skip.sum[a] += v[a]; skip.n++; }
    }
  }

  const qFlavors = input.questionnaire.flavors;
  const covered = new Set<FlavorAxis>();
  const selected = new Set<FlavorAxis>();
  if (qFlavors && qFlavors.length > 0) {
    for (const [name, axis] of Object.entries(ONBOARDING_FLAVOR_TO_AXIS)) {
      covered.add(axis);
      if (qFlavors.some((f) => norm(f) === name)) selected.add(axis);
    }
  }
  const hasQ = covered.size > 0;
  if (pos.weight === 0 && !hasQ) return null;

  const bw = pos.weight > 0 ? FLAVOR_BLEND.maxBehaviourWeight * clamp(pos.weight / FLAVOR_BLEND.weightForMax, 0, 1) : 0;
  const scores = {} as Record<FlavorAxis, number>;
  for (const a of FLAVOR_AXES) {
    let behaviour: number | null = null;
    if (pos.weight > 0) {
      const avg = pos.sum[a] / pos.weight; // 0-5
      const skipAvg = skip.n >= FLAVOR_BLEND.minSkips ? skip.sum[a] / skip.n : avg;
      behaviour = clamp((avg + FLAVOR_BLEND.skipInfluence * (avg - skipAvg)) * 20, 0, 100);
    }
    const q = covered.has(a) ? (selected.has(a) ? FLAVOR_BLEND.questionnaireSelected : FLAVOR_BLEND.questionnaireUnselected) : null;
    scores[a] = round(q != null && behaviour != null ? (1 - bw) * q + bw * behaviour : (behaviour ?? q ?? 0));
  }
  const top = [...FLAVOR_AXES].filter((a) => scores[a] > 0).sort((a, b) => scores[b] - scores[a]).slice(0, 3);
  return { scores, top, behaviourWeight: bw };
}

// ──────────────────────────── 4. top cuisines ────────────────────────────

export function computeTopCuisines(input: KpiInput): CuisineAffinity[] {
  const display = new Map<string, string>();
  const bump = (m: Map<string, number>, raw: string) => {
    const k = norm(raw);
    if (!k) return;
    if (!display.has(k)) display.set(k, titleCase(raw.trim()));
    m.set(k, (m.get(k) ?? 0) + 1);
  };

  const visited = new Map<string, number>();
  const saved = new Map<string, number>();
  const reviewed = new Map<string, number>();
  for (const v of visitsOf(input.cards)) (v.card.tags?.cuisine ?? []).forEach((c) => bump(visited, c));
  for (const c of published(input.cards)) if (c.card_type === 'FOOD_REVIEW') (c.tags?.cuisine ?? []).forEach((x) => bump(reviewed, x));
  for (const s of input.saved ?? []) {
    if (s.card) (s.card.tags?.cuisine ?? []).forEach((x) => bump(saved, x));
    else if (s.cuisine) bump(saved, s.cuisine);
  }

  // Searched: a search that mentions a cuisine the user has otherwise touched.
  const searched = new Map<string, number>();
  const known = new Set<string>([...visited.keys(), ...saved.keys(), ...reviewed.keys()]);
  for (const e of input.events) {
    if (e.type !== 'search' || !e.query) continue;
    const q = norm(e.query);
    for (const k of known) if (q.includes(k)) searched.set(k, (searched.get(k) ?? 0) + 1);
  }

  const components: [Map<string, number>, number][] = [
    [visited, CUISINE_WEIGHT.visited],
    [saved, CUISINE_WEIGHT.saved],
    [reviewed, CUISINE_WEIGHT.reviewed],
    [searched, CUISINE_WEIGHT.searched],
  ];
  const present = components.filter(([m]) => m.size > 0);
  if (present.length === 0) return [];
  const totalWeight = present.reduce((a, [, w]) => a + w, 0);

  return [...known]
    .map((k) => {
      const sum = present.reduce((acc, [m, w]) => acc + (w * (m.get(k) ?? 0)) / Math.max(...m.values()), 0);
      return { name: display.get(k) ?? titleCase(k), score: round((sum / totalWeight) * 100) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ─────────────────────── 5. stats, food stats, badges ───────────────────────

function computeDaysActive(input: KpiInput): number {
  const now = input.now;
  const days = new Set<string>();
  const mark = (iso: string) => {
    const d = new Date(iso);
    if (inMonth(d, now.getFullYear(), now.getMonth())) days.add(dayKey(d));
  };
  // "Meaningful" activity only - opening the app is not tracked at all.
  for (const c of published(input.cards)) mark(c.created_at);
  for (const s of input.saved ?? []) mark(s.createdAt);
  for (const s of input.shares ?? []) mark(s.createdAt);
  for (const e of input.events) mark(e.createdAt);
  return days.size;
}

const BADGE_DEFS: { id: string; group: BadgeProgress['group']; emoji: string; title: string; requirement: string; target: number; metric: 'places' | 'cuisines' | 'reviews' | 'shares' | 'crews' | 'spicy' | 'sweet' | 'crunchy' }[] = [
  { id: 'first-explorer', group: 'Exploration', emoji: '🥾', title: 'First Explorer', requirement: '5 restaurants', target: 5, metric: 'places' },
  { id: 'city-explorer', group: 'Exploration', emoji: '🏙️', title: 'City Explorer', requirement: '25 restaurants', target: 25, metric: 'places' },
  { id: 'food-navigator', group: 'Exploration', emoji: '🧭', title: 'Food Navigator', requirement: '100 restaurants', target: 100, metric: 'places' },
  { id: 'food-pioneer', group: 'Exploration', emoji: '🚩', title: 'Food Pioneer', requirement: '250 restaurants', target: 250, metric: 'places' },
  { id: 'taste-explorer', group: 'Cuisine', emoji: '🍜', title: 'Taste Explorer', requirement: '5 cuisines', target: 5, metric: 'cuisines' },
  { id: 'world-taster', group: 'Cuisine', emoji: '🌎', title: 'World Taster', requirement: '15 cuisines', target: 15, metric: 'cuisines' },
  { id: 'global-palate', group: 'Cuisine', emoji: '🌐', title: 'Global Palate', requirement: '30 cuisines', target: 30, metric: 'cuisines' },
  { id: 'heat-seeker', group: 'Flavour', emoji: '🌶️', title: 'Heat Seeker', requirement: 'Spicy above 85', target: 86, metric: 'spicy' },
  { id: 'sweet-tooth', group: 'Flavour', emoji: '🍰', title: 'Sweet Tooth', requirement: 'Sweet above 85', target: 86, metric: 'sweet' },
  { id: 'crunch-hunter', group: 'Flavour', emoji: '🥨', title: 'Crunch Hunter', requirement: 'Crunchy above 85', target: 86, metric: 'crunchy' },
  { id: 'voice-of-fuzo', group: 'Social', emoji: '📣', title: 'Voice of FUZO', requirement: '10 reviews', target: 10, metric: 'reviews' },
  { id: 'food-connector', group: 'Social', emoji: '🔗', title: 'Food Connector', requirement: '20 shared discoveries', target: 20, metric: 'shares' },
  { id: 'social-explorer', group: 'Social', emoji: '🥂', title: 'Social Explorer', requirement: '5 crews', target: 5, metric: 'crews' },
];

export function computeKpis(input: KpiInput): ProfileKpis {
  const own = published(input.cards);
  const visits = visitsOf(input.cards);
  const placesExplored = new Set(visits.map((v) => v.place)).size;
  const cuisinesExplored = new Set(visits.flatMap((v) => v.cuisines)).size;
  const reviewsPosted = own.filter((c) => c.card_type === 'FOOD_REVIEW').length;

  const flavorDna = computeFlavorDna(input);
  const metrics = {
    places: placesExplored,
    cuisines: cuisinesExplored,
    reviews: reviewsPosted,
    shares: input.shares?.length ?? 0,
    crews: input.crewCount ?? 0,
    spicy: flavorDna?.scores.spicy ?? 0,
    sweet: flavorDna?.scores.sweet ?? 0,
    crunchy: flavorDna?.scores.crunchy ?? 0,
  };

  return {
    stats: {
      placesExplored,
      cuisinesExplored,
      cardsSaved: input.saved ? input.saved.length : null,
      reviewsPosted,
      contentCreated: own.length,
      foodShared: input.shares ? input.shares.length : null,
    },
    exploration: computeExplorationScore(input),
    foodDna: computeFoodDna(input),
    flavorDna,
    topCuisines: computeTopCuisines(input),
    foodStats: { restaurantsExplored: placesExplored, reviewsWritten: reviewsPosted, daysActive: computeDaysActive(input) },
    badges: BADGE_DEFS.map((b) => ({
      id: b.id, group: b.group, emoji: b.emoji, title: b.title, requirement: b.requirement, target: b.target,
      current: metrics[b.metric],
      earned: metrics[b.metric] >= b.target,
    })),
  };
}
