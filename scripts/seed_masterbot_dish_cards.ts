/**
 * MASTERBOT DISH CARD SEEDING SCRIPT
 * ==================================================================
 * Turns the 68 AI-generated food photos in public/generated-images/ (mapped
 * one-to-one to dish metadata in
 * public/generated-images/masterbot_image_metadata.json, itself produced by
 * scripts/create_image_metadata.ts) into real food_cards rows for the 7
 * masterbot personas (scripts/data/masterbotPersonas.ts) - one card per
 * image, distinct from the generic per-restaurant food_cards
 * scripts/seed_masterbots.ts already created from the raw MasterSet scrape.
 *
 * NOTE: a Gemini Vision QA pass (sending each image back to Gemini to verify
 * it depicts the claimed dish) was requested but could not run - the
 * GEMINI_API_KEY in .env.local has no remaining prepayment credits (429
 * RESOURCE_EXHAUSTED) and no OPENAI_API_KEY is configured as a fallback
 * vision provider. Per explicit user instruction, this script proceeds
 * without that verification step, trusting the dish metadata already
 * generated for each image.
 *
 * For the 54 RESTAURANT-sourced images (filename is `<placeId>_v2.png`),
 * this cross-references the original Google-Places scrape
 * (K:\...\Fuzo_Doc_Backup\data\MasterSet_<city>.json) by placeId to recover
 * real lat/lng/address/category/rating for the food_cards row and the
 * Scout-map dual-write - same source seed_masterbots.ts uses, not
 * fabricated. The 14 DISCOVERY-sourced images (persona take, no specific
 * venue) use the persona's home-city centroid (a real, well-known city
 * center coordinate, not a specific fabricated address) so they still place
 * sensibly on the Scout map per the task's "matching the masterbot's
 * location" instruction.
 *
 * Idempotent/resumable: skips any metadata entry whose image_url already
 * has a food_cards row.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed_masterbot_dish_cards.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { MASTERBOT_PERSONAS, type MasterbotPersona } from './data/masterbotPersonas';
import { emptyCardTags, type FoodCardType, type FlavorVector, FLAVOR_AXES } from '../src/lib/types/foodCard';
import { normalizeTag } from '../src/lib/utils/taxonomy';
import taxonomyData from '../src/lib/data/fuzoTaxonomy.json';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MASTERSET_DIR = 'K:/H DRIVE/Quantum Climb/APPS/Fuzo_Doc_Backup/data';
const MASTERSET_CITIES = [
  'bangkok', 'barcelona', 'hongkong', 'london', 'mexicocity',
  'mumbai', 'newyork', 'other', 'paris', 'singapore', 'tokyo',
];
const METADATA_PATH = path.resolve(__dirname, '../public/generated-images/masterbot_image_metadata.json');

// Real, well-known city centers - only used to place DISCOVERY-sourced cards
// (no specific venue) on the Scout map near the persona's home city, not to
// fabricate a specific address.
const CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  tokyo: { lat: 35.6762, lng: 139.6503 },
  bangkok: { lat: 13.7563, lng: 100.5018 },
  paris: { lat: 48.8566, lng: 2.3522 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  london: { lat: 51.5072, lng: -0.1276 },
  newyork: { lat: 40.7128, lng: -74.006 },
  barcelona: { lat: 41.3851, lng: 2.1734 },
  mexicocity: { lat: 19.4326, lng: -99.1332 },
  hongkong: { lat: 22.3193, lng: 114.1694 },
};

interface MasterSetRow {
  title: string;
  categoryName?: string;
  categories?: string[];
  address?: string;
  city?: string;
  price?: string;
  totalScore?: number;
  placeId: string;
  location?: { lat: number; lng: number };
  additionalInfo?: Record<string, Array<Record<string, boolean>>>;
}

interface ImageMetadata {
  filename: string;
  image_url: string;
  persona_name: string;
  persona_slug: string;
  source: 'RESTAURANT' | 'DISCOVERY';
  restaurant_name: string | null;
  cuisine: string;
  dish_name: string;
  dish_description: string;
  ingredients: string[];
  flavor_profile: { sweet: number; sour: number; salty: number; spicy: number; umami: number };
}

function loadPlaceIdMap(): Map<string, MasterSetRow> {
  const map = new Map<string, MasterSetRow>();
  for (const city of MASTERSET_CITIES) {
    const p = path.join(MASTERSET_DIR, `MasterSet_${city}.json`);
    if (!fs.existsSync(p)) continue;
    const rows: MasterSetRow[] = JSON.parse(fs.readFileSync(p, 'utf-8'));
    for (const r of rows) map.set(r.placeId, r);
  }
  return map;
}

// Word-boundary match (not plain substring) - a plain .includes() falsely
// matches e.g. synonym "deli" -> "Sandwich" inside the word "delicate".
function containsWord(haystack: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(haystack);
}

function matchAgainstVocab(haystack: string, tags: readonly string[], synonyms: Record<string, string>): string[] {
  const found = new Set<string>();
  for (const tag of tags) {
    if (containsWord(haystack, tag)) found.add(tag);
  }
  for (const [syn, canonical] of Object.entries(synonyms)) {
    if (containsWord(haystack, syn) && (tags as string[]).includes(canonical)) found.add(canonical);
  }
  return [...found];
}

// cooking_style has no taxonomy.ts source (see TagChips.tsx's comment - it's
// a small hardcoded list), mirrors seed_masterbots.ts's identical map.
const COOKING_STYLE_KEYWORDS: Record<string, string> = {
  barbecue: 'Grilled', bbq: 'Grilled', grill: 'Grilled', grilled: 'Grilled',
  bakery: 'Baked', baked: 'Baked',
  fried: 'Fried',
  steamed: 'Steamed', 'dim sum': 'Steamed',
  smoked: 'Smoked',
  roast: 'Roasted', roasted: 'Roasted',
};
function deriveCookingStyle(haystack: string): string[] {
  const found = new Set<string>();
  for (const [keyword, style] of Object.entries(COOKING_STYLE_KEYWORDS)) {
    if (containsWord(haystack, keyword)) found.add(style);
  }
  return [...found];
}

function deriveMealType(row: MasterSetRow | undefined): string[] {
  if (!row) return [];
  const sections = [...(row.additionalInfo?.['Popular for'] || []), ...(row.additionalInfo?.['Dining options'] || [])];
  const flags = Object.assign({}, ...sections);
  return (taxonomyData.mealTypes.tags as string[]).filter((tag) => flags[tag]);
}

// Maps the 5-axis flavor_profile generated per-dish (sweet/sour/salty/spicy/
// umami, 0-5) onto food_cards' 10-axis FlavorVector
// (src/lib/types/foodCard.ts). Only the 5 axes with real signal are set;
// the other 5 (bitter/smoky/creamy/fresh/crunchy) are left at 0 rather than
// fabricated, since nothing in the source data speaks to them.
function mapFlavorProfile(fp: ImageMetadata['flavor_profile']): FlavorVector {
  const vector = Object.fromEntries(FLAVOR_AXES.map((a) => [a, 0])) as FlavorVector;
  vector.spicy = fp.spicy;
  vector.sweet = fp.sweet;
  vector.tangy = fp.sour;
  vector.salty = fp.salty;
  vector.savory = fp.umami;
  return vector;
}

async function lookupPersonaUserIds(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const persona of MASTERBOT_PERSONAS) {
    const { data, error } = await supabase.from('users').select('id').eq('email', persona.email).maybeSingle();
    if (error || !data?.id) {
      throw new Error(`Could not find existing user account for ${persona.displayName} (${persona.email}). Run scripts/seed_masterbots.ts first. ${error?.message || ''}`);
    }
    map.set(persona.slug, data.id);
  }
  return map;
}

async function getAlreadySeededImageUrls(): Promise<Set<string>> {
  const { data, error } = await supabase.from('food_cards').select('image_url').not('image_url', 'is', null);
  if (error) throw new Error(`Failed to check existing food_cards: ${error.message}`);
  return new Set((data || []).map((r) => r.image_url as string));
}

async function seedEntry(
  entry: ImageMetadata,
  persona: MasterbotPersona,
  userId: string,
  placeIdMap: Map<string, MasterSetRow>,
): Promise<void> {
  const placeId = entry.source === 'RESTAURANT' ? entry.filename.replace(/_v2\.png$/, '') : null;
  const masterSetRow = placeId ? placeIdMap.get(placeId) : undefined;

  const cuisine = normalizeTag(entry.cuisine);
  const categoryHaystack = `${masterSetRow?.categoryName || ''} ${(masterSetRow?.categories || []).join(' ')}`;
  const dishHaystack = `${categoryHaystack} ${entry.dish_name} ${entry.dish_description} ${entry.ingredients.join(' ')}`;

  const foodType = matchAgainstVocab(dishHaystack, taxonomyData.foodCategories.tags, taxonomyData.foodCategories.synonyms);
  const occasion = matchAgainstVocab(dishHaystack, taxonomyData.vibes.tags, taxonomyData.vibes.synonyms);
  const cookingStyle = deriveCookingStyle(dishHaystack);

  let lat: number;
  let lng: number;
  if (masterSetRow?.location) {
    lat = masterSetRow.location.lat;
    lng = masterSetRow.location.lng;
  } else {
    const homeCity = persona.cityFiles[0];
    const centroid = CITY_CENTROIDS[homeCity] || { lat: 0, lng: 0 };
    lat = centroid.lat;
    lng = centroid.lng;
  }

  const cardType: FoodCardType = entry.source === 'RESTAURANT' ? persona.restaurantCardFamily : 'FOOD_REVIEW';

  const cardRow = {
    user_id: userId,
    card_type: cardType,
    title: entry.dish_name,
    caption: entry.dish_description,
    tags: {
      ...emptyCardTags(),
      cuisine: [cuisine],
      diet: persona.dietary,
      price_level: masterSetRow?.price || null,
      food_type: foodType,
      occasion,
      cooking_style: cookingStyle,
      meal_type: deriveMealType(masterSetRow),
    },
    flavor_profile: mapFlavorProfile(entry.flavor_profile),
    ingredients: entry.ingredients.map((i) => [i, '', ''] as [string, string, string]),
    nutrition: {},
    place_id: masterSetRow?.placeId || null,
    lat,
    lng,
    media_url: null,
    image_url: entry.image_url,
    status: 'PUBLISHED' as const,
    stats: { likes: 0, saves: 0 },
  };

  const { error: cardError } = await supabase.from('food_cards').insert(cardRow);
  if (cardError) {
    console.error(`  [${entry.filename}] food_cards insert failed:`, cardError.message);
    return;
  }

  // Scout-map + global-feed dual-write, replicating
  // ScoutPersistence.saveScoutFind()'s insert shape (src/lib/services/scoutPersistence.ts).
  const name = entry.restaurant_name || entry.dish_name;
  const category = masterSetRow?.categoryName || cuisine;
  const contentParts = [`New Discovery: ${name}`, category, entry.dish_description];

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content: contentParts.join('\n'),
      latitude: lat,
      longitude: lng,
      rating: masterSetRow?.totalScore || 0,
      images: [entry.image_url],
      image_url: entry.image_url,
    })
    .select('id')
    .single();
  if (postError) console.warn(`  [${entry.filename}] posts dual-write skipped:`, postError.message);

  const { error: locationError } = await supabase.from('fuzo_locations').insert({
    user_id: userId,
    source_post_id: post?.id || null,
    location_name: name,
    restaurant_name: entry.restaurant_name,
    cuisine,
    latitude: lat,
    longitude: lng,
    address: masterSetRow?.address || '',
    notes: entry.dish_description,
    tags: [cuisine],
    photos: [entry.image_url],
    timings: {},
    rating: masterSetRow?.totalScore || 0,
  });
  if (locationError) console.warn(`  [${entry.filename}] fuzo_locations dual-write failed:`, locationError.message);

  console.log(`  [${entry.filename}] OK - "${entry.dish_name}" for ${persona.displayName} (${cardType})`);
}

async function run() {
  console.log('Loading masterbot image metadata...');
  const metadata: ImageMetadata[] = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
  console.log(`${metadata.length} entries loaded.\n`);

  console.log('Indexing MasterSet placeId -> restaurant data...');
  const placeIdMap = loadPlaceIdMap();
  console.log(`${placeIdMap.size} MasterSet rows indexed.\n`);

  console.log('Looking up masterbot persona user accounts...');
  const personaUserIds = await lookupPersonaUserIds();
  console.log(`${personaUserIds.size} persona accounts found.\n`);

  console.log('Checking for already-seeded image_urls (idempotency)...');
  const alreadySeeded = await getAlreadySeededImageUrls();
  console.log(`${alreadySeeded.size} food_cards already have an image_url.\n`);

  const personaBySlug = new Map(MASTERBOT_PERSONAS.map((p) => [p.slug, p]));

  let inserted = 0;
  let skipped = 0;

  for (const entry of metadata) {
    if (alreadySeeded.has(entry.image_url)) {
      skipped++;
      continue;
    }
    const persona = personaBySlug.get(entry.persona_slug);
    const userId = personaUserIds.get(entry.persona_slug);
    if (!persona || !userId) {
      console.warn(`  [${entry.filename}] no persona/user found for slug "${entry.persona_slug}", skipping.`);
      continue;
    }
    await seedEntry(entry, persona, userId, placeIdMap);
    inserted++;
  }

  console.log(`\n--- Masterbot dish card seeding complete ---`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (already seeded): ${skipped}`);
}

run();
