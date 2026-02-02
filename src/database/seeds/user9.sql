-- Seed file for user9
\i src/database/seeds/function.sql

-- Add Ian Miller
SELECT add_test_user(
  'user9@example.com',
  'user9',
  'Ian Miller',
  'https://randomuser.me/api/portraits/men/5.jpg'
); 