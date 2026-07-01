# Keepsake — Deployment Guide

## Prerequisites

- Node.js 18+
- A Supabase project
- A Groq API key
- A Google AI (Gemini) API key
- A Vercel account (for frontend hosting)

---

## Step 1: Database Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your **Project URL** and **Anon Key**

### 1.2 Enable pgvector

In the Supabase SQL Editor, run:

```sql
create extension if not exists vector;
```

### 1.3 Run Schema Files

In order, run these in the Supabase SQL Editor:

1. `supabase/schema.sql` — Core tables
2. `supabase/phase3_schema.sql` — Intelligence tables (embeddings, graph, timeline)
3. `setup_storage.sql` — Storage bucket and policies

### 1.4 Verify Tables

Confirm these tables exist:
- `documents`
- `ai_processing_jobs`
- `skills`
- `recommendations`
- `timeline_events`
- `knowledge_nodes`
- `knowledge_edges`
- `embeddings`
- `graph_metrics`

---

## Step 2: Environment Variables

### Local Development

Create `.env.local` in project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GROQ_API_KEY=gsk_your-groq-key
VITE_GEMINI_API_KEY=AIzaSy_your-gemini-key
```

### Vercel Production

Add the same variables in:
Vercel Dashboard → Project → Settings → Environment Variables

---

## Step 3: Local Development

```bash
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

---

## Step 4: Deploy to Vercel

### Option A: GitHub Integration (Recommended)

1. Push code to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Select the repository
4. Add environment variables
5. Click **Deploy**

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Step 5: Supabase Auth Configuration

1. Go to Supabase → Authentication → URL Configuration
2. Set **Site URL** to your Vercel deployment URL (e.g. `https://keepsake.vercel.app`)
3. Add Vercel URL to **Redirect URLs**

---

## Step 6: Storage Bucket

Verify the `documents` bucket exists in Supabase Storage:

1. Supabase → Storage
2. Should see `documents` bucket
3. If not, run `setup_storage.sql` again

---

## Deployment Checklist

```
✓ pgvector extension enabled
✓ schema.sql executed
✓ phase3_schema.sql executed
✓ setup_storage.sql executed
✓ VITE_SUPABASE_URL set in Vercel
✓ VITE_SUPABASE_ANON_KEY set in Vercel
✓ VITE_GROQ_API_KEY set in Vercel
✓ VITE_GEMINI_API_KEY set in Vercel
✓ Supabase Auth redirect URL configured
✓ Documents storage bucket exists
✓ Row Level Security enabled on all tables
✓ Vercel deployment successful
✓ Login / Signup working
✓ File upload working
✓ AI processing completing
✓ Knowledge graph rendering
```

---

## Troubleshooting

### Upload stuck at processing
- Check browser console for error messages
- Verify VITE_GROQ_API_KEY is correct
- Check Supabase Storage bucket exists and has correct policies

### Knowledge graph empty
- Verify `phase3_schema.sql` was run (check for `knowledge_nodes` table)
- Check that `upsert_knowledge_node` RPC exists

### Semantic search returns no results
- Verify `embeddings` table exists
- Check VITE_GEMINI_API_KEY is correct
- Run a document upload to generate embeddings

### Auth not working after deployment
- Verify Vercel deployment URL is added to Supabase Auth redirect URLs
- Check VITE_SUPABASE_URL matches your project

---

## Environment Variable Reference

| Variable | Required | Source |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase → Settings → API |
| `VITE_GROQ_API_KEY` | ✅ Yes | console.groq.com |
| `VITE_GEMINI_API_KEY` | ✅ Yes | aistudio.google.com |
