-- =====================================================
-- ADD TENANT ISOLATION TO SAVED_ITEMS TABLE
-- =====================================================

-- Add tenant_id column to saved_items table
ALTER TABLE saved_items
ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT gen_random_uuid();

-- Create unique index for tenant isolation
CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_items_tenant_user_type_item
ON saved_items (tenant_id, user_id, item_type, item_id);

-- Update RLS policies to include tenant isolation
DROP POLICY IF EXISTS "Users can view own saved items" ON saved_items;
DROP POLICY IF EXISTS "Users can insert own saved items" ON saved_items;
DROP POLICY IF EXISTS "Users can update own saved items" ON saved_items;
DROP POLICY IF EXISTS "Users can delete own saved items" ON saved_items;

-- Create tenant-aware RLS policies
CREATE POLICY "Users can view own saved items with tenant isolation" ON saved_items
    FOR SELECT
    USING (
        auth.uid() = user_id
        AND tenant_id = current_setting('app.tenant_id')::uuid
    );

CREATE POLICY "Users can insert own saved items with tenant isolation" ON saved_items
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND tenant_id = current_setting('app.tenant_id')::uuid
    );

CREATE POLICY "Users can update own saved items with tenant isolation" ON saved_items
    FOR UPDATE
    USING (
        auth.uid() = user_id
        AND tenant_id = current_setting('app.tenant_id')::uuid
    )
    WITH CHECK (
        auth.uid() = user_id
        AND tenant_id = current_setting('app.tenant_id')::uuid
    );

CREATE POLICY "Users can delete own saved items with tenant isolation" ON saved_items
    FOR DELETE
    USING (
        auth.uid() = user_id
        AND tenant_id = current_setting('app.tenant_id')::uuid
    );

-- Add helpful comments
COMMENT ON COLUMN saved_items.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON INDEX uq_saved_items_tenant_user_type_item IS 'Ensures unique items per tenant, user, type, and item_id';

