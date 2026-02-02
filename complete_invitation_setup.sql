-- Complete setup for invitation task functionality
-- Run these commands in your Supabase SQL Editor

-- 1. Add is_invitation column to tasks table to track invitation tasks
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='is_invitation') THEN
        ALTER TABLE tasks ADD COLUMN is_invitation BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Add email_pending column to tasks table for invitation emails
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='email_pending') THEN
        ALTER TABLE tasks ADD COLUMN email_pending TEXT;
    END IF;
END $$;

-- 3. Make assignee_id nullable for invitation tasks
ALTER TABLE tasks ALTER COLUMN assignee_id DROP NOT NULL;

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_is_invitation ON tasks(is_invitation);
CREATE INDEX IF NOT EXISTS idx_tasks_email_pending ON tasks(email_pending);

-- 5. Ensure friendships table has proper unique constraint
ALTER TABLE friendships DROP CONSTRAINT IF EXISTS unique_friendship_pair;
ALTER TABLE friendships ADD CONSTRAINT unique_friendship_pair 
  UNIQUE (user_id, friend_id);

-- 6. Set default values for existing tasks
UPDATE tasks 
SET 
  is_invitation = FALSE,
  email_pending = NULL 
WHERE 
  is_invitation IS NULL;

-- 7. Add constraint to ensure invitation tasks have email_pending
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_invitation_email;
ALTER TABLE tasks ADD CONSTRAINT check_invitation_email 
CHECK (
  (is_invitation = FALSE AND assignee_id IS NOT NULL AND email_pending IS NULL) OR
  (is_invitation = TRUE AND email_pending IS NOT NULL)
);

-- 8. Create function to assign invitation tasks and create friendships
DROP FUNCTION IF EXISTS assign_invitation_tasks_to_user(TEXT, UUID);
CREATE OR REPLACE FUNCTION assign_invitation_tasks_to_user(
  user_email TEXT,
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  tasks_assigned INTEGER := 0;
  assigner_id UUID;
BEGIN
  -- Create friendships with all assigners for invitation tasks
  FOR assigner_id IN 
    SELECT DISTINCT t.assigner_id 
    FROM tasks t
    WHERE t.is_invitation = TRUE AND t.email_pending = user_email
  LOOP
    -- Create friendship from assigner to new user (assigner already "accepted" by sending invitation)
    INSERT INTO friendships (user_id, friend_id, status, created_at)
    VALUES (assigner_id, p_user_id, 'ACCEPTED', NOW())
    ON CONFLICT (user_id, friend_id) DO NOTHING;
  END LOOP;
  
  -- Assign invitation tasks to the new user
  UPDATE tasks 
  SET 
    assignee_id = p_user_id,
    is_invitation = FALSE,
    email_pending = NULL
  WHERE 
    is_invitation = TRUE 
    AND email_pending = user_email;
    
  GET DIAGNOSTICS tasks_assigned = ROW_COUNT;
  
  RETURN tasks_assigned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger function
CREATE OR REPLACE FUNCTION trigger_assign_invitation_tasks() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    PERFORM assign_invitation_tasks_to_user(NEW.email, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger
DROP TRIGGER IF EXISTS assign_invitation_tasks_trigger ON users;
CREATE TRIGGER assign_invitation_tasks_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_assign_invitation_tasks();

-- 11. Update RLS policies for invitation tasks
DROP POLICY IF EXISTS "Users can view invitation tasks for their email" ON tasks;
CREATE POLICY "Users can view invitation tasks for their email"
  ON tasks
  FOR SELECT
  USING (
    is_invitation = TRUE 
    AND email_pending = auth.email()
  );

DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON tasks;
CREATE POLICY "Users can view tasks assigned to them"
  ON tasks
  FOR SELECT
  USING (
    auth.uid() = assignee_id 
    OR (is_invitation = TRUE AND email_pending = auth.email())
  ); 