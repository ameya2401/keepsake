# Keepsake — Demo Script (3–5 Minutes)

## Judges Demo Script

---

### [0:00] The Problem (30 seconds)

> "Every developer has a documents folder that looks like this."

Point to a messy directory of PDFs.

> "Internship letters from 3 years ago. Certificates buried in downloads. Projects documented across Word files. When it's time to update a resume or prepare for an interview — you're manually searching through everything.

> **What if your documents could talk to each other?**"

---

### [0:30] Introduction to Keepsake (30 seconds)

> "This is Keepsake. An AI-powered career memory system."

Navigate to the landing page at `keepsake.app`.

> "Upload any career document — resume, certificate, internship letter, project report. Keepsake's AI extracts the intelligence buried inside and connects everything into a knowledge graph."

Click **Get Started** → Log in.

---

### [1:00] Upload a Document (45 seconds)

Navigate to **Upload** (`/upload`).

> "Let me upload an internship letter."

Drag-drop an internship PDF.

> "Keepsake is now extracting text, classifying the document type, and running it through Groq's Llama-3 — one of the fastest AI models available at 300 tokens per second."

Watch the progress bar move through stages:
- "Extracting text…"
- "Running AI analysis…"
- "Building knowledge graph…"
- "Generating embeddings…"
- "Complete"

> "Done in under 3 seconds."

---

### [1:45] Show Extracted Metadata (30 seconds)

Navigate to **Memories** (`/memories`) → click the new document.

> "Look at what was extracted. Organization: Google. Skills: Python, TensorFlow, Docker. Start date: May 2024. AI summary written automatically."

> "All of this from a PDF that previously had zero metadata."

---

### [2:15] Timeline Update (20 seconds)

Navigate to **Timeline** (`/timeline`).

> "The date from that internship letter was automatically added to my career timeline. Every document contributes to this view of my professional journey."

---

### [2:35] Knowledge Graph (30 seconds)

Navigate to **Knowledge Graph** (`/knowledge-graph`).

> "Here's where it gets interesting. Every entity is now a node. My name, Google, Python, TensorFlow, Docker — all connected."

Hover over a node.

> "Each relationship was discovered automatically by AI. This graph grows with every document I upload."

---

### [3:05] Semantic Search (30 seconds)

Navigate to **Search** (`/search`).

Type: `"Show everything related to Python"`

> "This isn't a keyword search. It's vector similarity — the AI understands that my TensorFlow internship and my open source project are both deeply related to Python, even if the word Python only appears in one."

---

### [3:35] AI Assistant (30 seconds)

Navigate to **Assistant** (`/assistant`).

Type: `"What projects best demonstrate my backend experience?"`

> "The assistant reasons across my entire memory archive and surfaces specific evidence — the distributed task queue project, the internship where I built APIs. It cites actual documents."

---

### [4:05] Resume Recommendations (20 seconds)

Navigate to **Recommendations** (`/recommendations`).

> "Keepsake compared my resume against all my memories and found three gaps. My hackathon win isn't on my resume. I have Docker expertise not reflected anywhere. Specific, actionable, data-driven."

---

### [4:25] The Closer (15 seconds)

> "I uploaded five documents. In under a minute, I have a searchable knowledge graph, a career timeline, AI-generated insights, and resume gap analysis."

> "**I never have to search through folders again.**"

---

## Key Demo Tips

- Use the **Load Demo Workspace** button to pre-populate data if live upload is slow
- The knowledge graph is most impressive with 5+ documents
- Semantic search is most impressive when searching for skills that appear across multiple documents
- The assistant should be asked questions that require reasoning across multiple documents

---

## Backup Plan

If AI API is slow or unavailable:
1. Pre-load demo workspace data (button on dashboard)
2. Show pre-populated knowledge graph
3. Demonstrate semantic search over demo data
4. Explain the AI pipeline architecture with the Architecture.md diagrams
