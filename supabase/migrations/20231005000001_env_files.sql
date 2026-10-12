-- Migration: Update env_files to support multiple files per project

DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find and drop the unique constraint on project_id if it exists
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'env_files'
      AND tc.constraint_type = 'UNIQUE'
      AND kcu.column_name = 'project_id';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE env_files DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add new columns
ALTER TABLE env_files ADD COLUMN IF NOT EXISTS file_name TEXT NOT NULL DEFAULT '.env';
ALTER TABLE env_files ADD COLUMN IF NOT EXISTS label TEXT DEFAULT NULL;

-- Add new unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'env_files_project_id_file_name_key'
    ) THEN
        ALTER TABLE env_files ADD CONSTRAINT env_files_project_id_file_name_key UNIQUE (project_id, file_name);
    END IF;
END $$;

