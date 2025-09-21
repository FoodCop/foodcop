-- Migration: Create saved_places table (renamed from plates)
-- This migration creates the new saved_places table for restaurant saves

-- Create saved_places table
CREATE TABLE saved_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_id UUID NOT NULL REFERENCES plates(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Save Details
    saved_type VARCHAR(20) DEFAULT 'want_to_try' CHECK (saved_type IN ('want_to_try', 'favorite', 'visited', 'wishlist')),
    notes TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),

    -- User Experience
    user_rating DECIMAL(3,2),
    visit_date DATE,
    spent_amount DECIMAL(10,2),

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(plate_id, restaurant_id)
);

-- Create indexes for saved_places table
CREATE INDEX idx_saved_places_plate_id ON saved_places(plate_id);
CREATE INDEX idx_saved_places_restaurant_id ON saved_places(restaurant_id);
CREATE INDEX idx_saved_places_saved_type ON saved_places(saved_type);
CREATE INDEX idx_saved_places_created_at ON saved_places(created_at DESC);

-- Enable RLS
ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_places table
CREATE POLICY "Users can manage own saved places" ON saved_places
    FOR ALL USING (plate_id IN (
        SELECT id FROM plates WHERE user_id = auth.uid()
    ));

-- Create trigger for updated_at
CREATE TRIGGER update_saved_places_updated_at
    BEFORE UPDATE ON saved_places
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
