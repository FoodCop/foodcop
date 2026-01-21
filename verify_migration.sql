-- Verification queries for migration 011

-- 1. Check if presence columns exist in users table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name IN ('is_online', 'last_activity_at', 'last_seen')
ORDER BY column_name;

-- 2. Check if user_presence table exists
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'user_presence'
) AS user_presence_table_exists;

-- 3. Check if helper functions exist
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN (
        'update_user_activity',
        'mark_user_offline',
        'cleanup_stale_presence'
    )
ORDER BY routine_name;

-- 4. Check indexes on users table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'users'
    AND indexname LIKE '%online%'
ORDER BY indexname;

-- 5. Check RLS policies on user_presence
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'user_presence'
ORDER BY policyname;
