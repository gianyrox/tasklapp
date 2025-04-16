-- Supabase SQL Schema for Task App with Friend-based System

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create friendships table to track relationships between users
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id <> friend_id) -- Cannot be friends with yourself
);

-- Create tasks table with extended metadata fields
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  assigner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_time_minutes INTEGER,
  actual_time_minutes INTEGER,
  submission_type TEXT, -- Type of submission required (FORM, LINK, FILE, etc.)
  submission_instructions TEXT, -- Directions for completing the task
  started_at TIMESTAMP WITH TIME ZONE, -- When the assignee started the task
  submission_date TIMESTAMP WITH TIME ZONE,
  submission_content TEXT, -- Text content or link submitted by assignee
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  timeliness_rating INTEGER CHECK (timeliness_rating BETWEEN 1 AND 5), -- Rating for on-time completion
  effort_rating INTEGER CHECK (effort_rating BETWEEN 1 AND 5), -- Rating for effort shown
  accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5), -- Rating for accuracy of submission
  feedback TEXT
);

-- Create task attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to get a user's friends
CREATE OR REPLACE FUNCTION get_user_friends(user_uuid UUID)
RETURNS TABLE (
  friend_id UUID,
  friend_name TEXT,
  friend_avatar TEXT,
  friendship_status TEXT,
  friendship_created TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.user_id = user_uuid THEN f.friend_id 
      ELSE f.user_id 
    END as friend_id,
    u.name as friend_name,
    u.avatar_url as friend_avatar,
    f.status as friendship_status,
    f.created_at as friendship_created
  FROM friendships f
  JOIN users u ON (
    CASE 
      WHEN f.user_id = user_uuid THEN f.friend_id 
      ELSE f.user_id 
    END = u.id
  )
  WHERE 
    (f.user_id = user_uuid OR f.friend_id = user_uuid)
    AND f.status = 'ACCEPTED';
END;
$$ LANGUAGE plpgsql;

-- Create leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE (
  id UUID,
  name TEXT,
  avatar_url TEXT,
  tasks_completed BIGINT,
  avg_completion_time FLOAT,
  avg_quality_rating FLOAT,
  avg_timeliness_rating FLOAT,
  avg_effort_rating FLOAT,
  avg_accuracy_rating FLOAT,
  tasks_overdue BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.avatar_url,
    COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as tasks_completed,
    AVG(CASE WHEN t.status = 'COMPLETED' AND t.actual_time_minutes IS NOT NULL 
        THEN t.actual_time_minutes 
        ELSE NULL END)::FLOAT as avg_completion_time,
    AVG(CASE WHEN t.status = 'COMPLETED' AND t.quality_rating IS NOT NULL 
        THEN t.quality_rating 
        ELSE NULL END)::FLOAT as avg_quality_rating,
    AVG(CASE WHEN t.status = 'COMPLETED' AND t.timeliness_rating IS NOT NULL 
        THEN t.timeliness_rating 
        ELSE NULL END)::FLOAT as avg_timeliness_rating,
    AVG(CASE WHEN t.status = 'COMPLETED' AND t.effort_rating IS NOT NULL 
        THEN t.effort_rating 
        ELSE NULL END)::FLOAT as avg_effort_rating,
    AVG(CASE WHEN t.status = 'COMPLETED' AND t.accuracy_rating IS NOT NULL 
        THEN t.accuracy_rating 
        ELSE NULL END)::FLOAT as avg_accuracy_rating,
    COUNT(CASE WHEN t.status = 'OVERDUE' THEN 1 END) as tasks_overdue
  FROM 
    users u
  LEFT JOIN 
    tasks t ON u.id = t.assignee_id
  GROUP BY 
    u.id, u.name, u.avatar_url
  ORDER BY 
    tasks_completed DESC, avg_quality_rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Add Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY "Users can view all users"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS policies for friendships
CREATE POLICY "Users can view their own friendships"
  ON friendships
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendship requests"
  ON friendships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of"
  ON friendships
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS policies for tasks
CREATE POLICY "Users can view tasks assigned to them"
  ON tasks
  FOR SELECT
  USING (auth.uid() = assignee_id);

CREATE POLICY "Users can view tasks they assigned"
  ON tasks
  FOR SELECT
  USING (auth.uid() = assigner_id);

CREATE POLICY "Users can create tasks"
  ON tasks
  FOR INSERT
  WITH CHECK (auth.uid() = assigner_id);

CREATE POLICY "Users can update tasks assigned to them"
  ON tasks
  FOR UPDATE
  USING (auth.uid() = assignee_id);

CREATE POLICY "Assigners can update tasks they assigned"
  ON tasks
  FOR UPDATE
  USING (auth.uid() = assigner_id);

-- RLS policies for task attachments
CREATE POLICY "Users can view attachments for their tasks"
  ON task_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_attachments.task_id
      AND (tasks.assignee_id = auth.uid() OR tasks.assigner_id = auth.uid())
    )
  );

CREATE POLICY "Users can add attachments to their assigned tasks"
  ON task_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_attachments.task_id
      AND tasks.assignee_id = auth.uid()
    )
  );

-- Drop user_stats table if it exists, as we're no longer using it
DROP TABLE IF EXISTS user_stats;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigner_id ON tasks(assigner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);

-- Sample test data (for development environment only)
-- Uncomment and run this in your development environment

/*
-- Insert test users with UUIDs
INSERT INTO users (id, name, email, avatar_url, created_at)
VALUES 
  (uuid_generate_v4(), 'Alice Johnson', 'alice@example.com', 'https://randomuser.me/api/portraits/women/1.jpg', NOW()),
  (uuid_generate_v4(), 'Bob Smith', 'bob@example.com', 'https://randomuser.me/api/portraits/men/1.jpg', NOW()),
  (uuid_generate_v4(), 'Carol Davis', 'carol@example.com', 'https://randomuser.me/api/portraits/women/2.jpg', NOW()),
  (uuid_generate_v4(), 'David Wilson', 'david@example.com', 'https://randomuser.me/api/portraits/men/2.jpg', NOW());

-- After inserting users, you'll need to get their IDs to create friendships and tasks
*/ 