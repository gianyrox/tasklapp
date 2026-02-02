-- Master seed file to add all test users
-- This script executes all individual user seed files

\i src/database/seeds/user1.sql
\i src/database/seeds/user2.sql
\i src/database/seeds/user3.sql
\i src/database/seeds/user4.sql
\i src/database/seeds/user5.sql
\i src/database/seeds/user6.sql
\i src/database/seeds/user7.sql
\i src/database/seeds/user8.sql
\i src/database/seeds/user9.sql
\i src/database/seeds/user10.sql
\i src/database/seeds/user11.sql
\i src/database/seeds/user12.sql
\i src/database/seeds/user13.sql
\i src/database/seeds/user14.sql
\i src/database/seeds/user15.sql

-- Instructions for using this script:
-- 1. Connect to your Supabase PostgreSQL database with admin privileges
-- 2. Run this script to create all 15 test users at once
-- 3. All users have the password 'password123'
-- 
-- Alternatively, you can run individual seed files (user1.sql, user2.sql, etc.)
-- to create specific users only. 