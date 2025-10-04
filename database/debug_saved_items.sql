-- Test script to check saved_items table structure
-- Run this in Supabase SQL Editor to understand the current state

-- Check if saved_items table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'saved_items' 
ORDER BY ordinal_position;

-- Check current RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'saved_items';

-- Check for any existing data
SELECT COUNT(*) as total_count FROM saved_items;

-- Test tenant_id requirements
SELECT 
    id,
    user_id,
    item_type,
    item_id,
    tenant_id,
    created_at
FROM saved_items 
LIMIT 5;