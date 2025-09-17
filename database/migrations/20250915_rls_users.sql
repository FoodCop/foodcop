-- Enable Row Level Security (RLS) on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to select/update their own row only
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Allow insert only if id matches auth.uid()
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Optionally, restrict DELETE to admins only (not enabled here)
-- CREATE POLICY "Admins can delete any user" ON users
--   FOR DELETE
--   USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Reminder: After applying, test with anon key and ensure service role is only used for privileged ops.
