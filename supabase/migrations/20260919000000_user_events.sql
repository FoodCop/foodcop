-- ==========================================
-- User activity events (Food DNA / Exploration KPIs)
-- ==========================================
-- The Profile KPI architecture (see src/lib/profile/kpi) is derived from data
-- the app already persists: food_cards (place_visited, review_published,
-- content_published), saved_items (food_card_saved) and points_ledger
-- (content_shared). This table only stores the behavioural signals that had
-- no home yet - a card being viewed in detail, a card being skipped in the
-- swipe feed, and a search - which feed Flavor DNA weighting, the Food DNA
-- behaviour score and "Days Active". Deliberately narrow (CHECK-constrained
-- event_type) so it can't grow into a catch-all analytics dump.

CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('card_viewed', 'card_skipped', 'search')),
  entity_type TEXT,                                   -- e.g. 'food_card'
  entity_id TEXT,                                     -- food_cards.id for card events
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,        -- e.g. {"query": "ramen"} for search
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_events_user_created_idx ON public.user_events (user_id, created_at DESC);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events." ON public.user_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events." ON public.user_events FOR INSERT WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON TABLE public.user_events TO authenticated;
GRANT ALL ON TABLE public.user_events TO service_role;
