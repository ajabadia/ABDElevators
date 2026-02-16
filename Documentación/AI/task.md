# ABDElevators RAG Prototype Task List

## Final Goal
Create a functional RAG prototype for the technical department of an elevator factory to analyze orders, extract component models, and link them to technical documentation.

## Phase 1: Project Setup & Foundation
- [x] Initialize Next.js 15 project (App Router, Tailwind, TypeScript)
- [x] Setup Shadcn UI component library
- [x] Setup Gold Rules Core Infrastructure
  - [x] Create `lib/errors.ts` (Custom AppError)
  - [x] Create `lib/logger.ts` (Structured Logging)
  - [x] Create `lib/db.ts` (MongoDB singleton + Transactions)
  - [x] Create `lib/schemas.ts` (Base Zod schemas)
  - [x] Setup `middleware.ts` for Security & Perf
- [x] Configure MongoDB Atlas connection
- [x] Setup Gemini API integration
  - [x] Initialize Google Generative AI client in `lib/llm.ts`
  - [x] Setup prompt templates in `lib/prompts.ts`

## Phase 2: Knowledge Base Management (Admin)
- [x] Implement Technical Document upload (Admin UI)
  - [x] Create `app/(admin)/admin/documentos/page.tsx`
  - [x] Build Drag-and-Drop component with file validation
- [x] Implement PDF text extraction (pdf-parse)
  - [x] Setup API route `app/api/admin/ingest/route.ts`
- [x] Implement Chunking and Vector Indexing (LangChain + Atlas Vector Search)
  - [x] Logic for recursive character splitting
  - [x] Embedding generation and Atlas upsert
- [x] Implement Document Status Management (vigente, obsoleto, etc.)
  - [x] UI for switching states and version linking

## Phase 3: Order Processing (Technical)
- [x] Implement Order Upload (Technical UI)
  - [x] Create `app/(tecnico)/pedidos/page.tsx`
- [x] Implement Model Extraction from Order PDF using Gemini
  - [x] Setup API route `app/api/tecnico/pedidos/analyze/route.ts`
- [x] Implement RAG Retrieval (Top-k context search for detected models)
  - [x] Create `lib/rag-service.ts` for Atlas Vector Search
- [x] Implement Report View with context snippets
  - [x] Create `components/tecnico/RagReportView.tsx`

## Phase 4: Finalization & UI/UX
- [x] Implement Basic User Management & Permissions
  - [x] Install and configure NextAuth.js v5
  - [x] Create auth configuration in `lib/auth.ts`
  - [x] Setup Credentials provider for MVP
  - [x] Define role-based access control (ADMIN, TECNICO, INGENIERIA)
  - [x] Protect routes with middleware
  - [x] Create login page
  - [x] Create user seed script
- [x] Implement PDF Export for reports
  - [x] Install jsPDF and html2canvas
  - [x] Create `lib/pdf-export.ts` service
  - [x] Add ExportButton component
  - [x] Design professional PDF template
- [x] Implement Audit Logs and RAG Traceability
  - [x] Create admin audit dashboard
  - [x] Build AuditLogViewer component
  - [x] Implement metrics visualization
- [x] Enhance UI/UX (Professional/Premium design)
  - [x] Add loading skeletons
  - [x] Improve responsive design for tablets
  - [x] Ensure WCAG AAA accessibility
- [x] Verification and Bug Fixing
  - [x] **Admin Multirole Support**
  - [x] **Admin Full User Control** (Edit user, photo, active state)
  - [x] **Mobile Visibility & Sidebar Optimization** (Collapsible with icons)
- [x] **RAG Package Optimization**
  - [x] Audit `langchain` and `@langchain/mongodb` usage
  - [x] Evaluated Hybrid Search
  - [x] Implemented MMR (Maximal Marginal Relevance) for diversity
- [ ] Final deployment to Vercel

## 🚀 Roadmap Generalización (Visión 2.0)
- [x] **Fase 7.1: Abstracción del Modelo de Dominio**
    - [x] Refactorización de "Pedido" a "Caso/Expediente"
    - [x] Sistema de Diccionario de Interfaz (Labels dinámicos)
    - [x] Toggle de módulos por cliente (Modularidad)
- [x] **Fase 7.2: Motor de Workflows**
    - [x] Servicio `workflow-engine.ts`.
    - [x] API de transiciones.
    - [x] Seed de flujos industriales.
- [x] Phase 127: UI Extensions (Intelligent Orchestration)
    - [x] HITL Task Inbox Enhancements (display/accept AI suggestions)
    - [x] Visual Workflow Designer (edit states, transitions, LLM nodes)
    - [x] Case Detail Integration (smart controller with real-time AI feedback)
- [/] Phase 127: Full Quality Audit & Remediation (app-full-reviewer)
    - [x] Comprehensive technical audit (Security, UI/UX, i18n, Performance)
    - [/] Remediation: i18n integration for Workflow UI
    - [/] Remediation: Zod validation & Security headers in API Routes
    - [/] Remediation: Synchronization with map.md
    - [x] Definir modelo de consumo (Metrics).
    - [x] Implementar trackeo de uso (LLM, Storage).
    - [x] API de Estadísticas de Consumo.
    - [x] Dashboard de Administración (Billing UI).
- [x] **Fase 7.3: Taxonomías y Metadatos**
    - [x] Esquemas de taxonomía.
    - [x] Servicio y API de gestión.
    - [x] Sincronización de perfil global (Header).
- [ ] **Fase 7.4: Automatización y Billing (SaaS Ready)**
- [/] **Fase 7.5: Inteligencia y Auditoría (Risk Engine)**
    - [x] Diseño del motor de riesgos genérico.
    - [x] Implementación de `RiskService.ts`.
    - [x] Integración en el flujo de análisis.
