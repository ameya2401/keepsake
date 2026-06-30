-- ============================================================
-- MemoryVerse — Phase 2 Schema Additions
-- Run this in the Supabase SQL Editor after the Phase 1 schema
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Ensure ai_jobs table has the right structure
-- (already created in Phase 1, but verifying fields)
-- ─────────────────────────────────────────────────────────────

-- Add error_message column if not exists
ALTER TABLE ai_jobs
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add retry_count column if not exists
ALTER TABLE ai_jobs
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Add started_at and completed_at columns if not exists
ALTER TABLE ai_jobs
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE ai_jobs
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────
-- Ensure documents table has all Phase 2 fields
-- ─────────────────────────────────────────────────────────────

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_narrative TEXT,
  ADD COLUMN IF NOT EXISTS confidence_score FLOAT,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ─────────────────────────────────────────────────────────────
-- Ensure skills table has all needed columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS skill_type TEXT DEFAULT 'technical'
    CHECK (skill_type IN ('technical', 'soft', 'domain')),
  ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ DEFAULT NOW();

-- ─────────────────────────────────────────────────────────────
-- Create timeline_events table (for Phase 2 timeline candidates)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS timeline_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE NOT NULL,
  event_type  TEXT,
  organization TEXT,
  is_milestone BOOLEAN DEFAULT false,
  confidence_score FLOAT,
  source_type TEXT DEFAULT 'ai_generated'
    CHECK (source_type IN ('ai_generated', 'manual', 'inferred')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for timeline_events
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "timeline_events_user_select"
  ON timeline_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "timeline_events_user_insert"
  ON timeline_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "timeline_events_user_update"
  ON timeline_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "timeline_events_user_delete"
  ON timeline_events FOR DELETE
  USING (auth.uid() = user_id);

-- Index on user_id + event_date for timeline queries
CREATE INDEX IF NOT EXISTS idx_timeline_events_user_date
  ON timeline_events (user_id, event_date DESC);

-- ─────────────────────────────────────────────────────────────
-- Activity logs table
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "activity_logs_user_select"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "activity_logs_user_insert"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for user activity queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user
  ON activity_logs (user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Skills table RLS policies
-- ─────────────────────────────────────────────────────────────

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "skills_user_select"
  ON skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "skills_user_insert"
  ON skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "skills_user_update"
  ON skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "skills_user_delete"
  ON skills FOR DELETE
  USING (auth.uid() = user_id);

-- Unique constraint to prevent skill duplicates per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_user_name
  ON skills (user_id, LOWER(name));

-- ─────────────────────────────────────────────────────────────
-- AI Jobs table RLS policies
-- ─────────────────────────────────────────────────────────────

ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "ai_jobs_user_select"
  ON ai_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "ai_jobs_user_insert"
  ON ai_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "ai_jobs_user_update"
  ON ai_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Helper function: increment retry count
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_retry_count(job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ai_jobs
  SET retry_count = retry_count + 1
  WHERE id = job_id AND user_id = auth.uid();
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Updated_at triggers
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_timeline_events_updated_at
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Documents: ensure processing_status enum values work
-- ─────────────────────────────────────────────────────────────

-- If processing_status is an enum, add missing values:
DO $$
BEGIN
  -- This handles cases where the column is TEXT type
  -- If it's an enum, add values if needed
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'processing_status'
  ) THEN
    BEGIN
      ALTER TYPE processing_status ADD VALUE IF NOT EXISTS 'queued';
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Index for document queries
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_documents_user_status
  ON documents (user_id, processing_status);

CREATE INDEX IF NOT EXISTS idx_documents_user_created
  ON documents (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_status
  ON ai_jobs (user_id, status);
