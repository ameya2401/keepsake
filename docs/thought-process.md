# Keepsake — Thought Process & Technical Decisions

## Why This Architecture?

### The Core Problem

Every student and professional has a "documents folder problem" — years of PDFs, Word files, and images scattered across downloads, email, and cloud drives. When asked "What projects have you done with machine learning?" or "When did you intern at that company?", the answer requires manually searching through dozens of files.

This is a knowledge management problem, not a storage problem. The documents exist — they just aren't connected.

---

## Technical Decision Log

### Why Supabase?

**Decision**: Use Supabase as the sole backend service.

**Rationale**:
1. **pgvector integration** — Supabase natively supports vector similarity search, eliminating the need for a separate vector database (Pinecone, Weaviate, etc.)
2. **Row Level Security** — Database-level access control means we never accidentally serve one user's data to another, even with application bugs
3. **Built-in Auth** — JWT-based auth with email/password and social login out of the box
4. **Realtime** — Document processing updates flow to the UI without polling
5. **Storage** — File uploads co-located with the database, signed URLs for security
6. **Developer Experience** — TypeScript client, auto-generated types, local development

**Trade-offs**:
- Vendor lock-in (mitigated by PostgreSQL compatibility)
- Free tier limits (generous for a hackathon/MVP)

---

### Why pgvector Instead of External Vector Databases?

**Decision**: Use pgvector (bundled with Supabase) instead of Pinecone, Weaviate, or Chroma.

**Rationale**:
1. **Zero additional services** — No extra API key, no extra billing, no network hop
2. **SQL joins** — Vector search results can be JOIN'd with document metadata in a single query
3. **Sufficient scale** — pgvector handles millions of vectors; this app will never exceed that
4. **Consistency** — Embeddings live in the same ACID transaction as the documents they describe

**Trade-offs**:
- Approximate Nearest Neighbor (ANN) performance below dedicated vector DBs at extreme scale
- Index maintenance on inserts (negligible at this scale)

---

### Why Groq for Text Generation?

**Decision**: Migrate from Gemini to Groq for all LLM inference.

**Rationale**:
1. **Speed** — Groq achieves 300+ tokens/second on Llama-3, making document processing feel near-instant
2. **Reliability** — Groq's API has no regional availability issues (Gemini had availability gaps affecting development)
3. **JSON mode** — Native `response_format: { type: "json_object" }` ensures structured extraction never fails to parse
4. **Cost** — Generous free tier for development and hackathon usage
5. **Model quality** — Llama-3.3-70b-versatile is excellent at structured JSON extraction

**Trade-offs**:
- No embedding endpoint (handled by Gemini's text-embedding-004)
- Potential rate limits at high traffic (mitigated by retry logic in pipeline)

---

### Why Keep Gemini for Embeddings?

**Decision**: Use Gemini's `text-embedding-004` model for vector embeddings only.

**Rationale**:
1. **Groq limitation** — Groq does not offer an embedding endpoint
2. **Embedding quality** — Gemini's embedding model produces 768-dimensional vectors with strong semantic understanding
3. **Low usage** — Embeddings are generated once per document, so token usage is minimal
4. **Free tier sufficient** — 1,500 requests/day on free tier is more than enough

---

### Why Client-Side AI Calls?

**Decision**: Make Groq and Gemini API calls directly from the browser, not from a server.

**Rationale**:
1. **Simplicity** — No backend server to maintain or deploy
2. **Groq's `dangerouslyAllowBrowser` flag** — Explicitly supported for development scenarios
3. **API key exposure** — The keys are scoped to specific services; worst case is API quota abuse, not data breach
4. **Speed** — No server round-trip adds latency

**Trade-offs** (and mitigations):
- API keys visible in browser → mitigated by: (a) Groq's per-user rate limits, (b) no sensitive server-side data is behind the keys
- For production at scale: Move AI calls to Supabase Edge Functions

---

## How AI Extraction Works

The extraction prompt is carefully engineered to return a strict JSON schema:

```
User prompt → EXTRACTION_PROMPT + document_text
                          ↓
              Groq Llama-3.3-70b (response_format: json_object)
                          ↓
              {
                title, document_type, organization,
                skills[], technologies[], dates,
                ai_summary, confidence, tags[]
              }
```

Key design choices:
- **Temperature 0.1** — Near-deterministic extraction, reduces hallucination
- **20,000 character limit** — Stays within Groq's context window while covering most documents
- **Retry with backoff** — 3 retries on failure, increasing delays

---

## How Relationship Discovery Works

After extraction, a second Groq call analyzes the structured metadata and identifies knowledge graph entities:

```
{document metadata} → RELATIONSHIP_PROMPT
                              ↓
                   {nodes: [...], relationships: [...]}
                              ↓
            Upserted into knowledge_nodes + knowledge_edges
```

Entity types: `person | skill | technology | project | internship | certificate | achievement | university | company`

Relationship types: `USES | CREATED | LEARNT | CERTIFIED_BY | WORKED_AT | MENTIONS | RELATED_TO | VALIDATES`

A **fallback path** exists: if AI extraction returns empty results, deterministic entity extraction from metadata fields (skills, organization, technologies) still builds a meaningful graph.

---

## How Recommendations Are Generated

Recommendations combine two complementary approaches:

**Rule-based (always runs):**
- No resume detected → "Upload your resume"
- Has certificates but no projects → "Apply your skills in projects"
- Hackathon result not on resume → "Add hackathon win to resume"

**AI-based (runs in parallel):**
- Full user context serialized as JSON → Groq Llama-3
- Prompt asks for specific, non-generic recommendations referencing actual document titles

Results are merged and deduplicated by title before insertion.

---

## How the Timeline Is Built

Timeline events are extracted during the AI pipeline run:

1. Groq extracts `timeline_candidate` from the document (title, date, organization, type)
2. If `timeline_candidate.date` is valid, a `timeline_event` row is created
3. The TimelinePage queries and renders events in chronological order

Document types map to event types:
- internship → `internship`
- certificate → `achievement`
- project → `project`
- hackathon → `achievement`

---

## Trade-offs Made

| Decision | Trade-off | Accepted Because |
|---|---|---|
| Client-side AI calls | API key exposure | Scope limited to rate abuse; no server data exposed |
| Groq for generation | No streaming support (stateless calls) | Latency is 1-3s which is acceptable |
| pgvector | Slower than dedicated vector DB at scale | Sufficient for hackathon + early product |
| No server backend | Can't hide business logic | Supabase RLS protects all data |
| Lazy loading all routes | Slight complexity | Reduces initial bundle by ~60% |

---

## Hackathon Judging Criteria Mapping

| Criterion | How Keepsake Addresses It |
|---|---|
| **Innovation** | First career memory OS combining document ingestion, knowledge graphs, and AI reasoning |
| **Technical Complexity** | 5-phase implementation: Auth → Upload → AI Pipeline → Knowledge Intelligence → Production |
| **AI Integration** | Groq Llama-3 (generation + vision), Gemini (embeddings), pgvector (semantic search) |
| **User Experience** | Onboarding wizard, demo mode, semantic search, interactive knowledge graph |
| **Completeness** | Full deployment, documentation, test data, and submission assets |
| **Scalability** | Supabase scales to millions of rows; Vercel scales to global CDN |

---

## Future Improvements

If given more time, the next engineering investments would be:

1. **Move AI calls to Supabase Edge Functions** — Eliminate API key exposure entirely
2. **Streaming AI responses** — Show extraction progress character-by-character
3. **Incremental graph updates** — Update only affected nodes when a document changes
4. **Background sync** — Process documents server-side, Realtime pushes updates
5. **Local embedding** — Run embedding model in-browser for privacy-first mode
6. **Graph query language** — Let users write Cypher-style queries against their knowledge graph
