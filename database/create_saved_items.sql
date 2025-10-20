-- Manual migration to create saved_items table if it doesn't exist
-- Run this directly in your Supabase SQL editor

-- Create saved_items table with core schema
CREATE TABLE IF NOT EXISTS saved_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User reference  
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Item classification
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('RECIPE', 'RESTAURANT', 'VIDEO', 'PHOTO')),
    item_id VARCHAR(255) NOT NULL,
    
    -- Flexible metadata storage
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    saved_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_items_type ON saved_items(item_type, user_id);

-- Add unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_items_unique ON saved_items(user_id, item_type, item_id);

-- Enable RLS
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own saved items" ON saved_items
    FOR ALL USING (auth.uid() = user_id);

-- Optional: Add is_favorite and is_private columns if they don't exist
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE saved_items ADD COLUMN is_favorite BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE saved_items ADD COLUMN is_private BOOLEAN DEFAULT true;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;