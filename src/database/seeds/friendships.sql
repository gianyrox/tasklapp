-- Seed file for friendships between test users
\i src/database/seeds/friendships_function.sql

-- Create a network of friendships between users
-- Each user has multiple connections

-- User 1 (Alex Johnson) friendships
SELECT add_test_friendship('user1@example.com', 'user2@example.com');
SELECT add_test_friendship('user1@example.com', 'user3@example.com');
SELECT add_test_friendship('user1@example.com', 'user5@example.com');
SELECT add_test_friendship('user1@example.com', 'user8@example.com');
SELECT add_test_friendship('user1@example.com', 'user10@example.com', 'PENDING');

-- User 2 (Beth Smith) friendships
SELECT add_test_friendship('user2@example.com', 'user4@example.com');
SELECT add_test_friendship('user2@example.com', 'user6@example.com');
SELECT add_test_friendship('user2@example.com', 'user9@example.com');
SELECT add_test_friendship('user2@example.com', 'user12@example.com', 'PENDING');

-- User 3 (Charlie Davis) friendships
SELECT add_test_friendship('user3@example.com', 'user4@example.com');
SELECT add_test_friendship('user3@example.com', 'user5@example.com');
SELECT add_test_friendship('user3@example.com', 'user11@example.com');
SELECT add_test_friendship('user3@example.com', 'user13@example.com', 'PENDING');

-- User 4 (Diana Wilson) friendships
SELECT add_test_friendship('user4@example.com', 'user7@example.com');
SELECT add_test_friendship('user4@example.com', 'user9@example.com');
SELECT add_test_friendship('user4@example.com', 'user15@example.com');

-- User 5 (Edward Martinez) friendships
SELECT add_test_friendship('user5@example.com', 'user7@example.com');
SELECT add_test_friendship('user5@example.com', 'user9@example.com');
SELECT add_test_friendship('user5@example.com', 'user14@example.com');

-- Some declined friendships for testing
SELECT add_test_friendship('user6@example.com', 'user10@example.com', 'DECLINED');
SELECT add_test_friendship('user7@example.com', 'user11@example.com', 'DECLINED');
SELECT add_test_friendship('user8@example.com', 'user12@example.com', 'DECLINED');

-- Add some more accepted friendships to complete the network
SELECT add_test_friendship('user10@example.com', 'user14@example.com');
SELECT add_test_friendship('user11@example.com', 'user15@example.com');
SELECT add_test_friendship('user12@example.com', 'user13@example.com');
SELECT add_test_friendship('user13@example.com', 'user14@example.com');
SELECT add_test_friendship('user14@example.com', 'user15@example.com');

-- Instructions for using this script:
-- 1. Connect to your Supabase PostgreSQL database with admin privileges
-- 2. Make sure all users are created first by running user seed files
-- 3. Run this script to create friendship relationships between test users 