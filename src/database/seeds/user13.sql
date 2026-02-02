-- Seed file for user13
\i src/database/seeds/function.sql

-- Add Mike Thompson
SELECT add_test_user(
  'user13@example.com',
  'user13',
  'Mike Thompson',
  'https://randomuser.me/api/portraits/men/7.jpg'
); 