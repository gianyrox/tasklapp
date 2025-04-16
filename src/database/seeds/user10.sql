-- Seed file for user10
\i src/database/seeds/function.sql

-- Add Julia Garcia
SELECT add_test_user(
  'user10@example.com',
  'user10',
  'Julia Garcia',
  'https://randomuser.me/api/portraits/women/5.jpg'
); 