================================================================================
# ROADMAP_MASTER – Source of Truth for ABD RAG Platform (Unified v5.0.0-alpha - SUITE ERA)

## 📖 Overview

---

- **Status & Metrics (v4.7.7 - CAUSAL ERA)**
- **Global Progress:** 100% (Architecture Pivot complete).
- **Industrialization Progress:** 100% (Phases 101-165 COMPLETED ✅).
- **Vertical Industry Support:** ✅ **FASE 98 COMPLETED** - Infrastructure & Synthetic Data for Legal, Banking, Insurance.
- **UX Transformation:** 100% (Phase 96 COMPLETE, Phase 125 COMPLETED, Phase 155 COMPLETED ✅).
- **Enterprise SaaS Ready:** 100% (Phase 132 COMPLETED ✅).
- **Core Status:** ✅ **RESOLVED** - Ingestion Pipeline Cloudinary Decoupling Complete (Phase 131 COMPLETED)
- **Compliance Status:** 🛡️ **FASE 140 COMPLETED** - Post-Security Audit Hardening & Rate Limiting Implementation
- **UX Status:** 🎨 **FASE 165 COMPLETED** - Advanced Task Inbox & AI Fallback indicators
- **Recent Ship:** **FASE 110: Predictive Costing & Global Dashboard**, FASE 140 Security Hardening (Rate Limiting & Timing Safety), Phase 86 Causal AI Reasoning (Property Twin), Phase 113 AI Hub & Model Governance.
- **Project Status:** **Industrial Multi-product Suite (v5.0.0-alpha - Architectural Pivot).**
- **Critical Issue:** ✅ PHASE 140 RESOLVED - Missing Rate Limiting & Log Vulnerabilities.
- **Architecture Review:** FASE 129-155 (Knowledge Graph Evolution + Enterprise Maturity + UX Standardization)

---

### 📋 Upcoming, To‑Do & Planned (Consolidated View)

#### Recently Completed (Architecture Pivot)

- [X] **Vertical Structure**: Carpetas `src/verticals/elevators` creadas y pobladas.
- [X] **Vertical Config Registry**: Service to manage industry-specific labels and behaviors. (Phase 98 ✅)
- [X] **Industry Prompt Packs**: Master prompts adaptation for Legal, Banking, Insurance. (Phase 98 ✅)
- [X] **Content Scaffolding**: Folder structures and empty templates for new verticals. (Phase 98 ✅)
- [X] **Feature Flags**: Manager implementado para control de despliegue.
- [X] **Admin Refactor**: Dashboard modularizado y auditoría optimizada (Phase 105 ✅).
- [X] **Active Multi-Vertical**: Domain Router & Industry-segregated retrieval (Phase 101.1 ✅).
- [X] **Ingestion Stabilization**: Propagación de sesión en workers para evitar fallos de aislamiento (Phase 81.5 ✅).

---

### 🔮 DETAILED PLANS FOR FUTURE PHASES

#### 🧹 FASE 140: POST-SECURITY AUDIT HARDENING (COMPLETADO ✅)
**Objetivo:** Resolver vulnerabilidades críticas detectadas en auditoría externa y mejorar la higiene de tipos.

- [X] **Integrated Rate Limiting**: Activación de `checkRateLimit` por IP en el middleware para todas las rutas `/api/`.
- [X] **Timing Attack Protection**: Comparación segura de secretos internos en middleware mediante validación de longitud y chequeo estricto.
- [X] **Log Sanitization**: Eliminación de caracteres potencialmente peligrosos en logs de errores de seguridad (`pathname`, `ip`).
- [X] **Type Hygiene (useApiItem)**: Refactorización del hook core para eliminar `any`, implementar carga segura de body y tipado `unknown`.
- [X] **DOMMatrix Polyfill Refinement**: Mejora del polyfill en `instrumentation.ts` con interfaz base y protección contra parámetros inválidos.

---

#### 🔌 FASE 30: API PÚBLICA & INTEGRACIÓN DE SISTEMAS (COMPLETADO ✅)

- [X] **API Key Manager**: Servicio de gestión y validación.
- [X] **Developer Portal UI**: Interfaz administrativa para generar/revocar keys (`/admin/api-keys`).
- [X] **Public Endpoints**: V1 Ingest, Query, Extract.
- [X] **Rate Limiting & Audit**: Integrado en `publicApiHandler`.

#### ♿ FASE 17b: ACCESIBILIDAD (A11Y) & SEO AUDIT (COMPLETADO ✅)

- [X] **Structured Data**: JSON-LD Schema.org para `SoftwareApplication`.
- [X] **A11Y Quick Wins**: Aria-labels en navegación y mejoras semánticas.
- [ ] Auditoría Lighthouse profunda (Pendiente externo).

#### 🎨 FASE 18b: WHITE-LABEL BRANDING (COMPLETADO ✅)

- **Objetivo:** Personalización corporativa por tenant (Colores, Logos dinámicos, Favicon).

- [X] Gestión de Branding (Logo, Favicon, Colors).
- [X] Isolation Visual (Dark Mode Auto).
- [X] **Zod Hardening:** Validación estricta de fechas y saneamiento de inputs (Fix 500 silent error).

---

#### 🌍 FASE 101.1: ACTIVE MULTI-VERTICAL EVOLUTION (COMPLETADO ✅)
**Objetivo:** Evolucionar a una arquitectura de clasificación activa y espacios segregados.

- [X] **Active Domain Router**: Clasificación inteligente de cada query (LLM/Embeddings). <!-- ref: Documentación/19/1901.txt -->
- [X] **Segregated Vector Spaces**: Índices vectoriales específicos por dominio para reducir ruido.
- [X] **Entity Engine Aliases**: Mapeo dinámico de nombres de entidades por vertical (ej: pedido -> claim).
- [X] **Cross-Domain Search**: Búsqueda paralela y merge inteligente para queries ambiguas.

---

#### 🧹 FASE 105: TECHNICAL HYGIENE & HARDENING (COMPLETADO ✅)
**Objetivo:** Resolver deuda técnica, refactorizar componentes críticos y blindar seguridad. <!-- ref: Documentación/19/1902.txt -->

- [X] **Component Refactoring**: Dividir `AdminDashboardPage`, `AuditoriaPage` y `IngestService` en módulos enfocados (Phase 105 ✅).
- [X] **Security Hardening**: Blindar `api/health/db-check` y asegurar validación de servidor en todos los endpoints admin (Phase 105 ✅).
- [X] **Type Hygiene**: Estandarización de `EntitySchema` y `RagAuditSchema` con campo `industry` (Phase 105 ✅).
- [X] **RAG Robustness**: Propagación de `effectiveIndustry` en todo el pipeline de búsqueda (Phase 105 ✅).
- [X] **Billing Circuit Breaker**: Implementado para proteger contra fallos continuos del servicio de facturación (Phase 105 ✅).

#### 🛡️ FASE 107: ENTERPRISE SECURITY & 2FA (COMPLETADO ✅)
**Objetivo:** Elevar el estándar de seguridad a nivel bancario con autenticación de doble factor.

- [X] **MFA Integration:** Implementación de TOTP (Authenticator App) en el flujo de login (`MfaService`).
- [X] **Recovery Codes:** Sistema de códigos de un solo uso para recuperación de cuenta.
- [X] **NextAuth Hardening:** Validación estricta de `mfaEnabled` en el callback `authorize`.
- [X] **Audit Logging:** Trazabilidad completa de intentos de acceso y validación de códigos.

#### 🔌 FASE 108: OPENAPI & DEVELOPER PORTAL (COMPLETADO ✅)
**Objetivo:** Facilitar la integración de terceros con documentación viva y estandarizada.

- [X] **OAS 3.0 Generation:** Extracción automática de especificación (`zod-to-openapi`) basada en esquemas reales.
- [X] **Interactive Portal:** Swagger UI integrado en `/admin/api-docs` con soporte Dark Mode.
- [X] **Security Integration:** Endpoint `/api/openapi.json` protegido por Guardian V3 (`technical-docs:read`).
- [X] **Type Fidelity:** Sincronización 1:1 entre Zod Schemas y documentación API.

#### 🌍 FASE 109: i18n GOVERNANCE & AI TRANSLATION (COMPLETADO ✅)
**Objetivo:** Gobernanza total del lenguage y traducción asistida por IA para escala global.

- [X] **AI Translation Engine:** Integración de Gemini 2.0 para traducción automática de claves (`TranslationService`).
- [X] **Global Sync:** Sincronización masiva de locales con persistencia garantizada en MongoDB.
- [X] **Missing Keys Radar:** Filtros en UI para detectar claves sin traducción activamente (Phase 109 ✅).
- [X] **Prompt Governance:** Estandarización de prompts de traducción con contexto de negocio (`vertical`).

#### 🎮 FASE 110: INTERACTIVE SANDBOX DEMO (COMPLETADO ✅)
**Objetivo:** Demo público e interactivo para mostrar capacidades RAG sin autenticación.

- [X] **Public Route:** Ruta `/sandbox` accesible sin login con rate limiting estricto (5 req/min por IP).
- [X] **Demo Documents:** Documentos hardcodeados (Manual Otis Gen2, Contrato Torre Norte) para contexto limitado.
- [X] **Chat Interface:** Componente `SandboxChat` con UI simplificada y feedback visual.
- [X] **Backend API:** `/api/sandbox/chat` con inyección de contexto demo y modelo `gemini-1.5-flash`.
- [X] **Security:** Sin acceso a datos reales de tenants, rate limiting por IP, sin persistencia de conversaciones.

#### 🧠 FASE 113: AI HUB UNIFICATION & MODEL GOVERNANCE (COMPLETADO ✅)
**Objetivo:** Centralizar la gestión de modelos de IA y unificar las herramientas de experimentación en un Hub coherente.

- [X] **Centralized Model Registry**: Implementación de `src/lib/constants/ai-models.ts` como fuente única de verdad para toda la plataforma.
- [X] **Model Mapping Hardening**: Refactorización de `gemini-client.ts` para mapear dinámicamente versiones "latest" y nuevos modelos (ej: Gemini 2.5 Flash).
- [X] **AI Hub Integration**: Nueva tarjeta de "Gestión de Prompts" integrada en `/admin/ai` y eliminación de accesos directos redundantes en la sidebar.
- [X] **Playground Synchronization**: Actualización del laboratorio de RAG para consumir el registro único de modelos, permitiendo pruebas industriales consistentes.
- [X] **Skill-based Governance**: Actualización del skill `prompt-governance` para auditar y prevenir el uso de modelos hardcodeados en el futuro.

---

#### ⚡ FASE 84: SSE HEARTBEAT & CONNECTION RECOVERY (COMPLETADO ✅)
**Objetivo:** Mejorar la resiliencia de las conexiones SSE con mecanismos de heartbeat y recuperación.

- [X] **SSE Heartbeat:** Implementación de mensajes de heartbeat para mantener las conexiones activas.
- [X] **Connection Recovery:** Lógica de reintento automático para conexiones SSE caídas.
- [X] **Error Handling:** Gestión robusta de errores para notificar al cliente sobre problemas de conexión.

---

### 🗺️ API ROUTES SYNC REPORT

| Route | Descripción | Fecha de Sincronización |
| :------------------------ | :------------------------------------------------------- | :------------------ |
| `/api/swagger/spec` | Generación dinámica de OpenAPI Spec (zod-to-openapi). | 2026-02-08 |
| `/api/webhooks/stripe` | Maneja eventos de Stripe con Idempotencia y Atomicidad (FASE 84). | 2026-02-17 |
| `/api/admin/export` | Exportación universal de datos (Logs, Assets, Tenants) en CSV/JSON. | 2026-02-17 |
| `/api/sandbox/chat` | Chat público demo con documentos hardcodeados (rate limit 5/min). | 2026-02-09 |

---

#### 🔐 FASE 111: MAGIC LINKS AUTHENTICATION (COMPLETADO ✅)
**Objetivo:** Autenticación passwordless mediante enlaces mágicos por email.

- [X] **Backend API:** `/api/auth/magic-link/request` para generación y envío de tokens seguros.
- [X] **Auth Integration:** Lógica de verificación en `lib/auth.ts` con detección de prefijo `MAGIC_LINK:`.
- [X] **Verification Page:** `/auth-pages/magic-link/verify` con estados de carga, éxito y error.
- [X] **Login UI:** Toggle entre "Password" y "Magic Link" modes en `/login` con animaciones Framer Motion.
- [X] **i18n:** Claves traducidas en ES/EN para toda la experiencia de usuario.
- [X] **Security:** Tokens of 64-char hex, expiración 15 min, single-use, rate limiting AUTH tier, email enumeration protection.
- [X] **Database:** Colección `magic_links` en auth DB con campos `email`, `token`, `expiresAt`, `used`, `ip`, `userId`.

---

#### ⚙️ FASE 112: STATE MACHINE & ERROR RECOVERY (COMPLETADO ✅)
**Objetivo:** Implementar una canalización de ingesta resiliente con validación de estados de grado bancario y recuperación automatizada.

- [X] **State Machine Validation:** Transiciones estrictas PENDING → QUEUED → PROCESSING → COMPLETED/FAILED con auditoría de integridad SHA-256.
- [X] **Dead Letter Queue (DLQ):** Almacenamiento persistente de trabajos fallidos para revisión manual y re-ejecución (`DeadLetterQueue.ts`).
- [X] **Stuck Job Detection:** Monitor de salud para detectar procesos bloqueados (> 30 min) y forzar recuperación (`StuckDetector.ts`).
- [X] **Vercel Cron Integration:** Despliegue de scripts de mantenimiento periódico (`/api/cron/stuck-jobs`).
- [X] **Code Refactoring:** Unificación de lógica de preparación en `IngestPreparer` eliminando 53 líneas de código duplicado.

---

#### 💸 FASE 133.7: BILLING & UNIFIED USAGE REFACTORING (COMPLETADO ✅)
**Objetivo:** Consolidar servicios de facturación, eliminar `any` types, y crear dashboard de consumo unificado con datos reales.

- [X] **BillingService Consolidation:** Fusión de dos archivos duplicados (`src/services/` + `src/lib/`) en una única fuente canónica con Stripe webhooks integrados.
- [X] **Strict TypeScript Enforcement:** Eliminación de 14x `any` types en `billing-service.ts` y `quota-service.ts`; reemplazados por interfaces tipadas (`TenantConfigCustomLimits`, `BillingFiscalData`).
- [X] **Unified Usage API:** Nuevo endpoint `GET /api/admin/billing/usage` combinando `QuotaService.getTenantUsageStats()` + `UsageService.getTenantROI()` en paralelo con SLA monitoring (500ms).
- [X] **Live Usage Dashboard:** `/admin/billing/usage` con datos reales (tokens, almacenamiento, búsquedas, usuarios), métricas ROI (ahorro de horas, coste estimado, eficiencia), y alertas dinámicas por estado de cuota.
- [X] **Billing Plan View:** `/admin/billing/plan` con comparación visual de tiers y refactorización UI completa (Phase 133.7 ✅).
- [X] **Invoice History:** `/admin/billing/invoices` con historial de facturas, i18n y descarga PDF (Phase 133.7 ✅).
- [X] **contracts Management:** `/admin/billing/contracts` con aislamiento de inquilinos y auditoría de seguridad (Phase 133.7 ✅).
- [X] **Logger Integration:** Nuevo source `BILLING_SERVICE` en `AppLogEvent`.
- [X] **Reusable Components:** `UsageChart` (Recharts) y `QuotaProgress` (Progress bar con umbrales).

**Archivos Clave:**
- `src/lib/billing-service.ts` — Servicio unificado (Stripe + Invoices + Plan Management)
- `src/app/api/admin/billing/usage/route.ts` — API de consumo unificado
- `src/app/(authenticated)/(admin)/admin/billing/usage/page.tsx` — Dashboard de consumo
- `src/lib/quota-service.ts` — Limpieza de tipos

#### 🕸️ FASE 135: GRAPH RAG - KNOWLEDGE GRAPH RETRIEVAL (COMPLETADO ✅)
**Objetivo:** Implementar retrieval basado en grafos de conocimiento como alternativa a RAG vectorial.

**Componentes:**
- [X] **Neo4j Infrastructure:** Provisionada y conectada vía `src/lib/neo4j.ts`.
- [X] **Entity Extraction:** Integrado en el pipeline de ingesta vía `graph-extraction-service.ts` (Feature Flag Controlled).
- [X] **Graph Retrieval:** Orquestación bidireccional activa en `graph-retrieval-service.ts`.
- [X] **Integration:** Integración en `hybridSearch` (lib/rag-service.ts).
- [X] **Hybrid Mode:** Combinación de vector similarity + graph traversal operativa.
- [X] **Prompt Governance:** Prompts `GRAPH_EXTRACTOR` y `QUERY_ENTITY_EXTRACTOR` centralizados.

**Beneficios:**
- Navegación de relaciones explícitas (ej: "¿Qué ascensores instaló Técnico López?")
- Contexto multi-hop (ej: "¿Qué edificios usan motores del mismo proveedor que Torre Central?")
- Reducción de alucinaciones en queries relacionales complejas

**Referencias:**
- Walkthrough: `walkthrough_phase_135.md`
- Audit: `audit_report_phase_135.md`

#### 🕸️ FASE 136: GRAPH RAG UI & EXPLORER (COMPLETADO ✅)
**Objetivo:** Visualizar el Grafo de Conocimiento en el Admin Panel para validación humana y depuración.

**Componentes:**
- [x] **API Endpoint:** `GET /api/admin/graph/explore` para recuperar nodos y relaciones (limitado/paginado).
- [x] **Visualization Engine:** Integración de `react-force-graph-2d` para visualización interactiva.
- [x] **Admin Page:** Página `/admin/knowledge-base/graph` protegida por RBAC.
- [x] **Search & Filter:** Capacidad de buscar nodos específicos y filtrar por tipo (Componente, Procedimiento, etc.).
- [x] **Details Panel:** Side-panel para ver propiedades del nodo seleccionado (fuente, fecha, metadata).

**Referencias:**
- Walkthrough: `walkthrough_phase_136.md`
- Audit: `audit_report_phase_136.md`

### 🚧 FUTURE PHASES (PENDING DEVELOPMENT)

#### 🕸️ FASE 145: ADVANCED GRAPH FILTERING (COMPLETADO ✅)
**Objetivo:** Potenciar el Explorador de Grafos con filtros avanzados por tipo de relación y peso semántico.

- [X] **Relationship Filtering:** Filtros visuales para ocultar/mostrar tipos de relaciones (ej: `RELATED_TO`, `PART_OF`). [DONE]
- [X] **Weight Thresholds:** Slider para filtrar relaciones débiles basadas en peso semántico. [DONE]
- [X] **Critical Path Mode:** Resaltado automático de nodos críticos en la red de conocimiento. [DONE]

#### 🕸️ FASE 150: DIRECT GRAPH EDITING (COMPLETADO ✅)
**Objetivo:** Permitir la curación manual del Grafo de Conocimiento directamente desde la interfaz visual.

- [X] **Visual Node Creation:** Crear nuevos nodos manualmente desde el canvas. [DONE]
- [X] **Relationship Editor:** Selección de nodos para conectar y definir tipos de relación. [DONE]
- [X] **Property Management:** Edición de propiedades vía Sidebar y Diálogos. [DONE]
- [X] **Curation Governance:** RBAC y logs de auditoría para cambios manuales. [DONE]

#### 🕸️ FASE 155: ADVANCED GRAPH CURATION (COMPLETADO ✅)
**Objetivo:** Elevar las herramientas de curación del grafo a un estándar profesional con operaciones masivas y limpieza profunda de datos.

- [X] **i18n & Audit**: Reparación integral de traducciones hardcodeadas y expansión de locales (ES/EN) para instrucciones del editor. [DONE]
- [X] **Bulk Deletion API**: Implementado motor de borrado masivo de nodos en una sola transacción Neo4j. [DONE]
- [X] **Node Merging (Fusion)**: Capacidad de fusionar nodos duplicados re-apuntando dinámicamente todas las relaciones (In/Out) vía Neo4j APOC. [DONE]
- [X] **Advanced Multi-Selection**: Implementación de `Shift + Click` en el canvas para selección múltiple y barra flotante de acciones masivas. [DONE]
- [X] **Stability Hardening**: Tipado estricto de propiedades y manejo de valores nulos para prevenir errores `ParameterMissing` en Neo4j. [DONE]

**Referencias:**
- Walkthrough: `walkthrough_phase_155.md`
- API Nodes: `/api/admin/graph/nodes/bulk`
- API Merge: `/api/admin/graph/nodes/merge`

---

### 🧠 FASES DE OPTIMIZACIÓN (EJECUTADAS)

#### 🧠 FASE 21: EVOLUCIÓN AGÉNTICA 2.0 (COMPLETADO)

- [X] Orquestación LangGraph: Self-Correction y Loops.
- [X] Multilingual RAG: Hybrid Search (RRF).
- [X] Evaluation Framework: RAGAs dashboard.

#### 🧠 FASE 25: OPTIMIZACIÓN & EFICIENCIA (COMPLETADO)

- [X] Upgrade a Gemini models 2026.
- [X] Smart Ingestion (MD5): Deduplicación.

#### 🧾 FASE 27: ENTERPRISE INVOICE MANAGER (COMPLETADO ✅)

- [X] **Invoice Engine:** Generación PDF + Self-Service portal.

#### 🔧 FASE 45: ADMIN DASHBOARD REFACTORING (COMPLETADO ✅)

- **Objetivo:** Estandarización visual completa del panel de administración (`ui-styling`).

- [X] **MetricCards:** Unificación de tarjetas de estadísticas.
- [X] **ContentCards:** Contenedores estándar para tablas y gráficos.
- [X] **Consistency:** Eliminación de estilos ad-hoc.

#### 🏗️ FASE 47: ARCHITECTURE PIVOT PREP (COMPLETADO ✅)

- **Objetivo:** Preparar el codebase para soportar múltiples industrias (Verticalización).

- [X] **Core Separation:** `src/core` (Motores agnósticos) vs `src/verticals` (Lógica de negocio).
- [X] **Feature Flags:** Sistema de control de activación de features (`lib/feature-flags.ts`).
- [X] **Migration:** Movimiento de `configurator` y `checklists` a `src/verticals/elevators`.
- [X] **UI Updates:** Selector de Industria (Mock) y RAG Reasoning.

#### ⚡ FASE 48: VISUAL WORKFLOW EDITOR (COMPLETADO ✅)

- **Objetivo:** Permitir a usuarios avanzados diseñar flujos RAG personalizados (If-This-Then-That) mediante interfaz visual.

- [X] **React Flow Integration:** Canvas infinito con Drag & Drop (`@xyflow/react`).
- [X] **Custom Nodes:** Implementados nodos Trigger, Action y Condition.
- [X] **Workflow Store:** Gestión de estado con Zustand.
- [X] **Persistence:** API `/api/admin/workflows` para guardar definiciones.

#### ⚙️ FASE 49: WORKFLOW COMPILATION & EXECUTION (COMPLETADO ✅)

- **Objetivo:** Traducir el diseño visual en lógica ejecutable por el `WorkflowEngine`.

- [X] **Compiler Logic:** Algoritmo de recorrido de grafo (Graph Traversal).
- [X] **Schema Mapping:** Convertir Nodos Visuales -> `AIWorkflow` Schema.
- [X] **Hybrid Storage:** Guardar definición visual (UI) + Lógica compilada (Backend).

#### 🧪 FASE 50: E2E VALIDATION (COMPLETADO ✅)

- **Objetivo:** Verificar el ciclo completo: Dibujar -> Compilar -> Ejecutar.

- [X] **E2E Script:** `test-workflow-e2e.ts`.
- [X] **Validation:** Confirmar que `WorkflowEngine` respeta las reglas creadas visualmente.

#### 🛠️ FASE 51: ADVANCED WORKFLOW EDITOR & MULTI-TENANCY (COMPLETADO ✅)

- **Objetivo:** UI Polish, Edición, y Seguridad Multi-tenant.

- [X] **Load & Edit:** Capacidad de cargar workflows existentes en el Canvas (`GET /api/admin/workflows/[id]`).
- [X] **Tenant Isolation:** Aislamiento ruguroso por `tenantId` en API y persistencia.
- [X] **RBAC Permissions:** Control de acceso granular para edición de flujos integrado con Guardian V2.
- [X] **Multi-Workflow Selector:** UI para gestionar y crear múltiples flujos por entorno.
- [X] **Advanced Nodes:** Loop Node, Wait Node, Switch Case Node, Custom Action Node.
- [X] **Validation UI:** Feedback visual en tiempo real para nodos huérfanos (Orphan Detection).
- [X] **Workflow UX Overhaul:**
    - [X] Permitir eliminar nodos/aristas seleccionados (Botón Borrar / Tecla Delete).
    - [X] Funcionalidad de Duplicar/Copiar Workflows existentes.
    - [x] **Versioning & History:** Guardar versiones históricas y permitir revertir.
    - [x] **Draft vs Published:** Guardar borradores antes de activar el flujo en ejecución.
- [X] **Dynamic Node Editor:** Configuración personalizada de parámetros por nodo (Lateral Panel).
- [X] **Tenant Custom Nodes:** Capacidad de definir acciones específicas por industria/tenant.


#### 👁️ FASE 52: VISUAL INTELLIGENCE (MULTI-MODAL RAG) (COMPLETADO ✅)

- **Objetivo:** Ingesta y comprensión de diagramas técnicos (Esquemas eléctricos/mecánicos).

- [X] **Multi-Modal Pipeline:** Integración nativa con Gemini 2.0/3 para PDFs.
- [X] **Vision LLM:** Procesamiento de diagramas con descripciones técnicas automáticas.
- [X] **Schema Navigation:** Identificación de página exacta (`approxPage`) para navegación técnica.

#### 📊 FASE 53: WORKFLOW ANALYTICS (COMPLETADO ✅)

- **Objetivo:** Observabilidad y optimización de procesos de negocio.

- [X] **Execution Heatmaps:** Visualización térmica sobre el canvas (nodos más visitados).
- [X] **Bottleneck Detection:** Identificación de nodos lentos o con alta tasa de fallo.
- [X] **Business KPIs:** Dashboard de métricas de negocio derivadas de los flujos.

#### 🔔 FASE 54: ANOMALY ALERTS & REPORTING (COMPLETADO ✅)

- **Objetivo:** Detección proactiva de fallos y reporting técnico.

- [X] **Anomaly Detection Logic:** `detectAnomalies` integrado en `WorkflowAnalyticsService`.
- [X] **Risk Notifications:** Integración con `NotificationService` para alertas críticas.
- [X] **Technical Reporting (PDF):** Endpoint `/api/admin/workflows/analytics/[id]/report`.
- [X] **Alert UI:** Visual cues (pulse effects) en el Workflow Canvas.

- [X] **Edge Migration:** Migrar APIS de lectura y validación a Vercel Edge Runtime.
- [X] **Async Ingest:** Implementar sistema de colas (Queue Service) para procesamiento de PDFs pesados.
- [X] **Redis/Edge Caching:** Capa de caché para definiciones de Workflows y Prompts.

#### 🛡️ FASE 55: GUARDIAN V1 - SECURITY HARDENING (COMPLETADO ✅)

- **Objetivo:** Cerrar brechas de seguridad y auditoría (Ref: ` /`documentación/13/00.md `, /`documentación/13/02.md`).

- [X] **Rate Limiting:** Implementar `@upstash/ratelimit` en endpoints de Auth y Admin.
- [X] **CSP Headers:** Configuración estricta de Content Security Policy en Middleware.
- [X] **Sanitization:** Revisión de seguridad en queries regex de MongoDB ($regex unsafe).

#### 🧠 FASE 56: RAG EVOLUTION 3.0 (Advanced Retrieval) (COMPLETADO ✅)

- **Objetivo:** Mejorar precisión y recall en consultas técnicas complejas (Ref: /`documentación/13/01.md `).

- [X] **Re-ranking Layer:** Integrar Cross-Encoder (Gemini Reranker) para reordenar resultados vectoriales.
- [X] **Smart Chunking:** Pipeline de chunking inteligente integrado en `IngestService`.
- [X] **Query Expansion:** Generación de queries alternativas con Gemini para mejorar búsqueda híbrida.

#### ⚖️ FASE 57: ADVANCED WORKFLOW LOGIC (COMPLETADO ✅)

- **Objetivo:** Robustez y lógica de negocio compleja en el motor de estados (Ref: /`documentación/13/01.md `).

- [X] **Optimistic Locking:** Prevenir race conditions en transiciones concurrentes.
- [X] **Business Rules:** Nodos de condición avanzada (ej: Monto > X, Cliente == Y).
- [X] **History Archiving:** Sistema de archivado de logs antiguos para evitar documentos gigantes.


#### 👁️ FASE 58: DYNAMIC WORKFLOW CONFIGURATION & EXECUTION MONITORING (COMPLETADO ✅)

- **Objetivo:** Edición dinámica de parámetros y visibilidad en tiempo real de la ejecución.

- [X] **Specialized Node Editor**: UI personalizada para nodos Wait, Switch y Loop.
- [X] **Execution Logs Panel**: Interfaz de monitoreo "Mission Control" para el Workflow Canvas.
- [X] **Structured Metadata**: Procesamiento de parámetros dinámicos en el compilador y motor.
- [X] **Real-time Live Polling**: Actualización automática de registros de ejecución.


#### 🌐 FASE 59: ENVIRONMENTS (STAGING / USER SANDBOX) (COMPLETADO ✅)

- **Objetivo:** Implementar aislamiento de datos y lógica de promoción entre entornos (Ref: Phase 59 Plan).

- [X] **Core Isolation:** Implementar campo `environment` en Prompts, Workflows y Documentos.
- [X] **Environment Switcher UI:** Selector global persistente en el Header (`EnvironmentSwitcher.tsx`).
- [X] **Promotion Logic:** Servicio para promover configuraciones de Staging -> Producción.
- [X] **RAG Filtering:** Búsqueda vectorial filtrada por el entorno activo en `rag-service.ts`.
- [X] **Vercel Build Fix:** Optimización de tipos y null-checks para despliegues estables.

#### 📨 FASE 60: ADVANCED INVITATION SYSTEM (COMPLETADO ✅)

- **Objetivo:** Escalabilidad en onboarding y gestión de accesos temporales (Ref: User Request).

- [X] **Bulk Invites:** Carga masiva de usuarios vía CSV/Excel para grandes tenants.
    - [X] Generación de plantillas (.csv/.xlsx) con ejemplos sintéticos y orden correcto.
    - [X] Guía en pantalla (Onboarding Tooltips) con especificaciones técnicas de cada campo.
    - [X] Pre-validación de datos antes de la ingesta para evitar errores de tipo/formato.
- [X] **Invitation Management:** UI para reenviar, revocar y ver estado de invitaciones pendientes.
- [X] **Smart Onboarding:** Asignación automática de Grupos y Departamentos desde la invitación.
- [X] **Magic Links & TTL:** Links de un solo uso o con expiración personalizada (integrado con JIT).



#### FASE 61: RAG COGNITIVE SCALING (COMPLETADO ✅)

- **Descripción**: Optimización de costes, seguridad y precisión estructural del motor RAG.
- **Hitos de Arquitectura:**
  - [X] **Semantic Cache Integration**: Implementación de caché semántica con Upstash/Redis.
  - [X] **PII Masking Engine**: Middleware de desidentificación de datos sensibles.
  - [X] **Graph-Enhanced RAG**: Extracción de entidades y relaciones para navegación estructural.
  - [X] **RAG Evaluation Dashboard**: Framework de observabilidad (Ragas style).
  - [X] **Optional PII Masking**: Flujo de advertencia UI para desactivar desidentificación completado.

#### 🌐 FASE 62: i18n GOVERNANCE & MULTILANGUAGE MANAGER (COMPLETADO ✅)

- **Objetivo:** Empoderar al SuperAdmin para gestionar traducciones sin tocar código y asegurar cobertura total i18n.

- [x] **i18n Audit**: Revisión de todo el frontend para identificar textos hardcodeados.
- [x] **Translation Editor UI**: Panel en `/admin/settings/i18n` para editar `es.json`, `en.json` (Phase 62 Core ✅).
- [x] **Lazy Loading with Filters**: Implementación de carga diferida con filtros de namespace y búsqueda (Phase 62.1 ✅).
- [x] **Dynamic i18n Storage**: Migración de traducciones a MongoDB con capa de caché en Redis (Phase 62.2 ✅).
- [x] **AI-Assisted Translation**: Botón "Auto-traducir" usando Gemini 1.5 Flash para nuevos idiomas (Phase 62.3 ✅).

#### ♿ FASE 63: i18n & a11y DEEP AUDIT & REMEDIATION (COMPLETADO ✅)

- **Objetivo:** Alcanzar el Grado A en accesibilidad e internacionalización en toda la plataforma, eliminando deuda técnica de la Visión 2.0 y permitiendo el uso multilingüe en el área privada.

- [X] **Global i18n Audit**: Extracción masiva de textos hardcoded en componentes Legacy y nuevos (Phase 53+).
- [X] **Private Area Localization**: Adaptar el Dashboard, Configuration panels y Workflow Editor a i18n total.
- [X] **Authenticated Language Selector**: Selector de idioma persistente en la Sidebar/UserNav para el área privada.
- [X] **A11Y enforcement**: Implementación de navegación por teclado completa, contraste de color WCAG AAA y etiquetas ARIA dinámicas.
- [X] **Automated Testing**: Integrar tests de accesibilidad (axe-core) en el pipeline de CI/CD.
- [X] **Accessibility Statement**: Página pública de declaración de conformidad.

#### 📄 FASE 64: BRANDED INDUSTRIAL REPORTS & CUSTOM TEMPLATES (COMPLETADO ✅)

- **Objetivo:** Convertir el informe técnico en un producto final de marca blanca listo para el cliente final.
- [x] **Branding Configuration**: Permitir a cada Tenant subir su logo y colores específicos para el PDF.
- [x] **Custom Templates**: Editor de plantillas para añadir disclaimers legales, firmas y metadatos personalizados.
- [x] **Automated Delivery**: Configurar envío automático del reporte al finalizar flujos específicos.

#### 🧹 FASE 65: DATA RETENTION & ANALYTICS PURGING (DEPRECADO 🔄)
> [!NOTE]
> Esta fase ha sido unificada en la **Fase 132.5 (DataLifecycleService)** para consolidar toda la lógica de retención y ciclo de vida en el motor de madurez SaaS.

---

### 💎 STRATEGIC ENTERPRISE OVERHAUL (VISION 2026+)

#### 🚀 FASE 31: ESTABILIZACIÓN, SEGURIDAD & UX REDESIGN (COMPLETADO ✅)

- [X] **Multi-tenant Hardening:** Validación estricta via JWT/Middleware.
- [X] **MongoDB Pro:** Índices críticos y Transacciones ACID.
- [X] **Async Jobs:** Migración a BullMQ (Procesos largos).
- [X] **Observabilidad Pro:** OpenTelemetry tracing.

#### 🚀 FASE 32: UNIVERSAL ONTOLOGY ENGINE (COMPLETADO ✅)

- [X] **Ontology Registry & Entity Engine**.
- [X] **Infrastructure Autoscaler**.
- [X] **Universal Security Audit**.
- [X] **Geo-Knowledge CDN & Performance Guard**.
- [X] **Reliability Engine & Failover**.
- [X] **Collaboration Service & Security AES-256-GCM**.

#### 🚀 FASE 33: ULTIMATE FEATURE SHOWCASE (COMPLETADO ✅)

- **Objetivo:** Actualizar la Landing Page y las páginas de "Features" para exhibir el 100% de las capacidades v2.30.

- [X] **Feature Audit:** Revisión total de funcionalidades.
- [X] **Landing Overhaul:** Actualizar `FeatureGrid.tsx` para incluir las nuevas "Killer Features".
