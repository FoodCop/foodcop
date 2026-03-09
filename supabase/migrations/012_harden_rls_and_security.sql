-- Migration 012: Harden RLS and security posture
-- - Restrict write access on public cache tables to service_role
-- - Add missing policy for kv_store table with RLS enabled
-- - Convert risky views to security invoker
-- - Pin search_path on security-sensitive functions

-- ============================================
-- 1) feed_cards: keep public read, restrict writes
-- ============================================

DROP POLICY IF EXISTS feed_cards_insert_policy ON public.feed_cards;
DROP POLICY IF EXISTS feed_cards_update_policy ON public.feed_cards;

CREATE POLICY feed_cards_insert_policy
ON public.feed_cards
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY feed_cards_update_policy
ON public.feed_cards
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 2) place_media_cache: keep public read, restrict writes
-- ============================================

DROP POLICY IF EXISTS "cache insert" ON public.place_media_cache;
DROP POLICY IF EXISTS "cache update" ON public.place_media_cache;
DROP POLICY IF EXISTS "cache delete" ON public.place_media_cache;

CREATE POLICY "cache insert"
ON public.place_media_cache
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "cache update"
ON public.place_media_cache
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "cache delete"
ON public.place_media_cache
FOR DELETE
TO service_role
USING (true);

-- ============================================
-- 3) kv_store table: add missing policy when table exists
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'kv_store_1fe262e4'
      AND c.relkind = 'r'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS kv_store_service_role_only ON public.kv_store_1fe262e4';
    EXECUTE 'CREATE POLICY kv_store_service_role_only ON public.kv_store_1fe262e4 FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END
$$;

-- ============================================
-- 4) Views: avoid SECURITY DEFINER exposure
-- ============================================

ALTER VIEW IF EXISTS public.message_retention_info SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_master_bot_posts SET (security_invoker = true);

-- ============================================
-- 5) Functions: pin search_path explicitly
-- ============================================

ALTER FUNCTION public.cleanup_empty_conversations() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_available_recipe_for_bot(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_available_recipe_for_bot(uuid, text[], text[], integer) SET search_path = public, pg_temp;
