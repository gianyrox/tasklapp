-- Seed file for user7
\i src/database/seeds/function.sql

-- Add George White
SELECT add_test_user(
  'user7@example.com',
  'user7',
  'George White',
  'https://randomuser.me/api/portraits/men/4.jpg'
); 