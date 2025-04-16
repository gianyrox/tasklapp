-- Migration script to add GRADED status to tasks table

-- First, drop the existing constraint that's causing the issue
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tasks_status_check' AND conrelid = 'tasks'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE tasks DROP CONSTRAINT tasks_status_check';
  END IF;
END $$;

-- Check if any tasks exist with status other than allowed values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM tasks 
    WHERE status NOT IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'GRADED')
  ) THEN
    RAISE EXCEPTION 'There are tasks with invalid status values that need to be fixed before applying this constraint';
  END IF;
END $$;

-- Add check constraint to ensure status is one of the allowed values
ALTER TABLE tasks
  ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'GRADED'));

-- Update the get_leaderboard function to consider GRADED status in calculations
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
    COUNT(CASE WHEN t.status = 'COMPLETED' OR t.status = 'GRADED' THEN 1 END) as tasks_completed,
    AVG(CASE WHEN (t.status = 'COMPLETED' OR t.status = 'GRADED') AND t.actual_time_minutes IS NOT NULL 
        THEN t.actual_time_minutes 
        ELSE NULL END)::FLOAT as avg_completion_time,
    AVG(CASE WHEN (t.status = 'COMPLETED' OR t.status = 'GRADED') AND t.quality_rating IS NOT NULL 
        THEN t.quality_rating 
        ELSE NULL END)::FLOAT as avg_quality_rating,
    AVG(CASE WHEN (t.status = 'COMPLETED' OR t.status = 'GRADED') AND t.timeliness_rating IS NOT NULL 
        THEN t.timeliness_rating 
        ELSE NULL END)::FLOAT as avg_timeliness_rating,
    AVG(CASE WHEN (t.status = 'COMPLETED' OR t.status = 'GRADED') AND t.effort_rating IS NOT NULL 
        THEN t.effort_rating 
        ELSE NULL END)::FLOAT as avg_effort_rating,
    AVG(CASE WHEN (t.status = 'COMPLETED' OR t.status = 'GRADED') AND t.accuracy_rating IS NOT NULL 
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

-- Add comments to explain the changes
COMMENT ON CONSTRAINT tasks_status_check ON tasks IS 'Ensures task status is one of: PENDING, IN_PROGRESS, COMPLETED, OVERDUE, or GRADED'; 