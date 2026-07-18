/**
 * MASTERBOT SEEDING SCRIPT
 * ==================================================================
 * Signs up the 7 FUZO masterbot personas (scripts/data/masterbotPersonas.ts,
 * sourced from masterbot_Profiles.txt) as real Supabase accounts, gives them
 * a real taste profile (replicating OnboardingWizard.finalize()'s Path-A
 * writes directly - no browser involved), and creates real `food_cards` for
 * each from the scraped Google-Places restaurant data at
 * K:\H DRIVE\Quantum Climb\APPS\Fuzo_Doc_Backup\data\MasterSet_<city>.json,
 * with thumbnails copied from that backup's public/generated-images/.
 *
 * Everything goes through the service-role client, which bypasses RLS - this
 * is what lets a single script create+own content for 7 different user ids
 * without ever needing 7 real login sessions (foodCardService.createFoodCard()
 * requires a live session; this script replicates its insert shape directly
 * instead, same as it replicates ScoutPersistence.saveScoutFind()'s inserts
 * for the Scout-map dual-write).
 *
 * Idempotent/resumable: reruns reuse existing accounts (looked up by email)
 * and skip content generation entirely for any persona that already has
 * food_cards.
 *
 * Masterbot cards deliberately do NOT call the award_points RPC - it keys off
 * auth.uid(), which is null for a service-role caller, and masterbots aren't
 * meant to compete on the (human) leaderboard - see the is_master_bot filter
 * added to pointsService.getLeaderboard().
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed_masterbots.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { MASTERBOT_PERSONAS, type MasterbotPersona } from './data/masterbotPersonas';
import { PERSONALITY } from '../src/lib/onboarding/data';
import { emptyCardTags, DEFAULT_FLAVOR, type FoodCardType } from '../src/lib/types/foodCard';
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
const IMAGES_SRC_DIR = 'K:/H DRIVE/Quantum Climb/APPS/Fuzo_Doc_Backup/public/generated-images';
const IMAGES_DEST_DIR = path.resolve(__dirname, '../public/generated-images');

const RESTAURANT_CARDS_PER_PERSONA = 8;
const DISCOVERY_CARDS_PER_PERSONA = 2;

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
  imageUrl?: string;
  additionalInfo?: Record<string, Array<Record<string, boolean>>>;
}

// Real, non-fabricated tag derivation from the scraped data itself (not the
// persona) - reuses the same taxonomy vocab src/lib/utils/taxonomy.ts and the
// Create Card studios' TagChips already use, so masterbot cards are tagged
// with the same vocabulary a real user's cards would be.
function matchAgainstVocab(haystack: string, tags: readonly string[], synonyms: Record<string, string>): string[] {
  const lower = haystack.toLowerCase();
  const found = new Set<string>();
  for (const tag of tags) {
    if (lower.includes(tag.toLowerCase())) found.add(tag);
  }
  for (const [syn, canonical] of Object.entries(synonyms)) {
    if (lower.includes(syn.toLowerCase()) && (tags as string[]).includes(canonical)) found.add(canonical);
  }
  return [...found];
}

// Google's own categoryName/categories overlap heavily with FUZO's
// foodCategories/vibes vocab ("Café", "BBQ", "Fine dining restaurant") - real
// signal, not invented.
function deriveFoodTypeAndOccasion(row: MasterSetRow): { foodType: string[]; occasion: string[] } {
  const haystack = `${row.categoryName || ''} ${(row.categories || []).join(' ')}`;
  return {
    foodType: matchAgainstVocab(haystack, taxonomyData.foodCategories.tags, taxonomyData.foodCategories.synonyms),
    occasion: matchAgainstVocab(haystack, taxonomyData.vibes.tags, taxonomyData.vibes.synonyms),
  };
}

// cooking_style has no taxonomy.ts source (see TagChips.tsx's comment - it's
// a small hardcoded list) - matched the same literal list via category text.
const COOKING_STYLE_KEYWORDS: Record<string, string> = {
  barbecue: 'Grilled', bbq: 'Grilled', grill: 'Grilled',
  bakery: 'Baked', baked: 'Baked',
  fried: 'Fried',
  steamed: 'Steamed', 'dim sum': 'Steamed',
  smoked: 'Smoked',
  roast: 'Roasted',
};
function deriveCookingStyle(row: MasterSetRow): string[] {
  const haystack = `${row.categoryName || ''} ${(row.categories || []).join(' ')}`.toLowerCase();
  const found = new Set<string>();
  for (const [keyword, style] of Object.entries(COOKING_STYLE_KEYWORDS)) {
    if (haystack.includes(keyword)) found.add(style);
  }
  return [...found];
}

// Google's "Popular for"/"Dining options" additionalInfo fields are real,
// per-venue survey data (not inferred) - flatten the array-of-single-key-
// objects shape and keep only keys that are true and match FUZO's mealTypes
// vocab.
function deriveMealType(row: MasterSetRow): string[] {
  const sections = [...(row.additionalInfo?.['Popular for'] || []), ...(row.additionalInfo?.['Dining options'] || [])];
  const flags = Object.assign({}, ...sections);
  return (taxonomyData.mealTypes.tags as string[]).filter((tag) => flags[tag]);
}

function loadCityRows(cityFiles: string[]): MasterSetRow[] {
  const rows: MasterSetRow[] = [];
  for (const city of cityFiles) {
    const p = path.join(MASTERSET_DIR, `MasterSet_${city}.json`);
    if (!fs.existsSync(p)) {
      console.warn(`  MasterSet file not found, skipping: ${p}`);
      continue;
    }
    const cityRows: MasterSetRow[] = JSON.parse(fs.readFileSync(p, 'utf-8'));
    rows.push(...cityRows);
  }
  return rows;
}

function pickRestaurants(persona: MasterbotPersona): MasterSetRow[] {
  const rows = loadCityRows(persona.cityFiles);
  const matches = rows.filter((r) => {
    const haystack = `${r.categoryName || ''} ${(r.categories || []).join(' ')}`;
    return persona.categoryPattern.test(haystack) && r.location?.lat && r.location?.lng;
  });
  return matches.slice(0, RESTAURANT_CARDS_PER_PERSONA);
}

// Most MasterSet rows (369/490) carry a Google Photos URL
// (lh3.googleusercontent.com) - these are confirmed DEAD (verified via curl:
// every sampled one now 400s) since Google's photo links expire and this
// data was scraped in late 2025 - so http(s) imageUrls are deliberately
// skipped, not used as a "free" thumbnail source, to avoid rendering broken
// image icons. The remainder point at a locally-generated
// `/generated-images/<placeId>_v2.png` from the AI image-generation pass,
// which only ever covered ~206/490 places before hitting its OpenAI billing
// cap - copy it over if it actually exists, otherwise the card just has no
// image (same graceful degradation the studios already use elsewhere).
function copyThumbnail(row: MasterSetRow): string | null {
  if (!row.imageUrl || row.imageUrl.startsWith('http')) return null;

  const filename = path.basename(row.imageUrl);
  const src = path.join(IMAGES_SRC_DIR, filename);
  if (!fs.existsSync(src)) return null;

  fs.mkdirSync(IMAGES_DEST_DIR, { recursive: true });
  const dest = path.join(IMAGES_DEST_DIR, filename);
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
  return `/generated-images/${filename}`;
}

async function ensureAccount(persona: MasterbotPersona): Promise<string> {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', persona.email)
    .maybeSingle();

  let userId: string;

  if (existing?.id) {
    userId = existing.id;
    console.log(`  Reusing existing account for ${persona.displayName} (${userId})`);
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: persona.email,
      password: randomUUID(),
      email_confirm: true,
      user_metadata: { display_name: persona.displayName },
    });
    if (error || !created?.user) {
      throw new Error(`Failed to create auth user for ${persona.displayName}: ${error?.message}`);
    }
    userId = created.user.id;
    console.log(`  Created new account for ${persona.displayName} (${userId})`);
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      is_master_bot: true,
      username: persona.username,
      display_name: persona.displayName,
      profile_type: 'foodlover',
      profile_subtype: persona.subtype,
      is_onboarded: true,
    })
    .eq('id', userId);
  if (updateError) console.warn(`  users update warning for ${persona.displayName}:`, updateError.message);

  const archetype = PERSONALITY[persona.archetype];
  const { error: tasteError } = await supabase.from('taste_profiles').upsert(
    {
      user_id: userId,
      cuisines: persona.cuisines,
      dietary: persona.dietary,
      result_emoji: archetype.icon,
      result_title: archetype.title,
      result_desc: archetype.desc,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (tasteError) console.warn(`  taste_profiles upsert warning for ${persona.displayName}:`, tasteError.message);

  const { error: statsError } = await supabase.from('user_stats').upsert({ user_id: userId }, { onConflict: 'user_id' });
  if (statsError) console.warn(`  user_stats upsert warning for ${persona.displayName}:`, statsError.message);

  return userId;
}

async function seedContent(persona: MasterbotPersona, userId: string): Promise<void> {
  const { count } = await supabase
    .from('food_cards')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (count && count > 0) {
    console.log(`  ${persona.displayName} already has ${count} food_cards, skipping content generation.`);
    return;
  }

  const restaurants = pickRestaurants(persona);
  console.log(`  Matched ${restaurants.length} restaurants for ${persona.displayName}.`);

  const restaurantCardType: FoodCardType = persona.restaurantCardFamily;
  const rows: Record<string, unknown>[] = [];

  for (const r of restaurants) {
    const imageUrl = copyThumbnail(r);
    const { foodType, occasion } = deriveFoodTypeAndOccasion(r);
    rows.push({
      user_id: userId,
      card_type: restaurantCardType,
      title: r.title,
      caption: `${persona.voiceQuote} — spotted at ${r.title}${r.city ? `, ${r.city}` : ''}.`,
      tags: {
        ...emptyCardTags(),
        cuisine: persona.cuisines,
        diet: persona.dietary,
        price_level: r.price || null,
        food_type: foodType,
        occasion,
        cooking_style: deriveCookingStyle(r),
        meal_type: deriveMealType(r),
      },
      flavor_profile: DEFAULT_FLAVOR,
      ingredients: [],
      nutrition: {},
      place_id: r.placeId,
      lat: r.location!.lat,
      lng: r.location!.lng,
      media_url: null,
      image_url: imageUrl,
      status: 'PUBLISHED',
      stats: { likes: 0, saves: 0 },
    });
  }

  for (let i = 0; i < DISCOVERY_CARDS_PER_PERSONA; i++) {
    rows.push({
      user_id: userId,
      card_type: 'FOOD_REVIEW',
      title: `${persona.displayName}'s Take`,
      caption: persona.voiceQuote,
      tags: { ...emptyCardTags(), cuisine: persona.cuisines, diet: persona.dietary },
      flavor_profile: DEFAULT_FLAVOR,
      ingredients: [],
      nutrition: {},
      place_id: null,
      lat: null,
      lng: null,
      media_url: null,
      image_url: restaurants[i] ? copyThumbnail(restaurants[i]) : null,
      status: 'PUBLISHED',
      stats: { likes: 0, saves: 0 },
    });
  }

  if (rows.length === 0) {
    console.warn(`  No content generated for ${persona.displayName} - no matching restaurants found.`);
    return;
  }

  const { error: cardsError } = await supabase.from('food_cards').insert(rows);
  if (cardsError) {
    console.error(`  food_cards insert failed for ${persona.displayName}:`, cardsError.message);
    return;
  }
  console.log(`  Inserted ${rows.length} food_cards for ${persona.displayName}.`);

  // Scout-map dual-write, replicating ScoutPersistence.saveScoutFind()'s
  // insert shape directly (that service uses the browser/anon client, which
  // has no session here - not usable from a service-role script).
  for (const r of restaurants) {
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: `New Discovery: ${r.title}\n${r.categoryName || ''}`,
        latitude: r.location!.lat,
        longitude: r.location!.lng,
        rating: r.totalScore || 0,
        images: [],
        image_url: '',
      })
      .select('id')
      .single();
    if (postError) console.warn(`  Scout post dual-write skipped for ${r.title}:`, postError.message);

    const { error: locationError } = await supabase.from('fuzo_locations').insert({
      user_id: userId,
      source_post_id: post?.id || null,
      location_name: r.title,
      restaurant_name: r.title,
      cuisine: r.categoryName || persona.cuisines[0] || '',
      latitude: r.location!.lat,
      longitude: r.location!.lng,
      address: r.address || '',
      notes: '',
      tags: persona.cuisines,
      photos: [],
      timings: {},
      rating: r.totalScore || 0,
    });
    if (locationError) console.warn(`  fuzo_locations dual-write failed for ${r.title}:`, locationError.message);
  }
}

async function run() {
  console.log(`Seeding ${MASTERBOT_PERSONAS.length} masterbot personas...\n`);

  for (const persona of MASTERBOT_PERSONAS) {
    console.log(`--- ${persona.displayName} ---`);
    const userId = await ensureAccount(persona);
    await seedContent(persona, userId);
    console.log('');
  }

  console.log('--- Masterbot seeding complete ---');
}

run();
