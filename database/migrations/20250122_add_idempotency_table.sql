-- =====================================================
-- ADD IDEMPOTENCY KEY TABLE FOR EDGE FUNCTIONS
-- =====================================================

-- Create idempotency keys table
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Create index for cleanup
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at
ON idempotency_keys(expires_at);

-- Enable RLS
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- RLS policy: service role can manage all keys
CREATE POLICY "Service role can manage idempotency keys" ON idempotency_keys
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Function to clean up expired keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM idempotency_keys
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_expired_idempotency_keys() TO service_role;

-- Add helpful comments
COMMENT ON TABLE idempotency_keys IS 'Stores idempotency keys for edge function retry handling';
COMMENT ON COLUMN idempotency_keys.key IS 'Unique idempotency key (usually hash of request)';
COMMENT ON COLUMN idempotency_keys.result IS 'Cached result from previous successful execution';
COMMENT ON COLUMN idempotency_keys.expires_at IS 'When this key expires and can be cleaned up';

