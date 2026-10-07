-- ==========================================
-- Leaderboard RPC (real rankings: scope x period)
-- ==========================================
-- Why an RPC: weekly / monthly rankings need SUM(points_ledger.points) for
-- OTHER users, but points_ledger is (correctly) owner-only under RLS, and
-- profile privacy must be honoured. This SECURITY DEFINER function returns only
-- public identity fields + a points total - never ledger rows.
--
--   scope  : 'global' | 'friends' (friends = accepted friends + you)
--   period : 'all' (users.points_total) | 'month' | 'week' (ledger sum since the
--            start of the current month / ISO week)
--
-- Rules baked in:
--   * Seeded demo accounts (is_master_bot) are never ranked - real people only.
--   * Respects profile visibility via can_view_profile() (Private users are not
--     listed; Followers-only users are listed to their friends). Requires
--     20260919010000_privacy_hardening.sql.
--   * Global lists only people who have scored (> 0) in the period; Friends lists
--     every friend so a new friend group still has a board.
--   * Ties share a rank (RANK()).
--   * Always includes the caller's own row (with their real rank, even outside
--     the top N) and the row directly above them, so the UI can say "42 pts to
--     pass Maya" from real data.

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_period TEXT DEFAULT 'all',
  p_limit INT DEFAULT 25
)
RETURNS TABLE (
  out_rank BIGINT,
  out_user_id UUID,
  out_display_name TEXT,
  out_username TEXT,
  out_avatar_url TEXT,
  out_points BIGINT,
  out_level INT,
  out_is_me BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me UUID := auth.uid();
  v_since TIMESTAMPTZ;
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 100);
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_scope NOT IN ('global', 'friends') THEN
    RAISE EXCEPTION 'Invalid scope';
  END IF;
  IF p_period NOT IN ('all', 'month', 'week') THEN
    RAISE EXCEPTION 'Invalid period';
  END IF;

  v_since := CASE p_period
    WHEN 'week' THEN date_trunc('week', now())
    WHEN 'month' THEN date_trunc('month', now())
    ELSE NULL
  END;

  RETURN QUERY
  WITH base AS (
    SELECT
      u.id,
      u.display_name,
      u.username,
      u.avatar_url,
      u.points_level,
      CASE WHEN v_since IS NULL THEN u.points_total::BIGINT ELSE COALESCE(l.pts, 0)::BIGINT END AS pts
    FROM public.users u
    LEFT JOIN (
      SELECT pl.user_id, SUM(pl.points) AS pts
      FROM public.points_ledger pl
      WHERE v_since IS NOT NULL AND pl.created_at >= v_since
      GROUP BY pl.user_id
    ) l ON l.user_id = u.id
    WHERE u.is_master_bot = false
      AND public.can_view_profile(u.id)
      AND (
        p_scope = 'global'
        OR u.id = v_me
        OR EXISTS (
          SELECT 1 FROM public.friend_requests fr
          WHERE fr.status = 'accepted'
            AND ((fr.requester_id = u.id AND fr.requested_id = v_me)
              OR (fr.requester_id = v_me AND fr.requested_id = u.id))
        )
      )
  ),
  ranked AS (
    SELECT b.*, RANK() OVER (ORDER BY b.pts DESC) AS rk
    FROM base b
    WHERE p_scope = 'friends' OR b.pts > 0 OR b.id = v_me
  ),
  mine AS (
    SELECT r.rk FROM ranked r WHERE r.id = v_me
  )
  SELECT r.rk, r.id, r.display_name, r.username, r.avatar_url, r.pts, r.points_level, (r.id = v_me)
  FROM ranked r
  WHERE r.rk <= v_limit
     OR r.id = v_me
     OR r.rk = (SELECT MAX(r2.rk) FROM ranked r2 WHERE r2.rk < (SELECT m.rk FROM mine m))
  ORDER BY r.rk, r.pts DESC, r.id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, TEXT, INT) TO authenticated;
