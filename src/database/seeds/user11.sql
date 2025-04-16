-- Seed file for user11
\i src/database/seeds/function.sql

-- Add Kevin Anderson
SELECT add_test_user(
  'user11@example.com',
  'user11',
  'Kevin Anderson',
  'https://randomuser.me/api/portraits/men/6.jpg'
); 