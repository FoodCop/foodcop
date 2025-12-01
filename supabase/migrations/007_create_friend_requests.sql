-- Migration: Create friend_requests table
-- Manages friend relationships between users

CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate requests and self-requests
  CONSTRAINT unique_friend_request UNIQUE (requester_id, requested_id),
  CONSTRAINT no_self_request CHECK (requester_id != requested_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON public.friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_requested ON public.friend_requests(requested_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_created_at ON public.friend_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view friend requests where they are the requester or requested
CREATE POLICY "Users can view own friend requests"
  ON public.friend_requests
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = requested_id);

-- Users can create friend requests (as requester)
CREATE POLICY "Users can create friend requests"
  ON public.friend_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Users can update friend requests where they are the requested party (to accept/decline)
-- Or where they are the requester (to cancel)
CREATE POLICY "Users can update own friend requests"
  ON public.friend_requests
  FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = requested_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = requested_id);

-- Users can delete friend requests where they are the requester (to cancel)
CREATE POLICY "Users can delete own friend requests"
  ON public.friend_requests
  FOR DELETE
  USING (auth.uid() = requester_id);

-- Grant permissions
GRANT ALL ON public.friend_requests TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_friend_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_friend_requests_updated_at();

-- Add helpful comment
COMMENT ON TABLE public.friend_requests IS 'Friend request relationships between users. Status: pending, accepted, or declined.';

