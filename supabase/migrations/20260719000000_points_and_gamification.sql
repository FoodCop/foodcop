-- ==========================================
-- Points, Levels, and Gamification Counters
-- ==========================================
-- Wires up public.users.points_total (existing column, read by
-- ChatService.listContacts's ORDER BY but never written anywhere) to two real
-- actions: publishing a food card (points vary by family) and sharing a card
-- with a friend (flat). Modeled on the proven pattern from the legacy app's
-- points system (ledger + idempotent award RPC + simple level formula) but
-- deliberately compact: 5 action types, 5 counters, one RPC - not the
-- 36-badge/14-achievement/35-counter rewards system that was never wired to
-- real data anywhere.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points_level INT NOT NULL DEFAULT 1;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS counters JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'create_recipe', 'create_restaurant', 'create_video', 'create_discovery', 'share_card'
  )),
  points INT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, action_type, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS points_ledger_user_idx ON public.points_ledger (user_id);

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points ledger." ON public.points_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- No INSERT policy for authenticated/anon - all writes happen through
-- award_points() below (SECURITY DEFINER), so a client can't fabricate rows.

GRANT SELECT ON TABLE public.points_ledger TO authenticated;
GRANT ALL ON TABLE public.points_ledger TO service_role;

-- Single RPC: looks up the point value + counter key for the action from two
-- small 5-entry CASE statements (no separate config table - keeps this
-- compact), inserts into the ledger (a unique_violation means "already
-- awarded for this exact source, no-op"), and on a real insert atomically
-- bumps users.points_total/points_level and the one matching user_stats
-- counter (upserted, since a user_stats row may not exist yet if onboarding
-- was never finished). 200 points per level - the same constant is mirrored
-- client-side in src/lib/rewards/progressionEngine.ts (POINTS_PER_LEVEL)
-- rather than recomputed independently.
-- Output columns are prefixed (out_*) because PL/pgSQL auto-declares a
-- variable per RETURNS TABLE column in the function's own scope - naming one
-- `points_total` would collide with (and shadow) the `public.users.points_total`
-- column inside the UPDATE below, causing "column reference is ambiguous".
CREATE OR REPLACE FUNCTION public.award_points(
  p_action_type TEXT,
  p_source_type TEXT,
  p_source_id TEXT
)
RETURNS TABLE (out_points_awarded INT, out_points_total INT, out_points_level INT, out_was_duplicate BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_points INT;
  v_counter_key TEXT;
  v_inserted BOOLEAN := true;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_points := CASE p_action_type
    WHEN 'create_recipe' THEN 40
    WHEN 'create_video' THEN 25
    WHEN 'create_restaurant' THEN 20
    WHEN 'create_discovery' THEN 15
    WHEN 'share_card' THEN 10
    ELSE 0
  END;

  v_counter_key := CASE p_action_type
    WHEN 'create_recipe' THEN 'recipe_cards'
    WHEN 'create_restaurant' THEN 'restaurant_cards'
    WHEN 'create_video' THEN 'video_cards'
    WHEN 'create_discovery' THEN 'discovery_cards'
    WHEN 'share_card' THEN 'cards_shared'
    ELSE NULL
  END;

  BEGIN
    INSERT INTO public.points_ledger (user_id, action_type, points, source_type, source_id)
    VALUES (v_user_id, p_action_type, v_points, p_source_type, p_source_id);
  EXCEPTION WHEN unique_violation THEN
    v_inserted := false;
  END;

  IF v_inserted THEN
    UPDATE public.users
      SET points_total = points_total + v_points,
          points_level = FLOOR((points_total + v_points) / 200.0)::INT + 1
      WHERE id = v_user_id;

    INSERT INTO public.user_stats (user_id, counters)
    VALUES (v_user_id, jsonb_build_object(v_counter_key, 1))
    ON CONFLICT (user_id) DO UPDATE
    SET counters = jsonb_set(
      public.user_stats.counters,
      ARRAY[v_counter_key],
      to_jsonb(COALESCE((public.user_stats.counters->>v_counter_key)::int, 0) + 1)
    );
  END IF;

  RETURN QUERY
    SELECT
      (CASE WHEN v_inserted THEN v_points ELSE 0 END),
      u.points_total,
      u.points_level,
      NOT v_inserted
    FROM public.users u
    WHERE u.id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_points(TEXT, TEXT, TEXT) TO authenticated;
