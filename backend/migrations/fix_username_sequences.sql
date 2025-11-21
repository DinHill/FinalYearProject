-- Fix username_sequences table to match the UserNam model requirements
-- This needs base_username, user_type, count columns

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add base_username column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'username_sequences' AND column_name = 'base_username'
    ) THEN
        ALTER TABLE username_sequences ADD COLUMN base_username VARCHAR(20);
    END IF;
    
    -- Add user_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'username_sequences' AND column_name = 'user_type'
    ) THEN
        ALTER TABLE username_sequences ADD COLUMN user_type VARCHAR(20);
    END IF;
    
    -- Add count column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'username_sequences' AND column_name = 'count'
    ) THEN
        ALTER TABLE username_sequences ADD COLUMN count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Drop old columns that conflict with new schema
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'username_sequences' AND column_name = 'campus_id'
    ) THEN
        ALTER TABLE username_sequences DROP COLUMN campus_id;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'username_sequences' AND column_name = 'year'
    ) THEN
        ALTER TABLE username_sequences DROP COLUMN year;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'username_sequences' AND column_name = 'sequence_number'
    ) THEN
        ALTER TABLE username_sequences DROP COLUMN sequence_number;
    END IF;
END $$;

-- Make new columns NOT NULL after adding them
DO $$
BEGIN
    ALTER TABLE username_sequences ALTER COLUMN base_username SET NOT NULL;
    ALTER TABLE username_sequences ALTER COLUMN user_type SET NOT NULL;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not set NOT NULL constraint - table may have existing NULL values';
END $$;

-- Drop old unique constraint
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'username_sequences_campus_id_year_key'
    ) THEN
        ALTER TABLE username_sequences DROP CONSTRAINT username_sequences_campus_id_year_key;
    END IF;
END $$;

-- Add unique constraint for new schema
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'username_sequences_base_username_user_type_key'
    ) THEN
        ALTER TABLE username_sequences 
        ADD CONSTRAINT username_sequences_base_username_user_type_key 
        UNIQUE(base_username, user_type);
    END IF;
END $$;

-- Add index
CREATE INDEX IF NOT EXISTS idx_username_sequences_lookup 
ON username_sequences(base_username, user_type);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'username_sequences'
ORDER BY ordinal_position;
