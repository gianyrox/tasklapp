-- Seed file for user3
\i src/database/seeds/function.sql

-- Add Charlie Davis
SELECT add_test_user(
  'user3@example.com',
  'user3',
  'Charlie Davis',
  'https://randomuser.me/api/portraits/men/2.jpg'
); 