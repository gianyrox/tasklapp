-- Master seed file to add all test data
-- This script executes all seed files in the correct order

-- First add all users
\i src/database/seeds/all_users.sql

-- Then create friendships between users
\i src/database/seeds/friendships.sql

-- Finally add tasks
\i src/database/seeds/tasks.sql

-- Instructions for using this script:
-- 1. Connect to your Supabase PostgreSQL database with admin privileges
-- 2. Run this script to create a complete test environment with:
--    - 15 test users
--    - Network of friendships between users
--    - Various tasks with different statuses, priorities and ratings
-- 3. All users have the password 'password123'
--
-- Alternatively, you can run individual seed files if you only need
-- certain types of test data. 