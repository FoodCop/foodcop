-- Migration 015: Seed user points from existing saved items
-- Rule: 50 points per saved item (one-time bootstrap)

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
    p.saved_count * 50,
    'seed_bootstrap',
    'saved_items_2026_02_27',
    jsonb_build_object(
      'reason', 'bootstrap from historical saved_items',
      'saved_items', p.saved_count,
      'points_per_item', 50
    )
  FROM per_user_saved p
  WHERE p.saved_count > 0
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_points_ledger l
      WHERE l.user_id = p.user_id
        AND l.action_type = 'manual_adjustment'
        AND l.source_entity_type = 'seed_bootstrap'
        AND l.source_entity_id = 'saved_items_2026_02_27'
    )
  RETURNING user_id
)
SELECT COUNT(*) FROM inserted;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id FROM public.users
  LOOP
    PERFORM public.recalculate_user_points(rec.id);
  END LOOP;
END
$$;
