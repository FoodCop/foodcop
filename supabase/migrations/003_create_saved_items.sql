-- Create saved_items table for user's saved content (plate items)
CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('restaurant', 'recipe', 'photo', 'video', 'other')),
  item_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_item UNIQUE (user_id, item_id, item_type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_item_type ON saved_items(item_type);
CREATE INDEX IF NOT EXISTS idx_saved_items_created_at ON saved_items(created_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own saved items"
  ON saved_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved items"
  ON saved_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved items"
  ON saved_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved items"
  ON saved_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_saved_items_updated_at
  BEFORE UPDATE ON saved_items
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_items_updated_at();
