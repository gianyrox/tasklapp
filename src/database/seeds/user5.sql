-- Seed file for user5
\i src/database/seeds/function.sql

-- Add Edward Martinez
SELECT add_test_user(
  'user5@example.com',
  'user5',
  'Edward Martinez',
  'https://randomuser.me/api/portraits/men/3.jpg'
); 