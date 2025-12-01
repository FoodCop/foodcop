-- Migration: Add is_masterbot column to users table
-- Masterbots are special system users that should be auto-friended on signup

-- Add is_masterbot column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_masterbot BOOLEAN DEFAULT false;

-- Create index for efficient masterbot queries
CREATE INDEX IF NOT EXISTS idx_users_is_masterbot ON public.users(is_masterbot) WHERE is_masterbot = true;

-- Add comment documenting the field
COMMENT ON COLUMN public.users.is_masterbot IS 'Whether this user is a masterbot (system user that should be auto-friended on new user signup)';

