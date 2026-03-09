-- Create user_swipe_history table
-- Tracks user swipe interactions with feed content

CREATE TABLE IF NOT EXISTS public.user_swipe_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('restaurant', 'recipe', 'video', 'post')),
  swipe_direction TEXT NOT NULL CHECK (swipe_direction IN ('left', 'right', 'up', 'down')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate swipes
  UNIQUE(user_id, item_id, item_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_swipe_history_user_id ON public.user_swipe_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_swipe_history_created_at ON public.user_swipe_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_swipe_history_item ON public.user_swipe_history(item_id, item_type);

-- Enable Row Level Security
ALTER TABLE public.user_swipe_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own swipe history
CREATE POLICY "Users can view own swipe history"
  ON public.user_swipe_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own swipes
CREATE POLICY "Users can insert own swipes"
  ON public.user_swipe_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own swipes (for metadata updates)
CREATE POLICY "Users can update own swipes"
  ON public.user_swipe_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own swipes
CREATE POLICY "Users can delete own swipes"
  ON public.user_swipe_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.user_swipe_history TO authenticated;
GRANT SELECT ON public.user_swipe_history TO anon;

-- Add helpful comment
COMMENT ON TABLE public.user_swipe_history IS 'Tracks user swipe interactions with feed content for personalization';
