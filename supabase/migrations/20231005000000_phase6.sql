-- Migration: Add fields for archiving, custom service types, todo due dates, and activity log

-- 1. Add archived_at to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Add custom_kind to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS custom_kind TEXT DEFAULT NULL;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'custom_kind_length'
    ) THEN
        ALTER TABLE services ADD CONSTRAINT custom_kind_length CHECK (custom_kind IS NULL OR char_length(custom_kind) <= 40);
    END IF;
END $$;

-- 3. Add due_date to todos (was already in init.sql for some users, making it safe)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ DEFAULT NULL;

-- 4. Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Enable RLS on activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for activity_log (safe wrapper)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own activity logs' AND tablename = 'activity_log'
    ) THEN
        CREATE POLICY "Users can view their own activity logs"
            ON activity_log FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own activity logs' AND tablename = 'activity_log'
    ) THEN
        CREATE POLICY "Users can insert their own activity logs"
            ON activity_log FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Optional: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_archived_at ON projects(archived_at);

