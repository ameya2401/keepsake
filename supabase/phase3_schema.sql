-- ============================================================
-- Keepsake — Phase 3 Schema: Knowledge Intelligence Engine
-- Run this in the Supabase SQL Editor after Phase 1 & 2 schemas
-- ============================================================

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─────────────────────────────────────────────────────────────
-- Add vector column to embeddings table (if not already present)
-- ─────────────────────────────────────────────────────────────

-- Add embedding vector column (768 dims for nomic-embed-text)
ALTER TABLE public.embeddings
  ADD COLUMN IF NOT EXISTS vector vector(768),
  ADD COLUMN IF NOT EXISTS content_snippet TEXT;

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector
  ON public.embeddings
  USING hnsw (vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─────────────────────────────────────────────────────────────
-- knowledge_triples — structured (subject, predicate, object) facts
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.knowledge_triples (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_node_id  UUID NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  target_node_id  UUID NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  predicate       TEXT NOT NULL,   -- USES, CREATED, CERTIFIED_BY, WORKED_AT, etc.
  confidence      DECIMAL(3,2) DEFAULT 0.7,
  source_memory_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_triples_user_id ON public.knowledge_triples(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_triples_source ON public.knowledge_triples(source_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_triples_target ON public.knowledge_triples(target_node_id);

ALTER TABLE public.knowledge_triples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own triples"
  ON public.knowledge_triples FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- similar_memories — pre-computed nearest neighbors
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.similar_memories (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id         UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  similar_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  similarity_score    DECIMAL(4,3) NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(document_id, similar_document_id)
);

CREATE INDEX IF NOT EXISTS idx_similar_memories_document_id
  ON public.similar_memories(document_id);
CREATE INDEX IF NOT EXISTS idx_similar_memories_user_id
  ON public.similar_memories(user_id);

ALTER TABLE public.similar_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own similar memories"
  ON public.similar_memories FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- memory_scores — per-document health score
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.memory_scores (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id             UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  health_score            SMALLINT NOT NULL DEFAULT 0 CHECK (health_score BETWEEN 0 AND 100),
  metadata_completeness   SMALLINT DEFAULT 0,
  relationship_count      SMALLINT DEFAULT 0,
  has_embedding           BOOLEAN DEFAULT FALSE,
  has_timeline_event      BOOLEAN DEFAULT FALSE,
  issues                  TEXT[] DEFAULT '{}',
  created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(document_id)
);

ALTER TABLE public.memory_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own memory scores"
  ON public.memory_scores FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- graph_metrics — user-level knowledge density metrics
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.graph_metrics (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_nodes               INTEGER DEFAULT 0,
  total_edges               INTEGER DEFAULT 0,
  avg_relationships         DECIMAL(5,2) DEFAULT 0,
  skills_per_project        DECIMAL(5,2) DEFAULT 0,
  timeline_completeness     DECIMAL(3,2) DEFAULT 0,
  document_coverage         DECIMAL(3,2) DEFAULT 0,
  overall_density_score     SMALLINT DEFAULT 0 CHECK (overall_density_score BETWEEN 0 AND 100),
  computed_at               TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.graph_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own graph metrics"
  ON public.graph_metrics FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Semantic search function using pgvector cosine similarity
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_memories_by_vector(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.5,
  match_count     INT    DEFAULT 10,
  p_user_id       UUID   DEFAULT auth.uid()
)
RETURNS TABLE (
  document_id   UUID,
  similarity    FLOAT,
  title         TEXT,
  category      TEXT,
  ai_summary    TEXT,
  tags          TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.document_id,
    1 - (e.vector <=> query_embedding) AS similarity,
    d.title,
    d.category::TEXT,
    d.ai_summary,
    d.tags
  FROM public.embeddings e
  JOIN public.documents d ON d.id = e.document_id
  WHERE
    e.user_id = p_user_id
    AND 1 - (e.vector <=> query_embedding) > match_threshold
  ORDER BY e.vector <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Helper: upsert knowledge node (find or create by label+type)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION upsert_knowledge_node(
  p_user_id     UUID,
  p_label       TEXT,
  p_node_type   node_type,
  p_document_id UUID DEFAULT NULL,
  p_properties  JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Try to find existing node
  SELECT id INTO v_id
  FROM public.knowledge_nodes
  WHERE user_id = p_user_id
    AND LOWER(label) = LOWER(p_label)
    AND node_type = p_node_type;

  IF v_id IS NULL THEN
    -- Create new node
    INSERT INTO public.knowledge_nodes (user_id, label, node_type, properties, document_ids)
    VALUES (
      p_user_id,
      p_label,
      p_node_type,
      p_properties,
      CASE WHEN p_document_id IS NOT NULL THEN ARRAY[p_document_id] ELSE '{}' END
    )
    RETURNING id INTO v_id;
  ELSIF p_document_id IS NOT NULL THEN
    -- Update existing node with additional document
    UPDATE public.knowledge_nodes
    SET
      document_ids = array_append(
        CASE WHEN p_document_id = ANY(document_ids) THEN document_ids
             ELSE document_ids END,
        CASE WHEN NOT (p_document_id = ANY(document_ids)) THEN p_document_id
             ELSE NULL END
      ),
      properties = properties || p_properties,
      updated_at = NOW()
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Helper: upsert knowledge edge (avoid duplicates)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION upsert_knowledge_edge(
  p_user_id      UUID,
  p_source_id    UUID,
  p_target_id    UUID,
  p_relationship TEXT,
  p_confidence   DECIMAL DEFAULT 0.7,
  p_document_id  UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.knowledge_edges
  WHERE user_id = p_user_id
    AND source_node_id = p_source_id
    AND target_node_id = p_target_id
    AND relationship = p_relationship;

  IF v_id IS NULL THEN
    INSERT INTO public.knowledge_edges
      (user_id, source_node_id, target_node_id, relationship, confidence_score, document_ids)
    VALUES
      (p_user_id, p_source_id, p_target_id, p_relationship, p_confidence,
       CASE WHEN p_document_id IS NOT NULL THEN ARRAY[p_document_id] ELSE '{}' END)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.knowledge_edges
    SET
      confidence_score = GREATEST(confidence_score, p_confidence),
      document_ids = CASE
        WHEN p_document_id IS NOT NULL AND NOT (p_document_id = ANY(document_ids))
        THEN array_append(document_ids, p_document_id)
        ELSE document_ids
      END,
      updated_at = NOW()
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Compute graph metrics for a user
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_graph_metrics(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nodes         INTEGER;
  v_edges         INTEGER;
  v_avg_rel       DECIMAL;
  v_docs          INTEGER;
  v_docs_covered  INTEGER;
  v_timeline_comp DECIMAL;
  v_density       SMALLINT;
BEGIN
  SELECT COUNT(*) INTO v_nodes FROM public.knowledge_nodes WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_edges FROM public.knowledge_edges WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_docs FROM public.documents WHERE user_id = p_user_id AND processing_status = 'completed';
  SELECT COUNT(DISTINCT document_id) INTO v_docs_covered FROM public.embeddings WHERE user_id = p_user_id;

  v_avg_rel := CASE WHEN v_nodes > 0 THEN (v_edges::DECIMAL * 2) / v_nodes ELSE 0 END;

  -- Timeline completeness: docs with timeline events / total docs
  SELECT CASE WHEN v_docs > 0 THEN
    (COUNT(DISTINCT te.document_id)::DECIMAL / v_docs)
  ELSE 0 END
  INTO v_timeline_comp
  FROM public.timeline_events te
  WHERE te.user_id = p_user_id;

  v_density := LEAST(100, (
    (CASE WHEN v_nodes > 5 THEN 20 ELSE v_nodes * 4 END) +
    (CASE WHEN v_edges > 10 THEN 20 ELSE v_edges * 2 END) +
    (CASE WHEN v_docs_covered > 0 AND v_docs > 0 THEN ROUND((v_docs_covered::DECIMAL / v_docs) * 20) ELSE 0 END) +
    (ROUND(v_timeline_comp * 20)) +
    (CASE WHEN v_avg_rel > 2 THEN 20 ELSE ROUND(v_avg_rel * 10) END)
  )::SMALLINT);

  INSERT INTO public.graph_metrics
    (user_id, total_nodes, total_edges, avg_relationships, timeline_completeness,
     document_coverage, overall_density_score, computed_at)
  VALUES
    (p_user_id, v_nodes, v_edges, v_avg_rel, v_timeline_comp,
     CASE WHEN v_docs > 0 THEN v_docs_covered::DECIMAL / v_docs ELSE 0 END,
     v_density, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_nodes           = EXCLUDED.total_nodes,
    total_edges           = EXCLUDED.total_edges,
    avg_relationships     = EXCLUDED.avg_relationships,
    timeline_completeness = EXCLUDED.timeline_completeness,
    document_coverage     = EXCLUDED.document_coverage,
    overall_density_score = EXCLUDED.overall_density_score,
    computed_at           = NOW();
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Triggers for updated_at on new tables
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_knowledge_triples_updated_at ON public.knowledge_triples;
CREATE TRIGGER update_knowledge_triples_updated_at
  BEFORE UPDATE ON public.knowledge_triples
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_memory_scores_updated_at ON public.memory_scores;
CREATE TRIGGER update_memory_scores_updated_at
  BEFORE UPDATE ON public.memory_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_knowledge_nodes_updated_at ON public.knowledge_nodes;
CREATE TRIGGER update_knowledge_nodes_updated_at
  BEFORE UPDATE ON public.knowledge_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_knowledge_edges_updated_at ON public.knowledge_edges;
CREATE TRIGGER update_knowledge_edges_updated_at
  BEFORE UPDATE ON public.knowledge_edges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
