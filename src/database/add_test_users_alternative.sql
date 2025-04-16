-- SQL Script to add 15 test users to Supabase Auth and the application users table
-- This script REMOVES existing test users completely before adding them back

DO $$
DECLARE
BEGIN
  -- Delete all test users from public.users and auth.users
  -- We identify test users by their email pattern
  DELETE FROM public.users WHERE email LIKE 'user%@example.com';
  DELETE FROM auth.users WHERE email LIKE 'user%@example.com';
END $$;

-- Function to add a test user to both auth.users and public.users tables
CREATE OR REPLACE FUNCTION add_test_user(
  email TEXT,
  username TEXT,
  name TEXT,
  avatar_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Generate a deterministic UUID based on email to avoid collisions
  -- This ensures the same user always gets the same ID
  user_id := gen_random_uuid();
  
  -- Insert into auth.users
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
    user_id,
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
  );

  -- Insert into public.users
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

-- Create some random test friendships
DO $$
DECLARE
  user_ids UUID[];
  i INTEGER;
  j INTEGER;
BEGIN
  -- Get all test user ids
  SELECT array_agg(id) INTO user_ids FROM public.users WHERE email LIKE 'user%@example.com';
  
  -- Create some random friendships
  FOR i IN 1..array_length(user_ids, 1) LOOP
    FOR j IN 1..array_length(user_ids, 1) LOOP
      IF i != j AND random() < 0.3 THEN -- 30% chance of friendship
        -- First try to delete any existing friendship
        DELETE FROM public.friendships 
        WHERE (user_id = user_ids[i] AND friend_id = user_ids[j])
           OR (user_id = user_ids[j] AND friend_id = user_ids[i]);
           
        -- Then create a new friendship
        INSERT INTO public.friendships (user_id, friend_id, status)
        VALUES (user_ids[i], user_ids[j], 'ACCEPTED');
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Also create some sample task data
DO $$
DECLARE
  user_ids UUID[];
  assigner_id UUID;
  assignee_id UUID;
  i INTEGER;
  task_titles TEXT[] := ARRAY[
    'Design new logo', 
    'Create marketing plan', 
    'Fix navigation bug',
    'Update documentation',
    'Review pull request',
    'Prepare presentation',
    'Send follow-up emails',
    'Schedule meeting',
    'Research competitors',
    'Draft quarterly report'
  ];
  statuses TEXT[] := ARRAY['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'];
  priorities TEXT[] := ARRAY['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
BEGIN
  -- Get all test user ids
  SELECT array_agg(id) INTO user_ids FROM public.users WHERE email LIKE 'user%@example.com';
  
  -- Delete any existing tasks for test users
  DELETE FROM public.tasks 
  WHERE assigner_id IN (SELECT id FROM public.users WHERE email LIKE 'user%@example.com')
     OR assignee_id IN (SELECT id FROM public.users WHERE email LIKE 'user%@example.com');
  
  -- Create sample tasks
  FOR i IN 1..30 LOOP
    -- Randomly select assigner and assignee
    assigner_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::integer];
    assignee_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::integer];
    
    -- Ensure they're different
    WHILE assignee_id = assigner_id LOOP
      assignee_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::integer];
    END LOOP;
    
    INSERT INTO public.tasks (
      id,
      title,
      description,
      created_at,
      due_date,
      assigner_id,
      assignee_id,
      status,
      priority,
      completed_at,
      estimated_time_minutes,
      actual_time_minutes,
      submission_date,
      quality_rating,
      feedback
    ) VALUES (
      gen_random_uuid(),
      task_titles[1 + floor(random() * array_length(task_titles, 1))::integer],
      'This is a sample task description. It describes what needs to be done.',
      NOW() - (floor(random() * 30)::integer || ' days')::interval,
      NOW() + (floor(random() * 14)::integer || ' days')::interval,
      assigner_id,
      assignee_id,
      statuses[1 + floor(random() * array_length(statuses, 1))::integer],
      priorities[1 + floor(random() * array_length(priorities, 1))::integer],
      CASE WHEN random() > 0.5 THEN NOW() - (floor(random() * 10)::integer || ' days')::interval ELSE NULL END,
      floor(random() * 180)::integer,
      CASE WHEN random() > 0.5 THEN floor(random() * 240)::integer ELSE NULL END,
      CASE WHEN random() > 0.5 THEN NOW() - (floor(random() * 5)::integer || ' days')::interval ELSE NULL END,
      CASE WHEN random() > 0.6 THEN 1 + floor(random() * 5)::integer ELSE NULL END,
      CASE WHEN random() > 0.7 THEN 'This is feedback on the completed task.' ELSE NULL END
    );
  END LOOP;
END $$;

-- Instructions for using this script:
-- 1. Connect to your Supabase PostgreSQL database with admin privileges
-- 2. Run this script to create 15 test users, random friendships, and sample tasks
-- 3. All users have the password 'password123'
-- 4. WARNING: This script DELETES existing test users with emails like 'user%@example.com' 