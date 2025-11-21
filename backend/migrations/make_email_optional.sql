-- Make email column optional (allow NULL)
-- This allows users to be created without a personal email
-- (Greenwich email is used for Firebase authentication)

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Update existing NULL emails to empty string if needed
-- (This line is optional and can be removed if you want to keep NULLs)
-- UPDATE users SET email = '' WHERE email IS NULL;
