-- SQL Script to add 15 test users to Supabase Auth and the application users table

-- Function to add a test user to both auth.users and public.users tables
CREATE OR REPLACE FUNCTION add_test_user(
  email TEXT,
  username TEXT,
  name TEXT,
  avatar_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  user_id UUID;
  existing_user_id UUID;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO existing_user_id FROM auth.users WHERE email = add_test_user.email;
  
  IF existing_user_id IS NOT NULL THEN
    -- User already exists, return existing ID
    RETURN existing_user_id;
  END IF;

  -- First insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    email,
    -- This is a hashed password 'password123'
    '$2a$10$ffEiXwvuEJTGKgUAGmswNeE4iUGdDDB1P.z9yWJ9Xvb0EgFGnKEwi',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', name),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO user_id;

  -- Check if user already exists in public.users
  IF EXISTS (SELECT 1 FROM public.users WHERE email = add_test_user.email) THEN
    -- Update the existing user with the new auth ID
    UPDATE public.users 
    SET id = user_id, 
        name = add_test_user.name, 
        avatar_url = add_test_user.avatar_url
    WHERE email = add_test_user.email;
  ELSE
    -- Insert into public.users if not exists
    INSERT INTO public.users (
      id, 
      name, 
      email, 
      avatar_url, 
      created_at
    ) VALUES (
      user_id,
      name,
      email,
      avatar_url,
      NOW()
    );
  END IF;

  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Add 15 test users
SELECT add_test_user(
  'user1@example.com',
  'user1',
  'Alex Johnson',
  'https://randomuser.me/api/portraits/men/1.jpg'
);

SELECT add_test_user(
  'user2@example.com',
  'user2',
  'Beth Smith',
  'https://randomuser.me/api/portraits/women/1.jpg'
);

SELECT add_test_user(
  'user3@example.com',
  'user3',
  'Charlie Davis',
  'https://randomuser.me/api/portraits/men/2.jpg'
);

SELECT add_test_user(
  'user4@example.com',
  'user4',
  'Diana Wilson',
  'https://randomuser.me/api/portraits/women/2.jpg'
);

SELECT add_test_user(
  'user5@example.com',
  'user5',
  'Edward Martinez',
  'https://randomuser.me/api/portraits/men/3.jpg'
);

SELECT add_test_user(
  'user6@example.com',
  'user6',
  'Fiona Taylor',
  'https://randomuser.me/api/portraits/women/3.jpg'
);

SELECT add_test_user(
  'user7@example.com',
  'user7',
  'George White',
  'https://randomuser.me/api/portraits/men/4.jpg'
);

SELECT add_test_user(
  'user8@example.com',
  'user8',
  'Hannah Brown',
  'https://randomuser.me/api/portraits/women/4.jpg'
);

SELECT add_test_user(
  'user9@example.com',
  'user9',
  'Ian Miller',
  'https://randomuser.me/api/portraits/men/5.jpg'
);

SELECT add_test_user(
  'user10@example.com',
  'user10',
  'Julia Garcia',
  'https://randomuser.me/api/portraits/women/5.jpg'
);

SELECT add_test_user(
  'user11@example.com',
  'user11',
  'Kevin Anderson',
  'https://randomuser.me/api/portraits/men/6.jpg'
);

SELECT add_test_user(
  'user12@example.com',
  'user12',
  'Laura Wright',
  'https://randomuser.me/api/portraits/women/6.jpg'
);

SELECT add_test_user(
  'user13@example.com',
  'user13',
  'Mike Thompson',
  'https://randomuser.me/api/portraits/men/7.jpg'
);

SELECT add_test_user(
  'user14@example.com',
  'user14',
  'Nancy Lee',
  'https://randomuser.me/api/portraits/women/7.jpg'
);

SELECT add_test_user(
  'user15@example.com',
  'user15',
  'Oliver Harris',
  'https://randomuser.me/api/portraits/men/8.jpg'
);

-- Create some friendships between users for testing
-- You can uncomment and modify this section if needed
/*
DO $$
DECLARE
  user_ids UUID[];
  i INTEGER;
  j INTEGER;
BEGIN
  -- Get all user ids
  SELECT array_agg(id) INTO user_ids FROM public.users;
  
  -- Create some random friendships
  FOR i IN 1..array_length(user_ids, 1) LOOP
    FOR j IN 1..array_length(user_ids, 1) LOOP
      IF i != j AND random() < 0.3 THEN -- 30% chance of friendship
        INSERT INTO public.friendships (user_id, friend_id, status)
        VALUES (user_ids[i], user_ids[j], 'ACCEPTED')
        ON CONFLICT (user_id, friend_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;
*/

-- Instructions for using this script:
-- 1. Connect to your Supabase PostgreSQL database with admin privileges
-- 2. Run this script to create 15 test users
-- 3. All users have the password 'password123' 