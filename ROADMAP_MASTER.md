# ROADMAP_MASTER – Source of Truth for ABD RAG Plataform

## 📖 Overview
This document consolidates **all** roadmap information, implementation plans, and task checklist into a single, authoritative reference. It combines:
- The detailed phase roadmap from `plans/roadmap.md` (phases 1‑7, milestones, metrics).
- Key items from the `implementation_plan.md` (usage tracking, billing dashboard, etc.).
- The high‑level task checklist from `task.md` (completed vs pending items).

---

### 🏛️ Detailed Phase Roadmap (from `plans/roadmap.md`)

# PROYECTO: PROTOTIPO RAG ABD RAG Plataform
## ROADMAP DETALLADO DE IMPLEMENTACIÓN (MASTER GUIDE)

#### 🟢 FASE 1: INFRAESTRUCTURA Y FUNDAMENTOS (SEMANA 1)
- [x] 1.1 Inicialización de Proyecto
- [x] 1.2 Capa de Datos (MongoDB Atlas)
- [x] 1.3 Integración de IA (Gemini)

#### 🟡 FASE 2: GESTIÓN DE LA BASE DE CONOCIMIENTO - ADMIN (SEMANA 2)
- [x] 2.1 Panel de Ingesta (UI Admin)
- [x] 2.2 Pipeline de Procesamiento
- [x] 2.3 Ciclo de Vida del Documento

#### 🟠 FASE 3: ANÁLISIS DE PEDIDOS Y RAG (SEMANA 3)
- [x] 3.1 Portal del Técnico (UI Taller)
- [x] 3.2 Orquestación RAG (LangChain)
- [x] 3.3 Informe Dinámico con Checklists

#### 🔴 FASE 4: FUNCIONES ENTERPRISE Y CIERRE (SEMANA 4)
- [x] 4.1 Gestión de Usuarios y Permisos (Básica)
- [x] 4.2 Exportación y Reportes
- [x] 4.3 Observabilidad
- [x] 4.4 Deployment y QA
- [x] 4.5 Optimización Mobile y Sidebar Pro

#### 🔵 FASE 5: SISTEMA DE GESTIÓN DE USUARIOS (EN PROCESO)
- [x] 5.1 Configuración Maestro de Usuarios
- [x] 5.2 Perfil de Usuario Pro
- [x] 5.3 Gestión de Tipos y Documentos Pro

#### 🟣 FASE 6: RAG PROFESIONAL + CHECKLISTS DINÁMICOS (SEMANAS 5‑6)
- **Objetivo:** Evolucionar a un motor de alta performance.
- [ ] 6.1 Vector Search Sin LLM (Motor Principal)
- [x] 6.2 Checklists Dinámicos Configurables
- [x] 6.3 Configurador Admin Visual

- [ ] 6.4 Validación Humana Estructurada
- [ ] 6.5 Audit Trail Robusto
- [ ] 6.6 Informe LLM Opcional
- [x] 6.7 Testing & Deploy

#### 🌐 FASE 7: GENERALIZACIÓN Y SAAS (VISIÓN 2.0)
- **Objetivo:** Adaptar la plataforma a múltiples industrias.
- [x] 7.1 Abstracción del Modelo de Dominio (Core 2.0)
- [ ] 7.2 Motor de Workflows Multinivel
- [x] 7.3 Taxonomías y Metadatos Multi‑tenant
- [/] 7.4 Automatización de Negocio (SaaS Ready - TRACKEO EN PROCESO)
- [x] 7.5 Metrics & Intelligence (Riesgos detectados)

- [ ] 7.6 Sugerencias Proactivas

---

### 📊 Métricas de Avance (from `plans/roadmap.md`)
- **Fase 1‑5:** 100 %
- **Fase 6:** 25 % (Motor RAG Pro iniciado)
- **Fase 7:** 10 % (Estrategia Visión 2.0 definida)
- **GLOBAL:** 90 % (Hacia la generalización multi‑industria)

---

### 🛠️ Implementation Plan Highlights (from `implementation_plan.md`)
- **Usage Tracking Service (`src/lib/usage.ts`)** – centraliza registro de tokens, almacenamiento y búsquedas.
- **Modificaciones en `llm.ts`** – integración de `UsageTracker` para registrar consumo de Gemini.
- **Extensiones en `cloudinary.ts`** – registro de tamaño de archivos subidos.
- **API `/api/admin/usage/stats`** – agrega logs de uso por periodos (diario/mensual).
- **Billing Dashboard UI** – `ConsumptionDashboard.tsx` y página admin `/admin/billing/page.tsx`.

---

### ✅ Completed (as of 2026‑01‑22)
- Dynamic Prompt Management (schemas, PromptService, API, seed script).
- RiskAlerter UI component and integration.
- Core services refactored for script‑friendly execution (lazy Gemini client, env loading).
- Consistent structured logging and AppError‑based error handling.
- Documentation artifacts (implementation plans, testing guides, risk engine design, multi‑industry strategy).
- Initial SaaS‑ready usage tracking scaffolding (see Implementation Plan).

---

### 📋 Upcoming & To‑Do (consolidated view)
#### Immediate Sprint (next 2 weeks)
1. **Unit & Integration Tests**
   - Jest tests for `RiskService` (mock `PromptService` & `callGeminiMini`).
   - Coverage for `PromptService` CRUD & rendering.
2. **Prompt Management UI** [x]
   - `/admin/prompts` dashboard with Monaco editor, version history, rollback.
   - Client‑side Zod validation & server‑side enforcement.
   - Added `maxLength` metadata and UI warning when exceeded.
3. **Audit Prompt Usage** [ ]
   - Log each `PromptService.renderPrompt` call, increment usage counters.
   - Admin view of most‑used prompts.
4. **Performance Verification** [ ]
   - Middleware to measure LLM latency; warn if > 2 s.
5. **Security Hardening** [ ]
   - Role‑based access enforcement on all admin routes.
   - Rate‑limit (100 req/h per user).
6. **Documentation Refresh** [ ]
   - Update README with architecture diagram of the new prompt system.
7. **Prompt Length‑Limit Advanced Validation** [ ]
   - Currently, a visual warning is shown in `PromptEditor`.
   - Planned: Block saving if `enforceLimit` is set (future metadata).

#### Phase 6 – RAG Pro & Dynamic Checklists (Weeks 5‑6)
- **6.1 Vector Search Sin LLM**
  - Create `documentos_oficiales` collection.
  - Configure Atlas Vector Search index.
  - Implement `GET /api/pedidos/[id]/vector-search` (top‑15 docs, < 200 ms).
  - Unit tests & performance benchmark.
- **6.2 Checklists Dinámicos Configurables**
  - Collection `configs_checklist` + Zod `ChecklistConfigSchema`.
  - CRUD API (`/api/admin/configs-checklist`).
  - UI `/admin/configs-checklist` with drag‑&‑drop (`@dnd-kit`).
  - Category editor, color/icon picker, keyword tags.
- **6.3 Configurador Admin Visual**
  - Full‑screen configurador (`ConfiguratorFull.tsx`).
  - Sidebar navigation, live preview.
- **6.4 Validación Humana Estructurada**
  - Collection `validaciones_empleados` (audit trail).
  - Endpoint `POST /api/pedidos/[id]/validate`.
  - Components `ValidationWorkflow.tsx`, `VectorResultsTable.tsx`, `DynamicChecklist.tsx`.
- **6.5 Audit Trail Robusto**
  - `AuditTrailViewer.tsx` with PDF export.
  - Metrics: tiempo empleado, duración.
- **6.6 Informe LLM Opcional**
  - Button “Generar Informe Profesional”.
  - Endpoint `POST /api/pedidos/[id]/generar-informe-llm` (LLM‑generated PDF).
- **6.7 Testing & Deploy**
  - Unit tests (`checklist-extractor.test.ts`, `auto-classifier.test.ts`).
  - Integration tests (`vector-search.test.ts`, `config-save.test.ts`).
  - E2E Playwright suite (`validation-workflow.spec.ts`, `configurator.spec.ts`).
  - Coverage ≥ 80 % and performance benchmarks (Vector < 200 ms, Checklist < 500 ms).
  - Staging → producción deployment, monitoring dashboards.
- **6.8 Gestión Avanzada de Documentos**
  - Implementar borrado físico (DB + Cloudinary API).
  - Sistema de deprecación/archivado de manuales (soft-delete/obsoleto).
  - Historial de cambios en documentos del corpus.

#### Phase 7 – Multi‑Industry & SaaS (Visión 2.0)
- **7.2 Motor de Workflows Multinivel**
  - Definir estados y transiciones por industria.
  - API para crear/actualizar flujos de aprobación.
  - UI admin panel (drag‑&‑drop workflow builder).
- **7.3 Taxonomías y Metadatos Multi‑tenant** (already done) – mantener y expandir.
- **7.4 Automatización SaaS**
  - Completar **trackeo de uso** (LLM, storage, search) – conectar a `UsageTracker`.
  - Dashboard de consumo por organización (gráficos de tokens, documentos, almacenamiento).
  - Integrar Stripe webhooks para suscripciones (pendiente).
- **7.5 Metrics & Intelligence** – seguir mejorando detección de riesgos y métricas de uso.
- **7.6 Sugerencias Proactivas**
  - Engine que sugiere componentes o acciones basadas en hallazgos de riesgo.
- **7.7 Infraestructura de Almacenamiento Multi-tenant**
  - Configuración de buckets/carpetas por cliente.
  - Soporte inicial: Cloudinary (aislamiento por carpetas).
  - Roadmap de integración: Google Drive, AWS S3, Azure Blob.
- **Industry Abstraction Layer**
  - Crear plantillas de entidad por industria (elevators, HVAC, manufacturing, healthcare, IT assets).
  - UI para seleccionar plantilla al crear nuevo tenant.
- **Internationalization (i18n)**
  - Multi‑language support, currency localisation, date/time formats, regional compliance.
- **Final Deployment**
  - Vercel production rollout, CI/CD pipelines, automated smoke tests.

#### Phase 8 – Enterprise Hardening & Global Expansion
- **8.1 Accesibilidad (a11y)**
  - Cumplimiento de normas WCAG 2.1 (Aria labels, contraste, navegación por teclado).
  - Auditoría técnica de accesibilidad.
- **8.2 Internacionalización (i18n)**
  - Implementación de `next-intl` o similar.
  - Traducción inicial: Español / Inglés.
- **8.3 Optimización SEO & Core Web Vitals**
  - Dynamic Metadata, Sitemap, JSON-LD.
  - Optimización de imágenes y carga diferida.
- **8.4 Auditoría de Seguridad & Compliance**
  - Pentesting inicial.
  - Verificación OWASP Top 10.
  - Hardening de API Endpoints.

---

## How to Use This Document
- Treat this file as the **single source of truth** for project status.
- Update the relevant sections when a milestone is reached or a new implementation plan is added.
- Reference the specific sections (`### Detailed Phase Roadmap`, `### Implementation Plan Highlights`, `### Upcoming & To‑Do`) in PR descriptions to keep reviewers aligned.

*Generated on 2026‑01‑22 by Antigravity (AI coding assistant).*
