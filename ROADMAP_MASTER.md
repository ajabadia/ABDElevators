# ROADMAP_MASTER – Source of Truth for ABD RAG Platform (Unified v2.31 - ENTERPRISE ERA - v4.2.1)

## 📖 Overview

---

- **Status & Metrics (v4.2.0 - ENTERPRISE ERA)**
- **Global Progress:** 100% (Architecture Pivot complete).
- **Industrialization Progress:** 100% (Phases 101-111 VERIFIED SUCCESS).
- **UX Transformation:** 100% (Phase 96 COMPLETADA).
- **Enterprise SaaS Ready:** 80% (Phase 120.1, 120.3, 120.4, 110, 111 COMPLETADA 🛡️).
- **Core Status:** 100% (High-Availability Industrial Grade).
- **Recent Ship:** Interactive Sandbox Demo (Public), Magic Links Authentication (Passwordless), Advanced Checklist Configs & i18n Multi-tier Cache.
- **Project Status:** **High-Performance Industrial Platform (v4.2.1 - Enterprise SaaS Evolution).**

---

### 📋 Upcoming, To‑Do & Planned (Consolidated View)

#### Recently Completed (Architecture Pivot)

- [X] **Vertical Structure**: Carpetas `src/verticals/elevators` creadas y pobladas.
- [X] **Feature Flags**: Manager implementado para control de despliegue.
- [X] **Admin Refactor**: Dashboard modularizado y auditoría optimizada (Phase 105 ✅).
- [X] **Active Multi-Vertical**: Domain Router & Industry-segregated retrieval (Phase 101.1 ✅).

---

### 🔮 DETAILED PLANS FOR FUTURE PHASES

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

#### 🔐 FASE 111: MAGIC LINKS AUTHENTICATION (COMPLETADO ✅)
**Objetivo:** Autenticación passwordless mediante enlaces mágicos por email.

- [X] **Backend API:** `/api/auth/magic-link/request` para generación y envío de tokens seguros.
- [X] **Auth Integration:** Lógica de verificación en `lib/auth.ts` con detección de prefijo `MAGIC_LINK:`.
- [X] **Verification Page:** `/auth-pages/magic-link/verify` con estados de carga, éxito y error.
- [X] **Login UI:** Toggle entre "Password" y "Magic Link" modes en `/login` con animaciones Framer Motion.
- [X] **i18n:** Claves traducidas en ES/EN para toda la experiencia de usuario.
- [X] **Security:** Tokens de 64-char hex, expiración 15 min, single-use, rate limiting AUTH tier, email enumeration protection.
- [X] **Database:** Colección `magic_links` en auth DB con campos `email`, `token`, `expiresAt`, `used`, `ip`, `userId`.

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

#### 📨 FASE 60: ADVANCED INVITATION SYSTEM

- **Objetivo:** Escalabilidad en onboarding y gestión de accesos temporales (Ref: User Request).

- [ ] **Bulk Invites:** Carga masiva de usuarios vía CSV/Excel para grandes tenants.
    - [ ] Generación de plantillas (.csv/.xlsx) con ejemplos sintéticos y orden correcto.
    - [ ] Guía en pantalla (Onboarding Tooltips) con especificaciones técnicas de cada campo.
    - [ ] Pre-validación de datos antes de la ingesta para evitar errores de tipo/formato.
- [ ] **Invitation Management:** UI para reenviar, revocar y ver estado de invitaciones pendientes.
- [ ] **Smart Onboarding:** Asignación automática de Grupos y Departamentos desde la invitación.
- [ ] **Magic Links & TTL:** Links de un solo uso o con expiración personalizada (integrado con JIT).



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

#### 📄 FASE 64: BRANDED INDUSTRIAL REPORTS & CUSTOM TEMPLATES (FUTURO)

- **Objetivo:** Convertir el informe técnico en un producto final de marca blanca listo para el cliente final.

- [ ] **Branding Configuration**: Permitir a cada Tenant subir su logo y colores específicos para el PDF.
- [ ] **Custom Templates**: Editor de plantillas para añadir disclaimers legales, firmas y metadatos personalizados.
- [ ] **Automated Delivery**: Configurar envío automático del reporte al finalizar flujos específicos.

#### 🧹 FASE 65: DATA RETENTION & ANALYTICS PURGING (FUTURO)

- **Objetivo:** Optimizar el rendimiento de la base de datos a largo plazo y cumplir con políticas de minimización de datos.

- [ ] **Retention Policies**: Definir periodos de vida para logs de auditoría y analíticas (ej. 90 días).
- [ ] **Analytics Aggregation**: Comprimir logs detallados en métricas agregadas antes de borrarlos.
- [ ] **Cold Storage Export**: Opcionalmente mover datos históricos a almacenamiento de bajo coste.

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
- [X] **Interactive Demos:** Mockups dinámicos.
- [X] **Documentation Sync:** ROADMAP_MASTER y Landing alineados al 100%.

#### 💅 FASE 34: UX HARMONY & NAVIGATION OVERHAUL (COMPLETADO ✅)

- **Objetivo:** Reducir la fatiga cognitiva y mejorar la usabilidad.

- [X] **Sidebar Semantic Grouping:** Organización de menús.
- [X] **Universal UserNav Refactor:** Simplificación del menú de usuario.
- [X] **Shortcut System (Command Center):** Buscador global (Ctrl+K).
- [X] **Visual Consistency Audit:** Estándar `ui-styling`.

#### 🛡️ FASE 35: ENTERPRISE HARDENING & AUDIT REMEDIATION (COMPLETADO ✅)

- [X] **Infrastructure Core:** DB Pooling, Índices, Idempotencia.
- [X] **Security Shielding:** PII Obfuscation, Prompt Injection Guard.
- [X] **Resilience & RAG:** Stream Ingestion, Embedding Retries, Soft Deletes.
- [X] **Frontend Stability:** Race Conditions, RSC Landing.

#### 🚀 FASE 36: INTELLIGENT GOVERNANCE & FEDERATED MONITORING (COMPLETADO ✅)

- [X] **Observability Pro (v2):** RAG Metrics, Cost Analytics.
- [X] **Intelligent Orchestration:** Prompt Shadowing, Hybrid Search (RRF).
- [X] **Federated Intelligence:** Global Pattern Sharing.

#### 🚀 FASE 37: SOVEREIGN ENGINE & FEDERATED INTELLIGENCE DEEPENING (COMPLETADO ✅)

- [X] **Sovereign Engine:** Worker autónomo.
- [X] **Global Vector Registry:** Federated search.
- [X] **Cross-Tenant Validation:** Reputación compartida.
- [X] **React Modernization:** Zustand integration.

#### 🚀 FASE 38: ADMIN INTELLIGENCE DASHBOARD (COMPLETADO ✅)

- [X] **Intelligence Dashboard:** `/admin/intelligence/trends`.
- [X] **Pattern Governance:** Moderación de patrones.
- [X] **ROI Analytics:** Ahorro estimado.
- [X] **Backend Analytics:** Service logic.

> [!IMPORTANT]
> **GUÍA DE INFRAESTRUCTURA (POST-FASE 36):**
> Indices creados en MongoDB Atlas: `keyword_index` (BM25) y `vector_index` (Híbrido).

---

### 📋 Future Evolutionary Paths (Vision 2027+)

1. **Sovereign Engine**: Self-correcting ontology evolving beyond human definitions.
2. **Predictive Preventive Networks**: Real-time failure prediction based on federated data trends.
3. **Advanced AGI Interaction**: Natural language complex reasoning for multi-step engineering logic.

## 🗑️ DEPRECATED & ARCHIVED

Listado de funcionalidades o planes que han sido descartados o sustituidos por cambio de visión.

- ~~[FASE 46: CRITICAL REFACTORING]~~
  - **Fecha:** 2026-02-02
  - **Motivo:** Sustituido por Fase 47 (Architecture Pivot).
- ~~[Vision 2027: Autonomous Physical Intervention (IoT Integration)]~~
  - **Fecha:** 2026-01-31
  - **Motivo:** Pivot estratégico hacia IA Air-Gapped.


---

### 🌟 ERAS DE EVOLUCIÓN E INDUSTRIALIZACIÓN (VISION 2026-2027)

Basado en la Auditoría Profesional del Bloque 015 (`1501.md`, `1502.md`, `1510.md`).

#### 👥 FASE 60: BULK INVITATION SYSTEM (COMPLETADO ✅)
**Objetivo:** Permitir el onboarding masivo de usuarios técnicos e ingenieros de forma eficiente.

- [X] **API Batch Processing**: Endpoint `/api/admin/users/invite/bulk` con validación atómica.
- [X] **UI de Importación**: Modal de alta fidelidad con soporte para Drag & Drop (CSV/XLSX).
- [X] **Plantillas Dinámicas**: Generación de archivos de ejemplo sintéticos para el cliente.
- [X] **Internacionalización**: Refactorización total de la interfaz administrativa a ES/EN.

#### 💂 FASE 70: GUARDIAN V2 & SECURITY HARDENING (COMPLETADO ✅)

- [X] **Unificación de RBAC**: Implementar Enum `UserRole` estricto y helper `requireRole()` centralizado. Corregir inconsistencias 'admin' vs 'SUPER_ADMIN'.
- [X] **Endurecimiento de CSP**: Eliminar `unsafe-inline` / `unsafe-eval` mediante nonces y migración total a Tailwind. 
- [X] **Índices MongoDB**: Crear `scripts/setup-indexes.ts` con índices compuestos (`{ tenantId: 1, status: 1 }`, `{ tenantId: 1, fileMd5: 1 }`).
- [X] **Deduplicación Atómica**: Índice único MD5 + manejo de race conditions en ingestión.

#### ⚡ FASE 71: ESCALABILIDAD & RESILIENCIA OPERATIVA (COMPLETADO ✅)
**Objetivo:** Preparar la infraestructura para alta disponibilidad y reducción de costes (Ref: `1501.md:389-428`).

- [X] **Caché RAG Estratificada**: Implementar Redis (Upstash) para caché de embeddings (L2) y respuestas frecuentes (L1).
- [X] **Circuit Breakers**: Integrar `cockatiel` o `opossum` para Gemini, Cloudinary y Stripe (Fallo elegante).
- [X] **Arquitectura de Workers**: Separar `ingest-worker` de la API principal usando BullMQ + Redis.
- [X] **Paginación Universal**: Estandarizar todos los endpoints de listado con paginación basada en cursos (Cursor-based).

#### 🎨 FASE 72: INDUSTRIAL PERFORMANCE & TYPE HYGIENE (COMPLETADO ✅)
**Objetivo:** Eliminar deuda técnica estructural y mejorar latencia (Ref: `1510.md:101-147`).

- [X] **Refactor Singleton de MongoDB**: Evitar socket leaks y optimizar reúso de conexiones.
- [X] **Streaming RAG**: UX progresiva con Gemini Stream y LangGraph support.
- [X] **Higiene de Tipos**: NextAuth + UserRole strict typing sin casts inseguros.
- [X] **Refactor Modular**: Descomposición de componentes gigantes (>500 líneas).

#### 🔮 FASE 73: FRONTERAS TECNOLÓGICAS (VISION 2027+)
**Objetivo:** Diferenciación competitiva extrema mediante tecnologías de vanguardia (Ref: `1502.md`).

- [ ] **Federated Learning Consortium**: Alertas de patrones de fraude/fallo compartidos sin exchange de PII.
- [ ] **Quantum-Classical Hybrid**: Optimización de colateral y riesgos mediante algoritmos cuánticos (QAOA/Monte Carlo).
- [ ] **Neuromorphic Edge AI**: Inferencia ultra-eficiente en sensores industriales (Loihi 2 style).
- [ ] **Digital Twins**: Gemelos digitales de flujo de caja y procesos operativos para simulación predictiva.

---

### 🚀 ESTRATEGIA ENTERPRISE 2026 (INGESTIÓN DE REQUERIMIENTOS)

Basado en el análisis de `Documentación/07` y `Documentación/09` (Skill: `roadmap-architect-analyst`).

#### 💰 FASE 80: CONVERSIÓN & ONBOARDING (QUICK WINS)
**Objetivo:** Reducir fricción de entrada y demostrar valor inmediato (ROI).

- [ ] **ROI Calculator**: Implementar calculadora interactiva en Landing Page. <!-- ref: Documentación/09/gaps funcionales.md:5 -->
- [X] **Interactive Sandbox Demo**: Simulador "Sube tu PDF" limitado para usuarios no registrados (Fase 110 ✅). <!-- ref: Documentación/09/gaps funcionales.md:4 -->
- [X] **Magic Links (Passwordless)**: Opción de login sin contraseña vía email (Fase 111 ✅). <!-- ref: Documentación/09/gaps funcionales.md:13 -->
- [X] **Post-Invite Onboarding Wizard**: Flujo guiado de 3 pasos tras el primer login (Phase 96.4 ✅). <!-- ref: Documentación/09/gaps funcionales.md:11 -->

#### 💂 FASE 81: SEGURIDAD ENTERPRISE & GOVERNANCE PRO
**Objetivo:** Cumplir con estándares bancarios e industriales de alta seguridad.

- [X] **2FA (Two-Factor Authentication)**: Implementación de TOTP (Authenticator) / SMS backup (Fase 107 ✅). <!-- ref: Documentación/07/roadmap-detallado.md:108 -->
- [X] **Swagger/OpenAPI Portal**: Interfaz interactiva para desarrolladores en `/admin/api-docs` (Fase 108 ✅). <!-- ref: Documentación/07/mejoras-tecnicas.md:269 -->
- [ ] **Document Relationships**: Motor de vinculación lógica ("A anula B", "X es compatible con Y"). <!-- ref: Documentación/09/gaps funcionales.md:27 -->
- [ ] **Inline PDF Secure Preview**: Visualización in-browser sin descarga temporal. <!-- ref: Documentación/09/gaps funcionales.md:30 -->
- [ ] **Scheduled Review Dates**: Fechas de caducidad y alertas de revisión para manuales técnicos. <!-- ref: Documentación/09/gaps funcionales.md:28 -->

#### 📊 FASE 82: COLABORACIÓN & DASHBOARD PROACTIVO
**Objetivo:** Transformar el análisis individual en un proceso de equipo dinámico.

- [ ] **Proactive System Alerts**: Notificaciones de umbrales (80% tokens), caducidades y pedidos estancados. <!-- ref: Documentación/09/gaps funcionales.md:18 -->
- [ ] **Interactive Analysis Checklist**: Feedback loop donde el técnico puede validar/corregir detecciones de la IA. <!-- ref: Documentación/09/gaps funcionales.md:42 -->
- [ ] **Collaboration Threads**: Sistema de comentarios y hilos tipo Google Docs dentro del análisis RAG. <!-- ref: Documentación/09/gaps funcionales.md:43 -->
- [ ] **Confidence Score Visualization**: Tags visuales (Alta/Media/Baja) por cada entidad detectada por IA. <!-- ref: Documentación/09/gaps funcionales.md:44 -->

#### 🧪 FASE 83: BACKEND REFINEMENT & SIMULATION TOOLS
**Objetivo:** Mejorar herramientas administrativas y precisión del motor de prompts.

- [ ] **Upgrade/Downgrade Price Simulator**: Cálculo exacto de pro-rata antes de cambiar suscripción. <!-- ref: Documentación/09/gaps funcionales.md:66 -->
- [ ] **A/B Prompt Testing Engine**: Herramienta para comparar performance de diferentes system prompts en un set de control. (Phase 83 - Core Started ✅)
- [ ] **Admin Session Simulator (Impersonation)**: Capacidad de SuperAdmin para ver la interfaz como un usuario específico (sin contraseña). <!-- ref: Documentación/09/gaps funcionales.md:53 -->
- [x] **Dry-run Test Button**: Probar cambios en prompts sobre documentos reales sin guardar resultados permanentes. (Phase 83 - API Ready ✅)

---

### 🛡️ ESTRATEGIA ENTERPRISE & INDUSTRIAL VERTICALS (Source: Folder 15)

#### 🛠️ FASE 84: ENTERPRISE STABILIZATION (REFINEMENTS)
**Objetivo:** Completar la excelencia operativa detectada en la Auditoría 15.

- [ ] **Prompt Rollback System**: Endpoint y UI para restaurar versiones anteriores de prompts. <!-- ref: 1510.md:1145 -->
- [ ] **SSE Heartbeat & Connection Recovery**: Monitor de salud para streams RAG de larga duración. <!-- ref: 1510.md:1209 -->
- [ ] **Transactional Webhooks (Stripe)**: Asegurar integridad atómica en el proceso de suscripción tras el pago. <!-- ref: 1510.md:1149 -->
- [ ] **Universal API Export (CSV/JSON)**: Paginación y exportación de logs y auditorías para legal discovery. <!-- ref: 1510.md:1257 -->

#### 🏛️ FASE 85: INDUSTRIAL VERTICALS (LEGAL, BANKING, INSURANCE)
**Objetivo:** Desplegar arquitecturas especializadas por sector.

- [ ] **Legal: Contract Intelligence Engine**: Comparativa automática de cláusulas contra estándar de la firma. <!-- ref: 1511.txt:23 -->
- [ ] **Banking: Perpetual KYC (pKYC)**: Motor de debida diligencia continua sobre corpus documental. <!-- ref: 1511.txt:35 -->
- [ ] **Insurance: Claims Automation Proxy**: Triaje automático de siniestros basado en evidencia documental técnica. <!-- ref: 1511.txt:48 -->
- [ ] **Real Estate: Property Twin Integration**: Relación entre planos 3D y especificaciones de mantenimiento. <!-- ref: 1511.txt:55 -->

#### 🔮 FASE 86: ADVANCED AGENTIC REASONING (2026+)
**Objetivo:** Evolucionar hacia la autonomía total del análisis.

- [x] **LangGraph Multi-Agent Workflows**: Orquestación de agentes con estados persistentes y "Human-in-the-loop". (Phase 104 Judge RAG ✅)
- [ ] **Causal AI Impact Assessment**: Análisis de "Qué pasaría si..." basado en relaciones causa-efecto. (Phase 86 - Prompt Engaged ✅)
- [ ] **Swarm Intelligence for Investigator Swarms**: Enjambres de agentes para e-discovery en litigios masivos. <!-- ref: 1502.md:368 -->
- [ ] **BGE-M3 Multilingual Embedding Logic**: Optimización para recuperación cross-language avanzada. <!-- ref: 1510.md:542 -->

---

### 🚀 ESTRATEGIA DE EVOLUCIÓN AVANZADA (VISION 2026-2027)
*Basado en el Análisis Estratégico `1801.txt`*

#### 🧠 FASE 100: RAG INFRASTRUCTURE SCALING (COMPLETADO ✅)
**Objetivo:** Preparar el motor para ingesta masiva y abstracción de proveedores.

- [X] **Streaming Ingestion**: Procesamiento incremental para documentos ultra-grandes (>500MB).
- [X] **Vector Store Abstraction**: Interfaz agnóstica para soportar Pinecone/Milvus junto a MongoDB Atlas.
- [X] **MD5 Chunk Guard**: Optimización de costes evitando re-embedding de fragmentos no modificados en actualizaciones de documentos.

#### 🌍 FASE 101: MULTI-VERTICAL FOUNDATION (COMPLETADO ✅)
**Objetivo:** Implementación inicial (pasiva) de multi-verticalidad.

- [X] **Domain Detection (Passive)**: Filtrado por `industry` en sesión de usuario.
- [X] **Specialized Prompt Contexts**: Inyección de glosarios técnicos por vertical.
- [X] **Vertical Compliance Graders**: Validadores básicos por sector.

#### 🌍 FASE 101.1: ACTIVE MULTI-VERTICAL EVOLUTION (EN PLANIFICACIÓN)
**Objetivo:** Evolucionar a una arquitectura de clasificación activa y espacios segregados.

- [ ] **Active Domain Router**: Clasificación inteligente de cada query (LLM/Embeddings). <!-- ref: Documentación/19/1901.txt -->
- [ ] **Segregated Vector Spaces**: Índices vectoriales específicos por dominio para reducir ruido.
- [ ] **Entity Engine Aliases**: Mapeo dinámico de nombres de entidades por vertical (ej: pedido -> claim).
- [ ] **Cross-Domain Search**: Búsqueda paralela y merge inteligente para queries ambiguas.

#### 🧠 FASE 102: COGNITIVE RETRIEVAL ENHANCEMENTS (COMPLETADO ✅)
**Objetivo:** Alcanzar el estado del arte en precisión de recuperación.

- [X] **Contextual Retrieval (Anthropic style)**: Enriquecimiento de cada chunk con un resumen ejecutivo del documento padre.
- [X] **Hierarchical Chunking**: Estructura de navegación Padre-Hijo para conservar la jerarquía documental (Secciones/Párrafos).
- [X] **Advanced Reranking (Cross-Encoder)**: Pipeline de expansión de consultas + Reranking Top-20 con modelos especializados.

---

### 🌌 ESTRATEGIA DISRUPTIVA (VISION 2027+)

#### FASE 90: QUANTUM & NEUROMORPHIC EDGE (NEXT-GEN)
- [ ] **Quantum-Classical Hybrid Optimization**: Algoritmos QAOA para riesgo y colateral bancario. <!-- ref: 1502.md:145 -->
- [ ] **Neuromorphic Edge Deployment**: Inferencia ultra-rápida en sensores locales (Fraude ATM / IoT Industrial). <!-- ref: 1502.md:74 -->
- [ ] **Brain-Computer Interface (BCI) Auth**: I+D para autenticación por biometría neural en operaciones de alto riesgo. <!-- ref: 1502.md:565 -->
- [ ] **Self-Healing Knowledge Assets**: Auditoría automática y corrección de obsolescencia documental mediante IA. <!-- ref: 1510.md:637 -->

---

### 🟢 MADUREZ DE PRODUCTO & CONECTIVIDAD (Source: Folder 16)

#### 🛠️ FASE 95: PRODUCT READINESS & FINAL CONNECTIVITY (COMPLETADO ✅)
**Objetivo:** Eliminar "Dead Ends" y asegurar la estabilidad core para despliegue industrial.

-   [X] **Unified Auth & Guardian Middleware**: Crear `authorizeRequest` para validación atómica en todas las APIs. <!-- ref: 1601.md:75 -->
-   [X] **Critical Bugfix: Workflow API**: Corregir sintaxis truncada en `workflow-definitions/route.ts`. <!-- ref: 1602.md:25 -->
-   [X] **Dashboard Stability**: Implementar/Importar `TenantROIStats` en `admin/page.tsx`. <!-- ref: 1602.md:151 -->
-   [X] **Integrated i18n Expansion**: Migrar strings hardcodeados a namespaces `knowledge_assets` y `entities`. <!-- ref: 1602.md:190 -->
-   [X] **Cross-Module Navigation**: Implementar `QuickNavConnector` para enlazar Checklist Editor y Workflow Canvas. <!-- ref: 1602.md:781 -->
-   [X] **GDPR User Audit Trail**: Implementar `auditUserAction` para trazabilidad de descargas y visualizaciones. <!-- ref: 1602.md:88 -->

---

### 🧥 ESTRATEGIA SaaS & EXPERIENCIA DE USUARIO (Source: Folder 17)

#### 🎨 FASE 96: BUSINESS-READY UX TRANSFORMATION & GOVERNANCE (COMPLETADO ✅)
**Objetivo:** Eliminar la barrera técnica y orientar la plataforma a resultados de negocio.

-   [x] **Audit Service Core**: Implementación de `AuditService` para logs grado bancario.
-   [x] **Audit Logs Professionalization (Phase 96.1 ✅)**: Patrón de Lazy Loading con filtros dinámicos y contadores aplicado al visor de auditoría.
-   [x] **Technical Terminology Purge (Phase 96.3 ✅)**: Migrar dashboard y reportes de jerga LLM a lenguaje de negocio (Precisión, Ahorro, Volumen) e implementación de i18n dinámico en PDFs.
-   [x] **Intelligent Onboarding System**: Implementar `useOnboarding` y `OnboardingOverlay` para tours guiados de primer login (Phase 96.4 ✅).
-   [x] **Conversational Search UI**: Crear interfaz de chat estilo "técnico-a-técnico" en `/buscar` (Phase 96.2 ✅).
-   [x] **Contextual Help Layer (Phase 96.2 ✅)**: Desplegar `HelpButton` e `InlineHelpPanel` explicativos en el visor de auditoría.
-   [x] **Filtered Notification Center**: Implementar un centro de notificaciones accesible desde `/admin/profile` con filtros por tipo y estado.

---

#### 🏢 FASE 120: ENTERPRISE SaaS TRANSFORMATION (NEXT 🚀)
**Objetivo:** Elevar la plataforma a estándares de "Enterprise-Ready" para clientes B2B de gran escala.
**Referencia:** [Doc 2001.txt](file:///d:/desarrollos/ABDElevators/documentación/20/2001.txt)

-   [X] **120.1: CIAM & Security Hardening (Identity Hub)** (Phase 120.1 ✅)
    -   [X] Mandatory MFA para roles ADMIN/SUPERADMIN.
    -   [X] Soporte fundamentos para SSO OIDC/SAML por tenant.
    -   [X] Guardian "Policy as Code" y auditoría de cambios de rol.
-   [ ] **120.2: Smart Billing & Usage Quotas (NEXT 🚀)**
    -   [ ] Integración con Stripe (Checkouts/Portal).
    -   [ ] Modelo de tiers (BASIC/PRO/ENTERPRISE) con Entitlements dinámicos.
    -   [ ] Hard enforcement de límites (tokens, storage, searches) vía `UsageService`.
-   [X] **120.3: Deep Observability & Reliability** (Phase 120.3 ✅)
    -   [X] Implementación de OpenTelemetry SDK (Custom Spans).
    -   [X] Dashboards de SLIs/SLOs de respuesta RAG (`/api/admin/observability/slis`).
    -   [X] Drills automatizados de backup/restore para MongoDB.
-   [X] **120.4: B2B Experience & ROI Visibility** (Phase 120.4 ✅)
    -   [X] Onboarding Wizard completo para nuevos Tenants.
    -   [X] Business Dashboards (ROI, Ahorro, Calidad RAG) con Chart.js.
    -   [X] Explainable AI Governance UI (Decision Tracing).

#### ⚙️ FASE 97: MULTI-VERTICAL WORKFLOW ENGINE (COMPLETADO ✅)
**Objetivo:** Permitir la orquestación de procesos complejos validados por RAG.

- [X] **Task Collaboration Hub**: Crear centro de gestión de tareas asignadas con historial de auditoría completo. <!-- ref: 08-workflow-engine.md:311 -->

#### 🏢 FASE 98: VERTICAL INDUSTRY PACKS
**Objetivo:** Especialización "out-of-the-box" para nichos de mercado.

- [ ] **Industry UI Adapter**: Implementar `useVerticalConfig` para inyección dinámica de terminología. <!-- ref: 07_arquitectura_multivertical.md:508 -->
- [ ] **Legal/Banking/Insurance Templates**: Crear configuraciones base de workflows y assets para cada vertical. <!-- ref: 07_arquitectura_multivertical.md:32 -->
- [ ] **Vertical Pricing Engine**: Adaptar lógica de suscripción para add-ons verticales y consumo por usuario/storage. <!-- ref: 07_arquitectura_multivertical.md:47 -->

---

### 📉 BACKLOG & GAP ANALYSIS (vs v1.0)

#### ✅ Data Portability & GDPR (Completado)
#### 💅 Frontend Standardization (Zustand & ui-styling)
#### 🧪 FASE 40: INTELLIGENT DATA SIMULATION & PIPELINE HARDENING (COMPLETADO)
#### 🎨 FASE 41: GLOBAL PRIVATE WEB STANDARDIZATION (COMPLETADO ✅)
#### 🧠 FASE 42: INTELLIGENCE ENGINE REFACTOR (COMPLETADO ✅)

---

## How to Use This Document

- Treat this file as the **single source of truth**.

---

#### 🚀 FASE 110: ENTERPRISE ANALYTICS & SCALING (FUTURO)
**Objetivo:** Llevar la plataforma al siguiente nivel de observabilidad y negocio.

- [ ] **Predictive Costing**: Sistema de predicción de costes de tokens por cliente.
- [ ] **Advanced Ingestion Workers**: Sistema distribuido de trabajadores para PDFs de gran volumen (>1GB).
- [ ] **Global Dashboard PRO**: Unificación de métricas de todos los tenants para superadmins.

#### 🔐 FASE 121: AUTH RETROSPECTIVE & HARDENING (FUTURO 🚀)
**Objetivo:** Revisión integral y blindaje de los sistemas de acceso para garantizar máxima resiliencia y seguridad.

- [ ] **Audit MFA Hub:** Revisión de la propagación de sesiones MFA y persistencia en Redis.
- [ ] **Magic Link Logic Overhaul:** Optimización de redirecciones profundas y estados de error.
- [ ] **Rate Limiting Intelligence:** Implementación de bloqueos progresivos por IP/Usuario en flujos de auth.
- [ ] **Session Security:** Blindaje de cookies y tokens JWT contra ataques de sesión.

*Updated and Audited on 2026-02-08 by Antigravity v4.1.0 (Skill: roadmap-manager)*
