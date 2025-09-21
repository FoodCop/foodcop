-- Migration: Create plate_items table for unified saving system
-- This migration creates the new plate_items table for all content types

-- Create plate_items table
CREATE TABLE plate_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_id UUID NOT NULL REFERENCES plates(id) ON DELETE CASCADE,

    -- Item Details
    item_type TEXT NOT NULL CHECK (item_type IN ('restaurant', 'recipe', 'photo', 'video')),
    item_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint for idempotency
    UNIQUE(plate_id, item_type, item_id)
);

-- Create indexes for plate_items table
CREATE INDEX idx_plate_items_plate_id ON plate_items(plate_id);
CREATE INDEX idx_plate_items_item_type ON plate_items(item_type);
CREATE INDEX idx_plate_items_item_id ON plate_items(item_id);
CREATE INDEX idx_plate_items_created_at ON plate_items(created_at DESC);
CREATE INDEX idx_plate_items_plate_type ON plate_items(plate_id, item_type);

-- Enable RLS
ALTER TABLE plate_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plate_items table
CREATE POLICY "Users can manage own plate items" ON plate_items
    FOR ALL USING (plate_id IN (
        SELECT id FROM plates WHERE user_id = auth.uid()
    ));

-- Create trigger for updated_at
CREATE TRIGGER update_plate_items_updated_at
    BEFORE UPDATE ON plate_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
