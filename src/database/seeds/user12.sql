-- Seed file for user12
\i src/database/seeds/function.sql

-- Add Laura Wright
SELECT add_test_user(
  'user12@example.com',
  'user12',
  'Laura Wright',
  'https://randomuser.me/api/portraits/women/6.jpg'
); 