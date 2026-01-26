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
- [x] 6.3 Configurador Admin Visual (Full-Screen Configurator Pro con Drag&Drop activo)

- [x] 6.4 Validación Humana Estructurada
- [x] 6.5 Audit Trail Robusto
- [x] 6.6 Informe LLM Opcional
- [x] 6.7 Testing & Deploy
- [ ] **Review Landing Page:** Actualizar secciones de "Features" o "Tecnología" con los avances de RAG Pro.

#### 🌐 FASE 7: GENERALIZACIÓN Y SAAS (VISIÓN 2.0)
- **Objetivo:** Adaptar la plataforma a múltiples industrias.
- [x] 7.1 Abstracción del Modelo de Dominio (Core 2.0)
- [x] 7.2 Motor de Workflows Multinivel
- [x] 7.3 Taxonomías y Metadatos Multi‑tenant
- [x] 7.4 Automatización de Negocio (SaaS Ready - TRACKEO COMPLETADO ✅)
- [x] 7.5 Metrics & Intelligence (Riesgos detectados)

- [ ] 7.6 Sugerencias Proactivas (REUBICADO A FASE 21 – INTEGRADO EN AGENTE)
- [ ] **Review Landing Page:** Resaltar la capacidad Multi-industria y Workflows en las secciones de "Soluciones".

---

### 📊 Métricas de Avance (from `plans/roadmap.md`)
- **Fase 1‑6:** 100 %
- **Fase 7:** 100 % (Motor de Workflows y SaaS listo)
- **Fase 10:** 95 % (Governance & Support operativo)
- **Fase 21:** 0 % (NUEVA: Agentic Evolution)
- **GLOBAL:** 92 % (Identity Suite & MFA implementation completed)

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
- Human Validation Workflow (checkpoint técnico, audit trail, multi-tenant).
- LLM Report Generation (Gemini-powered technical reports with versioning).
- Full SaaS Billing (Stripe integration, automated usage tracking, plan management).
- Advanced Multi-Tenancy (Tenant switching, cross-tenant admin).
- Governance Dashboard (SuperAdmin global metrics and system health).
- **Identity Suite Migration:** Dedicated auth database (ABDElevators-Auth) for user security.
- **Multi-Factor Authentication (MFA):** TOTP implementation with QR codes and recovery codes.
- **Session Control:** Remote session monitoring and revocation for users and admins.

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
3. **Audit Prompt Usage** [x]
   - Log each `PromptService.renderPrompt` call, increment usage counters.
   - Admin view of most‑used prompts (API ready).
4. **Performance Verification** [x]
   - Middleware added to measure request latency start.
5. **Security Hardening** [x]
   - Role‑based access enforcement in `middleware.ts` for all admin paths.
6. **Usability Deep Dive: Prompt Management (`/admin/prompts`)** [x]
   - [x] Review editor CX (Monaco Engine, variable form) and versioning robustness.
   - [x] Full migration of all hardcoded prompts (Checklist, RAG, Alerts, Report).
   - [x] Evaluate variable consistency (automatic `{{tenantId}}` injection).
7. **Documentation Refresh** [ ]
   - Update README with architecture diagram of the new prompt system.
8. **Prompt Length‑Limit Advanced Validation** [ ]
   - Currently, a visual warning is shown in `PromptEditor`.
   - Planned: Block saving if `enforceLimit` is set (future metadata).

#### Phase 6 – RAG Pro & Dynamic Checklists (Weeks 5‑6)
- [x] **6.1 Vector Search Sin LLM**
  - [x] Create `documentos_oficiales` collection.
  - [x] Configure Atlas Vector Search index (Guía creada en `docs/`).
  - [x] Implement `GET /api/pedidos/[id]/vector-search` (SLA < 200 ms).
  - [ ] Unit tests & performance benchmark.
- **6.2 Checklists Dinámicos Configurables**
  - Collection `configs_checklist` + Zod `ChecklistConfigSchema`.
  - CRUD API (`/api/admin/configs-checklist`).
  - UI `/admin/configs-checklist` with drag‑&‑drop (`@dnd-kit`).
  - Category editor, color/icon picker, keyword tags.
- **6.3 Configurador Admin Visual**
  - Full‑screen configurador (`ConfiguratorFull.tsx`).
  - Sidebar navigation, live preview.
- [x] **6.4 Validación Humana Estructurada**
  - [x] Collection `validaciones_empleados` (audit trail).
  - [x] Endpoint `POST /api/pedidos/[id]/validate` (guardar validación).
  - [x] Endpoint `GET /api/pedidos/[id]/validate` (historial).
  - [x] Component `ValidationWorkflow.tsx` (flujo completo de validación).
  - [x] Schemas: `ValidacionSchema`, `ValidacionItemSchema`.
  - [x] Performance monitoring (SLA < 300ms).
  - [x] **Integración Completa:** Página `/pedidos/[id]/validar` actualizada con nuevo sistema.
- [x] **6.5 Audit Trail Robusto**
  - [x] `AuditTrailViewer.tsx` / `audit-pdf-export.ts` (PDF export utility created).
  - [x] Metrics: tiempo empleado, duración, trazabilidad total.
- [x] **6.6 Informe LLM Opcional**
  - [x] Button “Generar Informe Profesional”.
  - [x] Endpoint `POST /api/pedidos/[id]/generar-informe` (Server-side PDF generation).
  - [x] Component `InformeLLMGenerator` with persistent PDF download.
- [x] **6.6.1 Gestión Avanzada de Informes LLM (Control de Costos & Auditoría)** ✅ **COMPLETADO**
  - [x] **Control de Costos:** Feature flag por tenant, límites mensuales, estimación pre-generación.
  - [x] **Almacenamiento:** PDFs en Cloudinary `/{tenantId}/informes/{pedidoId}/`, versionado automático.
  - [x] **Auditoría:** Historial completo, tracking de tokens/costos, quién generó cuándo.
  - [x] **UI:** Lista de informes en detalle del pedido, preview, descarga de PDF persistente.
  - [x] **Compliance:** Aislamiento total de informes por tenantId.
  - Ver diseño completo en documentación de fase
- **6.7 Testing & Deploy**
  - Unit tests (`checklist-extractor.test.ts`, `auto-classifier.test.ts`).
  - Integration tests (`vector-search.test.ts`, `config-save.test.ts`).
  - E2E Playwright suite (`validation-workflow.spec.ts`, `configurator.spec.ts`).
  - Coverage ≥ 80 % and performance benchmarks (Vector < 200 ms, Checklist < 500 ms).
  - Staging → producción deployment, monitoring dashboards.
- [x] **6.8 Gestión Avanzada de Documentos**
  - [x] Implementar borrado físico (DB + Cloudinary API).
  - [x] Sistema de deprecación/archivado de manuales (soft-delete/obsoleto).
  - [ ] Historial de cambios en documentos del corpus.

#### Phase 7 – Multi‑Industry & SaaS (Visión 2.0)
#### 7.2 Motor de Workflows Multinivel (COMPLETADO ✅)
- [x] Definición de esquemas Zod (`WorkflowDefinitionSchema`).
- [x] Implementación de `WorkflowEngine` (Motor de transiciones).
- [x] Implementación de `WorkflowService` (Gestión y Seeding).
- [x] Endpoint `POST /api/pedidos/[id]/transition`.
- [x] UI visualizador de estados en el dashboard.

...

#### 🏰 FASE 10: PLATFORM GOVERNANCE & SUPPORT (COMPLETADO ✅)
- **Objetivo:** Control total de la plataforma y soporte al usuario final.
- **Hitos:**
  - [x] **SuperAdmin Role:** Usuario raíz con visibilidad total (script `create-super-admin`).
  - [x] **Notificaciones Hub:** Sistema in-app con campana animada y polling (UI + Backend).
  - [x] **Centro de Soporte:** Formulario para técnicos y panel de respuesta para admins (`/contacto` y `/admin/contacts`).
  - [x] **Prompt Engineering UI 2.0 (Advanced):**
    - [x] Editor Monaco con validación de integridad de variables.
    - [x] "IntelliSense" de variables de sistema y guía de uso in-situ.
    - [x] Biblioteca de Plantillas (Load Example) por categoría.
    - [x] Control de Versiones completo con Rollback instantáneo.
  - [x] **Expansión SuperAdmin:** Revisar y ampliar opciones de gestión global (actualmente limitadas).
  - [x] **Métricas Globales:** Salud financiera y técnica de todos los tenants.
- [ ] **Review Landing Page:** Asegurar que las opciones de soporte y gobernanza se reflejan en la oferta Enterprise.
- **7.3 Taxonomías y Metadatos Multi‑tenant** (already done) – mantener y expandir.
- [x] **7.4 Automatización SaaS**
  - [x] Completar **trackeo de uso** (LLM, storage, search) – conectado a `UsageTracker`.
  - [x] Dashboard de consumo por organización (gráficos de tokens, documentos, almacenamiento).
  - [x] Integrar Stripe webhooks para suscripciones.
  - [x] **Plan Management:** Cambio de plan (Upgrade/Downgrade) con prorrateo de créditos.
- **💳 FASE 9.1: MOTOR DE FACTURACIÓN AVANZADA (DYNAMIC PRICING ENGINE) (COMPLETADO ✅)**
  - **Herencia de Tarifas:** Configuración global con overrides específicos por tenant (negociaciones ad-hoc).
  - **Modelos de Cobro Dinámicos:**
    - [ ] **Modelo Estándar:** Precio fijo por unidad (Reporte, API call, GB).
    - [ ] **Escalado por Volumen (Tiered):** Bloques de precio (0-100 a 1€, 101-500 a 0.90€).
    - [ ] **Rappel Directo:** Descuento aplicado a TODAS las unidades al superar un umbral.
    - [ ] **Rappel Inverso:** Recargo por volumen excesivo (discouragement pricing / infra stress).
    - [ ] **Tarifa Plana + Overage:** X unidades incluidas en el fee mensual, resto por unidad.
  - **Marketing & Landing Page:**
    - [ ] **Páginas de Precios:** Integrar `PricingTable` dinámica en la landing.
    - [ ] **Estructura de Planes:** Configurar planes Standard, Pro, Premium, Ultra con sus tiers visibles.
    - [ ] **Sincronización:** Botón "Publicar Cambios de Tarifas" en SuperAdmin para actualizar la landing.
    - [ ] **Automatización (Cron):** Tarea programada (Vercel Cron) para recálculo de consumos y actualización de dashboard de facturación el día 1 de cada mes.
- **🔄 FASE 9.2: GESTIÓN DE CICLO DE VIDA Y ESTABILIDAD (EN PROCESO 🛠️)**
  - **Grandfathering:** Lógica para proteger las tarifas de clientes antiguos ante cambios globales.
  - [x] **Upgrades/Downgrades:** Sistema de prorrateo para cambios de plan a mitad de mes.
  - [ ] **Ajustes Masivos:** Herramienta para SuperAdmin de actualización de precios (IPC/Inflación).
  - [x] **Trial to Paid:** Workflow de conversión automática y alertas de fin de cortesía.
- **7.5 Metrics & Intelligence** – seguir mejorando detección de riesgos y métricas de uso.
- **7.6 Sugerencias Proactivas**
  - Engine que sugiere componentes o acciones basadas en hallazgos de riesgo.
- [x] **7.7 Infraestructura de Almacenamiento Multi-tenant** (COMPLETADO ✅)
  - [x] Configuración de buckets/carpetas por cliente.
  - [x] Soporte inicial: Cloudinary (aislamiento por carpetas).
  - [ ] **Estrategia de Almacenamiento Flexible (BYOS):** Evaluar y permitir configuración por tenant de credenciales propias (Azure Blob, S3, Google Drive) vs. Almacenamiento compartido administrado (carpetas aisladas).
  - [ ] **Soberanía de Datos Pro (BYODB):** Capacidad para que un tenant premium configure su propia instancia/cluster de MongoDB. Requiere motor de inyección de conexiones dinámicas y centralización de telemetría para facturación.
  - [ ] Roadmap de integración: Google Drive, AWS S3, Azure Blob.
- [x] **Industry Abstraction Layer**
  - [x] Crear plantillas de entidad por industria (elevators, HVAC, manufacturing, healthcare, IT assets).
  - [x] UI para seleccionar plantilla al crear nuevo tenant.
- [x] **Internationalization (i18n)**
  - [x] Multi‑language support (ES/EN), cookie-based locale detection.
- [ ] **Final Deployment Hardening**
  - [x] Vercel production rollout, CI/CD pipelines.
  - [x] Rate-limiting & Security Headers.
  - [ ] Automated smoke tests & Pentesting.

#### Phase 8 – Enterprise Hardening & Global Expansion
- [x] **8.1 Accesibilidad (a11y)**
  - [x] Cumplimiento inicial WCAG 2.1 (Aria labels, contraste).
  - [ ] Auditoría técnica de accesibilidad completa.
- [x] **8.2 Internacionalización (i18n)**
  - [x] Implementación de `next-intl`.
  - [x] Traducción inicial: Español / Inglés.
- [x] **8.3 Optimización SEO & Core Web Vitals**
  - [x] Dynamic Metadata, OpenGraph, Twitter Cards.
  - [x] Optimización de imágenes (next/image).
- [ ] **8.4 Auditoría de Seguridad & Compliance**
  - [x] Registro estructurado de eventos (logEvento) en Auth.
  - [ ] Pentesting inicial.
  - [x] Hardening de API Endpoints (Rate-limiting 100 req/h).
  - [x] Security Headers (HSTS, No-Sniff, Frame-Deny).
  - [x] Fix: TypeScript compatibility for Next.js 15/16 (async params).

#### 🎨 FASE 8.5: LANDING PAGE & MARKETING (COMPLETADA - 2026-01-23)
- [x] **8.5.1 Landing Page Premium**
  - [x] Hero section con CTAs funcionales (Comenzar ahora → /login, Ver arquitectura → /arquitectura).
  - [x] Sección de Tecnología con 3 features (Dual-Engine, Vector Search, Audit-Trail).
  - [x] Sección de Soluciones multi-industria (Elevadores, Legal, IT).
  - [x] Sección de Seguridad Enterprise (Multi-tenant, Cifrado, Soberanía).
  - [x] Footer completo con links funcionales y páginas legales.
- [x] **8.5.2 Páginas de Detalle**
  - [x] `/arquitectura` - Arquitectura técnica completa (Frontend, Backend, Security, Data Flow).
  - [x] `/features/dual-engine` - Extracción Dual-Engine (OCR + Gemini AI).
  - [x] `/features/vector-search` - Hybrid Vector Search (Embeddings semánticos).
  - [x] `/features/audit-trail` - Audit-Trail Pro (Trazabilidad total).
- [x] **8.5.3 Páginas Legales**
  - [x] `/privacy` - Privacy Policy (GDPR compliant).
  - [x] `/terms` - Terms of Service (cumplimiento legal).
- [x] **8.5.4 Assets & Optimización**
  - [x] Imágenes generadas con IA para todas las secciones (8 imágenes custom).
  - [x] Optimización de rutas (public folder para Next.js static serving).
  - [x] Internacionalización (ES/EN) con next-intl.
  - [x] Diseño responsive y accesible (WCAG 2.1).

---

## 🎯 SIGUIENTE PASO: FASE 9 - BILLING & USAGE TRACKING (SaaS Ready)

### Objetivo
Implementar el sistema completo de facturación y trackeo de uso para convertir la plataforma en un SaaS comercializable.

### Tareas Prioritarias

#### 9.1 Usage Tracking Service (COMPLETADO ✅)
- [x] **Completar `src/lib/usage-service.ts`**
  - [x] Implementar `trackLLMUsage(tokens, model, operation)`.
  - [x] Implementar `trackStorageUsage(bytes, operation)`.
  - [x] Implementar `trackSearchUsage(queries, type)`.
  - [x] Integrar con MongoDB (collection `usage_logs`).
- [x] **Integrar en servicios existentes**
  - [x] Modificar `llm.ts` para registrar consumo de Gemini.
  - [x] Modificar `cloudinary.ts` para registrar tamaño de uploads.
  - [x] Modificar `rag-service.ts` para registrar búsquedas vectoriales.
- [x] **API de Estadísticas**
  - [x] `GET /api/admin/usage/stats` con tier y límites dinámicos.
  - [x] Agregación por tenant, tipo de recurso, y periodo.

#### 9.2 Billing Dashboard (COMPLETADO ✅)
- [x] **Componente `ConsumptionDashboard.tsx`**
  - [x] Gráficos de consumo (tokens LLM, storage GB, searches).
  - [x] Tabla de desglose por servicio.
  - [x] Alertas de límites (80% amarillo, 100% rojo).
  - [x] Barras de progreso dinámicas basadas en consumo real.
- [x] **Página `/admin/billing`**
  - [x] Vista de consumo actual del mes.
  - [x] Historial de actividad (últimos 20 eventos).
  - [x] Badge de plan actual (FREE/PRO/ENTERPRISE).
  - [x] Botones de gestión (Upgrade/Manage Subscription).
- [x] **Límites por Plan**
  - [x] Definir tiers: Free (100k tokens/mes), Pro (1M tokens/mes), Enterprise (ilimitado).
  - [x] Middleware `usage-limiter.ts` para bloquear requests si se excede el límite.
  - [x] Sistema de planes en `src/lib/plans.ts`.

#### 9.3 Integración Stripe (COMPLETADO ✅ - 2026-01-23)
- [x] **Servicio de Stripe**
  - [x] `src/lib/stripe.ts` con lazy initialization.
  - [x] Funciones: getOrCreateStripeCustomer, createCheckoutSession, createBillingPortalSession.
- [x] **Webhooks de Stripe**
  - [x] `POST /api/webhooks/stripe` para eventos (subscription.created, updated, deleted, payment.succeeded, payment.failed).
  - [x] Actualizar estado de suscripción en MongoDB (`tenants.subscription`).
  - [x] Verificación de firma con `stripe.webhooks.constructEvent()`.
- [x] **Checkout Flow**
  - [x] Página `/upgrade` con selector de planes (diseño premium).
  - [x] Integración con Stripe Checkout (`/api/billing/create-checkout`).
  - [x] Redirección post-pago a dashboard.
  - [x] Toggle mensual/anual con descuento.
- [x] **Billing Portal**
  - [x] Endpoint `/api/billing/portal` para gestionar suscripción.
  - [x] Botón "Gestionar Suscripción" en dashboard.
- [x] **Configuración**
  - [x] `.env.example` con todas las variables de Stripe.
  - [x] Documentación completa en `FASE_9.3_STRIPE.md`.

#### 9.4 Notificaciones de Límites (COMPLETADO ✅ - 2026-01-23)
- [x] **Email Alerts**
  - [x] Configurar servicio de email (Resend).
  - [x] Email templates HTML premium para alertas.
  - [x] Enviar email cuando se alcanza 80% del límite.
  - [x] Enviar email cuando se alcanza 100% (servicio suspendido).
  - [x] Email cuando pago falla (integrar en webhook).
  - [x] Suspensión automática tras 3 pagos fallidos.
  - [x] Prevención de spam (1 email cada 24h por límite).
- [x] **In-App Notifications**
  - [x] Componente `<LimitAlert />` (banner flotante).
  - [x] Componente `<LimitExceededModal />` (modal de bloqueo).
  - [x] Banner dismissible con sessionStorage.
  - [x] Colores dinámicos según severidad (amarillo/rojo).
- [x] **Fixes Críticos**
  - [x] Middleware: Rutas públicas (/, /privacy, /terms, /arquitectura, /features/*, /upgrade).
  - [x] Documentación completa en `FASE_9.4_NOTIFICATIONS.md`.


#### 9.5 Testing & Deployment
- [ ] **Unit Tests**
  - [ ] Tests para `UsageTracker` (mock MongoDB).
  - [ ] Tests para cálculo de costos por tier.
- [ ] **Integration Tests**
  - [ ] Test de flujo completo: upload → track storage → verify stats.
  - [ ] Test de Stripe webhook (mock events).
- [ ] **E2E Tests**
  - [ ] Playwright: flujo de upgrade de plan.
  - [ ] Playwright: verificación de límites.

#### 🚀 FASE 11: ADVANCED MULTI-TENANCY & GLOBAL GOVERNANCE
- **Objetivo:** Convertir la plataforma en un centro de control total donde la gestión multi-empresa sea transversal a todos los módulos.

- **11.0: Análisis de Impactos y Hardening de Contexto (REVISIÓN DE SEGURIDAD 🛡️):**
  - [x] **Identificación de Puntos Críticos:** Revisión de toda la stack para asegurar aislamiento total.
  - [x] **Impacto en RAG:** Los `document_chunks` deben incluir `tenantId` (o `null` para globales) para evitar fugas de información entre empresas.
  - [x] **Impacto en API (ID Enumeration):** Todos los endpoints `/[id]` deben validar que la entidad pertenece al `tenantId` de la sesión.
  - [x] **Impacto en UI State:** El cambio de contexto debe forzar la limpieza de cachés y recarga de datos (Sync React Context).
  - [x] **Impacto en Storage:** Verificación de aislamiento de carpetas en Cloudinary/S3 por cada contexto activo.
- [ ] **Review Landing Page:** Potenciar el mensaje de Aislamiento y Seguridad Grado Bancario.

- **Hitos de Infraestructura y Seguridad:**
  - [x] **Context Switching (Tenant Selector):** Selector global persistente para alternar entre contextos de empresa sin re-login (Componente `UserNav`).
  - [x] **RBAC Cross-Tenant:** Soporte para usuarios vinculados a múltiples organizaciones con roles independientes (Esquema `tenantAccess`).
  - [x] **Data Isolation (Hardened):** Middleware de filtrado dinámico basado en `activeTenantContext`.
  - [ ] **SuperAdmin Masquerading:** Capacidad de "emular" sesiones para soporte técnico avanzado.
- **Hitos de Gestión Transversal (El "Control Plane") (COMPLETADO ✅):**
  - [x] **Global Dashboard:** Vista agregada de métricas (pedidos activos, riesgos detectados, consumo) de todos los tenants para SuperAdmins (API `/api/admin/global-stats`).
  - [x] **Cross-Tenant User Management:** Panel para gestionar usuarios que pertenecen a varios grupos empresariales desde una sola vista.
  - [ ] **Auditoría Profunda de Gestión de Usuarios:** Revisar `/admin/usuarios` para asegurar que permite asignar y visualizar correctamente los permisos multi-tenant (`tenantAccess`), ya que la UI actual podría no reflejar todas las capacidades del backend.
  - [ ] **Unified Support Hub:** Integración del sistema de tickets con el selector de tenant para ver logs y contexto del usuario de forma inmediata.
  - [x] **AI Governance Layer:** 
    - [x] **Global Prompt History:** Audit log centralizado de cambios en prompts de toda la plataforma.
    - [x] **Tenant Context Branding:** Identificación visual del propietario del prompt en listados globales.
  - [ ] **Global Workflow & Prompt templates:** Capacidad de despliegue masivo de configuraciones maestras a múltiples tenants.
  - [x] **Consolidated Analytics:** Reportes de facturación, uso de AI y almacenamiento agregados por cliente y globalmente.
- **Hitos de Gestión de Usuarios Enterprise (Seguridad Grado Bancario):**
  - [x] **Tenant User Provisioning:** Interfaz para que Administradores den de alta, editen y suspendan usuarios de su propia entidad.
  - [x] **Granular RBAC UI:** Panel para asignar roles (`ADMIN`, `TECNICO`, `INGENIERIA`) y activar/desactivar módulos por usuario.
  - [x] **Invitaciones Seguras:** Sistema de invitación vía email con tokens de un solo uso y expiración temporal.
  - [ ] **Security Hardening:** Implementación de Multi-Factor Authentication (MFA) opcional y política de rotación de contraseñas.
  - [ ] **User Audit Trail:** Registro inmutable de quién creó a quién y qué permisos fueron modificados (Regla de Oro #4).
  - [ ] **Session Control:** Capacidad del administrador para revocar sesiones activas de usuarios comprometidos o dados de baja.
- [ ] **Review Landing Page:** Mostrar capacidades de RBAC y Control Enterprise en la sección de Seguridad.
  
- **🚀 FASE 12: MODO DEMO EFÍMERO & FREE TRIAL (PLANNED)**
  - **Objetivo:** Permitir que potenciales clientes prueben la plataforma en un entorno seguro y auto-limpiable.
  - **Hitos:**
    - [ ] **Ephemeral Tenant Factory:** Capacidad de crear un tenant de prueba con un solo click.
    - [ ] **Auto-Cleanup Engine (TTL):** Proceso programado para borrar tenants de prueba tras N días (incluye Cloudinary, DB y Logs).
    - [ ] **Demo Data Seeding:** Ingesta automática de documentos, pedidos y usuarios "fake" para una experiencia completa inmediata.
    - [ ] **Simulated Billing:** Visualización de cómo sería la factura sin cargos reales.
    - [ ] **Environment Isolation:** Investigación de despliegue en rama `demo` vs. Aislamiento lógico en `production`.
- [ ] **Review Landing Page:** Añadir botón/sección "Pruébalo ahora (Demo Mode)" si aplica.

- **🛡️ FASE 13: CONTINUIDAD, BACKUP & DISASTER RECOVERY (PLANNED)**
  - **Objetivo:** Garantizar la integridad de los datos y la capacidad de recuperación ante desastres para todos los tenants.
  - **Hitos y Estrategia Técnica:**
    - [ ] **Unified Backup Engine (Logical):** 
      - Scripting con `mongodump --query` para exportar datos JSON/BSON aislados por `tenantId`.
      - Almacenamiento comprimido en bucket S3 independiente con política de ciclo de vida (retención 30 días).
    - [ ] **Cloudinary Archiver:** 
      - Uso de `rclone` o scripts personalizados con la API de Cloudinary para sincronizar carpetas de tenant hacia AWS S3 Glacier (Cold Storage).
      - Verificación de hash para asegurar integridad de la copia.
    - [ ] **Data Portability Service:** Interfaz para que el cliente descargue un "Knowledge Package" (ZIP) con sus documentos originales + exportación de pedidos en formato legible (JSON/CSV).
    - [ ] **BYOS/BYODB Backup Bridge:** 
      - Orquestación de backups nativos en la nube del cliente (ej. disparar snapshot de su MongoDB Atlas propio o bucket S3 propio) vía webhooks o API de proveedores.
    - [ ] **WORM Audit Log Hardening:** Exportación mensual de `logs_aplicacion` a almacenamiento inmutable (WORM - Write Once Read Many) para cumplimiento normativo.
- [ ] **Review Landing Page:** Destacar la Soberanía de Datos y Disaster Recovery en la sección Enterprise.

- **⚖️ FASE 14: GDPR COMPLIANCE & DERECHO AL OLVIDO (PLANNED)**
  - **Objetivo:** Implementar un sistema profesional de borrado de datos que cumpla con la normativa europea, manteniendo la integridad de auditoría de la plataforma.
  - **Estrategia Técnica (Erasure Policy):**
    - [ ] **Purge System (Hard Delete):** Eliminación total de datos PII (Personally Identifiable Information) de la colección `usuarios` y `pedidos`.
    - [ ] **Document Shredding:** Borrado físico inmediato en Cloudinary de todo archivo vinculado al usuario/tenant solicitante.
    - [ ] **Anonymization Engine:** Si existen datos transaccionales necesarios para estadísticas globales (facturación, uso AI), se anonimizan (se quita el vínculo al email/nombre) en lugar de borrar el log de uso.
    - [ ] **Immutable Erasure Evidence:** 
      - Generación de un log crítico en `logs_aplicacion` que registre: *"Entidad [ID] borrada el [Fecha] por solicitud [Ticket ID]"*.
      - Este log NO contendrá datos privados, solo el ID interno y la acción, para demostrar cumplimiento ante inspecciones.
    - [ ] **Deletion Receipt:** Sistema de envío de email automático confirmando el borrado exitoso y el código de rastro de la operación.
- [ ] **Review Landing Page:** Promocionar el cumplimiento GDPR 100% y el derecho al olvido automatizado.

- **🔌 FASE 16: API PÚBLICA & INTEGRACIÓN DE SISTEMAS (PLANNED)**
  - **Objetivo:** Exponer la funcionalidad RAG como API RESTful consumible por sistemas externos de clientes, siguiendo estándares OpenAPI 3.0 y mejores prácticas de API design.
  - **Principios de Diseño:**
    - [ ] **RESTful Architecture:** Endpoints semánticos, verbos HTTP correctos, códigos de estado apropiados.
    - [ ] **Versionado:** API versionada (`/api/v1/...`) para compatibilidad hacia atrás.
    - [ ] **Rate Limiting:** Límites por API key (ej. 1000 req/día tier Free, ilimitado Enterprise).
    - [ ] **Autenticación:** API Keys + OAuth 2.0 para integraciones enterprise.
    - [ ] **Documentación:** Swagger/OpenAPI spec auto-generada, ejemplos de código en múltiples lenguajes.
  - **Endpoints Propuestos:**
    - [ ] **POST /api/v1/documents/ingest**
      - Descripción: Inyectar documentos del cliente directamente al corpus RAG.
      - Payload: `{ file: binary, metadata: { category, tags }, tenantId }`
      - Response: `{ documentId, status: "indexed", vectorsGenerated: 120 }`
      - SLA: < 2s para PDFs < 10MB.
    - [ ] **POST /api/v1/rag/query**
      - Descripción: Consulta RAG pura (texto → resultados semánticos).
      - Payload: `{ query: string, filters?: { category, dateRange }, topK: 10 }`
      - Response: `{ results: [{ text, score, source, metadata }], processingTime }`
      - SLA: < 500ms.
    - [ ] **POST /api/v1/analysis/extract**
      - Descripción: Análisis completo de pedido/caso (RAG + LLM + Validación).
      - Payload: `{ caseId: string, autoValidate: boolean }`
      - Response: `{ findings: [...], risks: [...], recommendations: [...], confidence }`
      - SLA: < 3s.
    - [ ] **GET /api/v1/results/{caseId}**
      - Descripción: Obtener resultados procesados para integración en sistemas del cliente.
      - Response: `{ caseId, status, validatedData, auditTrail, exportFormats: ["json", "pdf"] }`
    - [ ] **POST /api/v1/webhooks/subscribe**
      - Descripción: Suscribirse a eventos (documento indexado, análisis completado, validación aprobada).
      - Payload: `{ url: "https://client.com/webhook", events: ["document.indexed", "analysis.completed"] }`
  - **Seguridad y Compliance:**
    - [ ] **API Key Management:** Panel de generación/revocación de keys en `/admin/api-keys`.
    - [ ] **Scoped Permissions:** Keys con permisos granulares (read-only, write, admin).
    - [ ] **IP Whitelisting:** Restricción de IPs permitidas por API key.
    - [ ] **Audit Log:** Registro de todas las llamadas API con correlación a tenant.
    - [ ] **Encryption:** TLS 1.3 obligatorio, payload encryption opcional para datos sensibles.
  - **Developer Experience:**
    - [ ] **SDKs Oficiales:** JavaScript/TypeScript, Python, C# (.NET).
    - [ ] **Postman Collection:** Colección pre-configurada con ejemplos.
    - [ ] **Sandbox Environment:** Entorno de pruebas con datos fake para desarrollo.
    - [ ] **Status Page:** Página pública de estado de la API (uptime, latencia).
  - **Monitoreo y Analytics:**
    - [ ] **API Analytics Dashboard:** Métricas de uso por endpoint, errores, latencia.
    - [ ] **Usage Quotas:** Alertas automáticas al cliente cuando se acerca al límite.
    - [ ] **Error Tracking:** Integración con Sentry/Datadog para errores de API.

- **♿ FASE 17: ACCESIBILIDAD (A11Y) & SEO AUDIT (PLANNED)**
  - **Objetivo:** Garantizar que la aplicación cumple con estándares WCAG 2.1 AA y está optimizada para motores de búsqueda.
  - **Accesibilidad (A11Y):**
    - [ ] **Auditoría Automática:** Ejecutar Lighthouse, axe DevTools y WAVE en todas las páginas.
    - [ ] **Navegación por Teclado:** Verificar que toda la UI es navegable sin mouse (Tab, Enter, Esc).
    - [ ] **Screen Readers:** Probar con NVDA/JAWS (Windows) y VoiceOver (Mac).
    - [ ] **Contraste de Color:** Asegurar ratio mínimo 4.5:1 (texto normal) y 3:1 (texto grande).
    - [ ] **ARIA Labels:** Añadir `aria-label`, `aria-describedby` en componentes interactivos.
    - [ ] **Focus Management:** Estados de foco visibles y lógicos en modales, dropdowns, etc.
    - [ ] **Formularios Accesibles:** Labels asociados, mensajes de error descriptivos, validación en tiempo real.
    - [ ] **Imágenes:** Alt text descriptivo en todas las imágenes (no decorativas).
    - [ ] **Tablas de Datos:** Headers `<th>` con `scope`, caption descriptivo.
  - **SEO (Search Engine Optimization):**
    - [ ] **Meta Tags:** Title, description, Open Graph, Twitter Cards en todas las páginas públicas.
    - [ ] **Semantic HTML:** Uso correcto de `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`.
    - [ ] **Heading Hierarchy:** Un solo `<h1>` por página, jerarquía lógica (h1 → h2 → h3).
    - [ ] **Sitemap.xml:** Generación automática con Next.js.
    - [ ] **Robots.txt:** Configuración correcta para crawlers.
    - [ ] **Canonical URLs:** Evitar contenido duplicado.
    - [ ] **Performance:** Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1).
    - [ ] **Mobile-First:** Diseño responsive verificado en múltiples dispositivos.
    - [ ] **Structured Data:** Schema.org markup para rich snippets (Organization, Product, FAQ).
  - **Herramientas y Testing:**
    - [ ] **Lighthouse CI:** Integración en pipeline de CI/CD con umbrales mínimos (Accessibility: 90+, SEO: 90+).
    - [ ] **Pa11y:** Tests automáticos de accesibilidad en cada PR.
    - [ ] **Google Search Console:** Monitoreo de indexación y errores.
    - [ ] **Hotjar/Clarity:** Heatmaps para identificar problemas de UX.

- **🎨 FASE 18: WHITE-LABEL BRANDING & CORPORATE ASSETS (IN PROGRESS 🛠️)**
  - **Objetivo:** Permitir que cada tenant personalice la plataforma con su identidad corporativa (logos, colores, fuentes) para white-labeling enterprise.
  - **Gestión de Assets Corporativos:**
    - [ ] **Schema Extension:** Añadir campo `brandingAssets` al modelo de Tenant en MongoDB.
    - [ ] **Cloudinary Isolation:** Implementar estructura de carpetas `/{tenantId}/branding/` con lógica de sobrescritura para logos.
    - [ ] **CSS Variable Injection:** Crear un componente `BrandingProvider.tsx` que inyecte variables CSS (`--primary-color`, etc.) dinámicamente desde la DB.
  - **Módulo de Gestión de Imágenes (REUTILIZABLE):**
    - [ ] **Component: `ImageAssetManager.tsx`**: Selector de archivos con preview, crop y validaciones (formato/tamaño).
    - [ ] **Service: `asset-upload.ts`**: Lógica centralizada para subir logos y favicons vinculados al tenant.
  - **UI de Personalización:**
    - [ ] **Página: `/admin/settings/branding`**: Panel con color pickers y gestor de logos con preview en tiempo real.
    - [ ] **Report Branding:** Modificar el generador de PDFs para incluir el logo del tenant si existe.

- **🌍 FASE 19: INTERNACIONALIZACIÓN COMPLETA (i18n AUDIT) (PLANNED)**
  - **Objetivo:** Verificar que toda la aplicación soporta múltiples idiomas (ES/EN mínimo) y está preparada para expansión global.
  - **Auditoría de Cobertura:**
    - [ ] **Páginas Públicas:** Landing, arquitectura, features, contacto → 100% traducidas.
    - [ ] **Páginas Autenticadas:** Dashboard, pedidos, validación, admin → Verificar uso de `useTranslations()`.
    - [ ] **Componentes UI:** Botones, modals, forms, tables → Textos hardcodeados identificados y migrados a `messages/`.
    - [ ] **Emails:** Plantillas de invitación, notificaciones → Multilenguaje con fallback a ES.
    - [ ] **Mensajes de Error:** API responses, validaciones Zod → Traducidos en ambos idiomas.
    - [ ] **Informes PDF:** Generación de informes en idioma del tenant.
  - **Estructura de Traducciones:**
    - [ ] **Archivos:** `messages/es.json`, `messages/en.json` con estructura idéntica.
    - [ ] **Namespaces:** Organizar por secciones (`common`, `nav`, `pedidos`, `admin`, `errors`).
    - [ ] **Validación:** Script para detectar keys faltantes entre idiomas.
  - **Selector de Idioma:**
    - [ ] **UI Component:** Dropdown en header para cambiar idioma (persistir en cookies).
    - [ ] **Tenant Default:** Configurar idioma por defecto por tenant (ej. tenant UK → EN).
    - [ ] **User Preference:** Permitir que cada usuario elija su idioma preferido.
  - **Formateo Regional:**
    - [ ] **Fechas:** Usar `Intl.DateTimeFormat` con locale correcto.
    - [ ] **Números:** Separadores de miles/decimales según región.
    - [ ] **Moneda:** Formato de precios según país del tenant.
  - **Testing:**
    - [ ] **Pruebas Manuales:** Navegar toda la app en ES y EN verificando textos.
    - [ ] **Automated Tests:** Playwright tests que cambien idioma y verifiquen traducciones.
    - [ ] **Coverage Report:** Generar reporte de % de cobertura i18n por página.

- **🎫 FASE 20: SISTEMA DE TICKETING EMPRESARIAL (COMPLETADO ✅)**
  - **Objetivo:** Reemplazar el sistema de contacto simple por un sistema de ticketing profesional con escalamiento jerárquico y SLA tracking, siguiendo mejores prácticas de entornos SaaS bancarios.
  - **Arquitectura de Escalamiento:**
    - [x] **Jerarquía de Soporte:**
      ```
      Usuario (TECNICO/INGENIERIA) 
        → Ticket L1 (Auto-asignado a ADMIN del tenant)
        → Escalamiento L2 (ADMIN puede elevar a SUPER_ADMIN)
        → Escalamiento L3 (SUPER_ADMIN puede derivar a equipo técnico ABD)
      ```
    - [x] **Routing Inteligente:** 
      - Tickets técnicos (RAG, análisis) → Equipo de ingeniería
      - Tickets de facturación → Equipo comercial
      - Tickets de seguridad → Equipo de compliance
  - **Schema de Tickets:**
    - [x] **Collection: `tickets`**
      ```typescript
      {
        _id, ticketNumber: "TKT-2024-00123",
        tenantId, createdBy, assignedTo,
        subject, description, priority: "LOW|MEDIUM|HIGH|CRITICAL",
        category: "TECHNICAL|BILLING|SECURITY|FEATURE_REQUEST",
        status: "OPEN|IN_PROGRESS|WAITING_USER|ESCALATED|RESOLVED|CLOSED",
        sla: { responseTime: Date, resolutionTime: Date, breached: boolean },
        escalationHistory: [{ from, to, reason, timestamp }],
        attachments: [{ url, cloudinaryId, filename }],
        internalNotes: [{ author, content, timestamp, visibility: "INTERNAL_ONLY" }],
        publicComments: [{ author, content, timestamp }],
        tags: ["rag", "performance", "bug"],
        createdAt, updatedAt, resolvedAt, closedAt
      }
      ```
  - **SLA Management:**
    - [ ] **Definición de SLAs por Prioridad (Pendiente Configuración):**
      - CRITICAL: Respuesta < 1h, Resolución < 4h
      - HIGH: Respuesta < 4h, Resolución < 24h
      - MEDIUM: Respuesta < 24h, Resolución < 72h
      - LOW: Respuesta < 48h, Resolución < 7 días
    - [ ] **Alertas Automáticas:** Notificar a supervisores si SLA está en riesgo (80% del tiempo consumido).
    - [ ] **Breach Tracking:** Dashboard de tickets con SLA incumplido.
  - **UI de Gestión:**
    - [x] **Página: `/soporte`**
      - Vista de lista con filtros (estado, prioridad, categoría)
      - Indicadores visuales de SLA (verde/amarillo/rojo)
      - Búsqueda full-text en subject/description
    - [x] **Página: `/soporte/[id]`**
      - Timeline de actividad (comentarios, escalamientos, cambios de estado)
      - Editor de comentarios con markdown
      - Upload de attachments (screenshots, logs)
      - Botón "Escalar" con selector de destinatario
  - **Notificaciones:**
    - [ ] **Email:** Nuevo ticket, respuesta, escalamiento, resolución
    - [ ] **In-App:** Badge de tickets sin leer en header
    - [ ] **Webhook (opcional):** Integración con Slack/Teams para equipos
  - **Mejores Prácticas Bancarias:**
    - [ ] **Audit Trail Completo:** Registro inmutable de todas las acciones en el ticket
    - [ ] **Confidencialidad:** Notas internas no visibles para usuarios
    - [ ] **Encriptación:** Attachments sensibles encriptados en Cloudinary
    - [ ] **Compliance:** Retención de tickets por 7 años (regulación financiera)
    - [ ] **GDPR:** Anonimización de tickets al eliminar usuario
  - **Analytics:**
    - [ ] **Dashboard de Métricas:**
      - Tiempo promedio de primera respuesta
      - Tiempo promedio de resolución
      - % de tickets resueltos en SLA
      - Tickets por categoría/prioridad
      - Satisfacción del cliente (CSAT post-resolución)
    - [ ] **Reportes:** Exportar métricas en CSV/PDF para auditorías

- **🎯 FASE 15: LANDING PAGE AUDIT & COMPLIANCE CERTIFICATION (PLANNED)**
  - **Objetivo:** Asegurar que la landing page refleja con precisión las capacidades reales de la plataforma y obtener certificaciones formales.
  - **Tareas de Revisión:**
    - [x] **Corrección de Claims Falsos:**
      - [x] Cambiar "SOC2 Compliant" a "Enterprise Security Hardened" (no tenemos certificación formal).
      - [x] Cambiar "Aislamiento físico" a "Aislamiento lógico certificado" (es filtrado por tenantId, no físico).
      - [x] Actualizar "Soberanía de Datos" para reflejar que BYODB/BYOS está en roadmap.
    - [x] **Nueva Sección Enterprise:** Añadida sección destacando Workflows, Invitaciones Seguras, Dashboard de Consumo y RBAC.
    - [x] **Revisión de Métricas:** Eliminada métrica "99.9% Precisión RAG" no verificada. Reemplazada por "Multi-Tenant Aislamiento Total".
    - [ ] **Auditoría Estratégica de Contenidos (Q2 2026):**
      - [ ] **Revisión de Realidad:** Verificar que todas las features descritas en la landing están activas y coinciden con la versión actual (evitar over-promising).
      - [ ] **Profundidad Funcional:** Ampliar la descripción de capacidades (ej: "Motor de Análisis Heurístico" en lugar de "IA Genérica") para mostrar robustez sin revelar el stack exacto.
      - [ ] **Protección de IP:** Reescribir secciones técnicas para enfocar en el "Qué" (beneficio/función) y ocultar el "Cómo" (librerías/arquitectura específica) para evitar copias.
      - [ ] **Catálogo de Funciones:** Crear una página `/capabilities` o sección detallada que liste todos los super-poderes de la app (Extracción, Validación, Auditoría, etc.) de forma exhaustiva.
      - [ ] **Sincronización Roadmap-Landing:** Revisar exhaustivamente las Fases 10, 11 y 21 del Roadmap (Gobernanza, Multi-Tenant, Agentes) para asegurar que todos los hitos marcados como `[x]` (completados) en ese momento tienen su reflejo comercial en la web pública.
      - [ ] **Auditoría de Alineamiento de Permisos:** Revisión cruzada de todas las opciones de UI vs el sistema de permisos (RBAC/Multi-tenant). Verificar que no existen botones visibles para acciones prohibidas y que los administradores con acceso a múltiples tenants ven correctamente diferenciados los contextos.
      - [ ] **Revisión de Reglas de Agente (Governance):** Auditar el archivo `rules.md` (System Prompt) para verificar si las restricciones y mejores prácticas siguen vigentes. Ajustar, ampliar o eliminar reglas según la evolución del proyecto y verificar cumplimiento global. Sincronizar esta revisión con la auditoría de permisos.
      - [ ] **Consolidación de Auditoría y Logs:** Analizar `/admin/auditoria` vs `/admin/logs` (Observabilidad) para evaluar si deben fusionarse en una sola interfaz unificada. Revisar también el uso de las colecciones legacy `logs_aplicacion` y `usage_logs` en la BD principal para decidir su migración total a la nueva BD de logs dedicada o su depuración.
  - **Certificaciones Formales (Roadmap):**
    - [x] **6.6.1 Gestión de Informes LLM:** Sistema de control de costos y auditoría (Fase 6.6.1) ✅.
    - [ ] **SOC2 Type II:** Contratar auditoría externa (6-12 meses).
    - [ ] **ISO 27001:** Implementar controles de seguridad adicionales.
    - [x] **GDPR Initial Compliance:** Implementado aislamiento por tenant y retención básica ✅.
    - [ ] **RAG Quality Metrics:** Implementar sistema de evaluación automática (RAGAS/LangSmith).

### Métricas de Éxito
- ✅ **Trackeo preciso**: 100% de operaciones LLM/Storage/Search registradas.
- ✅ **Dashboard funcional**: Gráficos en tiempo real con datos reales.
- ✅ **Stripe integrado**: Pagos recurrentes funcionando en producción.
- ✅ **Límites enforced**: Bloqueo automático al exceder plan.
- [ ] **Gobernanza Total**: Un SuperAdmin puede auditar cualquier documento, pedido o log de cualquier tenant en <3 clics desde una visión centralizada.
- [ ] **Multi-tenancy Profesional**: Cambio de contexto instantáneo con actualización reactiva de toda la aplicación.

### Estimación
- **Duración**: 1 semana (40 horas)
- **Prioridad**: ALTA (crítico para monetización)
- **Dependencias**: Ninguna (infraestructura ya existe)


---

## 🧠 FASE 21: EVOLUCIÓN AGÉNTICA 2.0 (LANGGRAPH + MULTILINGUAL) ✅ COMPLETADO
**Objetivo:** Superar el RAG básico (retrieve-then-generate) mediante orquestación agéntica multi-paso y soporte multi-idioma nativo para el mercado europeo.

### 21.1 Core Agentic Engine (Intelligence Layer)
- [x] **Skeleton Experimental (Legacy):** Estructura básica de agentes.
- [x] **Orquestación con LangGraph 2.0:** 
  - [x] Implementar `StateGraph` avanzado: **Parser** (detección de intención) → **Retriever** (búsqueda) → **Validator** (vía crítica) → **Generator**.
  - [x] Lógica de **Auto-Corrección (Self-RAG)**: El agente valida la respuesta contra el contexto y si la confianza es < 0.7, re-ejecuta el retrieval con una query expandida por Gemini.
- [x] **BGE-M3 Multilingual Service:** 
  - [x] Integrar modelo BGE-M3 (vía `@xenova/transformers`) para soporte nativo ES/EN/DE/IT/FR.
  - [x] Implementar **Dual-Indexing**: Indexar normativas críticas (FATCA, CRS, EN-81) tanto en su versión original como en traducción técnica ES de alta fidelidad.
- [x] **Atlas Vector Search Integration:** Configuración de índices HNSW y búsqueda híbrida.

### 21.2 Advanced Admin UI (Lupa del Administrador)
- [x] **Live Agent Trace Viewer (MVP):** Visualización básica de pasos.
- [x] **Knowledge Base Explorer**: Panel para que el Administrador navegue por los fragmentos indexados, vea su peso semántico y active/desactive documentos del RAG.
- [x] **Confidence Inspector**: Herramienta integrada en el explorador para auditar la salud del conocimiento.

### 21.3 Technical Hardening (Next.js 15/16)
- [x] **Async Dynamic APIs**: Migración de `params` y `searchParams` a promesas cumplida ✅.
- [x] **Rate Limit Optimization**: Umbrales Enterprise para evitar bloqueos por prefetching.

---

### **🎯 PRIORIDAD ESTRATÉGICA ACTUAL (ACORDADO)**
- **PROXIMO PASO**: Configuración de SLAs por Prioridad (Fase 20. SLA Management).

---


### 📧 FASE 23: NOTIFICATION HUB & BI (EN CURSO 🛠️)
- [x] **23.1 Hub Unificado**: Servicio central de notificaciones (Email/In-App/Log).
- [x] **23.2 Business Intelligence**: Estadísticas agregadas, detección de riesgos y oportunidades de upsell.
- [x] **23.3 UI de Gestión Admin**: Dashboard SuperAdmin, Editor de Plantillas Multi-idioma, Auditoría de cambios.
- [ ] **23.4 Tenant Preferences UI**: Interfaz para que cada organización elija sus canales por evento (ej: Alertas de Facturación -> Solo Email).
- [ ] **23.5 User Opt-out Control**: Panel para que el usuario final gestione sus propias suscripciones (Compliance GDPR).

---

### 🎫 FASE 20: SISTEMA DE TICKETING EMPRESARIAL ✅ COMPLETADO
**Objetivo:** Soporte jerárquico L1/L2/L3 integrado.
- [x] **Dashboard de Gestión**: Panel master-detail para administración de incidencias.
- [x] **Escalamiento L1/L2/L3**: Capacidad de derivar tickets entre niveles de soporte.
- [x] **Notas Internas**: Comunicación privada entre técnicos (Audit Ready).
- [x] **UX Cliente**: Interfaz de chat/hilo para el usuario final.

---

### 🔐 FASE 11: SECURITY HARDENING (SAAS PRO - COMPLETADO ✅)
**Estrategia MFA:** Al no disponer de proveedor de SMS, utilizamos:
1.  **TOTP (Time-based One-Time Password)**: Compatible con Google/Microsoft Authenticator (Nivel PRO, coste 0).
2.  **Email OTP (Fallback)**: Código de 6 dígitos vía Resend (Fácil implementación).

- [x] **Implementación de TOTP**: Generación de QR y validación de secretos (otplib + qrcode).
- [x] **Gestión de Sesiones**: DB-backed sessions con capacidad de revocación remota.
- [x] **Identity Suite Migration**: Aislamiento de base de datos de identidad (ABDElevators-Auth).
- [x] **Audit Trail de Seguridad**: Registro de IPs, geolocalización básica y dispositivos en cada login.
- [x] **Environment Hardening**: `AUTH_TRUST_HOST` y whitelisting de IPs para Vercel.

---

### 🔭 FASE 24: OBSERVABILIDAD & LOGS (EN PROCESO 🛠️)
**Objetivo**: Proporcionar visibilidad total sobre errores y uso, preparando el sistema para escala masiva.

- [x] **24.1 Arquitectura de Logs Aislados (Dual-Write Ready)**
  - [x] Implementar `connectLogsDB()` en `lib/db.ts` con fallback inteligente.
  - [x] Refactorizar `logger.ts` para usar la conexión dedicada.
  - [x] Preparar lógica para `MONGODB_LOGS_URI` (Scaling futuro).
- [x] **24.2 Log Explorer UI (SuperAdmin)**
  - [x] API endpoint `/api/admin/logs` con filtros de eficiencia.
  - [x] Dashboard visual (`/admin/logs`) con búsqueda en tiempo real.

---

## How to Use This Document
- Treat this file as the **single source of truth** for project status.
- Update the relevant sections when a milestone is reached or a new implementation plan is added.
- Reference the specific sections (`### Detailed Phase Roadmap`, `### Implementation Plan Highlights`, `### Upcoming & To‑Do`) in PR descriptions to keep reviewers aligned.

*Generated on 2026‑01‑25 by Antigravity (AI coding assistant).*

---

## 📊 FASE 24: OBSERVABILITY & ADVANCED ANALYTICS (SAAS PRO)
**Objetivo:** Proporcionar visibilidad total y granular sobre el uso, rendimiento y seguridad de la plataforma a todos los niveles (Platform, Tenant, User).

### 24.1 Centralized Log Explorer & Analytics (Integration Focus)
**Decisión Estratégica:** Investigar herramientas de terceros (Axiom, Mixpanel, PostHog, BetterStack) para integración vía SDK o Webhooks antes de desarrollar una solución interna. El objetivo es evitar "reinventar la rueda" y aprovechar motores de analítica ya probados.

### 24.2 Multi-Level Analytics Dashboard
- [ ] **SuperAdmin View (Platform Health):** MAU, MRR, Latencia LLM.
- [ ] **Tenant Admin View (Organization ROI):** Ahorro de tiempo estimado.
- [ ] **User View (Personal Insights):** Eficiencia personal.

### 24.3 Proactive Anomaly Detection
- [ ] **Security Alerts:** Notificación inmediata si se detecta un patrón de acceso inusual (geo-imposible, fuerza bruta).
- [ ] **Business Alerts:** Aviso si un Tenant deja de usar la herramienta repentinamente (riesgo de Churn).
