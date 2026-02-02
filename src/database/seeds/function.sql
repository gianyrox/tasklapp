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
  SELECT id INTO existing_user_id FROM auth.users WHERE auth.users.email = add_test_user.email;
  
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
    add_test_user.email,
    -- This is a hashed password 'password123'
    '$2a$10$ffEiXwvuEJTGKgUAGmswNeE4iUGdDDB1P.z9yWJ9Xvb0EgFGnKEwi',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', add_test_user.name),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO user_id;

  -- Check if user already exists in public.users
  IF EXISTS (SELECT 1 FROM public.users WHERE public.users.email = add_test_user.email) THEN
    -- Update the existing user with the new auth ID
    UPDATE public.users 
    SET id = user_id, 
        name = add_test_user.name, 
        avatar_url = add_test_user.avatar_url
    WHERE public.users.email = add_test_user.email;
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
      add_test_user.name,
      add_test_user.email,
      add_test_user.avatar_url,
      NOW()
    );
  END IF;

  RETURN user_id;
END;
$$ LANGUAGE plpgsql; 