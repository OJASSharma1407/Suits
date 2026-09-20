# SUITS — Complete System Architecture

> **SUITS** (*Smart Unified Intelligence & Tracking System*) is an AI-powered court intelligence and legal research platform built for SIH 2026. It provides lawyers, researchers, and judges with real-time case tracking, AI-driven legal analysis, semantic search, predictive analytics, and an interactive legal chatbot.

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Root Structure](#3-project-root-structure)
4. [Infrastructure & DevOps](#4-infrastructure--devops)
5. [Backend Architecture](#5-backend-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [External Integrations](#7-external-integrations)
8. [Authentication Flow](#8-authentication-flow)
9. [AI Pipeline](#9-ai-pipeline)
10. [Data Flow Diagrams](#10-data-flow-diagrams)
11. [Environment Variables](#11-environment-variables)
12. [Complete File Tree](#12-complete-file-tree)

---

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT BROWSER                        │
│           React 19 + TypeScript + Vite + TailwindCSS        │
│                    http://localhost:5173                     │
└────────────────────────┬────────────────────────────────────┘
                         │  REST + SSE (streaming)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                          │
│              Python 3.12 + Uvicorn ASGI                     │
│                    http://localhost:8000                     │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │   Auth   │  │  Search  │  │  Cases   │  │    Chat   │  │
│  │  Router  │  │  Router  │  │  Router  │  │   Router  │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │Documents │  │Analytics │  │Bookmarks │  │  History  │  │
│  │  Router  │  │  Router  │  │  Router  │  │   Router  │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Files   │  │  Orders  │  │ Statutes │                  │
│  │  Router  │  │  Router  │  │  Router  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└────┬────────────────┬──────────────┬────────────────────────┘
     │                │              │
     ▼                ▼              ▼
┌─────────┐    ┌──────────┐   ┌───────────────────────────────┐
│  SQLite │    │  Redis   │   │      EXTERNAL APIS             │
│(dev) /  │    │  Cache   │   │  • eCourts India Partner API  │
│Postgres │    │  :6379   │   │  • Indian Kanoon API          │
│  (prod) │    └──────────┘   │  • Google Gemini AI           │
└─────────┘                   │  • OpenRouter (LLM gateway)   │
                              │  • Groq Cloud AI              │
                              │  • Resend (Email / OTP)       │
                              │  • Google OAuth 2.0           │
                              └───────────────────────────────┘
```

---

## 2. Tech Stack

### Backend

| Layer | Technology | Version |
|---|---|---|
| Language | Python | >= 3.12 |
| Web Framework | FastAPI | >= 0.115 |
| ASGI Server | Uvicorn (standard) | >= 0.30 |
| ORM | SQLAlchemy (async) | >= 2.0 |
| Migrations | Alembic | >= 1.13 |
| Primary DB | SQLite (dev) / PostgreSQL 16 (prod) | — |
| Async DB Drivers | aiosqlite / asyncpg | — |
| Cache | Redis 7 | — |
| Validation | Pydantic v2 + pydantic-settings | >= 2.0 |
| Auth | python-jose (JWT) + passlib[bcrypt] | — |
| HTTP Client | httpx | >= 0.27 |
| AI — Primary | Google Gemini (google-genai) | >= 2.0 |
| AI — Chatbot | OpenRouter gateway (openai SDK) | >= 1.0 |
| AI — Fallback | Groq Cloud (openai SDK) | >= 1.0 |
| AI — NLP | InLegalBERT (sentence-transformers) | local |
| Email | Resend | >= 2.0 |
| OAuth | google-auth | >= 2.0 |
| Logging | structlog | >= 24.0 |
| Linting | Ruff | >= 0.5 |
| Testing | pytest + pytest-asyncio | — |

### Frontend

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | ~6.0 |
| Framework | React | ^19 |
| Build Tool | Vite | ^8 |
| Styling | TailwindCSS v4 + Vanilla CSS | ^4.3 |
| Routing | React Router v7 | ^7 |
| Server State | TanStack Query v5 | ^5 |
| Global State | Zustand | ^5 |
| Forms | React Hook Form + Zod | — |
| HTTP Client | Axios | ^1.19 |
| Charts | Recharts | ^3 |
| Animation | Motion (Framer Motion fork) | ^12 |
| Icons | Lucide React | ^1.28 |
| PDF Rendering | pdfjs-dist | ^4.10 |
| Markdown | react-markdown + remark-gfm | — |
| Notifications | Sonner | ^2 |
| i18n | i18next + react-i18next | ^26 |
| OAuth | @react-oauth/google | ^0.13 |
| Linting | OXLint | ^1.75 |

---

## 3. Project Root Structure

```
Suits/
├── backend/                  # FastAPI Python backend
├── frontend/                 # React/Vite/TypeScript frontend
├── docker-compose.yml        # PostgreSQL 16 + Redis 7 containers
├── start-all.ps1             # PowerShell script to start all services
├── Loading.css               # Global loading animation CSS
├── .gitignore
└── LICENSE
```

---

## 4. Infrastructure & DevOps

### `docker-compose.yml`

Defines two containerized services:

| Service | Image | Port | Purpose |
|---|---|---|---|
| `suits_redis` | `redis:7-alpine` | `6379` | Session caching, rate limiting, AI response caching |
| `suits_postgres` | `postgres:16-alpine` | `5432` | Production-grade relational database |

- PostgreSQL persists data via a named volume `postgres_data`
- Both services have health checks configured
- The backend supports both SQLite (zero-config dev) and PostgreSQL (production) via `DATABASE_URL`

### `start-all.ps1`

PowerShell convenience script that launches:
1. Docker Compose (Redis + Postgres)
2. Uvicorn backend dev server
3. Vite frontend dev server

---

## 5. Backend Architecture

The backend follows a clean, layered architecture:

```
Request → Middleware → Router → Dependency Injection → Service → Repository → Database
                                                      ↘ AI Client → External API
```

### 5.1 Entry Point & Lifecycle

**`app/main.py`**

- Creates the FastAPI application instance
- Registers all routers under `/api` prefix
- Configures middleware stack (CORS → Rate Limiting → Logging)
- Global exception handlers for `SuitsBaseException` and generic `Exception`
- **Lifespan context manager** handles:
  - `startup`: Calls `init_db()` to create/migrate tables; purges stale cached orders and zero-confidence AI analyses
  - `shutdown`: Closes `ecourts_client` HTTP pool and `cache_service` connections
- Exposes `/api/health` and `/api/health/prediction` endpoints
- Swagger UI and ReDoc only active in `development` environment

**Middleware execution order** (last-added runs first):
```
RateLimitMiddleware → RequestLoggingMiddleware → CORSMiddleware
```

---

### 5.2 Core Layer

**`app/core/`**

| File | Purpose |
|---|---|
| `config.py` | `Settings` class using `pydantic-settings`. Reads all configuration from `.env` file. Provides typed access to DB URL, Redis URL, JWT secrets, all API keys, AI model names, cache TTLs, rate limits, and CORS origins. |
| `security.py` | JWT token creation (access + refresh), password hashing/verification using bcrypt, token decoding utilities. |
| `exceptions.py` | `SuitsBaseException` base class and all domain-specific exceptions (`NotFoundError`, `AuthenticationError`, `AuthorizationError`, `ConflictError`, `ValidationError`, etc.) each with HTTP status codes and typed error codes. |

---

### 5.3 Database Layer

**`app/database/`**

| File | Purpose |
|---|---|
| `base.py` | Declares `Base = declarative_base()` — the SQLAlchemy ORM base class imported by all models. |
| `session.py` | Creates the async engine (SQLite with `StaticPool` + WAL mode for dev; PostgreSQL with `NullPool` + connection pool for prod). Provides `async_session_factory` and `get_db()` dependency. Also runs `init_db()` which calls `Base.metadata.create_all` and applies lightweight SQLite ALTER TABLE column migrations on startup. |

**SQLite WAL Configuration:**
```
PRAGMA journal_mode=WAL      → concurrent readers + one writer
PRAGMA busy_timeout=30000    → retry writes for 30 seconds
PRAGMA foreign_keys=ON       → enforce FK constraints
```

---

### 5.4 Models (ORM)

**`app/models/`** — SQLAlchemy async ORM table definitions

| Model File | Table | Purpose |
|---|---|---|
| `user.py` | `users` | User accounts: email, hashed password, name, role, auth provider (`local`/`google`), Google ID, avatar URL, verification status, timestamps |
| `email_verification.py` | `email_verifications` | OTP records for email verification: user FK, OTP code, expiry timestamp, used flag |
| `conversation.py` | `conversations` | AI chat conversations: user FK, title, timestamps |
| `message.py` | `messages` | Chat messages: conversation FK, role (`user`/`assistant`), content, timestamps |
| `bookmark.py` | `bookmarks` | Bookmarked cases: user FK, CNR number, case title, court, date, timestamps |
| `search_history.py` | `search_history` | Search query logs: user FK, query text, result count, timestamps |
| `case_view_history.py` | `case_view_history` | Case view tracking: user FK, CNR number, case title, court, date, view count |
| `cached_case.py` | `cached_cases` | Full case JSON from eCourts API cached by CNR + optional query hash |
| `cached_order.py` | `cached_orders` | Order markdown summaries cached by CNR + order index |
| `cached_ai_analysis.py` | `cached_ai_analysis` | Full AI JSON analysis cached by CNR (headnotes, summary, prediction data, etc.) |
| `cached_era_analysis.py` | `cached_era_analysis` | Criminal era transition analysis cached by CNR |
| `cached_headnote.py` | `cached_headnotes` | Legal headnotes cached by Kanoon document ID |
| `document_chunk.py` | `document_chunks` | Vector store chunks: user document FK, chunk text, embedding vector (JSON), chunk index |
| `user_document.py` | `user_documents` | User-uploaded documents: user FK, filename, file content (BLOB), MIME type, page count, content hash, AI analysis JSON, notes, highlights JSON, tags JSON |
| `saved_file.py` | `saved_files` | Kanoon PDFs saved by users: user FK, Kanoon doc ID, title, file bytes, MIME, size |
| `refresh_log.py` | `refresh_logs` | JWT refresh token log: user FK, token hash, expiry |
| `api_usage_log.py` | `api_usage_logs` | API call tracking for analytics: user FK, endpoint, method, status code, timestamps |
| `__init__.py` | — | Imports all model classes so SQLAlchemy registers them with `Base.metadata` |

---

### 5.5 Repositories

**`app/repositories/`** — Data access layer, abstracts DB queries

| Repository | Purpose |
|---|---|
| `user_repository.py` | Create, fetch by email/ID, update users |
| `conversation_repository.py` | CRUD for conversations and messages; fetch with pagination |
| `bookmark_repository.py` | Add/remove/list bookmarks per user; check if a CNR is bookmarked |
| `cache_repository.py` | Unified read/write for all `cached_*` tables (cases, orders, AI analysis, era analysis, headnotes) |
| `document_repository.py` | CRUD for user documents and their vector chunks; chunk search by embedding similarity |
| `saved_file_repository.py` | Save/retrieve/delete Kanoon PDF files per user |

---

### 5.6 Schemas (Pydantic)

**`app/schemas/`** — Request/response validation and serialization

| Schema File | Covers |
|---|---|
| `auth.py` | `RegisterRequest`, `LoginRequest`, `TokenResponse`, `GoogleAuthRequest` |
| `user.py` | `UserResponse`, `UserUpdateRequest` |
| `case.py` | `CaseListItem`, `CaseDetailResponse`, `CaseSearchResult`, court/party/judge sub-schemas |
| `search.py` | `SearchRequest`, `SearchResponse`, `SearchResultItem`, filter schemas |
| `chat.py` | `MessageRequest`, `MessageResponse`, `ConversationResponse` |
| `document.py` | `DocumentUploadResponse`, `DocumentListItem`, `ChunkResponse`, annotation schemas |
| `order.py` | `OrderSummaryResponse`, order metadata sub-schemas |
| `citation.py` | `CitationNode`, `CitationEdge`, `CitationGraphResponse`, citation metadata |
| `headnote.py` | `HeadnoteResponse`, `LegalPrinciple`, `KeyFact` sub-schemas |
| `prediction.py` | `PredictionRequest`, `PredictionResponse`, outcome probability schemas |
| `era_transition.py` | `EraTransitionResponse`, criminal law era comparison schemas |
| `similar_case.py` | `SimilarCaseItem`, `SimilarCasesResponse` |
| `judge_analytics.py` | `JudgeDossierResponse`, bench statistics sub-schemas |
| `analytics.py` | `UserAnalyticsResponse`, activity summary schemas |
| `bookmark.py` | `BookmarkRequest`, `BookmarkResponse` |
| `history.py` | `SearchHistoryItem`, `CaseViewHistoryItem` |
| `saved_file.py` | `SavedFileResponse`, `SaveFileRequest` |
| `common.py` | Shared `PaginatedResponse`, `SuccessResponse` generics |

---

### 5.7 API Routes

**`app/api/`** — FastAPI router modules, all mounted under `/api`

| Router | Prefix | Key Endpoints |
|---|---|---|
| `auth.py` | `/api/auth` | `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `POST /verify-otp`, `POST /resend-otp`, `POST /google`, `GET /me`, `PATCH /me`, `DELETE /me` |
| `search.py` | `/api/search` | `GET /search` (eCourts full-text search with filters), `GET /search/history`, `DELETE /search/history/{id}` |
| `cases.py` | `/api/cases` | `GET /cases/{cnr}` (full case detail), `GET /cases/{cnr}/similar`, `GET /cases/{cnr}/prediction`, `GET /cases/{cnr}/headnotes`, `GET /cases/{cnr}/era-transition`, `GET /cases/{cnr}/judge-analytics`, `GET /cases/{cnr}/citations` |
| `orders.py` | `/api/orders` | `GET /orders/{cnr}` (list orders), `GET /orders/{cnr}/{index}` (single order markdown summary) |
| `chat.py` | `/api/chat` | `GET /chat/conversations`, `POST /chat/conversations`, `GET /chat/conversations/{id}`, `DELETE /chat/conversations/{id}`, `POST /chat/conversations/{id}/messages` (streaming SSE) |
| `bookmarks.py` | `/api/bookmarks` | `GET /bookmarks`, `POST /bookmarks`, `DELETE /bookmarks/{cnr}`, `GET /bookmarks/{cnr}/status` |
| `history.py` | `/api/history` | `GET /history/searches`, `GET /history/cases`, `DELETE /history/searches/{id}`, `DELETE /history/cases/{id}` |
| `analytics.py` | `/api/analytics` | `GET /analytics/me` (user activity stats), `GET /analytics/research` |
| `files.py` | `/api/files` | `GET /files`, `POST /files/save` (save Kanoon PDF), `GET /files/{id}`, `DELETE /files/{id}`, `GET /files/{id}/download` |
| `documents.py` | `/api/documents` | `GET /documents`, `POST /documents/upload` (multipart PDF), `GET /documents/{id}`, `DELETE /documents/{id}`, `POST /documents/{id}/analyze`, `PATCH /documents/{id}` (notes/highlights/tags), `POST /documents/search` (semantic RAG search) |
| `statutes.py` | `/api/statutes` | `GET /statutes/concordance` (criminal law IPC to BNS mapping), `GET /statutes/search` |

---

### 5.8 Services

**`app/services/`** — Business logic layer

| Service | Size | Purpose |
|---|---|---|
| `auth_service.py` | 12 KB | User registration with OTP email, login (local + Google OAuth token verification), JWT access/refresh token issuance, profile update, account deletion |
| `cache_service.py` | 4.5 KB | Redis wrapper: `get`/`set`/`delete`/`invalidate` with TTL management; handles serialization of complex objects; gracefully degrades if Redis is unavailable |
| `case_service.py` | 32 KB | Orchestrates full case retrieval: calls `ecourts_client` → stores in `cached_cases` → enriches with orders, AI analysis; handles CNR normalization, court code mapping, party/judge extraction |
| `search_service.py` | 22 KB | Full-text + filtered case search via eCourts API; stores query in `search_history`; result normalization and deduplication |
| `order_service.py` | 20 KB | Fetches court order PDFs from eCourts → sends to Gemini for OCR/summarization → caches markdown result in `cached_orders` |
| `ai_service.py` | 15 KB | Orchestrates the full AI analysis pipeline for a case: extracts structured JSON (parties, timeline, statutes, key facts, risk score) using Gemini; caches in `cached_ai_analysis` |
| `headnote_service.py` | 18 KB | Fetches the Kanoon judgment document → extracts legal headnotes (principles, ratio decidendi, obiter dicta, key facts) using Gemini → caches in `cached_headnotes` |
| `similar_cases_service.py` | 25 KB | Two-step RAG pipeline: (1) generates semantic embedding with InLegalBERT for the query case, (2) searches Kanoon for similar cases, (3) re-ranks with cosine similarity, returns top-N with relevance scores |
| `prediction_service.py` | 18 KB | **Judicial Outcome Prediction Engine**: collects case facts + precedents → sends structured prompt to Gemini Pro (with extended thinking budget) → returns probability distribution over outcomes (petitioner wins / respondent wins / partial / settled) with top influencing factors |
| `citation_service.py` | 26 KB | Builds citation graph: extracts cited cases from Kanoon judgment text → resolves each cited case → returns nodes + edges for D3/Canvas visualization |
| `era_transition_service.py` | 24 KB | **Criminal Era Analysis**: compares charges under old IPC/CrPC vs. new BNS/BNSS using the `criminal_statutes_concordance` data; generates structured comparison with AI commentary |
| `judge_analytics_service.py` | 43 KB | **Judge Dossier**: aggregates all Kanoon judgments by a given judge → computes verdict statistics, disposal times, subject-matter distribution, citation authority score, and temporal trends |
| `analytics_service.py` | 40 KB | User activity analytics: search patterns, case view heatmaps, most-used features, research time distribution |
| `embedding_service.py` | 4.2 KB | Wraps InLegalBERT sentence embeddings; whitened projection for improved cosine similarity |
| `inlegalbert_service.py` | 8.3 KB | Loads InLegalBERT model locally; provides `encode()` method; supports `whitened` or `finetuned` scoring modes; auto-selects CUDA/CPU device |
| `vector_store.py` | 6.2 KB | SQLite-backed vector store for user documents: stores chunks + embeddings in `document_chunks` table, performs cosine similarity search in Python |
| `document_processor.py` | 23 KB | PDF document processing pipeline: extracts text by page, chunks text, generates embeddings per chunk, stores in vector store; also runs AI analysis of uploaded documents |
| `ecourts_service.py` | 2.6 KB | Thin wrapper around `ecourts_client` for higher-level case/search operations |
| `email_service.py` | 5.2 KB | Sends OTP verification emails via Resend API; generates 6-digit OTP; stores hash in `email_verifications` |
| `bookmark_service.py` | 1.4 KB | Bookmark CRUD delegating to `bookmark_repository` |
| `history_service.py` | 6.7 KB | Manages search and case-view history with upsert logic (increments view count on re-visit) |
| `saved_file_service.py` | 3.4 KB | Saves and retrieves Kanoon PDF files in `saved_files` table |

---

### 5.9 AI Clients

**`app/clients/`** — Thin wrappers around external AI APIs

| Client | Size | Purpose |
|---|---|---|
| `gemini_client.py` | 22 KB | **Primary AI client**. Wraps `google-genai` SDK. Used for: case OCR, order PDF summarization, headnote extraction, case AI analysis, Kanoon text extraction. Supports streaming and non-streaming. Has retry logic with exponential backoff. Falls back gracefully on quota exhaustion. |
| `openrouter_client.py` | 22 KB | **Chatbot AI client**. Uses OpenAI-compatible API via OpenRouter gateway. Supports streaming via SSE. Used exclusively for the interactive legal chatbot (`/api/chat`). Injects legal context (case facts, statutes) into system prompt. |
| `groq_client.py` | 6.7 KB | **Fallback AI client**. Fires when Gemini credits are depleted. Same OpenAI-compatible interface. Model: `openai/gpt-oss-120b`. |
| `prediction_gemini_client.py` | 9.4 KB | **Prediction-specific Gemini client**. Uses an extended thinking budget (`prediction_thinking_budget=24576` tokens). Dedicated to the Judicial Outcome Prediction Engine. Uses `prediction_gemini_model` (default: `gemini-3.6-flash`). |
| `kanoon_client.py` | 11 KB | **Indian Kanoon API client**. Searches full-text judgment database, fetches judgment HTML/PDF, extracts metadata (judges, parties, citations). Used by headnote, similar cases, citation, and judge analytics services. |
| `ecourts_client.py` | 9 KB | **eCourts Partner API client**. Fetches live case status, party details, order documents, cause lists from the official Government of India eCourts webapi. Uses `ECOURTS_API_KEY`. |

---

### 5.10 Middleware

**`app/middleware/`**

| Middleware | Purpose |
|---|---|
| `logging.py` | `RequestLoggingMiddleware` — logs every request with method, path, status code, and processing time using structlog |
| `rate_limit.py` | `RateLimitMiddleware` — IP-based rate limiting using Redis sliding window; default 300 req/min (configurable via `RATE_LIMIT_PER_MINUTE`); returns `429 Too Many Requests` on breach |

---

### 5.11 Dependencies (FastAPI DI)

**`app/dependencies/auth.py`**

- `get_current_user` — extracts and validates JWT Bearer token from `Authorization` header; raises `AuthenticationError` on invalid/expired tokens; returns `User` ORM object
- Used by all protected routes via `Depends(get_current_user)`

---

### 5.12 Prompts

**`app/prompts/`** — AI prompt templates

| File | Purpose |
|---|---|
| `system.py` | System-level prompts: legal chatbot persona, context injection templates for case-aware conversations |
| `templates.py` | Task-specific prompt templates: case analysis extraction, headnote generation, order summarization, era transition analysis, prediction reasoning |
| `kanoon_extractor.py` | Prompts specifically for extracting structured data from Kanoon judgment HTML |

---

### 5.13 Utils

**`app/utils/`**

| File | Purpose |
|---|---|
| `kanoon_formatter.py` | Transforms raw Kanoon API HTML responses into clean markdown; strips noise, normalizes citations, extracts bench composition |

---

### 5.14 Data

**`app/data/`**

| File | Purpose |
|---|---|
| `criminal_statutes_concordance.py` | A large (54 KB) hardcoded concordance table mapping every IPC section to equivalent BNS section and every CrPC section to BNSS section. Used by `era_transition_service.py` for the Criminal Era Analysis feature. |

---

### 5.15 Scripts & Test Files

**`backend/scripts/`** — Developer diagnostic scripts

| Script | Purpose |
|---|---|
| `compute_whitening.py` | Computes the whitening transformation matrix for InLegalBERT embeddings |
| `diagnose_gemini.py` | Tests Gemini API connectivity and quota status |
| `probe_models.py` | Probes available OpenRouter/Groq models |
| `test_*.py` | Various integration tests for individual API endpoints and services |

**Root-level test files** (one-off integration probes):
- `test_kanoon.py`, `test_kanoon_pdf.py`, `test_kanoon_pipeline.py`
- `test_ecourts.py`
- `test_similar_cases_rag.py`
- `test_chatbot_kanoon.py`
- `test_citation_graph.py`
- `test_api_debug.py`

**Root-level utility scripts:**
- `check_cache.py` — Inspects cache table contents
- `clear_bad_cache.py` — Removes low-quality cached AI analyses
- `clear_ecourts_cache.py` — Purges eCourts case cache
- `clear_old_cases.py` — Removes stale case records
- `clear_and_init_kanoon.py` — Resets and re-initializes Kanoon cache
- `migrate_kanoon_filenames.py` — Migrates saved file naming convention
- `reset_db.py` — Drops and recreates all tables

---

## 6. Frontend Architecture

The frontend follows a feature-based architecture with clear separation between UI, data fetching, and global state.

### 6.1 Entry Point & Build

| File | Purpose |
|---|---|
| `index.html` | HTML shell; loads Vite entry point, sets favicon, title |
| `src/main.tsx` | React root: wraps app in `QueryClientProvider` (TanStack Query), `GoogleOAuthProvider`, `BrowserRouter` |
| `src/App.tsx` | Top-level app component; renders `AppRouter` |
| `vite.config.ts` | Vite build config: React plugin, `@` alias to `src/`, port config |
| `tsconfig.app.json` | TypeScript config: strict mode, React JSX transform, path aliases |

---

### 6.2 Routing

**`src/routes/`**

| File | Purpose |
|---|---|
| `index.tsx` | Defines the entire router using `createBrowserRouter`. All pages are **lazy-loaded** with `React.lazy()` for code splitting. Wraps authenticated routes in `ProtectedRoute` + `AppLayout`. |
| `protected-route.tsx` | Reads `auth-store`; redirects unauthenticated users to `/login` |

**Route Map:**

```
/                     → LandingPage          (public)
/login                → LoginPage            (public)
/register             → RegisterPage         (public)
/verify-otp           → VerifyOtpPage        (public)
/dashboard            → DashboardPage        (protected)
/search               → SearchPage           (protected)
/case/:cnr            → CaseDashboardPage    (protected)
/chat                 → ChatPage             (protected)
/chat/:conversationId → ChatPage             (protected)
/bookmarks            → BookmarksPage        (protected)
/files                → FilesPage            (protected)
/research             → ResearchPage         (protected)
/history              → HistoryPage          (protected)
/analytics            → AnalyticsPage        (protected)
/profile              → ProfilePage          (protected)
/settings             → SettingsPage         (protected)
*                     → NotFoundPage         (public)
```

---

### 6.3 Pages

**`src/pages/`** — Full-page route components

| Page | Size | Purpose |
|---|---|---|
| `LandingPage.tsx` | 53 KB | Marketing landing page: hero section, feature highlights, demo animations, CTA |
| `LoginPage.tsx` | 8.8 KB | Email/password login form + Google OAuth button; calls `auth.ts` service |
| `RegisterPage.tsx` | 7.6 KB | Registration form with Zod validation; triggers OTP email |
| `VerifyOtpPage.tsx` | 11.9 KB | 6-digit OTP entry with countdown timer and resend functionality |
| `DashboardPage.tsx` | 6.7 KB | Post-login home: recent cases, quick search, activity summary |
| `SearchPage.tsx` | 6.8 KB | Advanced case search with filters (court, date range, case type, party name) |
| `CaseDashboardPage.tsx` | 24 KB | **Core feature page** — full case detail view with all AI analysis cards |
| `ChatPage.tsx` | 10.8 KB | AI legal chatbot with conversation sidebar, streaming message display |
| `BookmarksPage.tsx` | 5.1 KB | Bookmarked cases list with quick-open links |
| `FilesPage.tsx` | 23 KB | Saved Kanoon PDFs with in-browser PDF viewer and research panel |
| `ResearchPage.tsx` | 9.3 KB | Legal research workspace with era transition explorer |
| `HistoryPage.tsx` | 16 KB | Search history + case view history with filterable tables |
| `AnalyticsPage.tsx` | 5.4 KB | User analytics dashboard (charts, heatmaps, metrics) |
| `ProfilePage.tsx` | 9.6 KB | User profile editor: name, email, avatar, password change |
| `SettingsPage.tsx` | 5.8 KB | App settings: theme, language, notification preferences |
| `NotFoundPage.tsx` | 1.2 KB | 404 page with navigation back to dashboard |

---

### 6.4 Components

**`src/components/`** — Organized by feature domain

#### Layout (`components/layout/`)

| Component | Purpose |
|---|---|
| `AppLayout.tsx` | Root layout shell: renders `Sidebar` + `Topbar` + `<Outlet />` for nested routes |
| `Sidebar.tsx` | Left navigation sidebar with route links, collapse toggle, active state highlighting |
| `Topbar.tsx` | Top bar with page title, `TopSearchBar`, user avatar menu, theme toggle |
| `Navbar.tsx` | Public-facing navbar for landing/auth pages |
| `TopSearchBar.tsx` | Global search input in topbar that navigates to `/search` |

#### Case (`components/case/`)

| Component | Size | Purpose |
|---|---|---|
| `CaseHeader.tsx` | 5.7 KB | Case title, CNR number, court name, case type, status badge |
| `AISummaryCard.tsx` | 32 KB | **AI case analysis card**: parties, timeline, statutes invoked, key facts, risk score, extraction confidence |
| `CasePredictionCard.tsx` | 24 KB | **Judicial Outcome Prediction**: probability bars for each outcome, top influencing precedents, confidence level, thinking-mode indicator |
| `SimilarCasesCard.tsx` | 23 KB | RAG-retrieved similar cases with relevance scores and quick-open links |
| `CaseHeadnoteCard.tsx` | 17 KB | Kanoon-extracted legal headnotes: ratio decidendi, obiter dicta, key principles |
| `CriminalEraTransitionCard.tsx` | 21 KB | Old IPC/CrPC vs. new BNS/BNSS charge mapping with AI commentary |
| `OrderCard.tsx` | 3.8 KB | Individual court order summary card with date, type, and AI markdown |
| `JudgeCard.tsx` | 4.9 KB | Judge name with click-to-open dossier |
| `PartyCard.tsx` | 3.1 KB | Petitioner/respondent details |
| `StatisticsCard.tsx` | 1.0 KB | Case statistics summary widget |
| `Timeline.tsx` | 8.8 KB | Visual case timeline with key dates and events |
| `DocumentLiquidNavBar.tsx` | 3.1 KB | Sticky floating navigation for the case dashboard sections |
| `CustomPDFViewer.tsx` | 47 KB | **Full-featured PDF viewer** built on `pdfjs-dist`: page navigation, zoom, text layer, annotation support |
| `DocumentReaderModal.tsx` | 41 KB | **Modal-based document reader**: PDF viewer + AI summary panel side-by-side, highlights, notes, export |
| **Citation sub-components** (`citation/`) | | |
| `CitationGraphCanvas.tsx` | 22 KB | D3-style canvas renderer for citation network: force-directed graph with drag, zoom, hover |
| `CitationNetworkView.tsx` | 8.0 KB | Citation graph orchestrator: fetches data, manages layout, renders canvas + controls + inspector |
| `CitationGraphControls.tsx` | 2.9 KB | Zoom, reset, filter controls for citation graph |
| `CitationLegend.tsx` | 2.8 KB | Color legend for citation graph node types |
| `CitationNodeInspector.tsx` | 7.5 KB | Side panel showing details of a selected citation node |
| **Judge sub-components** (`judge/`) | | |
| `JudgeDossierSlideOver.tsx` | 37 KB | **Full judge analytics slide-over panel**: verdict stats, subject distribution, disposal time, citation authority, temporal trends — all with Recharts charts |
| **Reader sub-components** (`reader/`) | | |
| `ReaderResearchPanel.tsx` | 18 KB | Side panel in document reader: semantic RAG search over document chunks, AI Q&A |

#### Chat (`components/chat/`)

| Component | Purpose |
|---|---|
| `ChatPanel.tsx` | Main chat container: message list, input, streaming response display |
| `ChatInput.tsx` | Multi-line textarea with send button and dictation trigger |
| `MessageBubble.tsx` | Individual message: user/assistant styling, markdown rendering, citation chips |
| `CitationChip.tsx` | Inline citation tag that opens the referenced case |
| `ConversationSidebar.tsx` | List of past conversations with rename/delete |
| `SuggestedQuestions.tsx` | Contextual suggested follow-up questions |
| `GlobalVoiceDictation.tsx` | Global voice input overlay triggered from chat or search |
| `LegalWaveformVisualizer.tsx` | Audio waveform animation during voice dictation |
| `SiriLegalVisualizer.tsx` | Siri-style circular pulse animation during AI speech recognition |
| `SiriWaveOrb.tsx` | Animated orb component for voice state feedback |

#### Analytics (`components/analytics/`)

| Component | Size | Purpose |
|---|---|---|
| `AnalyticsChart.tsx` | 11 KB | Multi-series line/bar charts for user research activity |
| `CourtDistributionCard.tsx` | 30 KB | Pie/donut chart of cases by court level |
| `ResearchHeatmap.tsx` | 13 KB | Calendar heatmap of daily research activity |
| `TopCitedActsCard.tsx` | 17 KB | Bar chart of most-referenced statutes in user's researched cases |

#### Search (`components/search/`)

| Component | Purpose |
|---|---|
| `SearchBar.tsx` | Styled search input with autocomplete suggestions |
| `SearchFilters.tsx` | Advanced filter panel: court, state, date range, case type, disposal status |
| `SearchResultCard.tsx` | Individual case result card with key metadata |
| `SearchResultTable.tsx` | Table view for search results with sortable columns |

#### Research (`components/research/`)

| Component | Purpose |
|---|---|
| `EraTransitionExplorer.tsx` | Standalone criminal statute era explorer: enter IPC/CrPC section → see BNS/BNSS equivalent with commentary |
| `ResearchBriefModal.tsx` | Research brief export modal: formats selected case facts/notes into a structured brief |

#### Common (`components/common/`)

| Component | Purpose |
|---|---|
| `CommandPalette.tsx` | Global `Cmd+K` command palette for quick navigation to any page or action |
| `MetricCard.tsx` | Reusable KPI metric display card with icon, value, trend |
| `SkeletonLoader.tsx` | Animated skeleton placeholder for loading states |
| `EmptyState.tsx` | Illustrated empty state component with CTA |
| `ErrorState.tsx` | Error display component with retry option |
| `StatusBadge.tsx` | Colored badge for case status, order type, etc. |
| `SuitsLoader.tsx` | Branded animated SUITS logo loader |

---

### 6.5 Services (API Layer)

**`src/services/`** — Axios-based API call functions, consumed by TanStack Query hooks

| Service File | Backend Endpoints |
|---|---|
| `auth.ts` | `/api/auth/*` — login, register, verify OTP, refresh, me, Google OAuth |
| `cases.ts` | `/api/cases/*` — case detail, similar cases |
| `search.ts` | `/api/search` — full-text search with filters |
| `chat.ts` | `/api/chat/*` — conversations CRUD, streaming messages |
| `document.ts` | `/api/documents/*` — upload, analyze, annotate, semantic search |
| `prediction.ts` | `/api/cases/{cnr}/prediction` |
| `headnote.ts` | `/api/cases/{cnr}/headnotes` |
| `eraTransition.ts` | `/api/cases/{cnr}/era-transition` |
| `citations.ts` | `/api/cases/{cnr}/citations` |
| `judgeAnalytics.ts` | `/api/cases/{cnr}/judge-analytics` |
| `bookmarks.ts` | `/api/bookmarks/*` |
| `history.ts` | `/api/history/*` |
| `analytics.ts` | `/api/analytics/*` |
| `files.ts` | `/api/files/*` |

---

### 6.6 State Management (Zustand Stores)

**`src/store/`** — Lightweight global state with Zustand

| Store | State | Purpose |
|---|---|---|
| `auth-store.ts` | `user`, `accessToken`, `isAuthenticated`, `setUser`, `logout` | Authentication state; persisted to `localStorage` |
| `theme-store.ts` | `theme` (`light`/`dark`), `setTheme` | Theme preference; syncs with `document.documentElement` class |
| `sidebar-store.ts` | `isCollapsed`, `toggle` | Sidebar collapse state |
| `dictation-store.ts` | `isListening`, `transcript`, `startDictation`, `stopDictation` | Global voice dictation state; shared between `GlobalVoiceDictation` and `ChatInput` |

---

### 6.7 Custom Hooks

**`src/hooks/`**

| Hook | Size | Purpose |
|---|---|---|
| `useLegalSpeechRecognition.ts` | 9.8 KB | Wraps the Web Speech API (`SpeechRecognition`) with legal vocabulary hints, interim transcript streaming, auto-stop on silence, error recovery. Types defined in `src/types/speech.d.ts`. |

---

### 6.8 Types

**`src/types/`** — TypeScript type definitions

| File | Types Defined |
|---|---|
| `auth.ts` | `User`, `AuthState`, `LoginCredentials`, `RegisterData` |
| `case.ts` | `CaseDetail`, `Party`, `Order`, `CaseStatus`, `CourtLevel`, etc. |
| `citation.ts` | `CitationNode`, `CitationEdge`, `CitationGraph` |
| `chat.ts` | `Conversation`, `Message`, `ChatRole` |
| `document.ts` | `UserDocument`, `DocumentChunk`, `Annotation` |
| `analytics.ts` | `UserAnalytics`, `ActivityRecord`, `ResearchMetrics` |
| `search.ts` | `SearchFilters`, `SearchResult` |
| `headnote.ts` | `Headnote`, `LegalPrinciple` |
| `prediction.ts` | `PredictionResult`, `OutcomeProbability`, `InfluencingFactor` |
| `era_transition.ts` | `EraTransitionResult`, `StatuteMapping` |
| `judge.ts` | `JudgeDossier`, `VerdictStats`, `BenchStats` |
| `similar-case.ts` | `SimilarCase`, `SimilarityScore` |
| `file.ts` | `SavedFile` |
| `common.ts` | `PaginatedResponse<T>`, `ApiResponse<T>` |
| `speech.d.ts` | Web Speech API ambient type declarations |

---

### 6.9 Lib / Utilities

**`src/lib/`**

| File/Dir | Purpose |
|---|---|
| `axios.ts` | Configured Axios instance: base URL from `VITE_API_URL`, request interceptor to inject `Authorization: Bearer <token>` from `auth-store`, response interceptor to handle 401 → auto-logout |
| `error.ts` | Error parsing utilities: extracts user-friendly message from API error responses |
| `dictation/` | Helper modules for the voice dictation system |

---

## 7. External Integrations

| Integration | Type | Used For | Auth Method |
|---|---|---|---|
| **eCourts India Partner API** | REST | Live case status, orders, cause lists, court hierarchy | `ECOURTS_API_KEY` header |
| **Indian Kanoon** | REST | Full judgment text, citations, judge history, headnote source | `KANOON_API_TOKEN` bearer |
| **Google Gemini** | gRPC/REST | Case AI analysis, order OCR/summary, headnote extraction, Kanoon text extraction | `GEMINI_API_KEY` |
| **OpenRouter** | REST (OpenAI-compatible) | Interactive legal AI chatbot (streaming SSE) | `OPENROUTER_API_KEY` |
| **Groq Cloud** | REST (OpenAI-compatible) | Gemini fallback for analysis tasks | `GROQ_API_KEY` |
| **Google OAuth 2.0** | OAuth | Social login ("Sign in with Google") | `GOOGLE_CLIENT_ID` |
| **Resend** | REST | OTP email delivery for account verification | `RESEND_API_KEY` |
| **InLegalBERT** | Local PyTorch | Legal semantic embeddings for similar-case RAG | Local model weights |

---

## 8. Authentication Flow

```
Register Flow:
  Client → POST /auth/register
         → Hash password
         → Create user (is_verified=False)
         → Generate OTP
         → Send email via Resend
         ← { message: "OTP sent" }

Verify OTP:
  Client → POST /auth/verify-otp
         → Validate OTP expiry
         → Set is_verified=True
         → Issue access + refresh tokens
         ← { access_token, refresh_token, user }

Refresh:
  Client → POST /auth/refresh
         → Validate refresh JWT
         → Issue new access token
         ← { access_token }

Google OAuth:
  Client → Google OAuth popup → ID token
         → POST /auth/google { id_token }
         → Verify with google-auth library
         → Create/update user (auth_provider='google')
         → Issue SUITS JWT pair
         ← { access_token, refresh_token, user }

All Protected Routes:
  Client → HTTP Request + Authorization: Bearer <access_token>
         → Depends(get_current_user) → decode JWT → fetch User
         → Route Handler
```

---

## 9. AI Pipeline

### Case Analysis Pipeline

```
CNR Number
    │
    ▼
ecourts_client.get_case(cnr)
    │
    ▼
case_service → cache check (cached_cases)
    │
    ├──▶ gemini_client.analyze_case() → cached_ai_analysis
    │        Extracts: parties, timeline, statutes, key facts, risk_score
    │
    ├──▶ order_service → ecourts_client.get_order_pdf()
    │        → gemini_client.summarize_order() → cached_orders
    │
    ├──▶ headnote_service → kanoon_client.search_judgment()
    │        → gemini_client.extract_headnotes() → cached_headnotes
    │
    ├──▶ similar_cases_service
    │        → inlegalbert_service.encode(case_text)
    │        → kanoon_client.search_similar()
    │        → cosine_similarity ranking
    │
    ├──▶ prediction_service
    │        → prediction_gemini_client.predict() (high thinking budget)
    │        → { petitioner_wins: 0.6, respondent_wins: 0.3, ... }
    │
    ├──▶ citation_service → kanoon_client.get_citations()
    │        → CitationGraph { nodes, edges }
    │
    ├──▶ era_transition_service
    │        → criminal_statutes_concordance lookup
    │        → gemini_client.analyze_era() → EraTransitionResult
    │
    └──▶ judge_analytics_service → kanoon_client.get_judge_judgments()
             → statistics aggregation → JudgeDossier
```

### Chat AI Pipeline

```
User Message
    │
    ▼
chat_service
    │
    ├── Fetch conversation history (last N messages)
    ├── Build system prompt (legal chatbot persona + case context)
    │
    ▼
openrouter_client.stream_chat()    ← primary
    │
    │ (on failure / quota exhausted)
    ▼
groq_client.stream_chat()          ← fallback
    │
    ▼
SSE stream to frontend
    │
    ▼
MessageBubble (renders streaming markdown)
```

### Document RAG Pipeline

```
PDF Upload
    │
    ▼
document_processor.process()
    ├── Extract text by page
    ├── Chunk text (sliding window)
    ├── inlegalbert_service.encode(chunk) per chunk
    └── Store chunks + embeddings → document_chunks table

Semantic Search Query
    │
    ▼
vector_store.search()
    ├── inlegalbert_service.encode(query)
    ├── Cosine similarity vs all chunks
    └── Return top-K chunks → ReaderResearchPanel
```

---

## 10. Data Flow Diagrams

### Request Lifecycle

```
Browser
  │ HTTP Request + Bearer Token
  ▼
CORSMiddleware
  │
  ▼
RateLimitMiddleware → Redis (sliding window check)
  │                    └── 429 if exceeded
  ▼
RequestLoggingMiddleware (log start)
  │
  ▼
FastAPI Router (path match)
  │
  ▼
Depends(get_current_user) → decode JWT → fetch User from DB
  │
  ▼
Route Handler
  │
  ├──▶ Service Layer (business logic)
  │        ├──▶ Repository (DB queries via SQLAlchemy async)
  │        │        └──▶ SQLite / PostgreSQL
  │        ├──▶ Cache Service (Redis get/set)
  │        └──▶ AI Client / External API
  │
  ▼
Pydantic Schema serialization
  │
  ▼
JSON Response → RequestLoggingMiddleware (log end)
  │
  ▼
Browser
```

---

## 11. Environment Variables

### Backend (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./suits.db` | Database connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection string |
| `JWT_SECRET` | `change-me` | JWT access token signing secret |
| `JWT_REFRESH_SECRET` | `change-me-refresh` | JWT refresh token signing secret |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token TTL |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL |
| `KANOON_API_TOKEN` | — | Indian Kanoon API bearer token |
| `ECOURTS_API_KEY` | — | eCourts Partner API key |
| `GEMINI_API_KEY` | — | Google Gemini AI API key |
| `GEMINI_MODEL` | `gemini-3.6-flash` | Gemini model for analysis tasks |
| `PREDICTION_GEMINI_MODEL` | `gemini-3.6-flash` | Gemini model for prediction |
| `OPENROUTER_API_KEY` | — | OpenRouter gateway key (chatbot) |
| `OPENROUTER_MODEL` | `openrouter/free` | OpenRouter model slug |
| `OPENROUTER_MAX_TOKENS` | `2048` | Max tokens for chat responses |
| `GROQ_API_KEY` | — | Groq Cloud API key (fallback) |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Groq model slug |
| `GOOGLE_CLIENT_ID` | — | Google OAuth 2.0 client ID |
| `RESEND_API_KEY` | — | Resend email service API key |
| `EMAIL_FROM` | `Suits Legal <onboarding@resend.dev>` | From address for OTP emails |
| `ENVIRONMENT` | `development` | `development` or `production` |
| `LOG_LEVEL` | `INFO` | Structlog log level |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |
| `RATE_LIMIT_PER_MINUTE` | `300` | Rate limit threshold per IP |

### Frontend (`.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL (e.g., `http://localhost:8000`) |

---

## 12. Complete File Tree

```
Suits/
├── .gitignore
├── LICENSE
├── Loading.css
├── ARCHITECTURE.md               # This document
├── docker-compose.yml            # Redis 7 + PostgreSQL 16 containers
├── start-all.ps1                 # Dev launcher (Docker + Backend + Frontend)
│
├── backend/
│   ├── .env                      # Local environment variables
│   ├── .env.example              # Environment template
│   ├── pyproject.toml            # Python project metadata & dependencies
│   ├── suits.db                  # SQLite database file (dev)
│   ├── suits.db-shm              # SQLite WAL shared memory
│   ├── suits.db-wal              # SQLite WAL file
│   │
│   ├── app/
│   │   ├── main.py               # FastAPI app, middleware, routers, lifespan
│   │   │
│   │   ├── api/                  # Route handlers
│   │   │   ├── auth.py           # /api/auth/*
│   │   │   ├── search.py         # /api/search
│   │   │   ├── cases.py          # /api/cases/*
│   │   │   ├── orders.py         # /api/orders/*
│   │   │   ├── chat.py           # /api/chat/* (SSE streaming)
│   │   │   ├── bookmarks.py      # /api/bookmarks/*
│   │   │   ├── history.py        # /api/history/*
│   │   │   ├── analytics.py      # /api/analytics/*
│   │   │   ├── files.py          # /api/files/*
│   │   │   ├── documents.py      # /api/documents/*
│   │   │   └── statutes.py       # /api/statutes/*
│   │   │
│   │   ├── clients/              # External API clients
│   │   │   ├── ecourts_client.py           # eCourts India live API
│   │   │   ├── gemini_client.py            # Google Gemini (analysis + OCR)
│   │   │   ├── openrouter_client.py        # OpenRouter (chatbot LLM)
│   │   │   ├── groq_client.py              # Groq Cloud (fallback LLM)
│   │   │   ├── kanoon_client.py            # Indian Kanoon judgments
│   │   │   └── prediction_gemini_client.py # Gemini (prediction engine)
│   │   │
│   │   ├── core/                 # Cross-cutting concerns
│   │   │   ├── config.py         # Pydantic settings (all env vars)
│   │   │   ├── security.py       # JWT + bcrypt
│   │   │   └── exceptions.py     # Domain exception hierarchy
│   │   │
│   │   ├── database/             # DB engine and session
│   │   │   ├── base.py           # SQLAlchemy declarative base
│   │   │   └── session.py        # Engine, session factory, init_db()
│   │   │
│   │   ├── models/               # SQLAlchemy ORM models
│   │   │   ├── __init__.py       # Imports all models for registration
│   │   │   ├── user.py
│   │   │   ├── email_verification.py
│   │   │   ├── conversation.py
│   │   │   ├── message.py
│   │   │   ├── bookmark.py
│   │   │   ├── search_history.py
│   │   │   ├── case_view_history.py
│   │   │   ├── cached_case.py
│   │   │   ├── cached_order.py
│   │   │   ├── cached_ai_analysis.py
│   │   │   ├── cached_era_analysis.py
│   │   │   ├── cached_headnote.py
│   │   │   ├── document_chunk.py
│   │   │   ├── user_document.py
│   │   │   ├── saved_file.py
│   │   │   ├── refresh_log.py
│   │   │   └── api_usage_log.py
│   │   │
│   │   ├── repositories/         # Data access layer
│   │   │   ├── user_repository.py
│   │   │   ├── conversation_repository.py
│   │   │   ├── bookmark_repository.py
│   │   │   ├── cache_repository.py
│   │   │   ├── document_repository.py
│   │   │   └── saved_file_repository.py
│   │   │
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── case.py
│   │   │   ├── search.py
│   │   │   ├── chat.py
│   │   │   ├── document.py
│   │   │   ├── order.py
│   │   │   ├── citation.py
│   │   │   ├── headnote.py
│   │   │   ├── prediction.py
│   │   │   ├── era_transition.py
│   │   │   ├── similar_case.py
│   │   │   ├── judge_analytics.py
│   │   │   ├── analytics.py
│   │   │   ├── bookmark.py
│   │   │   ├── history.py
│   │   │   ├── saved_file.py
│   │   │   └── common.py
│   │   │
│   │   ├── services/             # Business logic
│   │   │   ├── ai_service.py               # Case AI analysis orchestrator
│   │   │   ├── analytics_service.py        # User activity analytics
│   │   │   ├── auth_service.py             # Auth, OTP, Google OAuth
│   │   │   ├── bookmark_service.py         # Bookmark CRUD
│   │   │   ├── cache_service.py            # Redis wrapper
│   │   │   ├── case_service.py             # Case retrieval + enrichment
│   │   │   ├── citation_service.py         # Citation graph builder
│   │   │   ├── document_processor.py       # PDF to chunks to embeddings
│   │   │   ├── ecourts_service.py          # eCourts thin wrapper
│   │   │   ├── email_service.py            # OTP email (Resend)
│   │   │   ├── embedding_service.py        # InLegalBERT embedding wrapper
│   │   │   ├── era_transition_service.py   # Criminal law era analysis
│   │   │   ├── headnote_service.py         # Legal headnote extraction
│   │   │   ├── history_service.py          # Search + view history
│   │   │   ├── inlegalbert_service.py      # Local NLP model loader
│   │   │   ├── judge_analytics_service.py  # Judge dossier builder
│   │   │   ├── order_service.py            # Court order OCR + summary
│   │   │   ├── prediction_service.py       # Judicial outcome prediction
│   │   │   ├── saved_file_service.py       # Kanoon PDF file storage
│   │   │   ├── search_service.py           # Case search orchestration
│   │   │   ├── similar_cases_service.py    # RAG similar case retrieval
│   │   │   └── vector_store.py             # SQLite vector similarity search
│   │   │
│   │   ├── middleware/           # ASGI middleware
│   │   │   ├── logging.py        # Request/response logging
│   │   │   └── rate_limit.py     # Redis sliding-window rate limiter
│   │   │
│   │   ├── dependencies/         # FastAPI dependency injection
│   │   │   └── auth.py           # get_current_user()
│   │   │
│   │   ├── prompts/              # AI prompt templates
│   │   │   ├── system.py         # Chatbot system prompts
│   │   │   ├── templates.py      # Task-specific prompts
│   │   │   └── kanoon_extractor.py   # Kanoon extraction prompts
│   │   │
│   │   ├── utils/                # Utility functions
│   │   │   └── kanoon_formatter.py   # Kanoon HTML to markdown
│   │   │
│   │   └── data/                 # Static application data
│   │       └── criminal_statutes_concordance.py  # IPC/CrPC to BNS/BNSS mapping
│   │
│   ├── scripts/                  # Developer scripts
│   │   ├── compute_whitening.py
│   │   ├── diagnose_gemini.py
│   │   ├── probe_models.py
│   │   ├── test_35_pred.py
│   │   ├── test_era_transition_api.py
│   │   ├── test_full_prediction.py
│   │   ├── test_gemini_client.py
│   │   ├── test_headnote_api.py
│   │   ├── test_headnote_service.py
│   │   ├── test_http_endpoints.py
│   │   ├── test_models_live.py
│   │   └── test_pred_call.py
│   │
│   ├── tests/                    # Formal test suite (pytest)
│   ├── eval/                     # Evaluation scripts
│   │
│   ├── check_cache.py
│   ├── clear_bad_cache.py
│   ├── clear_ecourts_cache.py
│   ├── clear_old_cases.py
│   ├── clear_and_init_kanoon.py
│   ├── migrate_kanoon_filenames.py
│   ├── reset_db.py
│   ├── test_api_debug.py
│   ├── test_chatbot_kanoon.py
│   ├── test_citation_graph.py
│   ├── test_ecourts.py
│   ├── test_kanoon.py
│   ├── test_kanoon_pdf.py
│   ├── test_kanoon_pipeline.py
│   └── test_similar_cases_rag.py
│
└── frontend/
    ├── index.html                # HTML shell
    ├── package.json              # npm dependencies and scripts
    ├── vite.config.ts            # Vite build configuration
    ├── tsconfig.json             # TypeScript project references
    ├── tsconfig.app.json         # App TypeScript config (strict, paths)
    ├── tsconfig.node.json        # Node TypeScript config (for vite.config)
    ├── .env                      # VITE_API_URL
    ├── .oxlintrc.json            # OXLint linting rules
    │
    └── src/
        ├── main.tsx              # React root (QueryClient, GoogleOAuth, Router)
        ├── App.tsx               # Top-level component → AppRouter
        ├── App.css               # Global reset styles
        ├── index.css             # Design system tokens, utility classes
        │
        ├── routes/
        │   ├── index.tsx         # createBrowserRouter with all routes (lazy-loaded)
        │   └── protected-route.tsx   # Auth guard component
        │
        ├── pages/
        │   ├── LandingPage.tsx       # 53 KB — marketing & hero
        │   ├── LoginPage.tsx         # 8.8 KB
        │   ├── RegisterPage.tsx      # 7.6 KB
        │   ├── VerifyOtpPage.tsx     # 11.9 KB
        │   ├── DashboardPage.tsx     # 6.7 KB
        │   ├── SearchPage.tsx        # 6.8 KB
        │   ├── CaseDashboardPage.tsx # 24 KB — core feature page
        │   ├── ChatPage.tsx          # 10.8 KB
        │   ├── BookmarksPage.tsx     # 5.1 KB
        │   ├── FilesPage.tsx         # 23 KB
        │   ├── ResearchPage.tsx      # 9.3 KB
        │   ├── HistoryPage.tsx       # 16 KB
        │   ├── AnalyticsPage.tsx     # 5.4 KB
        │   ├── ProfilePage.tsx       # 9.6 KB
        │   ├── SettingsPage.tsx      # 5.8 KB
        │   └── NotFoundPage.tsx      # 1.2 KB
        │
        ├── components/
        │   ├── layout/
        │   │   ├── AppLayout.tsx
        │   │   ├── Sidebar.tsx
        │   │   ├── Topbar.tsx
        │   │   ├── Navbar.tsx
        │   │   └── TopSearchBar.tsx
        │   │
        │   ├── case/
        │   │   ├── AISummaryCard.tsx             # 32 KB
        │   │   ├── CaseHeader.tsx                # 5.7 KB
        │   │   ├── CaseHeadnoteCard.tsx          # 17 KB
        │   │   ├── CasePredictionCard.tsx        # 24 KB
        │   │   ├── CriminalEraTransitionCard.tsx # 21 KB
        │   │   ├── CustomPDFViewer.tsx           # 47 KB
        │   │   ├── DocumentLiquidNavBar.tsx      # 3.1 KB
        │   │   ├── DocumentReaderModal.tsx       # 41 KB
        │   │   ├── JudgeCard.tsx                 # 4.9 KB
        │   │   ├── OrderCard.tsx                 # 3.8 KB
        │   │   ├── PartyCard.tsx                 # 3.1 KB
        │   │   ├── SimilarCasesCard.tsx          # 23 KB
        │   │   ├── StatisticsCard.tsx            # 1.0 KB
        │   │   ├── Timeline.tsx                  # 8.8 KB
        │   │   ├── citation/
        │   │   │   ├── CitationGraphCanvas.tsx   # 22 KB
        │   │   │   ├── CitationGraphControls.tsx # 2.9 KB
        │   │   │   ├── CitationLegend.tsx        # 2.8 KB
        │   │   │   ├── CitationNetworkView.tsx   # 8.0 KB
        │   │   │   └── CitationNodeInspector.tsx # 7.5 KB
        │   │   ├── judge/
        │   │   │   └── JudgeDossierSlideOver.tsx # 37 KB
        │   │   └── reader/
        │   │       └── ReaderResearchPanel.tsx   # 18 KB
        │   │
        │   ├── chat/
        │   │   ├── ChatInput.tsx
        │   │   ├── ChatPanel.tsx
        │   │   ├── CitationChip.tsx
        │   │   ├── ConversationSidebar.tsx
        │   │   ├── GlobalVoiceDictation.tsx
        │   │   ├── LegalWaveformVisualizer.tsx
        │   │   ├── MessageBubble.tsx
        │   │   ├── SiriLegalVisualizer.tsx
        │   │   ├── SiriWaveOrb.tsx
        │   │   └── SuggestedQuestions.tsx
        │   │
        │   ├── analytics/
        │   │   ├── AnalyticsChart.tsx            # 11 KB
        │   │   ├── CourtDistributionCard.tsx     # 30 KB
        │   │   ├── ResearchHeatmap.tsx           # 13 KB
        │   │   └── TopCitedActsCard.tsx          # 17 KB
        │   │
        │   ├── search/
        │   │   ├── SearchBar.tsx
        │   │   ├── SearchFilters.tsx
        │   │   ├── SearchResultCard.tsx
        │   │   └── SearchResultTable.tsx
        │   │
        │   ├── research/
        │   │   ├── EraTransitionExplorer.tsx     # 15 KB
        │   │   └── ResearchBriefModal.tsx        # 10.8 KB
        │   │
        │   ├── files/
        │   │   └── ResearchBriefModal.tsx
        │   │
        │   └── common/
        │       ├── CommandPalette.tsx
        │       ├── EmptyState.tsx
        │       ├── ErrorState.tsx
        │       ├── MetricCard.tsx
        │       ├── SkeletonLoader.tsx
        │       ├── StatusBadge.tsx
        │       └── SuitsLoader.tsx
        │
        ├── services/             # Axios API service functions
        │   ├── auth.ts
        │   ├── analytics.ts
        │   ├── bookmarks.ts
        │   ├── cases.ts
        │   ├── chat.ts
        │   ├── citations.ts
        │   ├── document.ts
        │   ├── eraTransition.ts
        │   ├── files.ts
        │   ├── headnote.ts
        │   ├── history.ts
        │   ├── judgeAnalytics.ts
        │   ├── prediction.ts
        │   └── search.ts
        │
        ├── store/               # Zustand global state
        │   ├── auth-store.ts
        │   ├── dictation-store.ts
        │   ├── sidebar-store.ts
        │   └── theme-store.ts
        │
        ├── hooks/               # Custom React hooks
        │   └── useLegalSpeechRecognition.ts  # 9.8 KB
        │
        ├── types/               # TypeScript type definitions
        │   ├── analytics.ts
        │   ├── auth.ts
        │   ├── case.ts
        │   ├── citation.ts
        │   ├── chat.ts
        │   ├── common.ts
        │   ├── document.ts
        │   ├── era_transition.ts
        │   ├── file.ts
        │   ├── headnote.ts
        │   ├── judge.ts
        │   ├── prediction.ts
        │   ├── search.ts
        │   ├── similar-case.ts
        │   └── speech.d.ts
        │
        ├── lib/                 # Shared utilities
        │   ├── axios.ts          # Configured Axios instance (auth interceptors)
        │   ├── error.ts          # Error parsing helpers
        │   └── dictation/        # Voice dictation utility modules
        │
        └── assets/              # Static assets (images, fonts, SVGs)
```

---

*Generated: 2026-09-20 | SUITS v1.0.0 | SIH 2026*
