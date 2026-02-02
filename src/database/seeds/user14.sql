-- Seed file for user14
\i src/database/seeds/function.sql

-- Add Nancy Lee
SELECT add_test_user(
  'user14@example.com',
  'user14',
  'Nancy Lee',
  'https://randomuser.me/api/portraits/women/7.jpg'
); 