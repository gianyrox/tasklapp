-- Seed file for user2
\i src/database/seeds/function.sql

-- Add Beth Smith
SELECT add_test_user(
  'user2@example.com',
  'user2',
  'Beth Smith',
  'https://randomuser.me/api/portraits/women/1.jpg'
); 