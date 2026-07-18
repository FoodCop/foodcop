/**
 * MASTERBOT POINTS BACKFILL
 * ==================================================================
 * Retroactively awards points for the 138 masterbot food_cards that exist
 * (70 from scripts/seed_masterbots.ts, 68 from
 * scripts/seed_masterbot_dish_cards.ts) - both scripts wrote directly via the
 * service-role client, bypassing foodCardService.createFoodCard() (the only
 * code path that normally calls award_points()), so masterbots had earned
 * zero points despite having real published content.
 *
 * Per explicit decision: masterbots should earn points AND appear on
 * /leaderboard (see the is_master_bot filter removed from
 * pointsService.getLeaderboard() the same session, and the new
 * award_points_for_user() RPC in
 * supabase/migrations/20260720000000_masterbot_points_backfill_fn.sql -
 * award_points() itself can't be reused here since it hardcodes
 * v_user_id := auth.uid(), which is null for a service-role caller).
 *
 * Maps card_type -> action_type exactly the way
 * src/lib/services/foodCardService.ts's FAMILY_ACTION_TYPE does (same
 * familyOf() helper, same 'food_card' source_type/card-id source_id), so a
 * masterbot's points/counters end up identical to what they'd have been had
 * the card been published through the real app flow.
 *
 * Idempotent: award_points_for_user()'s underlying points_ledger has a
 * UNIQUE(user_id, action_type, source_type, source_id) constraint, so
 * re-running this script is a safe no-op for cards already awarded.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/award_masterbot_points.ts
 */

import { createClient } from '@supabase/supabase-js';
import { familyOf, type FoodCardFamily, type FoodCardType } from '../src/lib/types/foodCard';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const FAMILY_ACTION_TYPE: Record<FoodCardFamily, string> = {
  recipe: 'create_recipe',
  restaurant: 'create_restaurant',
  video: 'create_video',
  discovery: 'create_discovery',
};

async function run() {
  const { data: masterbots, error: mbError } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('is_master_bot', true);
  if (mbError || !masterbots) {
    console.error('Failed to load masterbot users:', mbError?.message);
    process.exit(1);
  }
  console.log(`${masterbots.length} masterbot accounts found.\n`);

  const { data: cards, error: cardsError } = await supabase
    .from('food_cards')
    .select('id, user_id, card_type')
    .in('user_id', masterbots.map((m) => m.id));
  if (cardsError || !cards) {
    console.error('Failed to load masterbot food_cards:', cardsError?.message);
    process.exit(1);
  }
  console.log(`${cards.length} masterbot food_cards found.\n`);

  let awarded = 0;
  let duplicate = 0;
  let failed = 0;

  for (const card of cards) {
    const actionType = FAMILY_ACTION_TYPE[familyOf(card.card_type as FoodCardType)];
    const { data, error } = await supabase.rpc('award_points_for_user', {
      p_user_id: card.user_id,
      p_action_type: actionType,
      p_source_type: 'food_card',
      p_source_id: card.id,
    });
    if (error) {
      console.warn(`  [${card.id}] award failed:`, error.message);
      failed++;
      continue;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.out_was_duplicate) {
      duplicate++;
    } else {
      awarded++;
    }
  }

  console.log(`\n--- Points backfill complete ---`);
  console.log(`Newly awarded: ${awarded}`);
  console.log(`Already awarded (skipped, idempotent): ${duplicate}`);
  console.log(`Failed: ${failed}`);

  console.log(`\n--- Per-masterbot totals ---`);
  const { data: updatedUsers } = await supabase
    .from('users')
    .select('display_name, points_total, points_level')
    .eq('is_master_bot', true)
    .order('points_total', { ascending: false });
  console.log(JSON.stringify(updatedUsers, null, 2));
}

run();
