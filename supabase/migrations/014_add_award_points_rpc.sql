-- Migration 014: Add authenticated points award RPC
-- Default award amount is 50 points per supported action.

CREATE OR REPLACE FUNCTION public.award_user_points(
  p_action_type TEXT,
  p_source_entity_type TEXT DEFAULT NULL,
  p_source_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  points_awarded INTEGER,
  points_total INTEGER,
  points_level INTEGER,
  was_duplicate BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_award_points INTEGER := 50;
  v_total INTEGER := 0;
  v_level INTEGER := 1;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  IF p_action_type NOT IN ('save_item', 'share_item', 'snap_post') THEN
    RAISE EXCEPTION 'Unsupported points action: %', p_action_type;
  END IF;

  BEGIN
    INSERT INTO public.user_points_ledger (
      user_id,
      action_type,
      points_delta,
      source_entity_type,
      source_entity_id,
      metadata
    )
    VALUES (
      v_user_id,
      p_action_type,
      v_award_points,
      p_source_entity_type,
      p_source_entity_id,
      COALESCE(p_metadata, '{}'::JSONB)
    );
  EXCEPTION WHEN unique_violation THEN
    SELECT u.points_total, u.points_level
    INTO v_total, v_level
    FROM public.users u
    WHERE u.id = v_user_id;

    RETURN QUERY SELECT 0, COALESCE(v_total, 0), COALESCE(v_level, 1), true;
    RETURN;
  END;

  PERFORM public.recalculate_user_points(v_user_id);

  SELECT u.points_total, u.points_level
  INTO v_total, v_level
  FROM public.users u
  WHERE u.id = v_user_id;

  RETURN QUERY SELECT v_award_points, COALESCE(v_total, 0), COALESCE(v_level, 1), false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_user_points(TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_user_points(TEXT, TEXT, TEXT, JSONB) TO service_role;
