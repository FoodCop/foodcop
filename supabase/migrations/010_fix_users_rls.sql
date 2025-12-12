-- Migration: Fix RLS policies for users table
-- Ensures that all authenticated users can view public profile information of other users

-- Enable RLS (just in case)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if it's too restrictive (e.g. "Users can view own profile")
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- Create comprehensive select policy
-- Allows any authenticated user to view basic profile info of all users
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users
  FOR SELECT
  USING (true);

-- Ensure update policy is still restricted to own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant access
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Add comment
COMMENT ON TABLE public.users IS 'Public user profiles. RLS policy allows everyone to read.';
