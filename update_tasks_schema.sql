-- Add is_invitation column to tasks table
ALTER TABLE tasks 
ADD COLUMN is_invitation BOOLEAN DEFAULT FALSE;

-- Add index for better performance when filtering invitation tasks
CREATE INDEX IF NOT EXISTS idx_tasks_is_invitation ON tasks(is_invitation);

-- Add comment to document the column purpose
COMMENT ON COLUMN tasks.is_invitation IS 'Flag to indicate if this task was created as an invitation for unregistered users';

-- Update existing tasks to have is_invitation = false (default)
UPDATE tasks SET is_invitation = FALSE WHERE is_invitation IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'is_invitation'; 