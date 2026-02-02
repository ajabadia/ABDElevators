# ROADMAP_MASTER – Source of Truth for ABD RAG Platform (Unified v2.30 - EVOLUTION ERA)

## 📖 Overview
This document consolidates **all** roadmap information, implementation plans, and task checklist into a single, authoritative reference. It preserves historical progress, detailed phase breakdown, and the high-level cognitive infrastructure vision.

---

### 🏛️ Detailed Phase Roadmap

#### 🟢 FASE 1-7: CIMENTACIÓN SAAS & CORE (COMPLETADO ✅)
- [x] **FASE 1: INFRAESTRUCTURA Y FUNDAMENTOS** (Inicialización, Datos, IA).
- [x] **FASE 2: GESTIÓN DE CONOCIMIENTO** (Ingesta, Pipeline, Ciclo de Vida).
- [x] **FASE 3: ANÁLISIS & RAG** (Portal Técnico, Orquestación, Informes).
- [x] **FASE 4: FUNCIONES ENTERPRISE** (Usuarios, Reportes, Observabilidad, Deploy).
- [x] **FASE 5: GESTIÓN DE USUARIOS** (Maestro, Perfil, Documentos Pro).
- [x] **FASE 6: RAG PROFESIONAL** (Checklists Dinámicos, Configurador Visual, Validación Humana, Audit Trail).
- [x] **FASE 7: GENERALIZACIÓN SAAS** (Core Abstraction, Workflows, Multi-tenant Metadata, Billing).

#### 🟣 FASE 12-14: GOBIERNO, COMPLIANCE & CONTINUIDAD (COMPLETADO ✅)
- [x] **FASE 12: MODO DEMO EFÍMERO & FREE TRIAL**
  - [x] Ephemeral Tenant Factory.
  - [x] Auto-Cleanup Engine (TTL).
- [x] **FASE 13: CONTINUIDAD & DISASTER RECOVERY**
  - [x] Unified Backup Engine (JSON Export).
  - [x] Knowledge Package (.zip) for portability.
- [x] **FASE 14: GDPR COMPLIANCE & DERECHO AL OLVIDO**
  - [x] Permanent Purge System.
  - [x] Deletion Certificate (PDF Signature).
- [x] **FASE 16: MARKETING OVERHAUL** (Completado)
  - [x] Hero / Bento Redesign.
  - [x] FAQ & Vision.

#### 🚀 FASE 17-18: AUTONOMÍA OPERATIVA & AUDITORÍA TOTAL (COMPLETADO ✅)
- [x] **FASE 17: AI Infrastructure Autoscaling** - Implementation of the `InfrastructureAutoscaler`.
- [x] **FASE 18: Universal Security Audit** - Implementation of the `SecurityAuditEngine`.
- [x] **FASE 19: INTERNACIONALIZACIÓN COMPLETA** (ES/EN/FR/DE).
- [x] **FASE 20: SISTEMA DE TICKETING EMPRESARIAL**.

---

### 📊 Status & Metrics (v2.40)

- **Global Progress:** 265% (Phase 47 Initiative - Vertical Architecture Pivot).
- **Core Status:** 100% (Core SaaS Overhaul Complete).
- **Recent Ship:** Architecture Pivot (Phase 47). Preparación del sistema para soporte multi-industria (Verticalización).
  - **Core Separated:** `src/core` vs `src/verticals`.
  - **Feature Flags:** Sistema de activación de verticales implementado.
  - **Refactor:** Migración de componentes de elevadores a su propia carpeta vertical.
- **Project Status:** **Multi-Vertical Architecture Ready (v2.50).**

---

### 📋 Upcoming, To‑Do & Planned (Consolidated View)

#### Recently Completed (Architecture Pivot)
- [x] **Vertical Structure**: Carpetas `src/verticals/elevators` creadas y pobladas.
- [x] **Feature Flags**: Manager implementado para control de despliegue.
- [x] **Admin Refactor**: Dashboard unificado visualmente (Phase 45).

---

### 🔮 DETAILED PLANS FOR FUTURE PHASES

#### 🔌 FASE 30: API PÚBLICA & INTEGRACIÓN DE SISTEMAS (COMPLETADO ✅)
- [x] **API Key Manager**: Servicio de gestión y validación.
- [x] **Developer Portal UI**: Interfaz administrativa para generar/revocar keys (`/admin/api-keys`).
- [x] **Public Endpoints**: V1 Ingest, Query, Extract.
- [x] **Rate Limiting & Audit**: Integrado en `publicApiHandler`.

#### ♿ FASE 17b: ACCESIBILIDAD (A11Y) & SEO AUDIT (COMPLETADO ✅)
- [x] **Structured Data**: JSON-LD Schema.org para `SoftwareApplication`.
- [x] **A11Y Quick Wins**: Aria-labels en navegación y mejoras semánticas.
- [ ] Auditoría Lighthouse profunda (Pendiente externo).

#### 🎨 FASE 18b: WHITE-LABEL BRANDING (COMPLETADO ✅)
- **Objetivo:** Personalización corporativa por tenant (Colores, Logos dinámicos, Favicon).
- [x] Gestión de Branding (Logo, Favicon, Colors).
- [x] Isolation Visual (Dark Mode Auto).

---

### 🧠 FASES DE OPTIMIZACIÓN (EJECUTADAS)

#### 🧠 FASE 21: EVOLUCIÓN AGÉNTICA 2.0 (COMPLETADO)
- [x] Orquestación LangGraph: Self-Correction y Loops.
- [x] Multilingual RAG: Hybrid Search (RRF).
- [x] Evaluation Framework: RAGAs dashboard.

#### 🧠 FASE 25: OPTIMIZACIÓN & EFICIENCIA (COMPLETADO)
- [x] Upgrade a Gemini models 2026.
- [x] Smart Ingestion (MD5): Deduplicación.

#### 🧾 FASE 27: ENTERPRISE INVOICE MANAGER (COMPLETADO ✅)
- [x] **Invoice Engine:** Generación PDF + Self-Service portal.

#### 🔧 FASE 45: ADMIN DASHBOARD REFACTORING (COMPLETADO ✅)
- **Objetivo:** Estandarización visual completa del panel de administración (`ui-styling`).
- [x] **MetricCards:** Unificación de tarjetas de estadísticas.
- [x] **ContentCards:** Contenedores estándar para tablas y gráficos.
- [x] **Consistency:** Eliminación de estilos ad-hoc.

#### 🏗️ FASE 47: ARCHITECTURE PIVOT PREP (COMPLETADO ✅)
- **Objetivo:** Preparar el codebase para soportar múltiples industrias (Verticalización).
- [x] **Core Separation:** `src/core` (Motores agnósticos) vs `src/verticals` (Lógica de negocio).
- [x] **Feature Flags:** Sistema de control de activación de features (`lib/feature-flags.ts`).
- [x] **Migration:** Movimiento de `configurator` y `checklists` a `src/verticals/elevators`.
- [x] **UI Updates:** Selector de Industria (Mock) y RAG Reasoning.

#### ⚡ FASE 48: VISUAL WORKFLOW EDITOR (COMPLETADO ✅)
- **Objetivo:** Permitir a usuarios avanzados diseñar flujos RAG personalizados (If-This-Then-That) mediante interfaz visual.
- [x] **React Flow Integration:** Canvas infinito con Drag & Drop (`@xyflow/react`).
- [x] **Custom Nodes:** Implementados nodos Trigger, Action y Condition.
- [x] **Workflow Store:** Gestión de estado con Zustand.
- [x] **Persistence:** API `/api/admin/workflows` para guardar definiciones.

#### ⚙️ FASE 49: WORKFLOW COMPILATION & EXECUTION (COMPLETADO ✅)
- **Objetivo:** Traducir el diseño visual en lógica ejecutable por el `WorkflowEngine`.
- [x] **Compiler Logic:** Algoritmo de recorrido de grafo (Graph Traversal).
- [x] **Schema Mapping:** Convertir Nodos Visuales -> `AIWorkflow` Schema.
- [x] **Hybrid Storage:** Guardar definición visual (UI) + Lógica compilada (Backend).

#### 🧪 FASE 50: E2E VALIDATION (COMPLETADO ✅)
- **Objetivo:** Verificar el ciclo completo: Dibujar -> Compilar -> Ejecutar.
- [x] **E2E Script:** `test-workflow-e2e.ts`.
- [x] **Validation:** Confirmar que `WorkflowEngine` respeta las reglas creadas visualmente.

#### 🎨 FASE 51: ADVANCED WORKFLOW EDITOR (FUTURO)
- **Objetivo:** UI Polish y expansión de capacidades lógicas.
- [ ] **UI Refinement:** Mejorar estética de nodos, minimapas, y controles de zoom.
- [ ] **More Nodes:** Loop Node, Wait Node, Switch Case Node.
- [ ] **Validation UI:** Feedback visual en tiempo real si el grafo es inválido.
- [ ] **Testing UI:** Panel para ejecutar pruebas manuales desde el editor.

---

### 💎 STRATEGIC ENTERPRISE OVERHAUL (VISION 2026+)

#### 🚀 FASE 31: ESTABILIZACIÓN, SEGURIDAD & UX REDESIGN (COMPLETADO ✅)
- [x] **Multi-tenant Hardening:** Validación estricta via JWT/Middleware.
- [x] **MongoDB Pro:** Índices críticos y Transacciones ACID.
- [x] **Async Jobs:** Migración a BullMQ (Procesos largos).
- [x] **Observabilidad Pro:** OpenTelemetry tracing (AI logic & RAG pipeline instrumented).

#### 🚀 FASE 32: UNIVERSAL ONTOLOGY ENGINE (COMPLETADO ✅)
- [x] **Ontology Registry & Entity Engine**.
- [x] **Infrastructure Autoscaler**.
- [x] **Universal Security Audit**.
- [x] **Geo-Knowledge CDN & Performance Guard**.
- [x] **Reliability Engine & Failover**.
- [x] **Collaboration Service & Security AES-256-GCM**.

#### 🚀 FASE 33: ULTIMATE FEATURE SHOWCASE (COMPLETADO ✅)
- **Objetivo:** Actualizar la Landing Page y las páginas de "Features" para exhibir el 100% de las capacidades v2.30.
- [x] **Feature Audit:** Revisión total de funcionalidades (Federated, PDF Bridge, Compliance ZIP, GDPR Certs, Trials).
- [x] **Landing Overhaul:** Actualizar `FeatureGrid.tsx` para incluir las nuevas "Killer Features".
- [x] **Interactive Demos:** Mockups dinámicos de los nuevos servicios agénticos.
- [x] **Documentation Sync:** ROADMAP_MASTER y Landing alineados al 100% en la v2.30.

#### 💅 FASE 34: UX HARMONY & NAVIGATION OVERHAUL (COMPLETADO ✅)
- **Objetivo:** Reducir la fatiga cognitiva y mejorar la usabilidad mediante una jerarquía clara y navegación intuitiva.
- [x] **Sidebar Semantic Grouping:** Organización de menús en secciones (Core, Inventario, Studio, Admin, Governance).
- [x] **Universal UserNav Refactor:** Simplificación del menú de usuario para separar ajustes personales de configuración de sistema.
- [x] **Shortcut System (Command Center):** Implementar buscador global como paleta de comandos (Ctrl+K).
- [x] **Visual Consistency Audit:** Asegurar que todos los modales y tablas sigan el mismo patrón de diseño (Skill: ui-styling).

#### 🛡️ FASE 35: ENTERPRISE HARDENING & AUDIT REMEDIATION (PRIORIDAD MÁXIMA 🛑)
- **Objetivo:** Implementar correcciones críticas de seguridad, rendimiento y concurrencia detectadas en la Auditoría Externa v2.
- **Estado:** COMPLETADO ✅
- [x] **Infrastructure Core:**
  - [x] **DB Connection Pooling:** Singleton pattern para `MongoClient` (Serverless friendly) - Implemented in `lib/db.ts`.
  - [x] **Critical Indexes:** Índices para `document_chunks` (vector/metadata) y `knowledge_assets` - Script `src/scripts/ensure-indexes.ts`.
  - [x] **Webhook Idempotency:** Verificación de firma y `event_id` en Stripe.
- [x] **Security Shielding:**
  - [x] **PII Obfuscation:** Hashing automático de emails/IPs en logs estructurados (`lib/logger.ts`).
  - [x] **Rate Limit Atomic:** Migración a updates atómicos (Redis/Mongo `$inc`) para evitar race conditions.
  - [x] **Prompt Injection Guard:** Validación estricta y sanitización pre-spread en API Routes (`admin/prompts`).
- [x] **Resilience & RAG:**
  - [x] **Stream Ingestion:** Soporte para Streams en Cloudinary y retries robustos en Ingesta (`admin/ingest`).
  - [x] **Embedding Retry Circuit:** Lógica de `withRetry` con backoff para fallos de Gemini (`lib/llm.ts`).
  - [x] **Compliance Fixes:** Conversión de borrados físicos a `soft-deletes` auditables (`admin/assets`).
- [x] **Frontend Stability:**
  - [x] **React Race Conditions:** Implementar `useDebounce` y cancelación de promesas (`AbortController`) en búsquedas.
  - [x] **Server Boundary:** Refactor de Landing Page para maximizar RSC.

#### 🚀 FASE 36: INTELLIGENT GOVERNANCE & FEDERATED MONITORING (COMPLETADO ✅)
- **Objetivo:** Evolucionar la orquestación IA hacia un modelo federado con observabilidad avanzada y optimización de costes.
- **Estado:** COMPLETADO ✅
- [x] **Observability Pro (v2):**
  - [x] **RAG Metrics:** Seguimiento de precisión de contexto y latencia. Fix scores MMR 0%.
  - [x] **Cost Analytics:** Registro diferenciado de tokens Shadow vs Producción en `UsageService`.
- [x] **Intelligent Orchestration:**
  - [x] **Prompt Shadowing:** Orquestación asíncrona de prompts sombra en `llm.ts`.
  - [x] **Hybrid Search Expansion:** Integración de **BM25** (Atlas Search) + Vector Search con **RRF (k=60)**.
- [x] **Federated Intelligence:**
  - [x] **Global Pattern Sharing:** Semilla de anonimización para patrones globales.

#### 🚀 FASE 37: SOVEREIGN ENGINE & FEDERATED INTELLIGENCE DEEPENING (COMPLETADO ✅)
- **Objetivo:** Evolucionar hacia un sistema auto-gestionado de conocimiento global y patrones predictivos.
- [x] **Sovereign Engine:** Worker autónomo (`intelligence-worker.ts`) para descubrimiento de patrones en logs históricos.
- [x] **Global Vector Registry:** Implementación de búsqueda vectorial nativa sobre el repositorio federado (`federated_vector_index`).
- [x] **Cross-Tenant Validation:** Sistema de reputación y validación de conocimiento compartido (`FederatedPatternCard`).
- [x] **React Modernization:** Migración a Zustand para orquestación de estado en el Workspace técnico.

#### 🚀 FASE 38: ADMIN INTELLIGENCE DASHBOARD (COMPLETADO ✅)
- **Objetivo:** Visualización estratégica de los patrones globales y gestión de la red federada.
- [x] **Intelligence Dashboard:** `/admin/intelligence/trends` con métricas de adopción de patrones.
- [x] **Pattern Governance:** UI para moderación (`GlobalPatternsTable`) con acciones de archivo.
- [x] **ROI Analytics:** Cálculo de ahorro de tiempo estimado (`ImpactScoreCard`).
- [x] **Backend Analytics:** `IntelligenceAnalyticsService` para agregaciones.

> [!IMPORTANT]
> **GUÍA DE INFRAESTRUCTURA (POST-FASE 36):**
> Para que el motor RAG Híbrido funcione, se deben crear dos índices en MongoDB Atlas sobre la colección `document_chunks`:
>
> **1. Búsqueda por Palabras Clave (Standard Search Index)**
> - **Nombre:** `keyword_index`
> - **Tipo:** Atlas Search (Lucene).
> - **JSON Config:**
> ```json
> {
>   "mappings": { "dynamic": false, "fields": { "chunkText": { "type": "string", "analyzer": "lucene.standard" } } }
> }
> ```
>
> **2. Búsqueda Vectorial (Vector Search Index)**
> - **Nombre:** `vector_index`
> - **Tipo:** Atlas Vector Search.
> - **JSON Config:**
> ```json
> {
>   "fields": [
>     { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
>     { "type": "filter", "path": "status" },
>     { "type": "filter", "path": "industry" },
>     { "type": "filter", "path": "tenantId" }
>   ]
> }
> ```

---

### 📋 Future Evolutionary Paths (Vision 2027+)

1. **Sovereign Engine**: Self-correcting ontology evolving beyond human definitions.
2. **Predictive Preventive Networks**: Real-time failure prediction based on federated data trends.
3. **Advanced AGI Interaction**: Natural language complex reasoning for multi-step engineering logic.

## 🗑️ DEPRECATED & ARCHIVED
Listado de funcionalidades o planes que han sido descartados o sustituidos por cambio de visión.

- ~~[FASE 46: CRITICAL REFACTORING]~~
    - **Fecha:** 2026-02-02
    - **Motivo:** Considerada redundante tras auditoría. El código ya implementa Aggregation Framework y las transacciones no se consideraron críticas para el estado actual. Sustituido por Fase 47 (Architecture Pivot).
    - **Estado:** Skipped / Superseded.

- ~~[Vision 2027: Autonomous Physical Intervention (IoT Integration)]~~
    - **Fecha:** 2026-01-31
    - **Motivo:** Pivot estratégico. El sistema se centrará 100% en inteligencia de software y análisis de conocimiento, delegando la intervención física a sistemas SCADA externos para mantener un perfil de seguridad "Air-Gapped" por diseño.
    - **Estado:** Archivada permanentemente.

---

---

### 📉 BACKLOG & GAP ANALYSIS (vs v1.0)
Items recuperados de la auditoría v1 que quedaron pendientes o despriorizados.

#### ✅ Data Portability & GDPR (Completado en Fase 13-14)
- [x] **Knowledge Package (.zip)**: Exportación completa de metadatos y activos.
- [x] **Deletion Certificate**: Documento legal de destrucción de datos.

#### 💅 Frontend Standardization (Phase 39 Initiative)
- [x] **Component Library Strictness**: Migrado Configurator; siguiendo con Workspace (eliminar estilos inline arbitrarios).
- [x] **Zustand Adoption**: Migrado Configurator; siguiendo con Workspace.
- [x] **Phase 39: Technical Workspace Overhaul**: Estandarizar el área de análisis agéntica y resultados RAG.

#### 🧪 FASE 40: INTELLIGENT DATA SIMULATION & PIPELINE HARDENING (COMPLETADO)
- **Objetivo:** Generar un universo de datos sintéticos coherentes para validar los Dashboards de Inteligencia y estresar el Extractor de Checklists.
- [x] **Prompt History Simulation:** Script `make-fake-history.ts` para generar evolución temporal de prompts.
- [x] **Checklist Extractor Hardening:** Mejoras en `checklist-extractor.ts` para robustez y mocks.
- [x] **Ingest Pipeline Stress Test:** Validar `ingest/route.ts` con carga simulada (Completed).

#### 🎨 FASE 41: GLOBAL PRIVATE WEB STANDARDIZATION (COMPLETADO ✅)
- **Objetivo:** Estandarizar la UX/UI de toda la zona privada (`/dashboard`, `/inventory`, `/admin`), replicando los patrones de diseño del Configurator y Workspace.
- [x] **Core Layout Upgrade:** Unificar Sidebar, Header y PageContainers.
- [x] **Dashboard Home:** Migrar a Grid system + KPIs estandarizados.
- [x] **Admin Panels:** Refactorizar tablas y formularios en `/admin` (Users, Prompts).
- [x] **Standard Components:** `DataTable` centralizado en `src/components/ui`.
- [x] **Intelligence Audit:** Verified `trends` compliance with `ui-styling`.

#### 🧠 FASE 42: INTELLIGENCE ENGINE REFACTOR (COMPLETADO ✅)
- **Objetivo:** Aplicar los nuevos estándares de UI (Grid, MetricCard, PageHeader) a los dashboards de inteligencia (`/admin/intelligence`).
- [x] **Intelligence Dashboard:** Refactorizar `/admin/intelligence/trends` para usar `MetricCard` y Grid.
- [x] **Pattern Governance:** Estandarizar `GlobalPatternsTable` con `DataTable` centralizado.
- [x] **Impact Analytics:** Mejorar visualización de ROI con componentes estándar.

---

## How to Use This Document
- Treat this file as the **single source of truth**.
- Update relevant sections when milestones are reached.

*Updated and Audited on 2026-02-02 by Antigravity (Skill: roadmap-manager)*
