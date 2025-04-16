-- Seed file for user4
\i src/database/seeds/function.sql

-- Add Diana Wilson
SELECT add_test_user(
  'user4@example.com',
  'user4',
  'Diana Wilson',
  'https://randomuser.me/api/portraits/women/2.jpg'
); 