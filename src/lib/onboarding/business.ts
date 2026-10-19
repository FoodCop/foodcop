// What each food business category is asked during onboarding (client spec
// v1, sections 4-5: "one reusable framework with conditional fields"; "do not
// force every category to provide the same location model"). Kept short on
// purpose - full menus and detailed setup come after onboarding.

import type { BusinessCategory } from './policy';
import { TASTE_CUISINES } from './taste';

/** Where a business is (B-03). */
export interface LocationModel {
  /** Matches business_branches.location_kind. */
  kind: 'address' | 'service_area' | 'mobile';
  /** Label for the place picker. */
  placeLabel: string;
  placeRequired: boolean;
  /** The address is kept off the public profile (cloud kitchens). */
  addressHidden?: boolean;
  /** Label for the "area you serve / operate in" text (absent = not asked). */
  areaLabel?: string;
  areaPlaceholder?: string;
  areaRequired?: boolean;
  /** Can add more locations (branches). */
  branches: boolean;
}

/** A multi-choice field stored in restaurant_profiles.operations. */
export interface OpsChoice {
  key: string;
  label: string;
  options: readonly string[];
}

export interface CategoryConfig {
  location: LocationModel;
  /** Ask for cuisines (restaurant_profiles.cuisines). */
  cuisines: boolean;
  /** Ask dine-in / takeaway (restaurant_profiles.services). */
  services: boolean;
  /** Ask the price range (restaurant_profiles.price_tier). */
  price: boolean;
  /** Weekly hours: required for walk-in places, optional for the rest. */
  hours: 'required' | 'optional';
  hoursLabel: string;
  choices: OpsChoice[];
  /** Food trucks: regular stops (free text). */
  stops?: boolean;
}

const ADDRESS = (branches = true): LocationModel => ({ kind: 'address', placeLabel: 'Main location', placeRequired: true, branches });

export const CATEGORY_CONFIG: Record<BusinessCategory, CategoryConfig> = {
  restaurant: {
    location: ADDRESS(),
    cuisines: true,
    services: true,
    price: true,
    hours: 'required',
    hoursLabel: 'Opening hours',
    choices: [],
  },
  cafe: {
    location: ADDRESS(),
    cuisines: false,
    services: true,
    price: true,
    hours: 'required',
    hoursLabel: 'Opening hours',
    choices: [{ key: 'offerings', label: 'What you serve', options: ['Coffee', 'Tea', 'Pastries', 'Breakfast', 'Lunch', 'Desserts', 'Smoothies & juices'] }],
  },
  bakery: {
    location: ADDRESS(),
    cuisines: false,
    services: true,
    price: true,
    hours: 'required',
    hoursLabel: 'Opening hours',
    choices: [{ key: 'baked_goods', label: 'What you bake', options: ['Bread', 'Cakes', 'Pastries', 'Cookies', 'Cupcakes', 'Gluten-free bakes', 'Custom orders'] }],
  },
  food_truck: {
    location: {
      kind: 'mobile',
      placeLabel: 'Where you’re usually based',
      placeRequired: false,
      areaLabel: 'Area you operate in',
      areaPlaceholder: 'e.g. Downtown Toronto and the waterfront',
      areaRequired: true,
      branches: true,
    },
    cuisines: true,
    services: false,
    price: true,
    hours: 'optional',
    hoursLabel: 'Usual hours',
    choices: [],
    stops: true,
  },
  cloud_kitchen: {
    location: {
      kind: 'service_area',
      placeLabel: 'Kitchen address (not shown publicly)',
      placeRequired: true,
      addressHidden: true,
      areaLabel: 'Delivery area',
      areaPlaceholder: 'e.g. Midtown and North York',
      areaRequired: true,
      branches: true,
    },
    cuisines: true,
    services: false,
    price: true,
    hours: 'required',
    hoursLabel: 'Kitchen hours',
    choices: [{ key: 'ordering', label: 'How people order', options: ['Delivery apps', 'Own website', 'Phone orders', 'Pre-orders'] }],
  },
  catering_company: {
    location: {
      kind: 'service_area',
      placeLabel: 'Kitchen or office (optional, not shown publicly)',
      placeRequired: false,
      addressHidden: true,
      areaLabel: 'Area you serve',
      areaPlaceholder: 'e.g. Greater Toronto Area',
      areaRequired: true,
      branches: false,
    },
    cuisines: true,
    services: false,
    price: false,
    hours: 'optional',
    hoursLabel: 'Hours you take orders',
    choices: [
      { key: 'catering_types', label: 'Events you cater', options: ['Weddings', 'Corporate events', 'Private parties', 'Festivals', 'Religious events', 'Funerals'] },
      { key: 'event_service', label: 'How you serve', options: ['Delivered to the event', 'Full-service staff', 'Drop-off only', 'Pick-up'] },
    ],
  },
  meal_prep: {
    location: {
      kind: 'service_area',
      placeLabel: 'Kitchen or pick-up point (optional, not shown publicly)',
      placeRequired: false,
      addressHidden: true,
      areaLabel: 'Area you deliver to',
      areaPlaceholder: 'e.g. Toronto and Mississauga',
      areaRequired: true,
      branches: false,
    },
    cuisines: false,
    services: false,
    price: true,
    hours: 'optional',
    hoursLabel: 'Hours you take orders',
    choices: [
      { key: 'offerings', label: 'What you offer', options: ['Weekly plans', 'Subscriptions', 'Single meals', 'Family packs', 'High protein', 'Vegan', 'Keto'] },
      { key: 'fulfilment', label: 'How people get it', options: ['Delivery', 'Pick-up'] },
    ],
  },
  specialty_food: {
    location: {
      kind: 'address',
      placeLabel: 'Shop or main location (optional)',
      placeRequired: false,
      areaLabel: 'Or the area you sell in',
      areaPlaceholder: 'e.g. Farmers markets across Ottawa',
      areaRequired: false,
      branches: true,
    },
    cuisines: false,
    services: false,
    price: true,
    hours: 'optional',
    hoursLabel: 'Opening hours',
    choices: [
      { key: 'products', label: 'What you make or sell', options: ['Sauces & condiments', 'Spices & blends', 'Preserves & jams', 'Baked goods', 'Snacks', 'Beverages', 'Chocolate & sweets', 'Imported groceries'] },
      { key: 'channels', label: 'Where you sell', options: ['Own shop', 'Farmers markets', 'Online', 'Retail stores', 'Wholesale'] },
    ],
  },
};

export const BUSINESS_CUISINES = TASTE_CUISINES;
export const PRICE_TIERS = ['$', '$$', '$$$', '$$$$'] as const;
export const ONBOARDING_SERVICES = [
  { key: 'dine_in', label: 'Dine-in' },
  { key: 'takeaway', label: 'Takeaway' },
] as const;

/** Specialty food may use an address OR a selling area: the location kind follows what they gave. */
export function branchKind(category: BusinessCategory, hasAddress: boolean, hasArea: boolean): LocationModel['kind'] {
  const model = CATEGORY_CONFIG[category].location;
  if (category === 'specialty_food') return hasAddress ? 'address' : hasArea ? 'service_area' : 'address';
  if (model.kind === 'mobile' && !hasAddress && !hasArea) return 'mobile';
  return model.kind;
}

/** A normalised website (adds https://), or null if it isn't a plausible web address. */
export function normaliseWebsite(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (!/^https?:$/.test(u.protocol) || !/\.[a-z]{2,}$/i.test(u.hostname)) return null;
    return u.toString().replace(/\/$/, '').slice(0, 300);
  } catch {
    return null;
  }
}
