-- Fix RLS policies for users table
-- Allow public read access to Master Bot profiles while keeping regular users private

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create new policies that allow:
-- 1. Public read access to Master Bot profiles (is_master_bot = true)
-- 2. Users can read/update their own profiles
-- 3. Users can insert their own profiles (for signup)

-- Policy: Allow public read access to Master Bot profiles
CREATE POLICY "Public can read master bot profiles" ON users
  FOR SELECT
  TO anon, authenticated
  USING (is_master_bot = true);

-- Policy: Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Optional: Allow service role to manage all users (for admin operations)
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

