-- =====================================================
-- ADD TENANT CONTEXT FUNCTION FOR RLS
-- =====================================================

-- Function to set tenant context for RLS policies
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.tenant_id', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_tenant_context(UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION set_tenant_context(UUID) IS 'Sets tenant context for RLS policies using current_setting';

