-- Supabase Database Debug Script
-- Run this to diagnose issues with your database schema and data

-- Check if the UUID extension is enabled
SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
) AS uuid_extension_enabled;

-- Check if all required tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'friendships', 'tasks', 'task_attachments');

-- Check table structures
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name IN ('users', 'friendships', 'tasks', 'task_attachments')
ORDER BY 
    table_name, ordinal_position;

-- Check RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename IN ('users', 'friendships', 'tasks', 'task_attachments');

-- Check row counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'friendships' as table_name, COUNT(*) as row_count FROM friendships
UNION ALL
SELECT 'tasks' as table_name, COUNT(*) as row_count FROM tasks
UNION ALL
SELECT 'task_attachments' as table_name, COUNT(*) as row_count FROM task_attachments;

-- Check for any errors in recent database operations
SELECT
    error_severity,
    error_message,
    created_at
FROM
    _sqlgpt_errors
WHERE
    created_at > NOW() - INTERVAL '1 day'
ORDER BY
    created_at DESC
LIMIT 10;

-- Try a simple test insert with verbose output (will be rolled back)
DO $$
BEGIN
    RAISE NOTICE 'Testing insert capabilities...';
    
    -- Test UUID generation
    RAISE NOTICE 'Testing UUID generation...';
    DECLARE test_uuid UUID;
    BEGIN
        SELECT uuid_generate_v4() INTO test_uuid;
        RAISE NOTICE 'UUID generated successfully: %', test_uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error generating UUID: %', SQLERRM;
    END;
    
    -- Test user insert
    RAISE NOTICE 'Testing user insert...';
    BEGIN
        WITH inserted_user AS (
            INSERT INTO users (id, name, email, avatar_url, created_at)
            VALUES (uuid_generate_v4(), 'Test User', 'test@example.com', 'https://example.com/avatar.jpg', NOW())
            RETURNING id
        )
        SELECT id INTO test_uuid FROM inserted_user;
        RAISE NOTICE 'User inserted successfully with ID: %', test_uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting user: %', SQLERRM;
    END;
    
    -- Roll back the test insert
    RAISE NOTICE 'Rolling back test insert...';
    RAISE EXCEPTION 'Intentional rollback to prevent test data insertion';
EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Intentional rollback to prevent test data insertion' THEN
        RAISE NOTICE 'Unexpected error: %', SQLERRM;
    ELSE
        RAISE NOTICE 'Test completed and rolled back successfully';
    END IF;
END $$; 