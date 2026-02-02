-- Seed file for user6
\i src/database/seeds/function.sql

-- Add Fiona Taylor
SELECT add_test_user(
  'user6@example.com',
  'user6',
  'Fiona Taylor',
  'https://randomuser.me/api/portraits/women/3.jpg'
); 