-- Migration 016: Admin utilities for points reseeding/rebalancing
-- Purpose: allow safe, repeatable points maintenance operations via service role.

-- Recalculate points for all users from ledger totals.
CREATE OR REPLACE FUNCTION public.recalculate_all_user_points()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  rec RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR rec IN SELECT id FROM public.users LOOP
    PERFORM public.recalculate_user_points(rec.id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Seed points from existing saved_items with a unique seed label.
-- Returns the number of inserted seed ledger rows.
CREATE OR REPLACE FUNCTION public.seed_points_from_saved_items_admin(
  p_points_per_item INTEGER DEFAULT 50,
  p_seed_label TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_seed_label TEXT;
  v_inserted_count INTEGER := 0;
BEGIN
  IF p_points_per_item <= 0 THEN
    RAISE EXCEPTION 'p_points_per_item must be > 0';
  END IF;

  v_seed_label := COALESCE(NULLIF(trim(p_seed_label), ''), to_char(now(), 'YYYY_MM_DD_HH24MISS'));

  WITH per_user_saved AS (
    SELECT
      u.id AS user_id,
      COUNT(si.*)::INTEGER AS saved_count
    FROM public.users u
    LEFT JOIN public.saved_items si ON si.user_id = u.id
    GROUP BY u.id
  ), inserted AS (
    INSERT INTO public.user_points_ledger (
      user_id,
      action_type,
      points_delta,
      source_entity_type,
      source_entity_id,
      metadata
    )
    SELECT
      p.user_id,
      'manual_adjustment',
      p.saved_count * p_points_per_item,
      'seed_bootstrap',
      v_seed_label,
      jsonb_build_object(
        'reason', 'admin reseed from historical saved_items',
        'saved_items', p.saved_count,
        'points_per_item', p_points_per_item
      )
    FROM per_user_saved p
    WHERE p.saved_count > 0
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_points_ledger l
        WHERE l.user_id = p.user_id
          AND l.action_type = 'manual_adjustment'
          AND l.source_entity_type = 'seed_bootstrap'
          AND l.source_entity_id = v_seed_label
      )
    RETURNING user_id
  )
  SELECT COUNT(*)::INTEGER INTO v_inserted_count FROM inserted;

  PERFORM public.recalculate_all_user_points();

  RETURN v_inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_all_user_points() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_points_from_saved_items_admin(INTEGER, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.recalculate_all_user_points() TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_points_from_saved_items_admin(INTEGER, TEXT) TO service_role;
