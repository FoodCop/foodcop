-- ============================================================================
-- Google cost limits (docs/GOOGLE_COST_PLAN.md, phases 1 + 2)
-- ============================================================================
-- 1. Daily usage counters, shared by every server instance. Only the server
--    (service role) can read or change them.
-- 2. Removes old Google photo links from saved places. Each link held the API
--    key and cost money every time it was shown.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.google_usage_daily (
  day DATE NOT NULL,
  kind TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind)
);

CREATE TABLE IF NOT EXISTS public.google_usage_user (
  day DATE NOT NULL,
  kind TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind, user_id)
);

-- RLS on with no policies: nobody but the service role gets in.
ALTER TABLE public.google_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_usage_user ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.google_usage_daily, public.google_usage_user FROM PUBLIC, anon, authenticated;

-- Takes one unit if both limits allow it. Answers 'ok', 'user_limit' or 'daily_limit'.
-- The conditional upserts make it safe when several requests arrive at once.
CREATE OR REPLACE FUNCTION public.consume_google_quota(
  p_kind TEXT,
  p_user UUID,
  p_daily_limit INTEGER,
  p_user_limit INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_day DATE := (NOW() AT TIME ZONE 'UTC')::date;
  v_used INTEGER;
BEGIN
  IF p_user_limit < 1 THEN RETURN 'user_limit'; END IF;
  IF p_daily_limit < 1 THEN RETURN 'daily_limit'; END IF;

  INSERT INTO public.google_usage_user AS u (day, kind, user_id, used)
  VALUES (v_day, p_kind, p_user, 1)
  ON CONFLICT (day, kind, user_id) DO UPDATE SET used = u.used + 1
  WHERE u.used < p_user_limit
  RETURNING used INTO v_used;
  IF NOT FOUND THEN RETURN 'user_limit'; END IF;

  INSERT INTO public.google_usage_daily AS d (day, kind, used)
  VALUES (v_day, p_kind, 1)
  ON CONFLICT (day, kind) DO UPDATE SET used = d.used + 1
  WHERE d.used < p_daily_limit
  RETURNING used INTO v_used;
  IF NOT FOUND THEN RETURN 'daily_limit'; END IF;

  -- Once a day, drop per-person rows older than a week.
  IF v_used = 1 THEN
    DELETE FROM public.google_usage_user WHERE day < v_day - 7;
  END IF;
  RETURN 'ok';
END;
$$;
REVOKE ALL ON FUNCTION public.consume_google_quota(TEXT, UUID, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_google_quota(TEXT, UUID, INTEGER, INTEGER) TO service_role;

-- Old saved photo links. The place itself stays saved and shows FUZO's placeholder.
UPDATE public.saved_items
SET metadata = metadata - 'image' - 'img' - 'image_url'
WHERE metadata->>'image' ~ '^https://(maps|places)\.googleapis\.com/'
   OR metadata->>'img' ~ '^https://(maps|places)\.googleapis\.com/'
   OR metadata->>'image_url' ~ '^https://(maps|places)\.googleapis\.com/';
