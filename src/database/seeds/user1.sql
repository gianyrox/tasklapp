-- Seed file for user1
\i src/database/seeds/function.sql

-- Add Alex Johnson
SELECT add_test_user(
  'user1@example.com',
  'user1',
  'Alex Johnson',
  'https://randomuser.me/api/portraits/men/1.jpg'
); 