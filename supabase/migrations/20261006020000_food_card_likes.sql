-- Feed likes (client, 2026-10-06): swiping a Feed card right is a "like",
-- separate from saving it to My Plate (swipe down). One row per user + card.

CREATE TABLE IF NOT EXISTS public.food_card_likes (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.food_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, card_id)
);

CREATE INDEX IF NOT EXISTS food_card_likes_card_idx ON public.food_card_likes (card_id);

ALTER TABLE public.food_card_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own food card likes." ON public.food_card_likes;
CREATE POLICY "Users can view own food card likes." ON public.food_card_likes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can like food cards." ON public.food_card_likes;
CREATE POLICY "Users can like food cards." ON public.food_card_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlike food cards." ON public.food_card_likes;
CREATE POLICY "Users can unlike food cards." ON public.food_card_likes FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.food_card_likes TO authenticated;
