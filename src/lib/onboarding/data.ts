// Ported verbatim from the old app's onboarding.html: the real branching
// onboarding flow (Discover Food / Create & Inspire / Grow My Food Business),
// its option lists, and its food-personality mini-quiz. This is FUZO's actual
// onboarding content, distinct from quiz.html's separate 5-module Food DNA quiz.

export const FLAVORS = ['Sweet', 'Spicy', 'Savory', 'Tangy', 'Sour', 'Bitter', 'Smoky', 'Umami', 'Creamy', 'Cheesy'];
export const CUISINES = ['Indian', 'Italian', 'Chinese', 'Japanese', 'Korean', 'Thai', 'Mexican', 'Mediterranean', 'Caribbean', 'Middle Eastern'];
export const DIETARY = ['No Restrictions', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Jain', 'Gluten-Free', 'Dairy-Free'];
export const FOOD_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Bakery', 'Catering', 'Meal Prep'];
export const AUDIENCE = ['Families', 'Students', 'Professionals', 'Foodies', 'Travelers', 'Health Conscious'];
export const CUSTOMER_MATCH = ['Food Explorers', 'Families', 'Professionals', 'Students', 'Travelers', 'Health Conscious Diners'];
export const BUSINESS_IDENTITY = ['Family Friendly', 'Hidden Gem', 'Fine Dining', 'Vegan Friendly', 'Halal', 'Local Favorite', 'Date Night', 'Late Night', 'Budget Friendly', 'Premium Experience'];
export const INTEGRATIONS = ['OpenTable', 'Website', 'Online Ordering'];

export type CardOpt = { v: string; icon: string; d?: string };

export const PATH_OPTS: CardOpt[] = [
  { v: 'A', icon: '/SVG/restaurant/Casual Dining.svg', d: 'Explore restaurants, dishes, reviews and food experiences.' },
  { v: 'B', icon: '/SVG/social/Video.svg', d: 'Share your culinary expertise, recipes, reviews and food content.' },
  { v: 'C', icon: '/SVG/social/Company.svg', d: 'Promote your food business and connect with food lovers.' },
];

export const A_TYPE_OPTS: CardOpt[] = [
  { v: 'Food Explorer', icon: '/SVG/restaurant/Global Cuisine.svg', d: 'Find new restaurants, dishes, and food experiences.' },
  { v: 'Food Reviewer', icon: '/SVG/social/Star.svg', d: 'Share honest takes on what you eat.' },
];

export const B_TYPE_OPTS: CardOpt[] = [
  { v: 'Food Blogger', icon: '/SVG/social/Camera.svg', d: 'Reviews, restaurant discovery, food photography.' },
  { v: 'Food Travel Blogger', icon: '/SVG/social/Earth.svg', d: 'Local food, city guides, road trips.' },
  { v: 'Recipe Creator', icon: '/SVG/social/Book.svg', d: 'Home cooking, baking, healthy recipes.' },
  { v: 'Cooking Instructor', icon: '/SVG/foodies/Video Instructions.svg', d: 'Beginner and advanced classes.' },
  { v: 'Nutrition Coach', icon: '/SVG/food/VEGAN.svg', d: 'Weight loss, sports nutrition, healthy eating.' },
  { v: 'Private Chef', icon: '/SVG/foodies/Professional Chef Male.svg', d: 'Personal dining, event dining.' },
  { v: 'Catering Chef', icon: '/SVG/social/Team.svg', d: 'Weddings, corporate events, private functions.' },
];

export const C_TYPE_OPTS: CardOpt[] = [
  { v: 'Restaurant', icon: '/SVG/restaurant/Table Setting.svg', d: 'A full-service dine-in spot.' },
  { v: 'Cloud Kitchen', icon: '/SVG/map/Radar.svg', d: 'Delivery-only kitchen, no storefront.' },
  { v: 'Café', icon: '/SVG/restaurant/Café.svg', d: 'Coffee, light bites, casual seating.' },
  { v: 'Bakery', icon: '/SVG/food/CAKE.svg', d: 'Baked goods and desserts.' },
  { v: 'Food Truck', icon: '/SVG/social/Car.svg', d: 'Mobile food service.' },
  { v: 'Catering Company', icon: '/SVG/social/Team.svg', d: 'Events and bulk orders.' },
  { v: 'Meal Prep Business', icon: '/SVG/restaurant/Menu.svg', d: 'Pre-made meals, subscriptions.' },
  { v: 'Specialty Food Business', icon: '/SVG/foodies/Specialty Groceries.svg', d: 'Niche or artisan food products.' },
];

export const SPECIALTY_MAP: Record<string, string[]> = {
  'Food Blogger': ['Reviews', 'Restaurant Discovery', 'Food Photography'],
  'Food Travel Blogger': ['Local Food', 'City Guides', 'Road Trips'],
  'Recipe Creator': ['Home Cooking', 'Baking', 'Healthy Recipes'],
  'Cooking Instructor': ['Beginner Classes', 'Advanced Classes'],
  'Nutrition Coach': ['Weight Loss', 'Sports Nutrition', 'Healthy Eating'],
  'Private Chef': ['Personal Dining', 'Event Dining'],
  'Catering Chef': ['Weddings', 'Corporate Events', 'Private Functions'],
};

export const QUIZ_QUESTIONS = [
  { key: 'q1', q: 'What’s your go-to meal vibe?', opts: ['Comfort & indulgent', 'Bold & spicy', 'Healthy & balanced', 'Trendy & aesthetic'] },
  { key: 'q2', q: 'How do you choose where to eat?', opts: ['Reviews', 'Social media', 'Cravings', 'Healthy options'] },
  { key: 'q3', q: 'What excites you most?', opts: ['Familiar favorites', 'New cuisines', 'Balanced eating', 'Food experiences'] },
  { key: 'q4', q: 'Pick a weekend activity', opts: ['Comfort food at home', 'Explore new restaurants', 'Cook something new', 'Visit a healthy cafe'] },
  { key: 'q5', q: 'How adventurous are you with food?', opts: ['Not much', 'Sometimes', 'Often', "I'll try anything"] },
] as const;

type Persona = 'explorer' | 'comfort' | 'health' | 'trend';

export const QUIZ_MAP: Record<string, Record<string, Persona>> = {
  q1: { 'Comfort & indulgent': 'comfort', 'Bold & spicy': 'explorer', 'Healthy & balanced': 'health', 'Trendy & aesthetic': 'trend' },
  q2: { Reviews: 'trend', 'Social media': 'trend', Cravings: 'comfort', 'Healthy options': 'health' },
  q3: { 'Familiar favorites': 'comfort', 'New cuisines': 'explorer', 'Balanced eating': 'health', 'Food experiences': 'trend' },
  q4: { 'Comfort food at home': 'comfort', 'Explore new restaurants': 'explorer', 'Cook something new': 'trend', 'Visit a healthy cafe': 'health' },
  q5: { 'Not much': 'comfort', Sometimes: 'health', Often: 'trend', "I'll try anything": 'explorer' },
};

export const PERSONALITY: Record<Persona, { icon: string; title: string; desc: string }> = {
  explorer: { icon: '/SVG/restaurant/Spicy.svg', title: 'Flavor Explorer', desc: 'You chase bold, new flavors and rarely order the same dish twice.' },
  comfort: { icon: '/SVG/food/PIZZA.svg', title: 'Comfort Craver', desc: 'Familiar, indulgent food is where your heart is.' },
  health: { icon: '/SVG/food/VEGAN.svg', title: 'Health Hero', desc: 'Balanced, nourishing meals top your list every time.' },
  trend: { icon: '/SVG/food/SUSHI.svg', title: 'Trend Hunter', desc: 'You eat with your eyes first and chase what’s buzzing.' },
};

export const FEATURES_LIST = [
  { k: 'reservations', label: 'Reservations' },
  { k: 'ordering', label: 'Ordering' },
  { k: 'catering', label: 'Catering Requests' },
  { k: 'events', label: 'Event Bookings' },
] as const;

export type PathChoice = 'A' | 'B' | 'C' | null;

export type OnboardingState = {
  screen: string;
  pathChoice: PathChoice;
  a: {
    type: string;
    flavors: string[];
    flavorsExtra: string[];
    cuisines: string[];
    cuisinesExtra: string[];
    dietary: string[];
    dietaryExtra: string[];
    quiz: Record<string, string>;
  };
  b: {
    type: string;
    profile: { name: string; bio: string; location: string; website: string };
    specialty: string[];
    portfolio: { photos: string[]; videos: string[]; recipes: string[]; menus: string[]; serviceImages: string[] };
    audience: string[];
  };
  c: {
    type: string;
    profile: { businessName: string; contact: string; phone: string; email: string; address: string };
    cuisine: string[];
    cuisineExtra: string[];
    categories: string[];
    categoriesExtra: string[];
    media: { menu: string[]; photos: string[]; dishes: string[] };
    identity: string[];
    features: { reservations: boolean; ordering: boolean; catering: boolean; events: boolean };
    integrations: string[];
    matching: string[];
  };
};

export function initialOnboardingState(): OnboardingState {
  return {
    screen: 'PATH_SELECT',
    pathChoice: null,
    a: { type: '', flavors: [], flavorsExtra: [], cuisines: [], cuisinesExtra: [], dietary: [], dietaryExtra: [], quiz: { q1: '', q2: '', q3: '', q4: '', q5: '' } },
    b: { type: '', profile: { name: '', bio: '', location: '', website: '' }, specialty: [], portfolio: { photos: [], videos: [], recipes: [], menus: [], serviceImages: [] }, audience: [] },
    c: {
      type: '',
      profile: { businessName: '', contact: '', phone: '', email: '', address: '' },
      cuisine: [],
      cuisineExtra: [],
      categories: [],
      categoriesExtra: [],
      media: { menu: [], photos: [], dishes: [] },
      identity: [],
      features: { reservations: false, ordering: false, catering: false, events: false },
      integrations: [],
      matching: [],
    },
  };
}

const NAV_ORDER: Record<'A' | 'B' | 'C', string[]> = {
  A: ['A_TYPE', 'A_FLAVORS', 'A_CUISINES', 'A_DIETARY', 'A_QUIZ', 'A_RESULT'],
  B: ['B_TYPE', 'B_PROFILE', 'B_SPECIALTY', 'B_PORTFOLIO', 'B_AUDIENCE', 'B_PREVIEW'],
  C: ['C_TYPE', 'C_PROFILE', 'C_CUISINE', 'C_MEDIA', 'C_IDENTITY', 'C_FEATURES', 'C_MATCHING', 'C_PREVIEW'],
};

export function fullOrder(state: OnboardingState): string[] {
  const base = ['PATH_SELECT'];
  if (!state.pathChoice) return base;
  return [...base, ...NAV_ORDER[state.pathChoice]];
}

export function courseIndex(state: OnboardingState): number {
  return fullOrder(state).indexOf(state.screen) + 1;
}

export function courseTotal(state: OnboardingState): number {
  return fullOrder(state).length;
}

export function nextScreenFor(state: OnboardingState): string {
  const s = state.screen;
  switch (s) {
    case 'PATH_SELECT':
      return state.pathChoice === 'A' ? 'A_TYPE' : state.pathChoice === 'B' ? 'B_TYPE' : 'C_TYPE';
    case 'A_TYPE':
      return 'A_FLAVORS';
    case 'A_FLAVORS':
      return 'A_CUISINES';
    case 'A_CUISINES':
      return 'A_DIETARY';
    case 'A_DIETARY':
      return 'A_QUIZ';
    case 'A_QUIZ':
      return 'A_RESULT';
    case 'A_RESULT':
      return 'DONE';
    case 'B_TYPE':
      return 'B_PROFILE';
    case 'B_PROFILE':
      return 'B_SPECIALTY';
    case 'B_SPECIALTY':
      return 'B_PORTFOLIO';
    case 'B_PORTFOLIO':
      return 'B_AUDIENCE';
    case 'B_AUDIENCE':
      return 'B_PREVIEW';
    case 'B_PREVIEW':
      return 'DONE';
    case 'C_TYPE':
      return 'C_PROFILE';
    case 'C_PROFILE':
      return 'C_CUISINE';
    case 'C_CUISINE':
      return 'C_MEDIA';
    case 'C_MEDIA':
      return 'C_IDENTITY';
    case 'C_IDENTITY':
      return 'C_FEATURES';
    case 'C_FEATURES':
      return 'C_MATCHING';
    case 'C_MATCHING':
      return 'C_PREVIEW';
    case 'C_PREVIEW':
      return 'DONE';
    default:
      return s;
  }
}

export function canContinue(state: OnboardingState): boolean {
  switch (state.screen) {
    case 'PATH_SELECT':
      return !!state.pathChoice;
    case 'A_TYPE':
      return !!state.a.type;
    case 'A_FLAVORS':
      return state.a.flavors.length > 0;
    case 'A_CUISINES':
      return state.a.cuisines.length > 0;
    case 'A_QUIZ':
      return ['q1', 'q2', 'q3', 'q4', 'q5'].every((k) => !!state.a.quiz[k]);
    case 'B_TYPE':
      return !!state.b.type;
    case 'B_SPECIALTY':
      return state.b.specialty.length > 0;
    case 'B_AUDIENCE':
      return state.b.audience.length > 0;
    case 'C_TYPE':
      return !!state.c.type;
    case 'C_CUISINE':
      return state.c.cuisine.length > 0 && state.c.categories.length > 0;
    case 'C_IDENTITY':
      return state.c.identity.length > 0;
    case 'C_MATCHING':
      return state.c.matching.length > 0;
    default:
      return true;
  }
}

export function continueLabel(state: OnboardingState): string {
  switch (state.screen) {
    case 'A_RESULT':
      return 'Start Exploring';
    case 'B_PREVIEW':
      return 'Launch Creator Profile';
    case 'C_PREVIEW':
      return 'Launch Business Profile';
    default:
      return 'Continue';
  }
}

export function computeResult(state: OnboardingState) {
  const tally: Record<Persona, number> = { comfort: 0, explorer: 0, health: 0, trend: 0 };
  for (const qk of Object.keys(QUIZ_MAP)) {
    const ans = state.a.quiz[qk];
    const persona = ans ? QUIZ_MAP[qk][ans] : undefined;
    if (persona) tally[persona]++;
  }
  let best: Persona = 'explorer';
  let bestScore = -1;
  (Object.keys(tally) as Persona[]).forEach((k) => {
    if (tally[k] > bestScore) {
      best = k;
      bestScore = tally[k];
    }
  });
  return PERSONALITY[best];
}
