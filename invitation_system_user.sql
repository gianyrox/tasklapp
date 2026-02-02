-- Create a system user for invitation tasks
INSERT INTO users (id, name, email, created_at, avatar_url)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'System Invitation User',
    'system+invitations@TasklApp.com',
    NOW(),
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- Add email_pending column to store the pending invitation email
ALTER TABLE tasks 
ADD COLUMN email_pending TEXT;

-- Add comment for the new column
COMMENT ON COLUMN tasks.email_pending IS 'Email address for invitation tasks where the user has not yet registered';

-- Verify the system user was created
SELECT id, name, email FROM users WHERE id = '00000000-0000-0000-0000-000000000001'; 