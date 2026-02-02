-- Function to add a friendship between two users
CREATE OR REPLACE FUNCTION add_test_friendship(
  user_email TEXT,
  friend_email TEXT,
  status TEXT DEFAULT 'ACCEPTED'
) RETURNS UUID AS $$
DECLARE
  user_id UUID;
  friend_id UUID;
  friendship_id UUID;
BEGIN
  -- Get user IDs from their emails
  SELECT id INTO user_id FROM public.users WHERE public.users.email = add_test_friendship.user_email;
  SELECT id INTO friend_id FROM public.users WHERE public.users.email = add_test_friendship.friend_email;
  
  IF user_id IS NULL OR friend_id IS NULL THEN
    RAISE EXCEPTION 'User or friend not found: % or %', add_test_friendship.user_email, add_test_friendship.friend_email;
  END IF;
  
  -- Check if friendship already exists (in either direction)
  SELECT id INTO friendship_id FROM public.friendships 
  WHERE (user_id = add_test_friendship.user_id AND friend_id = add_test_friendship.friend_id)
     OR (user_id = add_test_friendship.friend_id AND friend_id = add_test_friendship.user_id);
     
  IF friendship_id IS NOT NULL THEN
    -- Update existing friendship
    UPDATE public.friendships
    SET status = add_test_friendship.status,
        updated_at = NOW()
    WHERE id = friendship_id;
    
    RETURN friendship_id;
  END IF;
  
  -- Insert new friendship
  INSERT INTO public.friendships (
    id,
    user_id,
    friend_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    uuid_generate_v4(),
    add_test_friendship.user_id,
    add_test_friendship.friend_id,
    add_test_friendship.status,
    NOW(),
    NOW()
  ) RETURNING id INTO friendship_id;

  RETURN friendship_id;
END;
$$ LANGUAGE plpgsql; 