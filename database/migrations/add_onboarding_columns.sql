-- Migration: Add onboarding_completed column to users table
-- This ensures the column exists for the onboarding flow

-- Add onboarding_completed column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update any existing users to have onboarding_completed = false by default
UPDATE users 
SET onboarding_completed = FALSE 
WHERE onboarding_completed IS NULL;

-- Add index for onboarding_completed if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

-- Also ensure other preference columns exist
DO $$
BEGIN
    -- Add spice_tolerance if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'spice_tolerance'
    ) THEN
        ALTER TABLE users ADD COLUMN spice_tolerance INTEGER DEFAULT 3 CHECK (spice_tolerance >= 1 AND spice_tolerance <= 5);
    END IF;

    -- Add price_range_preference if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'price_range_preference'
    ) THEN
        ALTER TABLE users ADD COLUMN price_range_preference INTEGER DEFAULT 2 CHECK (price_range_preference >= 1 AND price_range_preference <= 4);
    END IF;
END $$;

-- Create saved_items table if it doesn't exist (for user's plate)
CREATE TABLE IF NOT EXISTS saved_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Item details
    type VARCHAR(20) NOT NULL CHECK (type IN ('restaurant', 'recipe')), -- restaurant or recipe
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine VARCHAR(100),
    
    -- Restaurant specific fields
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    website TEXT,
    price_range INTEGER CHECK (price_range >= 1 AND price_range <= 4),
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
    
    -- Recipe specific fields
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    prep_time VARCHAR(50), -- e.g., "30 min"
    cook_time VARCHAR(50),
    servings INTEGER,
    ingredients JSONB DEFAULT '[]'::jsonb,
    instructions JSONB DEFAULT '[]'::jsonb,
    
    -- Common fields
    image_url TEXT,
    source_url TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'saved' CHECK (status IN ('saved', 'want_to_try', 'tried', 'loved', 'not_recommended')),
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, name, type) -- Prevent duplicate items for same user
);

-- Indexes for saved_items table
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_type ON saved_items(type);
CREATE INDEX IF NOT EXISTS idx_saved_items_status ON saved_items(status);
CREATE INDEX IF NOT EXISTS idx_saved_items_cuisine ON saved_items(cuisine);
CREATE INDEX IF NOT EXISTS idx_saved_items_created_at ON saved_items(created_at DESC);