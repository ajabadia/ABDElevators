# ROADMAP_MASTER – Era 19: Security Consolidation & Clean Architecture

## 🛡️ ERA 19: SECURITY CONSOLIDATION & CLEAN ARCHITECTURE (Q1 2027)

**Objetivo:** Resolver hallazgos críticos de la auditoría técnica de Marzo 2026, eliminando la deuda de seguridad en el Middleware y robusteciendo el tipado estricto en la capa de datos.

---

### ✅ FASE 601: Middleware Isolation & SRP Hardening (Completada - Mar-17)

- **Meta:** Descomponer el middleware monolítico en servicios especializados y securizar el logging de auditoría.
- **Referencia:** `[Phase 617 task](file:///C:/Users/ajaba/.gemini/antigravity/brain/8b79fcea-ab32-4fa2-b791-8fb3e46e881c/task.md)`

- [X] **Modular Middleware**: Refactorización de `src/middleware.ts` y eliminación de interfaces redundantes en `auth.config.ts`.
- [X] **Security Headers & CSRF**: Blindaje de `headers.ts` y `api-auth.ts` con validación estricta de `Host` y tokens CSRF.
- [X] **Auth Utils Hardening**: Tipado estricto en `auth-utils.ts` eliminando el uso de `any` en sesiones y validación de Magic Links.

---

### ✅ FASE 602: Type Safety Hardening & Era 12 Debt (Completada - Mar-17)

- **Meta:** Eliminar el uso de `any` en servicios críticos y garantizar la integridad referencial en el Hub de Prompts.
- **Referencia:** `[Phase 615/616 task](file:///C:/Users/ajaba/.gemini/antigravity/brain/8b79fcea-ab32-4fa2-b791-8fb3e46e881c/task.md)`

- [X] **LLM Core Hardening**: Refactorización de `AiModelManager.ts`, `PromptRunner.ts` y `PromptService.ts` para usar `Session | null` y `AiGovernanceSession`.
- [X] **Hygiene Sweep**: Eliminación masiva de `as any` en `ExtractionService.ts`, `VisionService.ts` y `translation-service.ts`.
- [X] **Branded ID Implementation**: Integración de `EntityIdSchema` en el Prompt Hub y repositorios core.

---

### ✅ FASE 603: Core Schemas & Repository Hardening (Completada - Mar-17)

- **Meta:** Estandarizar la capa de datos y repositorios eliminando deudas de tipado.

- [X] **Schema Hardening**: Auditoría y corrección de `any` en `billing.ts`, `auth.ts`, `assets.ts`.
- [X] **Repository Refactor**: Eliminación de `as any` en `BaseRepository`, `WorkflowExecutionRepository`, `KnowledgeAssetRepository` y repositorios de órdenes.
- [X] **Standardized Query Layer**: Optimización de `useApiList` y `useApiItem` con persistencia de metadatos y soporte `AbortController`.

---

### ✅ FASE 604: API Handler & Secondary Clusters Hardening (Completada - Mar-17)

- **Meta:** Blindaje de entrypoints de API y estandarización de respuestas.

- [X] **API Cluster Hardening**: Refactorización de clústeres `admin/users`, `core/entities` y clústeres secundarios (Workflows, Insights, Audit).
- [X] **Monitoring Telemetry**: Estandarización de `/api/logs` y endpoints de feedback con acceso a DB securizado.
- [X] **Storage & Blob Security**: Hardening de `BlobStorageService` e `IngestApiService` con metadatos tipados.

---



## 🌊 ERA 12: RELATIONAL INTEGRITY & COGNITIVE EVOLUTION (Q2-Q3 2026)

**Objetivo:** Consolidar la arquitectura de datos eliminando silos ("islas"), garantizando integridad referencial estricta y sentando las bases para la cognición autónoma multitenant.

---

### ✅ FASE 370: Governance Hub & DX Testing (Completada - Mar-11)

- **Meta:** Unificar la observabilidad SOC2 y modernizar la gestión de identidades programáticas con infraestructura corporativa de pruebas.

- [X] **Governance Hub**: Portal unificado en `/governance` con Audit Logs, Monitor de Workflows y Security Status.
- [X] **API Keys v2**: Implementación de SHA-256 hashing y scopes granulares (Spaces, Assets, IPs).
- [X] **DX Infrastructure**: Setup base de **Vitest** y primera suite de pruebas para Workflow Executions.
- [X] **API Observability**: Nuevo endpoint `/api/admin/workflows/executions` para auditoría técnica.

---

### ✅ FASE 350: Data Architecture & Relational Integrity (Completada - Mar-10)

- **Meta:** Resolver las "Islas de Datos" identificadas en la auditoría 2901.txt, estandarizando esquemas (Zod) y garantizando la integridad referencial en todo el sistema.
- **Referencia:** `[2901.txt](file:///d:/desarrollos/ABDElevators/Documentaci%C3%B3n/29/2901.txt)` y `[2902_db_refactor_guidelines.md](file:///d:/desarrollos/ABDElevators/Documentaci%C3%B3n/29/2902_db_refactor_guidelines.md)`

- [X] **Data Primitives**: Implementar `EntityIdSchema` y `TenantScopedSchema` globales. (Centralizados en `@abd/platform-core`).
- [X] **RAG Quality Graph**: Resolver el aislamiento de Golden Sets contra Chunks creando colecciones `RAGEvaluation`.
- [X] **RAG Query Log**: Implementar la colección `RAGQueryLog` para trazabilidad real con `spaceId` obligatorio.
- [X] **Workflows Observability**: Crear colección `workflow_executions` y conectar las instancias de runtime con las definiciones.
- [X] **Knowledge & Assets Integrity**: Hacer obligatorio `spaceId` y `documentTypeId`.
- [X] **Universal Migrations**: Ejecutar scripts de migración y mitigación de huérfanos.
- [X] **Fase 350.2: Relational Integrity Hardening**: Cerrar brechas de tipado en Schemas (Zod) y resolver "Islas de Datos" remanentes en Auth e Intelligence.

---

### ✅ FASE 11: Public Trust & Laboratory Evolution (Completada - Mar-11)

- **Meta:** Modernizar el cluster público (i18n, a11y) y activar herramientas industriales en el Labs Hub representadas en el MVP.

- [X] **i18n Master Audit**: 100% de literales en Pricing, About y Contact (ES/EN).
- [X] **Vanguardia Agéntica UI**: Diseño premium con glassmorphism y gradientes en VisionSection.
- [X] **Mock Data Generator**: Activación de herramienta para generación sintética de Tenants/Assets.
- [X] **Predictive Costing Foundation**: Implementación de `UsageService` con proyecciones P95.
- [X] **Final Compliance Sweep**: Auditoría SEO y Metadata finalizada.

---

### ✅ FASE 344: Structural Performance & Era 12 Alignment (Completada - Mar-11)

- **Meta:** Resolver hallazgos estructurales y de performance asegurando compatibilidad con los nuevos esquemas relacionales de la Fase 350.

- [X] Audit `navigation-config.ts` vs `map.md` (Navigation Sync)
- [X] Integrate `EntityIdSchema` in relational schemas (Hardened End-to-End)
- [X] Eliminate `any` usage in core services (`WorkflowTaskService`, `IntelligenceWorker`)
- [X] **Global Hygiene Pass**: Optimización de `NavigationShell`, `PublicNavbar` y `PublicFooter` (Glassmorphism 3XL).
- [X] **Relational Performance**: Migración de `BaseRepository` y repositorios clave a Branded Types.
- [X] **Server Error States**: Implementar manejo de estados de error y loading consistentes (`SupportErrorState`).
- [X] **Branded ID Implementation**: Migración total de `TenantService`, `TicketService` y `SpaceService` a `EntityId`/`TenantId`.

---

### ✅ FASE 345: Security Depth & Autonomous Governance (Completada - Mar-11)

- **Meta:** Implementar blindaje ABAC/RBAC avanzado y rate limiting por tenant con observabilidad forense.

- [X] **Guardian V3.1 Hardening**: Resolución jerárquica de políticas y caché distribuida en Redis para persistencia multi-instancia.
- [X] **Per-Tenant Throttling**: Rate limiting dinámico basado en `tenantId` con overrides configurables vía `TenantLimitsService`.
- [X] **Decision Auditing**: Registro automático de cada evaluación de Guardian en `access_logs` (Audit Trail Forense).
- [X] **Security Regression Tests**: Suite de tests Jest para motores de permiso (`GuardianEngine.test.ts`).
- [X] **Governance Headers**: Implementación de `X-RateLimit-Tenant-ID` en el middleware para transparencia del lado del cliente.
- [X] **UI Refinement**: Visualización de Tiers y Overrides de Rate Limit en el dashboard de `/agents/governance`.
- [X] **Help Menu Restructuring**: Implementación de navegación jerárquica para la sección de Ayuda/Soporte.

---

### ✅ FASE 360: AI Sidekick UX & Intelligence Audit (Completed)

- **Meta:** Resolver la repetitividad de las respuestas del "AI Sidekick" (Asistente lateral) y asegurar que sea contextual y funcional en todas las vistas.

- [X] **Context Awareness Audit**: Revisar los prompts del Sidekick para asegurar que detecten la ruta actual (`pathname`) y el estado del usuario.
- [X] **Response Logic Refactor**: Eliminar respuestas genéricas o "hardcoded fallback" que resultan en la misma experiencia sin importar la sección.
- [X] **Status Verification**: Implementar un indicador de "Estado de Conexión" para saber cuándo el Sidekick está realmente operativo vs. en modo fallback offline.

---

### ✅ FASE 361: Navigation Architecture & Accordion UX (Completada - Mar-10)

- **Meta:** Limpiar la interfaz de navegación implementando menús tipo acordeón para reducir el ruido visual y auditar a fondo `navigation-config.ts`.

- [X] **Accordions UI**: Refactorizar el `NavigationShell` para agrupar clusters secundarios en acordeones desplegables.
- [X] **Config Deep Dive**: Revisión exhaustiva de `navigation-config.ts` para alinear permisos, roles y organización visual de las rutas.
- [X] **Mobile Optimization**: Asegurar que los acordeones funcionen perfectamente en vistas móviles reducidas.

---

### 🗺️ FASE 363: Universal Navigation Nesting & i18n Alignment (Completada - Mar-10)

- **Meta:** Implementar estructuras jerárquicas en todos los Hubs y unificar los literales de i18n para coherencia total.

- [X] **Nesting Implementation**: Implementar `children` en todos los dominios (Intelligence, Agents, Insights, Work).
- [X] **i18n Key Unification**: Estandarizar literales entre sidebar, breadcrumbs y Hub titles.
- [X] **Legacy Cleanup**: Purga de llaves redundantes en DB y sincronización global.
- [X] **Phase 343.1: Work Hub Modernization**:
  - [X] Modernización de la Landing Page principal (Full Dark Premium).
  - [X] Modernización del Feature Hub y todas las sub-páginas de features.
  - [X] Refresh de las páginas de Legal (Privacy, Terms, Accessibility).
  - [X] Modernización de Sandbox interactivo e i18n migration.
  - [X] Estandarización de About, Contact y Upgrade para Era 12.
  - [X] Modernización de Auth Flows (Login, Signup-Invite, Magic-Link).
  - [X] Dashboard Public Completion Status: 100%.

---

---

### ✅ FASE 364: Platform Polish (Completada - Mar-10)

- **Meta:** Refinar detalles visuales, accesibilidad y performance en toda la plataforma.

- [X] **Cross-browser Audit**: Verificar consistencia en Safari, Firefox y Chrome.
- [X] **A11y Pass**: Revisar contrastes y navegación por teclado en nuevos acordeones.
- [X] **Performance optimization**: Lazy loading de componentes pesados en los Hubs.
- [X] **Standardized i18n & Sanitization**: Reconstrucción de `common.json` (ES/EN) para eliminar duplicados y errores de sintaxis.
- [X] **Shared UI Resilience**- v7.2.8: Finalización del cluster público al 100% (Sandbox, About, Contact, Upgrade, Auth Flows). Localización y mejora de accesibilidad en `NavigationShell`, `SupportErrorState` y `DataStateIndicator`.

- **Era 15: Observability Resilience & Ingestion Recovery**: OTel API v2 Migration & Ingest Reset Reliability (Ph 454) — COMPLETED ✅🚀
- **Era 15: Advanced Compliance & Performance**: Intelligent Metrics Aggregation, Global Aggregator & Hook Resilience (Ph 453) — COMPLETED ✅🚀
- **Era 14/15: Technical Debt & Canonical Alignment**: Nomenclature Standardization, Domain Governance & Orders Consolidation (Ph 450) — COMPLETED ✅🚀
- **Era 15: Advanced Compliance & Performance**: SGSI PDF Certification, Proactive Security & P95 Observability — COMPLETED 🛡️🚀
- **Era 14: Technical Debt & Platform Hygiene**: Deep Purge & Modular Component Architecture (Ph 413) — COMPLETED 🧹🚀
- **Era 13: Security & Convergence Sprint**: ISO 27001 (SGSI), PII Masking, Multitenant Pentest (PASSED) & RAG Unification. 🛡️🚀
- **Governance Hub & API Keys v2 (Era 12 Sprint 3)**: Unified SOC2 Portal & Granular Security 🛡️

### ✅ ERA 11: COGNITIVE & HIERARCHICAL (MARZO 2026)

- **Phase 343: Full-App Compliance Sweep** -> UI-Styling & Error Resilience in all clusters.
- **Phase 342: Uncodixify & Industrial Error Resilience** -> Standardized UI and Support integration.
- **Phase 320: Unified Navigation Architecture** -> Domain-based routing & NavigationShell.
- **Phase 308: Universal Domain Intelligence** -> Agent Builder, Quality Insights, Compliance Hub, Domain Linker.
- **Phase 307: Reliability & Quality** -> RagJudge Service, Causal Analytics, Quality Dashboard.
- **Phase 306: Cognitive Retrieval Engine** -> Tiered discovery, query normalization, context orchestration.
- **Phase 305: Hierarchical RAG Foundation** -> Multi-tier indexing, structural segmentation, doc_profiles/sections.

## 🌅 ERA 11: HIERARCHICAL RAG & COGNITIVE ARCHITECTURE (Q2 2026)

**Objetivo:** Evolución hacia un sistema de RAG jerárquico (MemoRAG style) con observabilidad profunda y automatización de cumplimiento industrial.

### ✅ FASE 305: Hierarchical RAG Foundation (Marzo 2026)

- **Meta:** Superar las limitaciones de búsqueda plana de fragmentos mediante perfiles de documentos y secciones.

- [X] **Data Model v2**: Implementar colecciones `doc_profiles` y `doc_sections`.
- [X] **Hierarchical Indexing**: Nuevo pipeline de ingesta que genera resúmenes y embeddings en tres niveles (Doc, Sección, Fragmento).
- [X] **Structural Segmentation**: Segmentación inteligente de PDFs basada en jerarquía semántica e integración en UI/Trailing.

### ✅ FASE 306: Cognitive Retrieval Engine (Marzo 2026)

- **Meta:** Implementar el motor de búsqueda jerárquica con pre-procesamiento de consultas.

- [X] **Tiered Discovery**: Búsqueda en cascada (Profile -> Section -> Chunk) para maximizar relevancia y minimizar ruido.
- [X] **Query Normalization**: Normalización y traducción automática de consultas antes de la búsqueda.
- [X] **Context Orchestration**: Constructor de contexto inteligente ajustado a presupuestos de tokens.

### ✅ FASE 307: Reliability & Quality (RagJudge) - Marzo 2026

- **Meta:** Implementar "LLM as a Judge" para garantizar la fiabilidad industrial de las respuestas.

- [X] **RagJudge Service**: Evaluación automática de *Faithfulness*, *Relevance* y *Precision*. (Integrated in Quality Dashboard)
- [X] **Causal Analytics**: Clasificación de fallos (Alucinación vs. Mala Recuperación).
- [X] **Reliability Dashboard**: Visualización de *Hallucination Score* y KPIs de fiabilidad para el COO.

### 🏭 FASE 308: Universal Domain Intelligence (Suite Evolution)

- **Meta:** Generalizar la inteligencia de cumplimiento industrial y exponer los primeros módulos de la Suite Era 10.

- [X] **Quality Insights Service**: Panel de KPIs por operario/parte basado en `ragevaluations` y ejecución enriquecida. (Ref: 2802.txt Phase 1)
- [X] **Domain Linker**: Vinculación automática entre Pedidos/Activos y Documentación técnica.
- [X] **Agentic Builder (Alpha)**: No-code/low-code builder para asistentes técnicos basados en plantillas de workflows. (Ref: 2802.txt Phase 2)
- [X] **Compliance Hub**: Trazabilidad completa de "Documento -> Instrucción -> Ejecución -> Verificación".

### ✅ FASE 310: Golden Benchmarking & RAG Observability (Marzo 2026)

- **Meta:** Implementar un ciclo de evaluación científica mediante Golden Sets y experimentos comparativos.

- [X] **Golden Set Engine**: Sistema de gestión de colecciones de prueba maestro para benchmark industrial.
- [X] **Offline Experiment Runner**: Motor de comparación v1 vs v2 con cálculo automático de *Recall* y *Faithfulness*.
- [X] **Deep Observability**: Captura extendida de `flowType`, `engineVersion` y `agentKey` en cada consulta.
- [X] **Elevator Industry Pack**: 20+ queries especializadas para troubleshooting de maniobras (Arca II, etc.).

### ✅ FASE 310.2: Backend Consolidation & Observability Polish (Marzo 2026)

- **Meta:** Unificar los hubs de Operaciones y Entidades, eliminando deuda técnica y estandarizando las notificaciones.

- [X] **Entity Consolidation**: Rutas centralizadas en `/api/core/entities` y abstracción al hook `useEntity`.
- [X] **Hubs Unification**: Fusión de reportes (Schedules, History, Exports) en una única vista `Tabs` responsiva.
- [X] **Multi-tenant Guard (Definitive)**: Estandarización de `SecureCollection` y corrección de privilegios `SUPER_ADMIN` en servicios de observabilidad.
- [X] **Command Hub (Modal)**: Refactorización del System Hub a arquitectura de Diálogo (Modal) para máxima fiabilidad y UX.
- [X] **Notification Bridge**: Hook universal `useNotification` que coordina Toasts + DB Logging sincronizados.
- [X] **SLA Dashboard**: Monitor de rendimiento con agregaciones p95 para rutas y triggers de autodiagnóstico.

### ✅ FASE 320: Unified Navigation Architecture & Role-Agnostic Routing (Marzo 2026)

- **Meta:** Transición de enrutamiento basado en roles (`/admin/...`) a enrutamiento basado en dominios (`/work`, `/intelligence`, `/agents`, `/insights`), filtrado dinámicamente por Guardian V3.

- [X] **Fase 1: Foundations**: `NAVIGATION_CONFIG` centralizado y `NavigationShell` adaptativo.
- [X] **Fase 2: Gradual Migration**: Redirección y movimiento de rutas Core Hubs.
- [X] **Fase 3: Consolidation**: Unificación de configuraciones y purga de rutas legacy.
- [X] **Fase 4: Polish**: Búsqueda global de navegación (CMD+K) y analíticas de uso. (CMD+K updated with and domain context).

### ✅ FASE 342: Uncodixify & Industrial Error Resilience (Marzo 2026)

- **Meta:** Aplicar los estándares Uncodixify (Anti-AI) y asegurar una gestión de errores resiliente con integración de soporte.

- [X] **Audit Plan**: Mapeadas todas las rutas canónicas del Admin Dashboard e Insights.
- [X] **Uncodixify Sprint**: Refactorizados Admin Dashboard, Analytics, Audit, Reports y Compliance — radios 12px, tipografía profesional, tokens de diseño unificados.
- [X] **Support Integration**: Verificado y estandarizado `SupportErrorState` como componente único de error global, con propagación de Digest, URL y Timestamp a tickets de soporte.

### ✅ FASE 343: Full-App Compliance Sweep — UI-Styling & Error Resilience (Marzo 2026)

- **Meta:** Pasar las skills `ui-styling` y `error-resolution-handler` en cada ruta canónica de la aplicación. Aprovechar cada ruta para identificar si aplican skills adicionales del ciclo `app-full-reviewer`.
- **Skills Primarias**: `ui-styling` · `error-resolution-handler`
- **Skills Condicionales**: `i18n-a11y-auditor` · `toast-notifier-auditor` · `guardian-auditor` · `security-auditor` · `lazy-loading-list-auditor` · `db-consistency-auditor` · `prompt-governance` · `ai-governance-migrator` · `hygiene-reviewer`

> **Leyenda de Skills Condicionales:**
>
> - `[i18n]` → i18n-a11y-auditor (textos hardcodeados / ARIA)
> - `[toast]` → toast-notifier-auditor (feedback visual en acciones async)
> - `[guard]` → guardian-auditor (permisos/roles Guardian V3)
> - `[sec]` → security-auditor (SecureCollection, Zod, PII)
> - `[lazy]` → lazy-loading-list-auditor (listas con useApiList > 50 items)
> - `[db]` → db-consistency-auditor (rutas AUTH/LOGS/CONFIG/MAIN)
> - `[llm]` → prompt-governance + ai-governance-migrator (si usa Gemini/PromptService)
> - `[hyg]` → hygiene-reviewer (deuda técnica, any, console.log)

---

#### 🏁 CLUSTER: SuperAdmin Command Center (`/admin-dashboard`)

- [X] `/admin-dashboard` — **Platform Dashboard** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[db]`
- [X] `/admin-dashboard/tenants` — **Tenant Management** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[lazy]` `[db]`
- [X] `/admin-dashboard/infra` — **Infra Health** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]`
- [X] `/admin-dashboard/logs` — **System Logs** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[db]` `[hyg]`

---

#### ⚙️ CLUSTER: Work & Operations (`/work`)

- [X] `/work` — **Work Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]`
- [X] `/work/orders` — **Orders Explorer** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[lazy]` `[toast]` `[llm]`
- [X] `/work/tasks_legacy` — **Task Management** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]`
- [X] Refactor `/work/checklists` cluster to HubPage pattern.
- [X] Audit for missing A11y/i18n in shared error states.
- [X] Fix legacy links in `ChecklistConfigList`.
- [X] `/work/checklists` — **Checklist Execution** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[lazy]` `[toast]` `[db]`
- [X] `/work/checklists/new` — **New Checklist Config** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]`
- [X] `/work/checklists/[id]` — **Edit Checklist Config** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]`
- [X] `/work/cases` — **Case Detail** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[llm]`
- [X] `/work/workshop` — **Workshop Portal** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]`

---

#### 🧠 CLUSTER: Intelligence & Knowledge (`/intelligence`)

- [X] `/intelligence` — **Intelligence Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]`
- [X] `/intelligence/explorer` — **Neural Explorer (RAG Search)** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[llm]` `[hyg]`
- [X] `/intelligence/assets` — **Asset Manager** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]` `[db]`
- [X] `/intelligence/my-docs` — **My Documents** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]`
- [X] `/intelligence/spaces` — **Spaces Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]`
- [X] `/intelligence/document-types` — **Document Types** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]` `[db]`
- [X] `/intelligence/trends` — **Intelligence Trends** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[llm]`

---

#### ⚡ CLUSTER: AI & Automation (`/agents`)

- [X] `/agents` — **Agents Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]`
- [X] `/agents/agents` — **Agent Builder** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[llm]` `[hyg]`
- [X] `/agents/workflows` — **Workflow Studio** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[llm]` `[hyg]`
- [X] `/agents/rag-quality` — **RAG Quality** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[llm]` `[db]`
- [X] `/agents/golden-sets` — **Golden Benchmarking** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[llm]`
- [X] `/agents/governance" — **AI Governance / Model Registry** · `ui-styling error-resolution-handler [i18n][guard][sec][llm]`
- [X] `/agents/prompts` — **Prompt Studio** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[llm]` `[lazy]`
- [X] `/agents/playground` — **AI Playground** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[llm]` `[hyg]`

---

#### 📊 CLUSTER: Insights & Audit (`/insights`)

- [X] `/insights` — **Insights Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]`
- [X] `/insights/analytics` — **Analytics Center** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[db]` `[hyg]`
- [X] `/insights/reports` — **Report Schedules** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]` `[llm]`
- [X] `/insights/audit` — **Audit Log Explorer** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[db]` `[sec]`
- [X] `/insights/security` — **Security Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]`
- [X] `/insights/compliance` — **Compliance GDPR** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[toast]` (Refactored Mar-11)
- [X] `/insights/notifications` — **Comms History** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` (Refactored Mar-11)

---

#### ❓ CLUSTER: Help & Support (`/help`)

- [X] `/help/support` — **Support Portal** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[lazy]`
- [X] `/help/api` — **API Reference (Swagger)** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]`
- [X] `/help/labs` — **Labs & Demos** · `ui-styling` `error-resolution-handler` `[i18n]`

---

#### ⚙️ CLUSTER: Settings (`/settings`)

- [X] `/settings` — **Settings Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]`
- [X] `/settings/system` — **System Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[db]`
- [X] `/settings/profile` — **My Profile** · `ui-styling` `error-resolution-handler` `[i18n]` `[toast]`
- [X] `/settings/organization` — **Org Settings / Branding** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[db]`
- [X] `/settings/users` — **User Management** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[lazy]` `[toast]` `[db]`
- [X] `/settings/permissions` — **Permission Matrix** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]`
- [X] `/settings/billing` — **Billing & ROI** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[toast]`
- [X] `/settings/api-keys` — **API Keys** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[lazy]` `[toast]`
- [X] `/settings/notifications` — **Notification Config** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]`

---

#### 🌐 CLUSTER: Páginas Públicas (`/`)

- [X] `/` — **Landing Page** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO)
- [X] `/about` — **About** · `marketing-styling" `error-resolution-handler [i18n]` (SEO)
- [X] `/contact` — **Contact** · `marketing-styling` `error-resolution-handler` `[i18n]` `[toast]` (SEO)
- [X] `/pricing` — **Pricing** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO)
- [X] `/privacy` — **Privacy Policy** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO)
- [X] `/terms` — **Terms** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO/Metadata)
- [X] `/accessibility` — **Accessibility Statement** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO/Metadata)
- [X] `/features/*` — **Feature Pages** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO)
- [X] `/sandbox` — **Sandbox Público** · `ui-styling` `error-resolution-handler` `[i18n]`

---

#### 🔐 CLUSTER: Autenticación (`/auth`)

- [X] `/auth/login` — **Login Page** · `ui-styling` `error-resolution-handler` `[i18n]` `[sec]` `[toast]`
- [X] `/auth/signup` — **Signup Page** · `ui-styling` `error-resolution-handler` `[i18n]` `[sec]` `[toast]`
- [X] `/auth/magic-link` — **Magic Link** · `ui-styling` `error-resolution-handler` `[i18n]` `[toast]`

---

#### 🧩 COMPONENTES COMPARTIDOS (Auditar en paralelo)

- [X] `src/components/shared/SupportErrorState.tsx` — `error-resolution-handler` `[i18n]` `[a11y]`
- [X] `src/components/shared/DataStateIndicator.tsx` — `ui-styling` `error-resolution-handler`
- [X] `src/components/navigation/NavigationShell.tsx` — `ui-styling` `[i18n]` `[guard]`
- [X] `src/components/ui/` (primitivos globales) — `ui-styling` `[hyg]`

---

---

---

## 📜 History & Archived Milestones

### ✅ ERA 11: COGNITIVE & HIERARCHICAL (MARZO 2026)

- **Phase 308: Universal Domain Intelligence** -> Agent Builder, Quality Insights, Compliance Hub, Domain Linker.
- **Phase 307: Reliability & Quality** -> RagJudge Service, Causal Analytics, Quality Dashboard.
- **Phase 306: Cognitive Retrieval Engine** -> Tiered discovery, query normalization, context orchestration.
- **Phase 305: Hierarchical RAG Foundation** (Marzo 2026) -> Multi-tier indexing, structural segmentation, doc_profiles/sections.

### ✅ ERA 10: ENTERPRISE CONSOLIDATION (COMPLETADA)

- **Phase 304: Enterprise Reliability & Unified Audit** (Marzo 2026) -> Inmutable auditing, bank-grade policy enforcement, data lifecycle.
- **Phase 300-303: Industrial Scale & UI Refinements** -> Dashboards pro, detailed metrics, i18n alignment.

### ✅ ERA 1-9: FOUNDATIONS & SUITE TRANSITION

- **Monorepo Architecture** (Phases 180-182).
- **Core Platform Shell** (v5.0.0).
- **SaaS Readiness** (Multitenancy, Quotas, Security Hardening).

---

## 🛡️ ERA 13: PLATFORM CONVERGENCE & SECURITY BEYOND (Q1 2026)

**Objetivo:** Consolidar la convergencia del motor RAG, implementar el SGSI (Sistema de Gestión de Seguridad de la Información) alineado con ISO 27001 y verificar el blindaje técnico mediante pentesting asimétrico.

---

### ✅ FASE 401: RAG Unification & Domain Data Transition (Completada - Mar-11)

- **Meta:** Unificar los esquemas de calidad RAG y desacoplar el motor de dependencias verticales (Elevadores) mediante `domainMetadata`.

- [X] **Universal Schemas**: Generalización de `KnowledgeAsset` y `DocumentChunk` en `@abd/rag-engine`.
- [X] **Quality Unification**: Fusión de Golden Sets y Evaluaciones en un modelo único de reporte interactivo.
- [X] **Repository Pattern v2**: Migración masiva de servicios (`Case`, `Knowledge`, `RagEvaluation`) al patrón Era 12.
- [X] **Ingest API Deep Audit**: Refactorización de `IngestOrchestrator` para eliminar IDs hardcoded.

---

### ✅ FASE 402: ISO 27001 Security Hardening & PII Governance (Completada - Mar-11)

- **Meta:** Implementar los controles técnicos y organizativos requeridos por el SGSI y normativas de privacidad (GDPR).

- [X] **SGSI Infrastructure**: Creación del directorio `/security` con Políticas de Seguridad, Gestión de Incidentes y Registro de Riesgos.
- [X] **Data Privacy Hardening**: Implementación de PII Masking automático en `logEvento` y políticas de retención (TTL) en MongoDB para logs y sesiones.
- [X] **Observability Hardening**: Nuevo endpoint `/api/health/deep` para monitoreo reactivo de salud del cluster.
- [X] **Skill Integration**: Actualización de los Skills del agente (`security-auditor`, `roadmap-manager`) para forzar auditoría de cumplimiento en cada cambio.

---

### ✅ FASE 403: Multitenant Isolation Pentest & Surface Hardening (Completada - Mar-11)

- **Meta:** Verificar la integridad del aislamiento multitenant y auditar rutas legacy críticas.

- [X] **Asymmetric Pentest API**: Ejecución exitosa de scripts de ataque para verificar bloqueo de "Inter-tenant Leakage". (RAG Query & Direct ID access: PASSED).
- [X] **Legacy Route Audit**: Blindaje de `/api/admin/workflow-tasks` y vistas legacy con Guardian V3 y filtros de `tenantId` estrictos.
- [X] **Audit Evidence**: Registro de resultados de pentest en `walkthrough.md` y limpieza de scripts temporales.

---

## 🧹 ERA 14: TECH DEBT & CLEAN ARCHITECTURE SWEEP (Q2 2026)

**Objetivo:** Pagar la deuda técnica acumulada durante el rápido crecimiento operativo, estandarizando la base de código, optimizando el rendimiento (Server Components) y eliminando dependencias mock del entorno de producción.

### 📝 Resumen del Estado de la Plataforma (Cierre Era 13)

*Auditoría de Madurez:*

- **Seguridad (9.5/10):** Enterprise-grade, SOC2 ready. Protección CVE en Edge, Tenant Isolation estricto, Guardian ABAC, MFA.
- **Arquitectura (9/10):** Next.js 14+ patterns, Hub Pattern, Server Components por defecto.
- **UX/UI (8.5/10):** Accesible, i18n completo, Uncodixify design system.
- **DevOps (8/10):** RAG Tracing, Feature flags, Log structuration.

### ✅ FASE 410: Sanitización Core & Dependencias Demo (Completada - Mar-12)

- **Meta:** Aislar artefactos de prueba de producción y resolver pre-condiciones inseguras.

- [X] **Mock Isolation**: Extraer generadores (ej. bypasses en `instrumentation.ts`) hacia scripts CLI (`npm run db:seed`) fuera del bundle de Next.js.
- [X] **Demo Code Purge**: Evaluar la vertical `Real Estate` encapsulada por `if (!isDemo)`. Condicionar su build o aislarlo en paquete independiente. (Notfound layout implemented).

### ✅ FASE 411: Estandarización de Nomenclatura & Deuda TS (Completada - Mar-12)

- **Meta:** Resolver la inconsistencia Spanglish y estandarizar la convención histórica. Además de cerrar la brecha de tipado estricto ERA 12.

- [X] **TS Strict Debt Sweep**: Resolución sistemática de errores de tipado branded (`EntityId`, `TenantId`) en toda la plataforma.
- [X] **Rutas Canónicas**: Estandarizar todas las rutas y carpetas del App Router al inglés absoluto.
- [X] **Refactorización de Historial**: Unificar logs y docs que mezclan nomenclaturas antiguas hacia el formato estándar de Fases.

### ✅ FASE 412: Zero-Waterfall & React 19 Alignment (Completada - Mar-12)

- **Meta:** Migrar módulos rezagados (Beta/Placeholder) a Server Components para mayor Rendimiento y Seguridad.

- [X] **useEffect Purge**: Eliminados fetches de lado cliente en dashboards de AI Governance, Workflows y Prompts.
- [X] **Suspense Migration**: Implementación de `use()` de React 19 y fronteras `Suspense` para carga paralela y optimización de LCP.
- [X] **Core Hook Hardening**: Soporte de `initialData` en `useApiList` y `useApiItem`.
- [X] **Deep Purge Certification**: 100% nomenclature standardization & route migration verified.

### ✅ FASE 420: SGSI Evidence Automation & ISO 27001 Hardening (Completada - Mar-12)

- **Meta:** Automatizar la recolección de evidencias técnicas para el cumplimiento normativo.

- [X] **SGSI Orchestrator**: Implementación de `SGSIService` para agregación de logs de seguridad.
- [X] **Automated Reporting**: CLI tool para generación de reportes mensuales en Markdown.
- [X] **Traceability Link**: Vinculación de logs técnicos con el registro de incidentes en `/security`.

### ✅ FASE 413: Modular Architecture & Component Refactor (Completada - Mar-12)

- **Meta:** Implementar patrones de composición avanzados y separar la lógica de negocio (Hooks) de la interfaz para mejorar la mantenibilidad del Knowledge Admin y Landing Pages.

- [X] **Knowledge Explorer Hook**: Extracción de lógica de búsqueda, filtrado y streaming RAG a `useKnowledgeExplorer`.
- [X] **Modular Asset Manager**: Descomposición de `KnowledgeAssetsManager.tsx` en 6 sub-componentes especializados (Metrics, Table, Row, Actions, etc.) y `useKnowledgeAssets`.
- [X] **Shared UI Modularization**: Refactorización de `ConversationalSearch` y `CommandMenu` a arquitectura desacoplada (Hooks + Atomic UI).
- [X] **Landing Page Clients v2**: Modularización total de `FederatedClient`, `PdfBridgeClient` y `VectorSearchClient` siguiendo el patrón de Composición de Era 14.
- [X] **Shared Landing Sections**: Modularización de `EnterpriseSection`, `FeatureGrid` y `FeatureDetailDialog`.
- [X] **SRP Certification**: 100% de los componentes refactored cumplen con el Principio de Responsabilidad Única y Zero-Waterfall.

### ✅ FASE 451: Global Quality Audit & Criterion Unification (Completada - Mar-13)

- **Meta**: Unificar criterios de acceso a datos, reforzar la seguridad de esquemas y auditar la integridad de toda la aplicación tras el "Deep Purge".

- [X] **Unified Data Access**: Migración masiva de servicios a `getTenantCollection` con sesiones de sistema centralizadas.
- [X] **Security Hardening (Regla #11)**: Blindaje de `MongoSanitizer` para soportar `$group` sin comprometer el aislamiento multitenant.
- [X] **Technical Audit (Era 12 Alignment)**: Verificación del cumplimiento de "Branded IDs" y "Zero-Waterfall" en clusters secundarios.
- [X] **Expert Mode Persistence**: Persistencia de preferencias de navegación (Simple/Expert) sincronizada con el estado de i18n.

---

### ✅ FASE 452: P95 Latency Optimization & Security Hardening (Completada - Mar-13)

- **Meta**: Reducir la latencia P95 del endpoint de preferencias de usuario y optimizar el motor Guardian para evitar cuellos de botella.

- [X] **Guardian Optimization (Zero N+1)**: Resolución de jerarquías de grupos en memoria con consulta única a DB en `getUserEffectivePolicies`.
- [X] **Non-blocking Audit**: Implementación de `auditDecision` asíncrono para eliminar bloqueos en el hilo principal de respuesta.
- [X] **Logging Efficiency**: Optimización de `maskPII` y logging no crítico proactivo sin await.
- [X] **Regression Testing**: Actualización y validación de la suite `GuardianEngine.test.ts`.

---

### ✅ FASE 453: Intelligent Metrics Aggregation & Hook Resilience (Completada - Mar-15)

- **Meta**: Resolver discrepancias en los contadores del dashboard mediante agregación server-side y robustecer la persistencia de metadatos en los hooks core.

- [X] **Server-Side Global Stats**: Implementación de tubería de agregación en `/api/admin/knowledge-assets` para cálculos precisos sobre el 100% de la colección filtrada.
- [X] **useApiList Metadata Persistence**: Refactorización del hook base para exponer `rawResponse`, evitando la pérdida de estadísticas durante re-renders o actualizaciones optimistas.
- [X] **Knowledge Assets Integration**: Consumo directo de métricas calculadas por el servidor en `useKnowledgeAssets`, eliminando la reducción manual e ineficiente en el cliente.
- [X] **Unexpected Error Resolution**: Eliminación de cuellos de botella y race conditions en el procesamiento de fragmentos indexados.

---

### ✅ FASE 454: Observability Resilience & Ingestion Recovery (Completada - Mar-15)

- **Meta**: Resolver el bloqueo de ingesta mediante playbooks de recuperación (Reset) y estabilizar la observabilidad industrial mediante la corrección del pipeline de OpenTelemetry.

- [X] **Ingestion Reset Recovery**: Implementación de bypass de transacciones y polyfills de Cursor para asegurar la recuperación de estatus al 0% en la ingesta.
- [X] **OTel Dependency Hardening**: Resolución de conflictos de versiones en `@opentelemetry/*` y migración a API v2 (`resourceFromAttributes`).
- [X] **Registry & Status Sync**: Nuevo endpoint `/api/admin/knowledge-assets/status` para monitoreo reactivo de colas de ingesta.

---

### ✅ FASE 455: DRY Refactor & Admin API Standardization (Wave 4) - Completada Mar-16

- **Meta**: Finalizar la unificación técnica de los entrypoints administrativos y estandarizar la gobernanza de prompts y modelos.

- [X] **Admin API Standardization**: Refactorización de entrypoints para Tenants, Users, Prompts, Logs y KB Chunks usando `withCorrelation` y `handleApiError`.
- [X] **Prompt Governance (Rule #12)**: Implementación de carga dinámica de prompts desde DB con fallbacks inyectados en `PromptService`.
- [X] **Model Governance Alignment**: Sincronización de `AiModelManager` con el nuevo `PromptService` para trazabilidad absoluta de tokens y versiones.
- [X] **Technical Debt Sweep**: Eliminación de las últimas llamadas directas a `logEvento` en favor de `withCorrelation`.

---

---

---

### ✅ FASE 456: Platform-Wide UUID Standardization & DRY (Wave 13) - Completada Mar-16

- **Meta**: Eliminar la generación ad-hoc de UUIDs (`crypto.randomUUID`) centralizando la telemetría en un servicio agnóstico al entorno.

- [X] **CorrelationIdService Implementation**: Centralización de la lógica de generación de identidades con soporte para prefijos de dominio (Telemetry, Billing, RAG).
- [X] **Global Codebase Refactor**: Reemplazo del 100% de las llamadas nativas por el nuevo servicio en Middleware, API Handlers, Services y UI Components.
- [X] **Forensic Traceability**: Mejora de la observabilidad permitiendo rastrear el origen de cada UUID en sistemas distribuidos.
- [X] **Edge Compatibility**: Garantizar que la generación de IDs sea estable en el Edge Runtime de Vercel.

---

### ✅ FASE 457: Core Hardening & Layout Standardization (Wave 14) - Completada Mar-16

- **Meta**: Resolver hallazgos críticos de la auditoría de seguridad y eliminar deuda técnica visual mediante la estandarización de layouts de feature.

- [X] **SSRF Mitigation**: Implementar allowlist de hosts internos en Middleware para resolver riesgo crítico en validación de API keys.
- [X] **FeatureShell Implementation**: Crear arquitectura de layouts jerárquica para eliminar duplicación en ~23 páginas de feature.
- [X] **Type Safety Hardening**: Migración de `initialPromptsPromise` y otros entrypoints a tipos estrictos, eliminando el uso de `any` en `DashboardService`, `PromptsHub` y `DashboardSla`.
- [X] **Effect Resilience**: Implementar `AbortController` en hooks de fetch (DashboardSla) y verificar soporte en hooks core (`useApiList`, `useApiItem`).
- [X] **Zod v2 Optimization**: Migración de `EntityId` y `TenantId` a branded types para garantizar integridad referencial estricta (ERA 12).

---

## 🚀 ERA 15: ADVANCED COMPLIANCE & PERFORMANCE HARDENING (Q3 2026)

**Objetivo:** Elevar la plataforma a estándares de auditoría financiera, automatizar la certificación de evidencias y optimizar la latencia mediante observabilidad proactiva.

### ✅ FASE 430: SGSI PDF Certification & Audit UX (Completada - Mar-12)

- **Meta:** Transformar las evidencias Markdown en documentos legales PDF y modernizar el explorador de auditoría.

- [X] **PDF Evidence Engine**: Implementación de servicio de exportación con branding corporativo y firma de integridad para reportes SGSI.
- [X] **Audit Explorer v2 (Zero-Waterfall)**: Migración total de `/insights/audit` a React Server Components para eliminar latencia de carga inicial.
- [X] **Uncodixify 3.0 Alignment**: Refresco visual del registro de auditoría con alta densidad de datos y filtros avanzados.

### ✅ FASE 440: Proactive Security & P95 Observability (Completada - Mar-12)

- **Meta:** Pasar de una seguridad/observabilidad reactiva a una proactiva.

- [X] **Security Anomaly Engine**: Conectar `SGSIService` con el motor Guardian para detectar y alertar patrones de ataque (Brute-force, PII Leakage) en tiempo real.
- [X] **P95 SLA Alerter**: Sistema de notificaciones automáticas (Toasts + Email) cuando las métricas P95 del SLA Dashboard superan los umbrales críticos.
- [X] **Bottleneck Predictor**: Análisis de tendencias en el uso de RAG y Workflows para predecir saturación de infraestructura.

---

## 🎭 ERA 16: ROLE-BASED UX OPTIMIZATION & ACCESSIBILITY (Q4 2026)

**Objetivo:** Reducir la carga cognitiva mediante una estrategia de visibilidad basada en roles, simplificando la interfaz para usuarios no técnicos y potenciando la eficiencia operativa en campo.

---

### ✅ FASE 501: RAG Governance & AI Models Steering (Wave 16) - Completada Mar-16

- **Meta**: Formalizar el ciclo de vida de la inteligencia, el control dinámico de modelos y la auditoría estructural de ontologías.

- [X] **AI Steering Implementation**: Centralización de la gobernanza en `ai_governance_configs` con selección dinámica de modelos por tarea.
- [X] **Prompt Lifecycle Governance**: Implementación de estados (`DRAFT`, `PUBLISHED`, `FLAGGED`) y filtrado automático en `PromptService`.
- [X] **Ontology Review Loop**: Refactorización de `SovereignOntologyService` para generar propuestas inmutables auditable.
- [X] **Forensic Traceability**: Enriquecimiento de `RagEvaluation` y `DocumentChunk` con versiones de prompts y IDs de modelos.
- [X] **Engine Alignment**: Migración de `OrderAnalysisEngine`, `PredictiveEngine` y motores agénticos al sistema de steering.

---

- **Meta:** Implementar el "UX Mode Provider" a nivel global para ocultar complejidad innecesaria y automatizar la configuración por sector.

- [ ] **Adaptive Navigation**: Filtrar clusters (Governance, Agents, API Keys) automáticamente para el rol `TECHNICIAN`.
- [ ] **Expert Mode Toggle**: Implementación de selector de complejidad en el Sidebar (Zustand managed) para alternar visibilidad de herramientas avanzadas.
- [ ] **Industry Presets & RAG Auto-Tuning**: Herencia automática de `ragPresets` (ChunkSize, Overlap) desde `VerticalRegistryService`.
- [ ] **Industry-Specific Dashboards**: Widgets especializados en `/work` (Checklists para Elevators, Risk Heatmaps para Legal).

---

### ✅ FASE 502: Admin Onboarding & Wizard Architecture (Completada - Mar-16)

- **Meta:** Transformar la configuración del Tenant en un proceso guiado paso a paso para reducir el TTV (Time-to-Value).

- [X] **Fast-Track Onboarding Wizard**: Flujo secuencial en `/onboarding` (Identidad -> Equipo -> Documentos -> Test).
- [X] **Smart Branding Extraction**: Extracción automática de paleta de colores corporativos mediante el análisis del logo subido.
- [X] **Contextual Help v2**: Botones de ayuda vinculados dinámicamente a la base de conocimiento en paneles técnicos.

---

### 📱 FASE 503: Mobile Technician Professional PWA

- **Meta:** Optimizar la experiencia para técnicos en campo con foco en movilidad, rapidez y uso manos libres.

- [ ] **Ultra-Mobile Technician View**: Interfaz de alta densidad/alto contraste optimizada para smartphones en `/technician`.
- [ ] **Voice-to-RAG (Hands-Free)**: Integración de Web Speech API para consultas a la documentación técnica por voz. Opción premium.
- [ ] **Offline-First Resilience**: Estrategias de caching agresivo en `PWAProvider` para manuales técnicos críticos del sector.

---
- **UX/UI (8.5/10):** Accesible, i18n completo, Uncodixify design system.
- **DevOps (8/10):** RAG Tracing, Feature flags, Log structuration.

### ✅ FASE 410: Sanitización Core & Dependencias Demo (Completada - Mar-12)

- **Meta:** Aislar artefactos de prueba de producción y resolver pre-condiciones inseguras.

- [X] **Mock Isolation**: Extraer generadores (ej. bypasses en `instrumentation.ts`) hacia scripts CLI (`npm run db:seed`) fuera del bundle de Next.js.
- [X] **Demo Code Purge**: Evaluar la vertical `Real Estate` encapsulada por `if (!isDemo)`. Condicionar su build o aislarlo en paquete independiente. (Notfound layout implemented).

### ✅ FASE 411: Estandarización de Nomenclatura & Deuda TS (Completada - Mar-12)

- **Meta:** Resolver la inconsistencia Spanglish y estandarizar la convención histórica. Además de cerrar la brecha de tipado estricto ERA 12.

- [X] **TS Strict Debt Sweep**: Resolución sistemática de errores de tipado branded (`EntityId`, `TenantId`) en toda la plataforma.
- [X] **Rutas Canónicas**: Estandarizar todas las rutas y carpetas del App Router al inglés absoluto.
- [X] **Refactorización de Historial**: Unificar logs y docs que mezclan nomenclaturas antiguas hacia el formato estándar de Fases.

### ✅ FASE 412: Zero-Waterfall & React 19 Alignment (Completada - Mar-12)

- **Meta:** Migrar módulos rezagados (Beta/Placeholder) a Server Components para mayor Rendimiento y Seguridad.

- [X] **useEffect Purge**: Eliminados fetches de lado cliente en dashboards de AI Governance, Workflows y Prompts.
- [X] **Suspense Migration**: Implementación de `use()` de React 19 y fronteras `Suspense` para carga paralela y optimización de LCP.
- [X] **Core Hook Hardening**: Soporte de `initialData` en `useApiList` y `useApiItem`.
- [X] **Deep Purge Certification**: 100% nomenclature standardization & route migration verified.

### ✅ FASE 420: SGSI Evidence Automation & ISO 27001 Hardening (Completada - Mar-12)

- **Meta:** Automatizar la recolección de evidencias técnicas para el cumplimiento normativo.

- [X] **SGSI Orchestrator**: Implementación de `SGSIService` para agregación de logs de seguridad.
- [X] **Automated Reporting**: CLI tool para generación de reportes mensuales en Markdown.
- [X] **Traceability Link**: Vinculación de logs técnicos con el registro de incidentes en `/security`.

### ✅ FASE 413: Modular Architecture & Component Refactor (Completada - Mar-12)

- **Meta:** Implementar patrones de composición avanzados y separar la lógica de negocio (Hooks) de la interfaz para mejorar la mantenibilidad del Knowledge Admin y Landing Pages.

- [X] **Knowledge Explorer Hook**: Extracción de lógica de búsqueda, filtrado y streaming RAG a `useKnowledgeExplorer`.
- [X] **Modular Asset Manager**: Descomposición de `KnowledgeAssetsManager.tsx` en 6 sub-componentes especializados (Metrics, Table, Row, Actions, etc.) y `useKnowledgeAssets`.
- [X] **Shared UI Modularization**: Refactorización de `ConversationalSearch` y `CommandMenu` a arquitectura desacoplada (Hooks + Atomic UI).
- [X] **Landing Page Clients v2**: Modularización total de `FederatedClient`, `PdfBridgeClient` y `VectorSearchClient` siguiendo el patrón de Composición de Era 14.
- [X] **Shared Landing Sections**: Modularización de `EnterpriseSection`, `FeatureGrid` y `FeatureDetailDialog`.
- [X] **SRP Certification**: 100% de los componentes refactored cumplen con el Principio de Responsabilidad Única y Zero-Waterfall.

### ✅ FASE 451: Global Quality Audit & Criterion Unification (Completada - Mar-13)

- **Meta**: Unificar criterios de acceso a datos, reforzar la seguridad de esquemas y auditar la integridad de toda la aplicación tras el "Deep Purge".

- [X] **Unified Data Access**: Migración masiva de servicios a `getTenantCollection` con sesiones de sistema centralizadas.
- [X] **Security Hardening (Regla #11)**: Blindaje de `MongoSanitizer` para soportar `$group` sin comprometer el aislamiento multitenant.
- [X] **Technical Audit (Era 12 Alignment)**: Verificación del cumplimiento de "Branded IDs" y "Zero-Waterfall" en clusters secundarios.
- [X] **Expert Mode Persistence**: Persistencia de preferencias de navegación (Simple/Expert) sincronizada con el estado de i18n.

---

### ✅ FASE 452: P95 Latency Optimization & Security Hardening (Completada - Mar-13)

- **Meta**: Reducir la latencia P95 del endpoint de preferencias de usuario y optimizar el motor Guardian para evitar cuellos de botella.

- [X] **Guardian Optimization (Zero N+1)**: Resolución de jerarquías de grupos en memoria con consulta única a DB en `getUserEffectivePolicies`.
- [X] **Non-blocking Audit**: Implementación de `auditDecision` asíncrono para eliminar bloqueos en el hilo principal de respuesta.
- [X] **Logging Efficiency**: Optimización de `maskPII` y logging no crítico proactivo sin await.
- [X] **Regression Testing**: Actualización y validación de la suite `GuardianEngine.test.ts`.

---

### ✅ FASE 453: Intelligent Metrics Aggregation & Hook Resilience (Completada - Mar-15)

- **Meta**: Resolver discrepancias en los contadores del dashboard mediante agregación server-side y robustecer la persistencia de metadatos en los hooks core.

- [X] **Server-Side Global Stats**: Implementación de tubería de agregación en `/api/admin/knowledge-assets` para cálculos precisos sobre el 100% de la colección filtrada.
- [X] **useApiList Metadata Persistence**: Refactorización del hook base para exponer `rawResponse`, evitando la pérdida de estadísticas durante re-renders o actualizaciones optimistas.
- [X] **Knowledge Assets Integration**: Consumo directo de métricas calculadas por el servidor en `useKnowledgeAssets`, eliminando la reducción manual e ineficiente en el cliente.
- [X] **Unexpected Error Resolution**: Eliminación de cuellos de botella y race conditions en el procesamiento de fragmentos indexados.

---

### ✅ FASE 454: Observability Resilience & Ingestion Recovery (Completada - Mar-15)

- **Meta**: Resolver el bloqueo de ingesta mediante playbooks de recuperación (Reset) y estabilizar la observabilidad industrial mediante la corrección del pipeline de OpenTelemetry.

- [X] **Ingestion Reset Recovery**: Implementación de bypass de transacciones y polyfills de Cursor para asegurar la recuperación de estatus al 0% en la ingesta.
- [X] **OTel Dependency Hardening**: Resolución de conflictos de versiones en `@opentelemetry/*` y migración a API v2 (`resourceFromAttributes`).
- [X] **Registry & Status Sync**: Nuevo endpoint `/api/admin/knowledge-assets/status` para monitoreo reactivo de colas de ingesta.

---

### ✅ FASE 455: DRY Refactor & Admin API Standardization (Wave 4) - Completada Mar-16

- **Meta**: Finalizar la unificación técnica de los entrypoints administrativos y estandarizar la gobernanza de prompts y modelos.

- [X] **Admin API Standardization**: Refactorización de entrypoints para Tenants, Users, Prompts, Logs y KB Chunks usando `withCorrelation` y `handleApiError`.
- [X] **Prompt Governance (Rule #12)**: Implementación de carga dinámica de prompts desde DB con fallbacks inyectados en `PromptService`.
- [X] **Model Governance Alignment**: Sincronización de `AiModelManager` con el nuevo `PromptService` para trazabilidad absoluta de tokens y versiones.
- [X] **Technical Debt Sweep**: Eliminación de las últimas llamadas directas a `logEvento` en favor de `withCorrelation`.

---

---

---

### ✅ FASE 456: Platform-Wide UUID Standardization & DRY (Wave 13) - Completada Mar-16

- **Meta**: Eliminar la generación ad-hoc de UUIDs (`crypto.randomUUID`) centralizando la telemetría en un servicio agnóstico al entorno.

- [X] **CorrelationIdService Implementation**: Centralización de la lógica de generación de identidades con soporte para prefijos de dominio (Telemetry, Billing, RAG).
- [X] **Global Codebase Refactor**: Reemplazo del 100% de las llamadas nativas por el nuevo servicio en Middleware, API Handlers, Services y UI Components.
- [X] **Forensic Traceability**: Mejora de la observabilidad permitiendo rastrear el origen de cada UUID en sistemas distribuidos.
- [X] **Edge Compatibility**: Garantizar que la generación de IDs sea estable en el Edge Runtime de Vercel.

---

### ✅ FASE 457: Core Hardening & Layout Standardization (Wave 14) - Completada Mar-16

- **Meta**: Resolver hallazgos críticos de la auditoría de seguridad y eliminar deuda técnica visual mediante la estandarización de layouts de feature.

- [X] **SSRF Mitigation**: Implementar allowlist de hosts internos en Middleware para resolver riesgo crítico en validación de API keys.
- [X] **FeatureShell Implementation**: Crear arquitectura de layouts jerárquica para eliminar duplicación en ~23 páginas de feature.
- [X] **Type Safety Hardening**: Migración de `initialPromptsPromise` y otros entrypoints a tipos estrictos, eliminando el uso de `any` en `DashboardService`, `PromptsHub` y `DashboardSla`.
- [X] **Effect Resilience**: Implementar `AbortController` en hooks de fetch (DashboardSla) y verificar soporte en hooks core (`useApiList`, `useApiItem`).
- [X] **Zod v2 Optimization**: Migración de `EntityId` y `TenantId` a branded types para garantizar integridad referencial estricta (ERA 12).

---

## 🚀 ERA 15: ADVANCED COMPLIANCE & PERFORMANCE HARDENING (Q3 2026)

**Objetivo:** Elevar la plataforma a estándares de auditoría financiera, automatizar la certificación de evidencias y optimizar la latencia mediante observabilidad proactiva.

### ✅ FASE 430: SGSI PDF Certification & Audit UX (Completada - Mar-12)

- **Meta:** Transformar las evidencias Markdown en documentos legales PDF y modernizar el explorador de auditoría.

- [X] **PDF Evidence Engine**: Implementación de servicio de exportación con branding corporativo y firma de integridad para reportes SGSI.
- [X] **Audit Explorer v2 (Zero-Waterfall)**: Migración total de `/insights/audit` a React Server Components para eliminar latencia de carga inicial.
- [X] **Uncodixify 3.0 Alignment**: Refresco visual del registro de auditoría con alta densidad de datos y filtros avanzados.

### ✅ FASE 440: Proactive Security & P95 Observability (Completada - Mar-12)

- **Meta:** Pasar de una seguridad/observabilidad reactiva a una proactiva.

- [X] **Security Anomaly Engine**: Conectar `SGSIService` con el motor Guardian para detectar y alertar patrones de ataque (Brute-force, PII Leakage) en tiempo real.
- [X] **P95 SLA Alerter**: Sistema de notificaciones automáticas (Toasts + Email) cuando las métricas P95 del SLA Dashboard superan los umbrales críticos.
- [X] **Bottleneck Predictor**: Análisis de tendencias en el uso de RAG y Workflows para predecir saturación de infraestructura.

---

## 🎭 ERA 16: ROLE-BASED UX OPTIMIZATION & ACCESSIBILITY (Q4 2026)

**Objetivo:** Reducir la carga cognitiva mediante una estrategia de visibilidad basada en roles, simplificando la interfaz para usuarios no técnicos y potenciando la eficiencia operativa en campo.

---

### ✅ FASE 501: Adaptive UX & Industry Dashboards (Completada - Mar-16)

- **Meta**: Formalizar el ciclo de vida de la inteligencia, el control dinámico de modelos y la auditoría estructural de ontologías.

- [X] **AI Steering Implementation**: Centralización de la gobernanza en `ai_governance_configs` con selección dinámica de modelos por tarea.
- [X] **Prompt Lifecycle Governance**: Implementación de estados (`DRAFT`, `PUBLISHED`, `FLAGGED`) y filtrado automático en `PromptService`.
- [X] **Ontology Review Loop**: Refactorización de `SovereignOntologyService` para generar propuestas inmutables auditable.
- [X] **Forensic Traceability**: Enriquecimiento de `RagEvaluation` y `DocumentChunk` con versiones de prompts y IDs de modelos.
- [X] **Engine Alignment**: Migración de `OrderAnalysisEngine`, `PredictiveEngine` y motores agénticos al sistema de steering.

---

- **Meta:** Implementar el "UX Mode Provider" a nivel global para ocultar complejidad innecesaria y automatizar la configuración por sector.

- [X] **Adaptive Navigation**: Filtrar clusters (Governance, Agents, API Keys) automáticamente para el rol `TECHNICIAN`.
- [X] **Expert Mode Toggle**: Implementación de selector de complejidad en el Sidebar (Zustand managed) para alternar visibilidad de herramientas avanzadas.
- [X] **Industry Presets & RAG Auto-Tuning**: Herencia automática de `ragPresets` (ChunkSize, Overlap) desde `VerticalRegistryService`.
- [X] **Industry-Specific Dashboards**: Widgets especializados en `/work` (Checklists para Elevators, Risk Heatmaps para Legal).

---

### ✅ FASE 502: Admin Onboarding & Wizard Architecture (Completada - Mar-16)

- **Meta:** Transformar la configuración del Tenant en un proceso guiado paso a paso para reducir el TTV (Time-to-Value).

- [X] **Fast-Track Onboarding Wizard**: Flujo secuencial en `/onboarding` (Identidad -> Equipo -> Documentos -> Test).
- [X] **Smart Branding Extraction**: Extracción automática de paleta de colores corporativos mediante el análisis del logo subido.
- [X] **Contextual Help v2**: Botones de ayuda vinculados dinámicamente a la base de conocimiento en paneles técnicos.

---

### ✅ FASE 503: Mobile Technician Professional PWA (Completada - Mar-16)

- **Meta:** Optimizar la experiencia para técnicos en campo con foco en movilidad, rapidez y uso manos libres.

- [X] **Ultra-Mobile Technician View**: Interfaz de alta densidad/alto contraste optimizada para smartphones en `/technician`.
- [X] **Voice-to-RAG (Hands-Free)**: Integración de Web Speech API para consultas a la documentación técnica por voz. Opción premium.
- [X] **Offline-First Resilience**: Estrategias de caching agresivo en `PWAProvider` para manuales técnicos críticos del sector.

---

**Documento:** ROADMAP_MASTER.md

- **Last Audit**: 2026-03-16 (Fase 601 Defined - Era 19 Initiated)
- **Status**: PRODUCTION READY (PWA Field Operations & Adaptive UX)
- **Versión Core**: 8.3.0
  **Fases en Cola (VIWS 2028):** Iniciar transición a Federated Learning y Gemelos Digitales Cognitivos.
