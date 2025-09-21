-- Migration: Create plates table (renamed from users)
-- This migration creates the new plates table structure

-- Create plates table
CREATE TABLE plates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Profile Information
    display_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_photo_url TEXT,

    -- Location
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(100),

    -- Preferences
    dietary_preferences JSONB DEFAULT '[]'::jsonb,
    cuisine_preferences JSONB DEFAULT '[]'::jsonb,

    -- Points & Gamification
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    streak_count INTEGER DEFAULT 0,

    -- Social Stats
    friends_count INTEGER DEFAULT 0,
    saved_places_count INTEGER DEFAULT 0,
    saved_recipes_count INTEGER DEFAULT 0,
    saved_photos_count INTEGER DEFAULT 0,
    saved_videos_count INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for plates table
CREATE INDEX idx_plates_user_id ON plates(user_id);
CREATE INDEX idx_plates_username ON plates(username);
CREATE INDEX idx_plates_created_at ON plates(created_at);
CREATE INDEX idx_plates_total_points ON plates(total_points DESC);

-- Enable RLS
ALTER TABLE plates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plates table
CREATE POLICY "Users can view public plates" ON plates FOR SELECT USING (true);
CREATE POLICY "Users can update own plate" ON plates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plate" ON plates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own plate" ON plates FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_plates_updated_at
    BEFORE UPDATE ON plates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
