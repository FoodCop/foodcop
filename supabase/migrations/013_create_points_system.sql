-- Migration 013: Create points system foundation
-- Adds persistent user points totals and an auditable points ledger.

-- ============================================
-- 1) Add points columns to users
-- ============================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS points_total INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_level INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS points_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN public.users.points_total IS 'Current total earned points for the user.';
COMMENT ON COLUMN public.users.points_level IS 'Current user level derived from points progression.';
COMMENT ON COLUMN public.users.points_updated_at IS 'Last time points totals were updated.';

-- ============================================
-- 2) Points ledger table
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('save_item', 'share_item', 'snap_post', 'manual_adjustment', 'reward_redemption')),
  points_delta INTEGER NOT NULL,
  source_entity_type TEXT,
  source_entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_points_ledger IS 'Immutable ledger of points earn/spend events per user.';

CREATE INDEX IF NOT EXISTS idx_user_points_ledger_user_created
  ON public.user_points_ledger(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_points_ledger_action_type
  ON public.user_points_ledger(action_type, created_at DESC);

-- Prevent duplicate awards for the same source object and action type
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_points_ledger_event_source
  ON public.user_points_ledger(user_id, action_type, source_entity_type, source_entity_id)
  WHERE source_entity_type IS NOT NULL AND source_entity_id IS NOT NULL;

-- ============================================
-- 3) RLS
-- ============================================

ALTER TABLE public.user_points_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own points ledger" ON public.user_points_ledger;
CREATE POLICY "Users can view own points ledger"
  ON public.user_points_ledger
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages points ledger" ON public.user_points_ledger;
CREATE POLICY "Service role manages points ledger"
  ON public.user_points_ledger
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 4) Helper function to recalculate totals from ledger
-- ============================================

CREATE OR REPLACE FUNCTION public.recalculate_user_points(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total INTEGER;
  v_level INTEGER;
BEGIN
  SELECT COALESCE(SUM(points_delta), 0)
  INTO v_total
  FROM public.user_points_ledger
  WHERE user_id = p_user_id;

  v_level := GREATEST(1, FLOOR(v_total / 1000.0)::INTEGER + 1);

  UPDATE public.users
  SET
    points_total = v_total,
    points_level = v_level,
    points_updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_user_points(UUID) TO service_role;
