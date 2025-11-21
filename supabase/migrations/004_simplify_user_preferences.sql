-- Migration: Simplify User Preferences
-- Remove redundant preference fields that don't map to Spoonacular API
-- Keep only: dietary_preferences (TEXT[]) and cuisine_preferences (TEXT[])
-- Remove: price_range_preference, spice_tolerance, cuisine_dislikes

-- Drop redundant columns from users table
ALTER TABLE public.users 
DROP COLUMN IF EXISTS price_range_preference,
DROP COLUMN IF EXISTS spice_tolerance,
DROP COLUMN IF EXISTS cuisine_dislikes;

-- Add comment documenting the simplified preference approach
COMMENT ON COLUMN public.users.dietary_preferences IS 'User dietary restrictions (vegetarian, vegan, gluten free, etc.) - maps to Spoonacular diet parameter';
COMMENT ON COLUMN public.users.cuisine_preferences IS 'User cuisine preferences (italian, mexican, indian, etc.) - maps to Spoonacular cuisine parameter';
