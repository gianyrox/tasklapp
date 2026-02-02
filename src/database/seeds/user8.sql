-- Seed file for user8
\i src/database/seeds/function.sql

-- Add Hannah Brown
SELECT add_test_user(
  'user8@example.com',
  'user8',
  'Hannah Brown',
  'https://randomuser.me/api/portraits/women/4.jpg'
); 