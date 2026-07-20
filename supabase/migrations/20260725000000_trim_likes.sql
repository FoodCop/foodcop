-- ==========================================
-- Trims: real per-user "like" persistence
-- ==========================================
-- TrimsReel.tsx's heart toggle was useState-only - lost on refresh, and the
-- reel's own separate offcanvas "Save" action had no onClick at all. Save
-- reuses the existing saved_items/PlateService pipeline (itemType 'video',
-- see Phase 1's Bites wiring for the same pattern), but Like is kept in its
-- own small table rather than folded into saved_items - the reel's own UI
-- already treats "like" and "save" as two separate actions, and Trims
-- content is still 5 bundled static files (not food_cards rows), so trim_id
-- is a plain int, not a UUID FK into anything.
CREATE TABLE IF NOT EXISTS public.trim_likes (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  trim_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, trim_id)
);

ALTER TABLE public.trim_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trim likes." ON public.trim_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trim likes." ON public.trim_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own trim likes." ON public.trim_likes FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON TABLE public.trim_likes TO anon, authenticated, service_role;
