/**
 * PROFILE KPI SERVICE
 * Gathers the raw signals the KPI engine (src/lib/profile/kpi/compute.ts)
 * needs. Maps the spec's event names onto the tables that already hold them:
 *
 *   place_visited / review_published / content_published -> food_cards (passed in)
 *   food_card_saved                                      -> saved_items
 *   content_shared                                       -> points_ledger ('share_card')
 *   card views / skips / searches                        -> user_events
 *
 * saved_items, points_ledger, user_events, taste_profiles, group_members and
 * event_rsvps are owner-only under RLS, so for a visitor those come back
 * empty - the caller passes isOwner=false and they are reported as
 * "unavailable" (null) instead of a misleading zero.
 *
 * Every read is best-effort: a failed/missing table (e.g. user_events not yet
 * migrated) degrades that one signal to empty rather than breaking Food DNA.
 */

import { createClient } from '@/lib/supabase/client';
import type { FoodCardRecord } from '@/lib/types/foodCard';
import type { DnaAxis } from '@/lib/recommendation/dna';
import type { EventSignal, KpiInput, SavedSignal } from '@/lib/profile/kpi/compute';

export interface ProfileSignals {
  saved: SavedSignal[] | null;
  shares: { createdAt: string }[] | null;
  events: EventSignal[];
  crewCount: number | null;
  rsvpCount: number | null;
  questionnaire: KpiInput['questionnaire'];
}

const EMPTY_SIGNALS: ProfileSignals = {
  saved: null,
  shares: null,
  events: [],
  crewCount: null,
  rsvpCount: null,
  questionnaire: { dnaScores: null, flavors: null, cuisines: null },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// saved_items rows that are not "food cards" in the KPI sense.
const NON_FOOD_ITEM_TYPES = new Set(['ad', 'trivia']);
const CARD_LOOKUP_CHUNK = 150;

async function fetchCardsByIds(ids: string[]): Promise<Map<string, FoodCardRecord>> {
  const client = createClient();
  const out = new Map<string, FoodCardRecord>();
  if (!client || ids.length === 0) return out;
  for (let i = 0; i < ids.length; i += CARD_LOOKUP_CHUNK) {
    const { data } = await client.from('food_cards').select('*').in('id', ids.slice(i, i + CARD_LOOKUP_CHUNK));
    for (const row of (data ?? []) as FoodCardRecord[]) out.set(row.id, row);
  }
  return out;
}

export const ProfileKpiService = {
  async getSignals(userId: string, isOwner: boolean): Promise<ProfileSignals> {
    const client = createClient();
    if (!client || !isOwner) return EMPTY_SIGNALS;

    const [savedRes, shareRes, eventRes, crewRes, rsvpRes, tasteRes, consentRes] = await Promise.all([
      client.from('saved_items').select('item_type, item_id, metadata, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(500),
      client.from('points_ledger').select('created_at').eq('user_id', userId).eq('action_type', 'share_card').limit(1000),
      client.from('user_events').select('event_type, entity_id, metadata, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1000),
      client.from('group_members').select('group_id', { count: 'exact', head: true }).eq('user_id', userId),
      client.from('event_rsvps').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'going'),
      client.from('taste_profiles').select('cuisines, flavors, dna_scores').eq('user_id', userId).maybeSingle(),
      client.from('user_settings').select('use_activity_for_ml').eq('user_id', userId).maybeSingle(),
    ]);

    const savedRows = (savedRes.data ?? []).filter((r) => !NON_FOOD_ITEM_TYPES.has(String(r.item_type)));
    // "Use Activity for Matching" off = behavioural events are not used for the
    // profile either (they are also no longer recorded - see ActivityEventService).
    const activityAllowed = consentRes.data?.use_activity_for_ml ?? true;
    const eventRows = eventRes.error || !activityAllowed ? [] : (eventRes.data ?? []);

    const cardIds = new Set<string>();
    for (const r of savedRows) if (UUID_RE.test(String(r.item_id))) cardIds.add(String(r.item_id));
    for (const e of eventRows) if (e.entity_id && UUID_RE.test(String(e.entity_id))) cardIds.add(String(e.entity_id));
    const cards = await fetchCardsByIds([...cardIds]);

    const saved: SavedSignal[] = savedRows.map((r) => {
      const meta = (r.metadata && typeof r.metadata === 'object' ? r.metadata : {}) as Record<string, unknown>;
      return {
        itemType: String(r.item_type),
        createdAt: String(r.created_at),
        cuisine: typeof meta.cuisine === 'string' && meta.cuisine.trim() ? meta.cuisine : null,
        card: cards.get(String(r.item_id)) ?? null,
      };
    });

    const events: EventSignal[] = eventRows.map((e) => {
      const meta = (e.metadata && typeof e.metadata === 'object' ? e.metadata : {}) as Record<string, unknown>;
      return {
        type: e.event_type as EventSignal['type'],
        createdAt: String(e.created_at),
        card: e.entity_id ? cards.get(String(e.entity_id)) ?? null : null,
        query: typeof meta.query === 'string' ? meta.query : undefined,
      };
    });

    const taste = tasteRes.data;
    return {
      saved: savedRes.error ? null : saved,
      shares: shareRes.error ? null : (shareRes.data ?? []).map((r) => ({ createdAt: String(r.created_at) })),
      events,
      crewCount: crewRes.error ? null : crewRes.count ?? 0,
      rsvpCount: rsvpRes.error ? null : rsvpRes.count ?? 0,
      questionnaire: {
        dnaScores: (taste?.dna_scores as Record<DnaAxis, number> | null) ?? null,
        flavors: (taste?.flavors as string[] | null) ?? null,
        cuisines: (taste?.cuisines as string[] | null) ?? null,
      },
    };
  },
};
