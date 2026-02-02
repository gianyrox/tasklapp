-- Migration to update existing PREMIUM memberships to MEMBER
-- This script updates any existing users with 'PREMIUM' membership_type to 'MEMBER'

-- Update existing PREMIUM users to MEMBER
UPDATE users 
SET membership_type = 'MEMBER' 
WHERE membership_type = 'PREMIUM';

-- Update existing member users to MEMBER (in case any lowercase exist)
UPDATE users 
SET membership_type = 'MEMBER' 
WHERE membership_type = 'member';

-- Update the check constraint to only allow 'FREE' and 'MEMBER' values
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_membership_type_check;
ALTER TABLE users ADD CONSTRAINT users_membership_type_check 
CHECK (membership_type IN ('FREE', 'MEMBER'));

-- Update any subscription records or related data if needed
-- (Add any additional updates for related tables here)

-- Verify the update
DO $$
BEGIN
  -- Check if any PREMIUM or member records still exist
  IF EXISTS (SELECT 1 FROM users WHERE membership_type IN ('PREMIUM', 'member')) THEN
    RAISE NOTICE 'Warning: Some PREMIUM or member records still exist';
  ELSE
    RAISE NOTICE 'Successfully updated all PREMIUM/member records to MEMBER';
  END IF;
  
  -- Show count of each membership type
  RAISE NOTICE 'FREE members: %', (SELECT COUNT(*) FROM users WHERE membership_type = 'FREE');
  RAISE NOTICE 'MEMBER members: %', (SELECT COUNT(*) FROM users WHERE membership_type = 'MEMBER');
END $$; 