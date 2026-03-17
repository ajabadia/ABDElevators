# ROADMAP_MASTER – Era 19: Security Consolidation & Clean Architecture

## 🌊 ERA 19: SECURITY CONSOLIDATION & ARCHITECTURAL HARDENING (Q1-Q2 2026)

**Objetivo:** Consolidar la seguridad mediante el aislamiento del middleware, eliminar la deuda técnica de tipos ("any") en el núcleo y estandarizar la arquitectura de servicios para producción masiva.

---

### ✅ FASE 601: Middleware Isolation & Security Shell (Completada - Mar-17)
- **Meta:** Blindar el punto de entrada de la aplicación mediante el aislamiento de la lógica de autenticación y permisos.
- [X] **Middleware Extraction**: Refactorización de `middleware.ts` para usar hooks de seguridad aislados.
- [X] **Security Headers Enforcement**: Implementación estricta de `Content-Security-Policy` y `Permissions-Policy`.
- [X] **Zero-Trust Logic**: Validación de sesión en cada salto de ruta con fallback a `auth/login`.

---

### ✅ FASE 602: Core Schema Hardening & Type Safety (Completada - Mar-17)
- **Meta:** Eliminar el uso de `any` en los esquemas centrales y servicios exportados para prevenir errores en tiempo de ejecución.
- [X] **Zod Schema Audit**: Revisión y tipado estricto de `RagFeedbackSchema` y `RagUsageSchema`.
- [X] **Service Interface Hardening**: Tipado de retornos en `FeedbackService` y `UsageService`.
- [X] **Strict Type Flag**: Activación simbólica de revisión manual "Zero-Any" en módulos críticos de telemetría.

---

### ✅ FASE 603: Telemetry Enhancement & Implicit Feedback (Completada - Mar-17)
- **Meta:** Capturar el contexto de UI en la telemetría RAG y rastrear interacciones implícitas de usuario.
- [X] **UI Context Tracking**: Inclusión de `uiOrigin` y `uiContext` en los logs de feedback.
- [X] **Implicit Usage API**: Nuevo endpoint `/api/feedback/usage` para clicks en hallazgos.
- [X] **Correlation ID Bridge**: Propagación del ID de correlación desde la búsqueda hasta el feedback.

---

### ✅ FASE 610: Production Readiness & SLA Monitoring (Completada - Mar-17)
- **Meta:** Asegurar que los endpoints críticos cumplen con los SLAs de latencia y registran errores estructurados.
- [X] **SLA Enforcement**: Registro de advertencias si `/api/pedidos/analyze` supera los 2000ms.
- [X] **Structured Error Bridge**: Mapeo de `AppError` a respuestas JSON con códigos de error estandarizados.
- [X] **Performance Audit**: Verificación de latencias P95 en entorno de simulación.

---

### ✅ FASE 618: Roadmap & Documentation Synchronization (Completada - Mar-17)
- **Meta:** Sincronizar el estado del proyecto en toda la documentación técnica y marketing.
- [X] **ROADMAP_MASTER.md Sync**: Actualización de fases 601-618.
- [X] **README.md v8.4.0**: Actualización de versión y registro de cambios de la Era 19.
- [X] **Map.md Audit**: Sincronización de rutas y estados de auditoría.
- [X] **Landing Page Consistency**: Actualización de logros en `Landing.json` (ES/EN).

---

## 🌊 ERA 12: RELATIONAL INTEGRITY & COGNITIVE EVOLUTION (Q2-Q3 2026)

**Objetivo:** Consolidar la arquitectura de datos eliminando silos ("islas"), garantizando integridad referencial estricta y sentando las bases para la cognición autónoma multitenant.

---

### ✅ FASE 370: Governance Hub & DX Testing (Completada - Mar-11)
- **Meta:** Unificar la observabilidad SOC2 y modernizar la gestión de identidades programáticas con infraestructura corporativa de pruebas.
- [x] **Governance Hub**: Portal unificado en `/governance` con Audit Logs, Monitor de Workflows y Security Status.
- [x] **API Keys v2**: Implementación de SHA-256 hashing y scopes granulares (Spaces, Assets, IPs).
- [x] **DX Infrastructure**: Setup base de **Vitest** y primera suite de pruebas para Workflow Executions.
- [x] **API Observability**: Nuevo endpoint `/api/admin/workflows/executions` para auditoría técnica.

---

### ✅ FASE 350: Data Architecture & Relational Integrity (Completada - Mar-10)
- **Meta:** Resolver las "Islas de Datos" identificadas en la auditoría 2901.txt, estandarizando esquemas (Zod) y garantizando la integridad referencial en todo el sistema.
- **Referencia:** `[2901.txt](file:///d:/desarrollos/ABDElevators/Documentaci%C3%B3n/29/2901.txt)` y `[2902_db_refactor_guidelines.md](file:///d:/desarrollos/ABDElevators/Documentaci%C3%B3n/29/2902_db_refactor_guidelines.md)`
- [x] **Data Primitives**: Implementar `EntityIdSchema` y `TenantScopedSchema` globales. (Centralizados en `@abd/platform-core`).
- [x] **RAG Quality Graph**: Resolver el aislamiento de Golden Sets contra Chunks creando colecciones `RAGEvaluation`.
- [x] **RAG Query Log**: Implementar la colección `RAGQueryLog` para trazabilidad real con `spaceId` obligatorio.
- [x] **Workflows Observability**: Crear colección `workflow_executions` y conectar las instancias de runtime con las definiciones.
- [x] **Knowledge & Assets Integrity**: Hacer obligatorio `spaceId` y `documentTypeId`.
- [x] **Universal Migrations**: Ejecutar scripts de migración y mitigación de huérfanos.
- [x] **Fase 350.2: Relational Integrity Hardening**: Cerrar brechas de tipado en Schemas (Zod) y resolver "Islas de Datos" remanentes en Auth e Intelligence.

---

### ✅ FASE 11: Public Trust & Laboratory Evolution (Completada - Mar-11)
- **Meta:** Modernizar el cluster público (i18n, a11y) y activar herramientas industriales en el Labs Hub representadas en el MVP.
- [x] **i18n Master Audit**: 100% de literales en Pricing, About y Contact (ES/EN).
- [x] **Vanguardia Agéntica UI**: Diseño premium con glassmorphism y gradientes en VisionSection.
- [x] **Mock Data Generator**: Activación de herramienta para generación sintética de Tenants/Assets.
- [x] **Predictive Costing Foundation**: Implementación de `UsageService` con proyecciones P95.
- [x] **Final Compliance Sweep**: Auditoría SEO y Metadata finalizada.

---

### ✅ FASE 344: Structural Performance & Era 12 Alignment (Completada - Mar-11)
- **Meta:** Resolver hallazgos estructurales y de performance asegurando compatibilidad con los nuevos esquemas relacionales de la Fase 350.
- [x] Audit `navigation-config.ts` vs `map.md` (Navigation Sync)
- [x] Integrate `EntityIdSchema` in relational schemas (Hardened End-to-End)
- [x] Eliminate `any` usage in core services (`WorkflowTaskService`, `IntelligenceWorker`)
- [x] **Global Hygiene Pass**: Optimización de `NavigationShell`, `PublicNavbar` y `PublicFooter` (Glassmorphism 3XL).
- [x] **Relational Performance**: Migración de `BaseRepository` y repositorios clave a Branded Types.
- [x] **Server Error States**: Implementar manejo de estados de error y loading consistentes (`SupportErrorState`).
- [x] **Branded ID Implementation**: Migración total de `TenantService`, `TicketService` y `SpaceService` a `EntityId`/`TenantId`.

---

### ✅ FASE 345: Security Depth & Autonomous Governance (Completada - Mar-11)
- **Meta:** Implementar blindaje ABAC/RBAC avanzado y rate limiting por tenant con observabilidad forense.
- [x] **Guardian V3.1 Hardening**: Resolución jerárquica de políticas y caché distribuida en Redis para persistencia multi-instancia.
- [x] **Per-Tenant Throttling**: Rate limiting dinámico basado en `tenantId` con overrides configurables vía `TenantLimitsService`.
- [x] **Decision Auditing**: Registro automático de cada evaluación de Guardian en `access_logs` (Audit Trail Forense).
- [x] **Security Regression Tests**: Suite de tests Jest para motores de permiso (`GuardianEngine.test.ts`).
- [x] **Governance Headers**: Implementación de `X-RateLimit-Tenant-ID` en el middleware para transparencia del lado del cliente.
- [x] **UI Refinement**: Visualización de Tiers y Overrides de Rate Limit en el dashboard de `/agents/governance`.
- [x] **Help Menu Restructuring**: Implementación de navegación jerárquica para la sección de Ayuda/Soporte.

---

### ✅ FASE 360: AI Sidekick UX & Intelligence Audit (Completed)
- **Meta:** Resolver la repetitividad de las respuestas del "AI Sidekick" (Asistente lateral) y asegurar que sea contextual y funcional en todas las vistas.
- [x] **Context Awareness Audit**: Revisar los prompts del Sidekick para asegurar que detecten la ruta actual (`pathname`) y el estado del usuario.
- [x] **Response Logic Refactor**: Eliminar respuestas genéricas o "hardcoded fallback" que resultan en la misma experiencia sin importar la sección.
- [x] **Status Verification**: Implementar un indicador de "Estado de Conexión" para saber cuándo el Sidekick está realmente operativo vs. en modo fallback offline.

---

### ✅ FASE 361: Navigation Architecture & Accordion UX (Completada - Mar-10)
- **Meta:** Limpiar la interfaz de navegación implementando menús tipo acordeón para reducir el ruido visual y auditar a fondo `navigation-config.ts`.
- [x] **Accordions UI**: Refactorizar el `NavigationShell` para agrupar clusters secundarios en acordeones desplegables.
- [x] **Config Deep Dive**: Revisión exhaustiva de `navigation-config.ts` para alinear permisos, roles y organización visual de las rutas.
- [x] **Mobile Optimization**: Asegurar que los acordeones funcionen perfectamente en vistas móviles reducidas.

---

### 🗺️ FASE 363: Universal Navigation Nesting & i18n Alignment (Completada - Mar-10)
- **Meta:** Implementar estructuras jerárquicas en todos los Hubs y unificar los literales de i18n para coherencia total.
- [x] **Nesting Implementation**: Implementar `children` en todos los dominios (Intelligence, Agents, Insights, Work).
- [x] **i18n Key Unification**: Estandarizar literales entre sidebar, breadcrumbs y Hub titles.
- [x] **Legacy Cleanup**: Purga de llaves redundantes en DB y sincronización global.
- [x] **Phase 343.1: Work Hub Modernization**:
  - [x] Modernización de la Landing Page principal (Full Dark Premium).
  - [x] Modernización del Feature Hub y todas las sub-páginas de features.
  - [x] Refresh de las páginas de Legal (Privacy, Terms, Accessibility).
  - [x] Modernización de Sandbox interactivo e i18n migration.
  - [x] Estandarización de About, Contact y Upgrade para Era 12.
  - [x] Modernización de Auth Flows (Login, Signup-Invite, Magic-Link).
  - [x] Dashboard Public Completion Status: 100%.

---

### ✅ FASE 364: Platform Polish (Completada - Mar-10)
- **Meta:** Refinar detalles visuales, accesibilidad y performance en toda la plataforma.
- [x] **Cross-browser Audit**: Verificar consistencia en Safari, Firefox y Chrome.
- [x] **A11y Pass**: Revisar contrastes y navegación por teclado en nuevos acordeones.
- [x] **Performance optimization**: Lazy loading de componentes pesados en los Hubs.
- [x] **Standardized i18n & Sanitization**: Reconstrucción de `common.json` (ES/EN) para eliminar duplicados y errores de sintaxis.
- [x] **Shared UI Resilience**- v7.2.8: Finalización del cluster público al 100%.

---

## 📜 History & Archived Milestones

### 🗓️ Recent Ship (March 2026)
- **Era 19: Security Consolidation & Clean Architecture**: Middleware Isolation & Type Safety — COMPLETADA ✅🛡️
- **Era 18: Governance Dashboard & Visual Health Monitoring**: Real-time stats & Health Scores — COMPLETADA ✅🏰
- **Era 17: Prompt Sync Automation & CI/CD Integrity**: Automated sync service — COMPLETADA ✅🔄
- **Era 16: RAG Governance & AI Models Steering (Wave 16)**: Dynamic Model Selection, Prompt Lifecycle & Ontology Proposals — COMPLETADA ✅🎭
- **Era 15: RAG Pipeline Hardening & Telemetry Enforcement**: Domain Consolidation, Job Hardening & SSE Progress (Ph 458) — COMPLETADA ✅🚀
- **Era 14/15: Technical Debt & Canonical Alignment**: Nomenclature Standardization, Domain Governance & Orders Consolidation (Ph 450) — COMPLETADA ✅🚀
- **Era 14: Technical Debt & Platform Hygiene**: Deep Purge & Modular Architecture — COMPLETADA 🧹🚀
- **Era 13: Security & Convergence Sprint**: ISO 27001 (SGSI), PII Masking, Multitenant Pentest (PASSED) & RAG Unification — COMPLETADA 🛡️🚀
- **Era 12: Relational Integrity & Branded Types**: EntityIdSchema & Tenant Isolation — COMPLETADA ✅🛡️

### ✅ ERA 11: COGNITIVE & HIERARCHICAL (MARZO 2026)
- **Phase 343: Full-App Compliance Sweep** -> UI-Styling & Error Resilience in all clusters.
- **Phase 342: Uncodixify & Industrial Error Resilience** -> Standardized UI and Support integration.
- **Phase 320: Unified Navigation Architecture** -> Domain-based routing & NavigationShell.
- **Phase 308: Universal Domain Intelligence** -> Agent Builder, Quality Insights, Compliance Hub, Domain Linker.
- **Phase 307: Reliability & Quality** -> RagJudge Service, Causal Analytics, Quality Dashboard.
- **Phase 306: Cognitive Retrieval Engine** -> Tiered discovery, query normalization, context orchestration.
- **Phase 305: Hierarchical RAG Foundation** -> Multi-tier indexing, structural segmentation, doc_profiles/sections.

---

## 🌅 ERA 11: HIERARCHICAL RAG & COGNITIVE ARCHITECTURE (Q2 2026)

**Objetivo:** Evolución hacia un sistema de RAG jerárquico (MemoRAG style) con observabilidad profunda y automatización de cumplimiento industrial.

---

### ✅ FASE 305: Hierarchical RAG Foundation (Marzo 2026)
- **Meta:** Superar las limitaciones de búsqueda plana de fragmentos mediante perfiles de documentos y secciones.
- [x] **Data Model v2**: Implementar colecciones `doc_profiles` y `doc_sections`.
- [x] **Hierarchical Indexing**: Nuevo pipeline de ingesta que genera resúmenes y embeddings en tres niveles (Doc, Sección, Fragmento).
- [x] **Structural Segmentation**: Segmentación inteligente de PDFs basada en jerarquía semántica e integración en UI/Trailing.

---

### ✅ FASE 306: Cognitive Retrieval Engine (Marzo 2026)
- **Meta:** Implementar el motor de búsqueda jerárquica con pre-procesamiento de consultas.
- [x] **Tiered Discovery**: Búsqueda en cascada (Profile -> Section -> Chunk) para maximizar relevancia y minimizar ruido.
- [x] **Query Normalization**: Normalización y traducción automática de consultas antes de la búsqueda.
- [x] **Context Orchestration**: Constructor de contexto inteligente ajustado a presupuestos de tokens.

---

### ✅ FASE 307: Reliability & Quality (RagJudge) - Marzo 2026
- **Meta:** Implementar "LLM as a Judge" para garantizar la fiabilidad industrial de las respuestas.
- [x] **RagJudge Service**: Evaluación automática de *Faithfulness*, *Relevance* y *Precision*. (Integrated in Quality Dashboard)
- [x] **Causal Analytics**: Clasificación de fallos (Alucinación vs. Mala Recuperación).
- [x] **Reliability Dashboard**: Visualización de *Hallucination Score* y KPIs de fiabilidad para el COO.

---

### 🏭 FASE 308: Universal Domain Intelligence (Suite Evolution)
- **Meta:** Generalizar la inteligencia de cumplimiento industrial y exponer los primeros módulos de la Suite Era 10.
- [x] **Quality Insights Service**: Panel de KPIs por operario/parte basado en `ragevaluations` y ejecución enriquecida. (Ref: 2802.txt Phase 1)
- [x] **Domain Linker**: Vinculación automática entre Pedidos/Activos y Documentación técnica.
- [x] **Agentic Builder (Alpha)**: No-code/low-code builder para asistentes técnicos basados en plantillas de workflows. (Ref: 2802.txt Phase 2)
- [x] **Compliance Hub**: Trazabilidad completa de "Documento -> Instrucción -> Ejecución -> Verificación".

---

### ✅ FASE 310: Golden Benchmarking & RAG Observability (Marzo 2026)
- **Meta:** Implementar un ciclo de evaluación científica mediante Golden Sets y experimentos comparativos.
- [x] **Golden Set Engine**: Sistema de gestión de colecciones de prueba maestro para benchmark industrial.
- [x] **Offline Experiment Runner**: Motor de comparación v1 vs v2 con cálculo automático de *Recall* y *Faithfulness*.
- [x] **Deep Observability**: Captura extendida de `flowType`, `engineVersion` y `agentKey` en cada consulta.
- [x] **Elevator Industry Pack**: 20+ queries especializadas para troubleshooting de maniobras (Arca II, etc.).

---

### ✅ FASE 310.2: Backend Consolidation & Observability Polish (Marzo 2026)
- **Meta:** Unificar los hubs de Operaciones y Entidades, eliminando deuda técnica y estandarizando las notificaciones.
- [x] **Entity Consolidation**: Rutas centralizadas en `/api/core/entities` y abstracción al hook `useEntity`.
- [x] **Hubs Unification**: Fusión de reportes (Schedules, History, Exports) en una única vista `Tabs` responsiva.
- [x] **Multi-tenant Guard (Definitive)**: Estandarización de `SecureCollection` y corrección de privilegios `SUPER_ADMIN` en servicios de observabilidad.
- [x] **Command Hub (Modal)**: Refactorización del System Hub a arquitectura de Diálogo (Modal) para máxima fiabilidad y UX.
- [x] **Notification Bridge**: Hook universal `useNotification` que coordina Toasts + DB Logging sincronizados.
- [x] **SLA Dashboard**: Monitor de rendimiento con agregaciones p95 para rutas y triggers de autodiagnóstico.

---

### ✅ FASE 320: Unified Navigation Architecture & Role-Agnostic Routing (Marzo 2026)
- **Meta:** Transición de enrutamiento basado en roles (`/admin/...`) a enrutamiento basado en dominios (`/work`, `/intelligence`, `/agents`, `/insights`), filtrado dinámicamente por Guardian V3.
- [x] **Fase 1: Foundations**: `NAVIGATION_CONFIG` centralizado y `NavigationShell` adaptativo.
- [x] **Fase 2: Gradual Migration**: Redirección y movimiento de rutas Core Hubs.
- [x] **Fase 3: Consolidation**: Unificación de configuraciones y purga de rutas legacy.
- [x] **Fase 4: Polish**: Búsqueda global de navegación (CMD+K) y analíticas de uso. (CMD+K updated with and domain context).

---

### ✅ FASE 342: Uncodixify & Industrial Error Resilience (Marzo 2026)
- **Meta:** Aplicar los estándares Uncodixify (Anti-AI) y asegurar una gestión de errores resiliente con integración de soporte.
- [x] **Audit Plan**: Mapeadas todas las rutas canónicas del Admin Dashboard e Insights.
- [x] **Uncodixify Sprint**: Refactorizados Admin Dashboard, Analytics, Audit, Reports y Compliance — radios 12px, tipografía profesional, tokens de diseño unificados.
- [x] **Support Integration**: Verificado y estandarizado `SupportErrorState` como componente único de error global, con propagación de Digest, URL y Timestamp a tickets de soporte.

---

### ✅ FASE 343: Full-App Compliance Sweep — UI-Styling & Error Resilience (Marzo 2026)
- **Meta:** Pasar las skills `ui-styling` y `error-resolution-handler` en cada ruta canónica de la aplicación. Aprovechar cada ruta para identificar si aplican skills adicionales del ciclo `app-full-reviewer`.

---

#### 🏁 CLUSTER: SuperAdmin Command Center (`/admin-dashboard`)
- [x] `/admin-dashboard` — **Platform Dashboard** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[db]`
- [x] `/admin-dashboard/tenants` — **Tenant Management** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[lazy]` `[db]`
- [x] `/admin-dashboard/infra` — **Infra Health** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]`
- [x] `/admin-dashboard/logs` — **System Logs** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[db]` `[hyg]`

---

#### ⚙️ CLUSTER: Work & Operations (`/work`)
- [x] `/work` — **Work Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]`
- [x] `/work/orders` — **Orders Explorer** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[lazy]` `[toast]` `[llm]`
- [x] `/work/tasks_legacy` — **Task Management** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]`
- [x] Refactor `/work/checklists` cluster to HubPage pattern.
- [x] Audit for missing A11y/i18n in shared error states.
- [x] Fix legacy links in `ChecklistConfigList`.
- [x] `/work/checklists` — **Checklist Execution** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[lazy]` `[toast]` `[db]`
- [x] `/work/checklists/new` — **New Checklist Config** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]`
- [x] `/work/checklists/[id]` — **Edit Checklist Config** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]`
- [x] `/work/cases` — **Case Detail** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[llm]`
- [x] `/work/workshop` — **Workshop Portal** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]`

---

#### 🧠 CLUSTER: Intelligence & Knowledge (`/intelligence`)
- [x] `/intelligence` — **Intelligence Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]`
- [x] `/intelligence/explorer` — **Neural Explorer (RAG Search)** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[llm]` `[hyg]`
- [x] `/intelligence/assets` — **Asset Manager** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]` `[db]`
- [x] `/intelligence/my-docs` — **My Documents** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]`
- [x] `/intelligence/spaces` — **Spaces Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]`
- [x] `/intelligence/document-types` — **Document Types** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]` `[db]`
- [x] `/intelligence/trends` — **Intelligence Trends** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[llm]`

---

#### ⚡ CLUSTER: AI & Automation (`/agents`)
- [x] `/agents` — **Agents Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]`
- [x] `/agents/agents` — **Agent Builder** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[llm]` `[hyg]`
- [x] `/agents/workflows` — **Workflow Studio** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[llm]` `[hyg]`
- [x] `/agents/rag-quality` — **RAG Quality** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[llm]` `[db]`
- [x] `/agents/golden-sets` — **Golden Benchmarking** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[llm]`
- [x] `/agents/governance` — **AI Governance / Model Registry** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[llm]`
- [x] `/agents/prompts` — **Prompt Studio** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[llm]` `[lazy]`
- [x] `/agents/playground` — **AI Playground** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[llm]` `[hyg]`

---

#### 📊 CLUSTER: Insights & Audit (`/insights`)
- [x] `/insights` — **Insights Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]`
- [x] `/insights/analytics` — **Analytics Center** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[db]` `[hyg]`
- [x] `/insights/reports` — **Report Schedules** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[toast]` `[llm]`
- [x] `/insights/audit` — **Audit Log Explorer** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]` `[db]` `[sec]`
- [x] `/insights/security` — **Security Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]`
- [x] `/insights/compliance` — **Compliance GDPR** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[toast]`
- [x] `/insights/notifications` — **Comms History** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[lazy]`

---

#### ❓ CLUSTER: Help & Support (`/help`)
- [x] `/help/support` — **Support Portal** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[lazy]`
- [x] `/help/api` — **API Reference (Swagger)** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]`
- [x] `/help/labs` — **Labs & Demos** · `ui-styling` `error-resolution-handler` `[i18n]`

---

#### ⚙️ CLUSTER: Settings (`/settings`)
- [x] `/settings` — **Settings Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]`
- [x] `/settings/system` — **System Hub** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[db]`
- [x] `/settings/profile` — **My Profile** · `ui-styling` `error-resolution-handler` `[i18n]` `[toast]`
- [x] `/settings/organization` — **Org Settings / Branding** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]` `[db]`
- [x] `/settings/users` — **User Management** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[lazy]` `[toast]` `[db]`
- [x] `/settings/permissions` — **Permission Matrix** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]`
- [x] `/settings/billing` — **Billing & ROI** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[toast]`
- [x] `/settings/api-keys` — **API Keys** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[sec]` `[lazy]` `[toast]`
- [x] `/settings/notifications` — **Notification Config** · `ui-styling` `error-resolution-handler` `[i18n]` `[guard]` `[toast]`

---

#### 🌐 CLUSTER: Páginas Públicas (`/`)
- [x] `/` — **Landing Page** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO)
- [x] `/about` — **About** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO)
- [x] `/contact` — **Contact** · `marketing-styling` `error-resolution-handler` `[i18n]` `[toast]` (SEO)
- [x] `/pricing` — **Pricing** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO)
- [x] `/privacy` — **Privacy Policy** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO)
- [x] `/terms` — **Terms** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO/Metadata)
- [x] `/accessibility` — **Accessibility Statement** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO/Metadata)
- [x] `/features/*` — **Feature Pages** · `marketing-styling` `error-resolution-handler` `[i18n]` (SEO)
- [x] `/sandbox` — **Sandbox Público** · `ui-styling` `error-resolution-handler` `[i18n]`

---

#### 🔐 CLUSTER: Autenticación (`/auth`)
- [x] `/auth/login` — **Login Page** · `ui-styling` `error-resolution-handler` `[i18n]` `[sec]` `[toast]`
- [x] `/auth/signup` — **Signup Page** · `ui-styling` `error-resolution-handler` `[i18n]` `[sec]` `[toast]`
- [x] `/auth/magic-link` — **Magic Link** · `ui-styling` `error-resolution-handler` `[i18n]` `[toast]`

---

#### 🧩 COMPONENTES COMPARTIDOS (Auditar en paralelo)
- [x] `src/components/shared/SupportErrorState.tsx` — `error-resolution-handler` `[i18n]` `[a11y]`
- [x] `src/components/shared/DataStateIndicator.tsx` — `ui-styling` `error-resolution-handler`
- [x] `src/components/navigation/NavigationShell.tsx` — `ui-styling` `[i18n]` `[guard]`
- [x] `src/components/ui/` (primitivos globales) — `ui-styling` `[hyg]`

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

- **Last Audit**: 2026-03-17 (Phase 618: Roadmap & Documentation Synchronization — COMPLETED ✅)
- **Status**: PRODUCTION READY (Architectural Hardening Era 19 COMPLETED)
- **Versión Core**: 8.4.0
  **Fases en Cola (VIWS 2028):** Iniciar transición a Federated Learning y Gemelos Digitales Cognitivos.
