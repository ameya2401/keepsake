# Keepsake — AI-Powered Career Intelligence

<div align="center">
  <img src="https://img.shields.io/badge/Built%20with-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/AI-Groq%20Llama--3-F55036?style=for-the-badge&logo=meta" alt="Groq" />
  <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Deployment-Vercel-000000?style=for-the-badge&logo=vercel" alt="Vercel" />
</div>

---

## 🧠 What is Keepsake?

**Keepsake** is an AI-powered career memory system that transforms scattered documents — resumes, certificates, internship letters, and project portfolios — into an intelligent, searchable knowledge base.

> "I never have to search through folders again."

### The Problem

Students and professionals accumulate hundreds of career documents over years. These files are stored in folders, email attachments, and cloud drives with no intelligence connecting them. When it's time to update a resume, prepare for an interview, or reflect on your career journey, the information is scattered and hard to find.

### The Solution

Keepsake ingests your documents, extracts rich metadata using AI, and builds:
- A **knowledge graph** connecting your skills, organizations, and achievements
- A **career timeline** from dates extracted across all documents
- **Semantic search** that understands the meaning of your questions
- **AI recommendations** that surface gaps and opportunities

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 AI Extraction | Groq Llama-3 extracts skills, technologies, dates, and achievements |
| 🕸️ Knowledge Graph | Visual network of entities and their relationships |
| ⏱️ Career Timeline | Auto-populated timeline from document dates |
| 🔍 Semantic Search | Vector search across all memories using pgvector |
| 💡 AI Recommendations | Personalized career gap analysis and suggestions |
| 📊 Resume Analyzer | Compare resume against entire memory archive |
| 🧭 AI Assistant | Ask complex questions about your career history |
| 📈 Analytics Dashboard | Operational metrics and knowledge graph growth |

---

## 🏗️ Technology Stack

### Frontend
- **React 19** + **TypeScript** — Modern UI framework
- **Vite 6** — Lightning-fast build tool
- **TailwindCSS 3** — Utility-first styling
- **Framer Motion** — Smooth animations
- **React Router v7** — Client-side routing
- **TanStack Query v5** — Server state management
- **Radix UI** — Accessible headless components

### AI & Processing
- **Groq (Llama-3.3-70b-versatile)** — Text generation, extraction, reasoning (300+ tok/s)
- **Groq (Llama-3.2-11b-vision-preview)** — Image document analysis
- **Google Gemini (text-embedding-004)** — Vector embeddings for semantic search
- **pdfjs-dist** — PDF text extraction
- **Mammoth** — DOCX text extraction

### Backend & Database
- **Supabase** — PostgreSQL database, auth, storage, realtime
- **pgvector** — Vector similarity search for semantic memory retrieval
- **Supabase RLS** — Row-level security for data isolation

### Deployment
- **Vercel** — Frontend hosting with automatic deploys
- **Supabase Cloud** — Managed PostgreSQL with vector support

---

## 📁 Folder Structure

```
keepsake/
├── src/
│   ├── components/
│   │   ├── common/          # Shared components (CommandPalette, Onboarding, ProtectedRoute)
│   │   ├── layout/          # AppShell, Sidebar, Navbar
│   │   └── ui/              # Design system (Button, Card, Badge, etc.)
│   ├── features/
│   │   ├── analytics/       # Analytics dashboard
│   │   ├── assistant/       # AI Assistant + Resume Analyzer
│   │   ├── authentication/  # Login, Signup, ForgotPassword
│   │   ├── dashboard/       # Main dashboard with stats and insights
│   │   ├── knowledge-graph/ # Interactive graph visualization
│   │   ├── memories/        # Memory list and detail views
│   │   ├── recommendations/ # AI recommendation cards
│   │   ├── search/          # Semantic search interface
│   │   ├── settings/        # Profile and app settings
│   │   ├── timeline/        # Career timeline view
│   │   └── upload/          # File upload and processing dashboard
│   ├── lib/
│   │   ├── ai-pipeline.ts        # Main AI orchestration pipeline
│   │   ├── demo-seeder.ts        # Demo data seeder
│   │   ├── embedding-service.ts  # Vector embedding generation
│   │   ├── knowledge-graph-service.ts  # Graph building logic
│   │   ├── reasoning-api.ts      # Cross-memory reasoning
│   │   ├── recommendation-engine.ts    # Career recommendations
│   │   ├── supabase.ts           # Supabase client
│   │   ├── text-extractor.ts     # PDF/DOCX/image text extraction
│   │   └── utils.ts              # Shared utilities
│   ├── pages/
│   │   ├── LandingPage.tsx  # Public marketing page
│   │   └── NotFoundPage.tsx # 404 page
│   ├── providers/
│   │   ├── AuthProvider.tsx  # Authentication context
│   │   └── ThemeProvider.tsx # Dark/light mode
│   └── types/
│       └── database.ts      # TypeScript database types
├── supabase/
│   ├── schema.sql            # Base schema (Phase 1-2)
│   └── phase3_schema.sql     # Phase 3 extensions (embeddings, graph, timeline)
├── Process/                  # Phase planning documents
└── docs/                     # Documentation
```

---

## ⚙️ Environment Variables

Create a `.env.local` file at the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Models
VITE_GROQ_API_KEY=gsk_your-groq-key      # Text generation & vision (free tier generous)
VITE_GEMINI_API_KEY=AIzaSy_your-key      # Embeddings only (very low usage)
```

### Getting API Keys
- **Groq**: [console.groq.com](https://console.groq.com) — Free tier: 100 requests/min
- **Gemini**: [aistudio.google.com](https://aistudio.google.com) — Free tier: 1,500 requests/day (embeddings only)
- **Supabase**: [supabase.com](https://supabase.com) — Free tier: 500MB database

---

## 🚀 Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/ameya2401/keepsake.git
cd keepsake

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your API keys

# 4. Set up the database
# Go to Supabase SQL Editor and run:
# supabase/schema.sql
# supabase/phase3_schema.sql
# setup_storage.sql

# 5. Start the development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

---

## 🗄️ Database Setup

Run these SQL files in order in your Supabase SQL editor:

1. `supabase/schema.sql` — Core tables (users, documents, jobs, skills, recommendations)
2. `supabase/phase3_schema.sql` — Extended intelligence (embeddings, knowledge graph, timeline)
3. `setup_storage.sql` — Storage bucket policies

---

## 🤖 AI Workflow

```
Upload File
    │
    ▼
Text Extraction (pdfjs / mammoth / image-to-base64)
    │
    ▼
Groq Llama-3 Analysis
    ├── Document type detection
    ├── Metadata extraction (skills, org, dates, achievements)
    ├── AI summary generation
    └── Tag generation
    │
    ▼
Database Storage (Supabase documents table)
    │
    ├──▶ Knowledge Graph (entity + relationship extraction)
    ├──▶ Timeline Events (date extraction → timeline_events)
    ├──▶ Vector Embeddings (Gemini → pgvector)
    └──▶ Skill Aggregation (skills table upsert)
```

---

## 🌐 Deployment

### Vercel (Frontend)

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy

```bash
# Manual deploy
npm run build
vercel --prod
```

### Supabase (Backend)
- Create project at [supabase.com](https://supabase.com)
- Enable pgvector extension: `create extension if not exists vector`
- Run schema files in SQL editor
- Enable Row Level Security on all tables

---

## 🎮 Demo Mode

New users can immediately explore Keepsake with pre-loaded sample data:

1. Sign up / log in
2. Click **"Load Demo Workspace"** on the dashboard
3. Explore a pre-built career knowledge base with:
   - Google internship letter
   - AWS certification
   - Open source project
   - Hackathon win
   - Engineering resume

---

## 🗺️ Future Roadmap

- [ ] Google Drive & Dropbox integration
- [ ] GitHub repository sync (README → project memory)
- [ ] Resume PDF generation from memory archive
- [ ] LinkedIn profile comparison
- [ ] Calendar integration for timeline events
- [ ] Voice search
- [ ] Team workspaces / recruiter mode
- [ ] Email ingestion (internship offers via email)
- [ ] Offline mode with local AI (Ollama)
- [ ] Plugin architecture for custom extractors

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- **Groq** for blazing-fast LLM inference
- **Supabase** for the incredible open-source backend platform
- **Vercel** for seamless frontend deployment
- **pdfjs-dist** and **Mammoth** for document parsing

---

*Built for the AI Hackathon 2026 — Keepsake v1.0*
