# Keepsake — Architecture

## System Overview

Keepsake is a single-page application (SPA) with a serverless backend. The frontend is a React app deployed to Vercel. The backend is entirely powered by Supabase (PostgreSQL, Auth, Storage, Realtime).

---

## Architecture Diagram

```mermaid
graph TB
    subgraph "Client (React + Vite)"
        UI[React SPA]
        State[TanStack Query]
        Router[React Router v7]
    end

    subgraph "AI Layer (Client-side)"
        Groq[Groq API<br/>Llama-3.3-70b]
        GVision[Groq Vision<br/>Llama-3.2-11b]
        Gemini[Gemini API<br/>text-embedding-004]
    end

    subgraph "Supabase Backend"
        Auth[Supabase Auth]
        DB[(PostgreSQL<br/>+ pgvector)]
        Storage[Supabase Storage]
        Realtime[Supabase Realtime]
        RLS[Row Level Security]
    end

    subgraph "Deployment"
        Vercel[Vercel CDN]
        SupaCloud[Supabase Cloud]
    end

    UI --> Groq
    UI --> GVision
    UI --> Gemini
    UI --> Auth
    UI --> DB
    UI --> Storage
    UI --> Realtime

    DB --> RLS
    Auth --> RLS

    Vercel --> UI
    SupaCloud --> DB
    SupaCloud --> Auth
    SupaCloud --> Storage
```

---

## Document Processing Pipeline

```mermaid
flowchart TD
    A[User uploads file] --> B{File Type?}

    B -->|PDF| C[pdfjs-dist extraction]
    B -->|DOCX| D[Mammoth extraction]
    B -->|Image| E[Base64 encoding]

    C --> F[Text content]
    D --> F
    E --> G[Image data]

    F --> H[Groq Llama-3.3-70b<br/>JSON extraction]
    G --> I[Groq Llama-3.2-11b Vision<br/>Image analysis]

    H --> J[Structured metadata]
    I --> J

    J --> K[Supabase documents table]
    J --> L[Knowledge Graph Service]
    J --> M[Timeline Event Service]
    J --> N[Embedding Service]
    J --> O[Skill Aggregation]

    L --> P[knowledge_nodes + edges]
    M --> Q[timeline_events]
    N --> R[pgvector embeddings]
    O --> S[skills table]
```

---

## Knowledge Graph Architecture

```mermaid
graph LR
    subgraph "Node Types"
        Person
        Skill
        Technology
        Project
        Company
        Certificate
        Achievement
        University
    end

    subgraph "Edge Predicates"
        USES
        CREATED
        WORKED_AT
        CERTIFIED_BY
        RELATED_TO
        LEADS_TO
        VALIDATES
    end

    Project -->|USES| Skill
    Project -->|USES| Technology
    Certificate -->|CERTIFIED_BY| Company
    Person -->|WORKED_AT| Company
    Skill -->|RELATED_TO| Skill
    Certificate -->|VALIDATES| Skill
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant React
    participant Supabase

    User->>React: Visit /signup
    React->>Supabase: signUp(email, password)
    Supabase-->>React: Session + User
    React->>React: AuthProvider detects session
    React-->>User: Redirect to /dashboard

    User->>React: Refresh page
    React->>Supabase: getSession()
    Supabase-->>React: Existing session
    React-->>User: Stay authenticated
```

---

## Database Relationships

```mermaid
erDiagram
    users ||--o{ documents : "uploads"
    users ||--o{ skills : "has"
    users ||--o{ timeline_events : "has"
    users ||--o{ knowledge_nodes : "owns"
    users ||--o{ recommendations : "receives"

    documents ||--o{ ai_processing_jobs : "tracked by"
    documents ||--o{ embeddings : "has"
    documents ||--o{ timeline_events : "produces"
    documents ||--|| knowledge_nodes : "maps to"

    knowledge_nodes ||--o{ knowledge_edges : "source of"
    knowledge_nodes ||--o{ knowledge_edges : "target of"

    users {
        uuid id PK
        text email
        text full_name
        jsonb preferences
    }

    documents {
        uuid id PK
        uuid user_id FK
        text title
        text category
        text processing_status
        jsonb metadata
        text ai_summary
        text[] tags
    }

    embeddings {
        uuid id PK
        uuid document_id FK
        vector_1536 embedding
        text content_chunk
    }

    knowledge_nodes {
        uuid id PK
        uuid user_id FK
        text label
        text node_type
        jsonb properties
        uuid[] document_ids
    }

    knowledge_edges {
        uuid id PK
        uuid source_node_id FK
        uuid target_node_id FK
        text relationship
        float confidence_score
    }
```

---

## Recommendation Engine Flow

```mermaid
flowchart TD
    A[Trigger: new document uploaded] --> B[Fetch user context]
    B --> C[Documents + Skills + Timeline]

    C --> D{AI Recommendations}
    C --> E{Rule-based Recommendations}

    D --> F[Groq Llama-3<br/>context-aware suggestions]
    E --> G[Deterministic rules<br/>missing resume, no portfolio, etc.]

    F --> H[Merge + deduplicate]
    G --> H

    H --> I[Insert into recommendations table]
    I --> J[Display on dashboard]
```

---

## Frontend Component Flow

```mermaid
graph TB
    App --> Router
    Router --> ProtectedRoute
    ProtectedRoute --> AuthProvider

    AuthProvider --> AppShell
    AppShell --> Sidebar
    AppShell --> Navbar
    AppShell --> Page

    Page --> DashboardPage
    Page --> UploadPage
    Page --> MemoriesPage
    Page --> KnowledgeGraphPage
    Page --> TimelinePage
    Page --> SearchPage
    Page --> AssistantPage
    Page --> RecommendationsPage
    Page --> AnalyticsPage
```
