-- Migration: Add preferences_hint_shown field
-- Track whether the preferences hint modal has been shown to the user
-- This allows us to show the hint on first visit only

-- Add preferences_hint_shown column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS preferences_hint_shown BOOLEAN DEFAULT false;

-- Add comment documenting the field
COMMENT ON COLUMN public.users.preferences_hint_shown IS 'Whether the preferences hint modal has been shown to the user (first visit tracking)';

-- Also ensure dietary_preferences and cuisine_preferences exist (they should from migration 004)
-- But add them if they don't exist for safety
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dietary_preferences TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cuisine_preferences TEXT[] DEFAULT '{}';

