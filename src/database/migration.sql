-- Migration script for Supabase to add new task submission and rating fields
-- Run this in the Supabase SQL Editor

-- Add new columns to the tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS submission_type TEXT,
  ADD COLUMN IF NOT EXISTS submission_instructions TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS submission_content TEXT,
  ADD COLUMN IF NOT EXISTS timeliness_rating INTEGER CHECK (timeliness_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS effort_rating INTEGER CHECK (effort_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5);

-- Drop and recreate the leaderboard function to include new metrics
DROP FUNCTION IF EXISTS get_leaderboard();

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

-- Create index for started_at to help with queries filtering by task status
CREATE INDEX IF NOT EXISTS idx_tasks_started_at ON tasks(started_at); 