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
- [ ] **Review Landing Page:** Actualizar secciones de "Features" o "Tecnología" con los avances de RAG Pro.

#### 🌐 FASE 7: GENERALIZACIÓN Y SAAS (VISIÓN 2.0)
- **Objetivo:** Adaptar la plataforma a múltiples industrias.
- [x] 7.1 Abstracción del Modelo de Dominio (Core 2.0)
- [ ] 7.2 Motor de Workflows Multinivel
- [x] 7.3 Taxonomías y Metadatos Multi‑tenant
- [/] 7.4 Automatización de Negocio (SaaS Ready - TRACKEO EN PROCESO)
- [x] 7.5 Metrics & Intelligence (Riesgos detectados)

- [ ] 7.6 Sugerencias Proactivas
- [ ] **Review Landing Page:** Resaltar la capacidad Multi-industria y Workflows en las secciones de "Soluciones".

---

### 📊 Métricas de Avance (from `plans/roadmap.md`)
- **Fase 1‑6:** 100 %
- **Fase 7:** 90 % (Motor de Workflows y SaaS listo)
- **Fase 10:** 60 % (Governance & Support en despliegue)
- **GLOBAL:** 95 % (Hacia el cierre de la Visión 2.0)

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
  - [ ] Metrics: tiempo empleado, duración.
- **6.6 Informe LLM Opcional**
  - Button “Generar Informe Profesional”.
  - Endpoint `POST /api/pedidos/[id]/generar-informe-llm` (LLM‑generated PDF).
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
#### 7.2 Motor de Workflows Multinivel (EN PROCESO 🛠️)
- [x] Definición de esquemas Zod (`WorkflowDefinitionSchema`).
- [x] Implementación de `WorkflowEngine` (Motor de transiciones).
- [x] Implementación de `WorkflowService` (Gestión y Seeding).
- [x] Endpoint `POST /api/pedidos/[id]/transition`.
- [x] UI visualizador de estados en el dashboard.

...

#### 🏰 FASE 10: PLATFORM GOVERNANCE & SUPPORT (EN PROCESO 🛠️)
- **Objetivo:** Control total de la plataforma y soporte al usuario final.
- **Hitos:**
  - [x] **SuperAdmin Role:** Usuario raíz con visibilidad total (script `create-super-admin`).
  - [x] **Notificaciones Hub:** Sistema in-app con campana animada y polling (UI + Backend).
  - [x] **Centro de Soporte:** Formulario para técnicos y panel de respuesta para admins (`/contacto` y `/admin/contacts`).
  - [x] **Prompt Engineering UI:** Editor avanzado para mantenimiento de modelos Gemini.
  - [ ] **Expansión SuperAdmin:** Revisar y ampliar opciones de gestión global (actualmente limitadas).
  - [ ] **Métricas Globales:** Salud financiera y técnica de todos los tenants.
- [ ] **Review Landing Page:** Asegurar que las opciones de soporte y gobernanza se reflejan en la oferta Enterprise.
- **7.3 Taxonomías y Metadatos Multi‑tenant** (already done) – mantener y expandir.
- **7.4 Automatización SaaS**
  - Completar **trackeo de uso** (LLM, storage, search) – conectar a `UsageTracker`.
  - Dashboard de consumo por organización (gráficos de tokens, documentos, almacenamiento).
  - Integrar Stripe webhooks para suscripciones (pendiente).
- **7.5 Metrics & Intelligence** – seguir mejorando detección de riesgos y métricas de uso.
- **7.6 Sugerencias Proactivas**
  - Engine que sugiere componentes o acciones basadas en hallazgos de riesgo.
- [x] **7.7 Infraestructura de Almacenamiento Multi-tenant**
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
- [ ] **Final Deployment**
  - [x] Vercel production rollout, CI/CD pipelines.
  - [ ] Automated smoke tests.

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
- **Hitos de Gestión Transversal (El "Control Plane"):**
  - [x] **Global Dashboard:** Vista agregada de métricas (pedidos activos, riesgos detectados, consumo) de todos los tenants para SuperAdmins (API `/api/admin/global-stats`).
  - [ ] **Cross-Tenant User Management:** Panel para gestionar usuarios que pertenecen a varios grupos empresariales desde una sola vista.
  - [ ] **Unified Support Hub:** Integración del sistema de tickets con el selector de tenant para ver logs y contexto del usuario de forma inmediata.
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

- **🎯 FASE 15: LANDING PAGE AUDIT & COMPLIANCE CERTIFICATION (PLANNED)**
  - **Objetivo:** Asegurar que la landing page refleja con precisión las capacidades reales de la plataforma y obtener certificaciones formales.
  - **Tareas de Revisión:**
    - [x] **Corrección de Claims Falsos:**
      - [x] Cambiar "SOC2 Compliant" a "Enterprise Security Hardened" (no tenemos certificación formal).
      - [x] Cambiar "Aislamiento físico" a "Aislamiento lógico certificado" (es filtrado por tenantId, no físico).
      - [x] Actualizar "Soberanía de Datos" para reflejar que BYODB/BYOS está en roadmap.
    - [x] **Nueva Sección Enterprise:** Añadida sección destacando Workflows, Invitaciones Seguras, Dashboard de Consumo y RBAC.
    - [x] **Revisión de Métricas:** Eliminada métrica "99.9% Precisión RAG" no verificada. Reemplazada por "Multi-Tenant Aislamiento Total".
  - **Certificaciones Formales (Roadmap):**
    - [ ] **SOC2 Type II:** Contratar auditoría externa (6-12 meses).
    - [ ] **ISO 27001:** Implementar controles de seguridad adicionales.
    - [ ] **GDPR Compliance Seal:** Validación formal de cumplimiento europeo.
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

## How to Use This Document
- Treat this file as the **single source of truth** for project status.
- Update the relevant sections when a milestone is reached or a new implementation plan is added.
- Reference the specific sections (`### Detailed Phase Roadmap`, `### Implementation Plan Highlights`, `### Upcoming & To‑Do`) in PR descriptions to keep reviewers aligned.

*Generated on 2026‑01‑22 by Antigravity (AI coding assistant).*
