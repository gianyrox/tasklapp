-- Seed file for user15
\i src/database/seeds/function.sql

-- Add Oliver Harris
SELECT add_test_user(
  'user15@example.com',
  'user15',
  'Oliver Harris',
  'https://randomuser.me/api/portraits/men/8.jpg'
); 