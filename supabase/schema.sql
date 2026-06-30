-- ============================================================
-- MemoryVerse — Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─────────────────────────────────────────────────────────────
-- Custom Types / Enums
-- ─────────────────────────────────────────────────────────────

CREATE TYPE document_category AS ENUM (
  'resume', 'certificate', 'internship', 'project', 'research',
  'academic_transcript', 'achievement', 'portfolio', 'recommendation_letter',
  'cover_letter', 'course_completion', 'workshop', 'hackathon',
  'volunteer_work', 'other'
);

CREATE TYPE processing_status AS ENUM (
  'uploaded', 'queued', 'processing', 'completed', 'failed'
);

CREATE TYPE skill_type AS ENUM ('technical', 'soft', 'domain');

CREATE TYPE node_type AS ENUM (
  'person', 'skill', 'technology', 'project', 'internship',
  'certificate', 'achievement', 'university', 'company',
  'resume', 'portfolio', 'course'
);

CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');

-- ─────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT NOT NULL,
  avatar_url  TEXT,
  bio         TEXT,
  timezone    TEXT DEFAULT 'UTC',
  theme_preference theme_preference DEFAULT 'dark',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- documents
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.documents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  original_filename   TEXT NOT NULL,
  file_path           TEXT NOT NULL,
  file_type           TEXT NOT NULL,
  file_size           BIGINT NOT NULL DEFAULT 0,
  category            document_category,
  processing_status   processing_status DEFAULT 'uploaded' NOT NULL,
  extracted_text      TEXT,
  ai_summary          TEXT,
  ai_narrative        TEXT,
  confidence_score    DECIMAL(3,2),
  metadata            JSONB,
  tags                TEXT[] DEFAULT '{}',
  is_public           BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON public.documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON public.documents USING GIN(metadata);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- skills
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.skills (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  skill_type        skill_type DEFAULT 'technical',
  proficiency_level SMALLINT CHECK (proficiency_level BETWEEN 1 AND 10),
  first_seen_at     TIMESTAMPTZ,
  document_count    INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_skills_user_id ON public.skills(user_id);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own skills"
  ON public.skills FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.projects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id   UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  technologies  TEXT[] DEFAULT '{}',
  github_url    TEXT,
  demo_url      TEXT,
  start_date    DATE,
  end_date      DATE,
  is_featured   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- internships
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.internships (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id   UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  company       TEXT NOT NULL,
  role          TEXT NOT NULL,
  description   TEXT,
  technologies  TEXT[] DEFAULT '{}',
  start_date    DATE,
  end_date      DATE,
  is_current    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_internships_user_id ON public.internships(user_id);

ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own internships"
  ON public.internships FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- certifications
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.certifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id     UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  issuer          TEXT NOT NULL,
  issue_date      DATE,
  expiry_date     DATE,
  credential_id   TEXT,
  credential_url  TEXT,
  skills          TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own certifications"
  ON public.certifications FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- achievements
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.achievements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id       UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  organization      TEXT,
  achievement_date  DATE,
  category          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own achievements"
  ON public.achievements FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- timeline_events
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.timeline_events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id       UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  event_date        DATE NOT NULL,
  event_type        document_category,
  organization      TEXT,
  is_milestone      BOOLEAN DEFAULT FALSE,
  confidence_score  DECIMAL(3,2),
  source_type       TEXT DEFAULT 'ai_generated' CHECK (source_type IN ('ai_generated', 'manual', 'inferred')),
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_timeline_events_user_id ON public.timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_event_date ON public.timeline_events(event_date DESC);

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own timeline"
  ON public.timeline_events FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- knowledge_nodes
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.knowledge_nodes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  node_type     node_type NOT NULL,
  properties    JSONB DEFAULT '{}',
  document_ids  UUID[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_user_id ON public.knowledge_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_type ON public.knowledge_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_label ON public.knowledge_nodes(label);

ALTER TABLE public.knowledge_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own knowledge nodes"
  ON public.knowledge_nodes FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- knowledge_edges
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.knowledge_edges (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_node_id    UUID NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  target_node_id    UUID NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  relationship      TEXT NOT NULL,
  confidence_score  DECIMAL(3,2),
  document_ids      UUID[] DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_edges_user_id ON public.knowledge_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON public.knowledge_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_target ON public.knowledge_edges(target_node_id);

ALTER TABLE public.knowledge_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own knowledge edges"
  ON public.knowledge_edges FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- embeddings (Phase 3)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.embeddings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  embedding_type  TEXT NOT NULL DEFAULT 'full_text',
  model_name      TEXT NOT NULL,
  dimension       INTEGER NOT NULL,
  vector          vector(768),  -- nomic-embed-text dimension
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON public.embeddings(document_id);

ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own embeddings"
  ON public.embeddings FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- ai_jobs
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_type        TEXT NOT NULL,
  status          processing_status DEFAULT 'queued' NOT NULL,
  progress        SMALLINT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  retry_count     SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_document_id ON public.ai_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_id ON public.ai_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON public.ai_jobs(status);

ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai jobs"
  ON public.ai_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- recommendations
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recommendations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id   UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  impact        TEXT DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high')),
  is_dismissed  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.recommendations(user_id);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recommendations"
  ON public.recommendations FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- activity_logs
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- search_history
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.search_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query         TEXT NOT NULL,
  result_count  INTEGER DEFAULT 0,
  search_type   TEXT DEFAULT 'keyword',
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own search history"
  ON public.search_history FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- user_settings
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_settings (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme                     theme_preference DEFAULT 'dark',
  notification_email        BOOLEAN DEFAULT TRUE,
  notification_processing   BOOLEAN DEFAULT TRUE,
  notification_recommendations BOOLEAN DEFAULT TRUE,
  auto_categorize           BOOLEAN DEFAULT TRUE,
  auto_timeline             BOOLEAN DEFAULT TRUE,
  auto_relationships        BOOLEAN DEFAULT TRUE,
  knowledge_graph_visible   BOOLEAN DEFAULT TRUE,
  created_at                TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at                TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Supabase Storage Buckets
-- (Run these via Supabase Dashboard > Storage, or via API)
-- ─────────────────────────────────────────────────────────────

-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('generated-assets', 'generated-assets', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('future-exports', 'future-exports', false);

-- ─────────────────────────────────────────────────────────────
-- Storage RLS Policies
-- ─────────────────────────────────────────────────────────────

-- Documents bucket: users can only access their own folder
-- CREATE POLICY "Users can upload own documents"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can read own documents"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own documents"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ─────────────────────────────────────────────────────────────
-- Updated at triggers
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
