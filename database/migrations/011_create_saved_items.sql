-- =====================================================
-- CREATE SAVED_ITEMS TABLE FOR UNIFIED SAVE-TO-PLATE
-- =====================================================

-- Create saved_items table for unified save functionality
CREATE TABLE IF NOT EXISTS saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('restaurant', 'recipe', 'photo', 'other')),
    item_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure no duplicates per user
    UNIQUE(user_id, item_type, item_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_item_type ON saved_items(item_type);
CREATE INDEX IF NOT EXISTS idx_saved_items_created_at ON saved_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_items_user_type ON saved_items(user_id, item_type);

-- Enable Row Level Security
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own saved items
CREATE POLICY "Users can view own saved items" ON saved_items
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own saved items
CREATE POLICY "Users can insert own saved items" ON saved_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved items
CREATE POLICY "Users can update own saved items" ON saved_items
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own saved items
CREATE POLICY "Users can delete own saved items" ON saved_items
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_items_updated_at
    BEFORE UPDATE ON saved_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE saved_items IS 'Unified table for all user saved items (restaurants, recipes, photos, etc.)';
COMMENT ON COLUMN saved_items.item_type IS 'Type of saved item: restaurant, recipe, photo, other';
COMMENT ON COLUMN saved_items.item_id IS 'Unique identifier for the item (place_id, recipe_id, etc.)';
COMMENT ON COLUMN saved_items.metadata IS 'Additional item data (title, image_url, etc.) stored as JSON';
