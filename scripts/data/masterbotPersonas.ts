/**
 * The 7 FUZO masterbot personas from masterbot_Profiles.txt (repo root),
 * given a real Supabase account + taste profile + food_cards by
 * scripts/seed_masterbots.ts.
 *
 * `cuisines`/`dietary` are mapped onto onboarding's FIXED vocab
 * (src/lib/onboarding/data.ts CUISINES/DIETARY - only 10 cuisines exist) on a
 * best-fit basis. Some personas (Sebastian LeClair's French fine dining,
 * Omar Darzi's coffee culture) don't map cleanly onto that vocab - this is a
 * known, accepted approximation, not a bug.
 *
 * `personaArchetype` picks directly from src/lib/onboarding/data.ts's
 * PERSONALITY map (explorer/comfort/health/trend) in place of running the
 * actual 5-question quiz a real user would take - the closest-fit archetype
 * for each persona's stated personality.
 *
 * `cityFiles` + `categoryPattern` select which K:\...\Fuzo_Doc_Backup\data\
 * MasterSet_<city>.json rows become this persona's RESTAURANT_VISIT/
 * CAFE_VISIT/STREET_FOOD food_cards (regex tested against
 * `categoryName + ' ' + categories.join(' ')`).
 */

export type MasterbotSubtype = 'Food Explorer' | 'Food Reviewer';
export type MasterbotArchetype = 'explorer' | 'comfort' | 'health' | 'trend';

export interface MasterbotPersona {
  slug: string;
  displayName: string;
  email: string;
  username: string;
  voiceQuote: string;
  cuisines: string[];
  dietary: string[];
  subtype: MasterbotSubtype;
  archetype: MasterbotArchetype;
  cityFiles: string[];
  categoryPattern: RegExp;
  restaurantCardFamily: 'RESTAURANT_VISIT' | 'CAFE_VISIT' | 'STREET_FOOD';
}

export const MASTERBOT_PERSONAS: MasterbotPersona[] = [
  {
    slug: 'jun-tanaka',
    displayName: 'Jun Tanaka',
    email: 'jun.tanaka@masterbots.fuzo.app',
    username: 'jun_zen',
    voiceQuote: "Perfection is often hidden in the smallest details.",
    cuisines: ['Japanese'],
    dietary: ['No Restrictions'],
    subtype: 'Food Reviewer',
    archetype: 'health',
    cityFiles: ['tokyo'],
    categoryPattern: /japanese|sushi|ramen|izakaya|yakiniku/i,
    restaurantCardFamily: 'RESTAURANT_VISIT',
  },
  {
    slug: 'aurelia-voss',
    displayName: 'Aurelia "Nomad" Voss',
    email: 'aurelia.voss@masterbots.fuzo.app',
    username: 'nomad_aurelia',
    voiceQuote: 'The best meal in a city is rarely the most expensive one.',
    cuisines: ['Thai', 'Chinese'],
    dietary: ['No Restrictions'],
    subtype: 'Food Explorer',
    archetype: 'explorer',
    cityFiles: ['bangkok', 'singapore', 'mumbai', 'other'],
    categoryPattern: /street|hawker|food court|food truck|market/i,
    restaurantCardFamily: 'STREET_FOOD',
  },
  {
    slug: 'sebastian-leclair',
    displayName: 'Sebastian LeClair',
    email: 'sebastian.leclair@masterbots.fuzo.app',
    username: 'the_epicurean',
    voiceQuote: 'Dining is theatre. Every course tells a story.',
    cuisines: ['Italian', 'Mediterranean'],
    dietary: ['No Restrictions'],
    subtype: 'Food Reviewer',
    archetype: 'trend',
    cityFiles: ['paris', 'london', 'newyork', 'barcelona'],
    categoryPattern: /fine dining|michelin|haute|french/i,
    restaurantCardFamily: 'RESTAURANT_VISIT',
  },
  {
    slug: 'lila-cheng',
    displayName: 'Lila Cheng',
    email: 'lila.cheng@masterbots.fuzo.app',
    username: 'green_gourmet',
    voiceQuote: 'The future of food is delicious, ethical, and sustainable.',
    cuisines: ['Mediterranean', 'Italian'],
    dietary: ['Vegan', 'Vegetarian'],
    subtype: 'Food Explorer',
    archetype: 'health',
    cityFiles: ['tokyo', 'paris', 'newyork', 'london'],
    categoryPattern: /vegan|vegetarian|plant|organic|health food/i,
    restaurantCardFamily: 'RESTAURANT_VISIT',
  },
  {
    slug: 'rafael-mendez',
    displayName: 'Rafael "Rafa" Mendez',
    email: 'rafael.mendez@masterbots.fuzo.app',
    username: 'rafa_adventurer',
    voiceQuote: "If you've never tried it before, order it.",
    cuisines: ['Thai', 'Mexican', 'Indian'],
    dietary: ['No Restrictions'],
    subtype: 'Food Explorer',
    archetype: 'explorer',
    cityFiles: ['bangkok', 'mexicocity', 'other', 'singapore'],
    categoryPattern: /thai|mexican|barbecue|spicy|szechuan|taco/i,
    restaurantCardFamily: 'RESTAURANT_VISIT',
  },
  {
    slug: 'anika-kapoor',
    displayName: 'Anika Kapoor',
    email: 'anika.kapoor@masterbots.fuzo.app',
    username: 'spice_scholar',
    voiceQuote: 'Every spice has a story. Every dish carries a legacy.',
    cuisines: ['Indian', 'Thai'],
    dietary: ['No Restrictions'],
    subtype: 'Food Reviewer',
    archetype: 'explorer',
    cityFiles: ['mumbai', 'london', 'hongkong'],
    categoryPattern: /indian/i,
    restaurantCardFamily: 'RESTAURANT_VISIT',
  },
  {
    slug: 'omar-darzi',
    displayName: 'Omar Darzi',
    email: 'omar.darzi@masterbots.fuzo.app',
    username: 'coffee_pilgrim',
    voiceQuote: 'A city reveals itself through its cafés.',
    cuisines: ['Mediterranean'],
    dietary: ['No Restrictions'],
    subtype: 'Food Explorer',
    archetype: 'trend',
    cityFiles: ['tokyo', 'paris', 'bangkok', 'london'],
    categoryPattern: /caf|coffee|roaster/i,
    restaurantCardFamily: 'CAFE_VISIT',
  },
];
