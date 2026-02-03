# ROADMAP_MASTER – Source of Truth for ABD RAG Platform (Unified v2.30 - EVOLUTION ERA)

## 📖 Overview

This document consolidates **all** roadmap information, implementation plans, and task checklist into a single, authoritative reference. It preserves historical progress, detailed phase breakdown, and the high-level cognitive infrastructure vision.

---

### 🏛️ Detailed Phase Roadmap

#### 🟢 FASE 1-7: CIMENTACIÓN SAAS & CORE (COMPLETADO ✅)

- [X] **FASE 1: INFRAESTRUCTURA Y FUNDAMENTOS** (Inicialización, Datos, IA).
- [X] **FASE 2: GESTIÓN DE CONOCIMIENTO** (Ingesta, Pipeline, Ciclo de Vida).
- [X] **FASE 3: ANÁLISIS & RAG** (Portal Técnico, Orquestación, Informes).
- [X] **FASE 4: FUNCIONES ENTERPRISE** (Usuarios, Reportes, Observabilidad, Deploy).
- [X] **FASE 5: GESTIÓN DE USUARIOS** (Maestro, Perfil, Documentos Pro).
- [X] **FASE 6: RAG PROFESIONAL** (Checklists Dinámicos, Configurador Visual, Validación Humana, Audit Trail).
- [X] **FASE 7: GENERALIZACIÓN SAAS** (Core Abstraction, Workflows, Multi-tenant Metadata, Billing).

#### 🟣 FASE 12-14: GOBIERNO, COMPLIANCE & CONTINUIDAD (COMPLETADO ✅)

- [X] **FASE 12: MODO DEMO EFÍMERO & FREE TRIAL**
  - [X] Ephemeral Tenant Factory.
  - [X] Auto-Cleanup Engine (TTL).
- [X] **FASE 13: CONTINUIDAD & DISASTER RECOVERY**
  - [X] Unified Backup Engine (JSON Export).
  - [X] Knowledge Package (.zip) for portability.
- [X] **FASE 14: GDPR COMPLIANCE & DERECHO AL OLVIDO**
  - [X] Permanent Purge System.
  - [X] Deletion Certificate (PDF Signature).
- [X] **FASE 16: MARKETING OVERHAUL** (Completado)
  - [X] Hero / Bento Redesign.
  - [X] FAQ & Vision.

#### 🚀 FASE 17-18: AUTONOMÍA OPERATIVA & AUDITORÍA TOTAL (COMPLETADO ✅)

- [X] **FASE 17: AI Infrastructure Autoscaling** - Implementation of the `InfrastructureAutoscaler`.
- [X] **FASE 18: Universal Security Audit** - Implementation of the `SecurityAuditEngine`.
- [X] **FASE 19: INTERNACIONALIZACIÓN COMPLETA** (ES/EN/FR/DE).
- [X] **FASE 20: SISTEMA DE TICKETING EMPRESARIAL**.

---

### 📊 Status & Metrics (v3.2.2 - HARDENED)

- **Global Progress:** 100% (Architecture Pivot & Security Hardening COMPLETE).
- **Industrialization Progress:** 14% (Phase 70 COMPLETE - 1 of 7 industrial phases).
- **Core Status:** 100% (Bank-Grade Stability & Security Unified).
- **Recent Ship:** Bank-Grade Hardening (RBAC Unification, Dynamic CSP & Atomic Deduplication).
  - **RBAC Unification:** Modelo de permisos determinista mediante `UserRole` enum y `requireRole` helper.
  - **Dynamic CSP:** Protección XSS avanzada basada en Nonces generados por petición.
  - **Atomic Integrity:** Deduplicación por hash MD5 en base de datos con protección contra condiciones de carrera.
- **Project Status:** **Bank-Grade Industrial Stability (v3.2.2).**


---

### 📋 Upcoming, To‑Do & Planned (Consolidated View)

#### Recently Completed (Architecture Pivot)

- [X] **Vertical Structure**: Carpetas `src/verticals/elevators` creadas y pobladas.
- [X] **Feature Flags**: Manager implementado para control de despliegue.
- [X] **Admin Refactor**: Dashboard unificado visualmente (Phase 45).

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

#### 🌐 FASE 62: i18n GOVERNANCE & MULTILANGUAGE MANAGER (FUTURO)

- **Objetivo:** Empoderar al SuperAdmin para gestionar traducciones sin tocar código y asegurar cobertura total i18n.

- [ ] **i18n Audit**: Revisión de todo el frontend para identificar textos hardcodeados.
- [ ] **Translation Editor UI**: Panel en `/admin/settings/i18n` para editar `es.json`, `en.json` y añadir nuevos idiomas.
- [ ] **Dynamic i18n Storage**: Migrar traducciones de archivos estáticos a MongoDB con capa de caché en Redis para rendimiento.
- [ ] **AI-Assisted Translation**: Botón "Auto-traducir" usando Gemini para nuevos idiomas.

#### ♿ FASE 63: i18n & a11y DEEP AUDIT & REMEDIATION (COMPLETADO - ÁREA ADMIN ✅)

- **Objetivo:** Alcanzar el Grado A en accesibilidad e internacionalización en toda la plataforma, eliminando deuda técnica de la Visión 2.0 y permitiendo el uso multilingüe en el área privada.

- [X] **Global i18n Audit**: Extracción masiva de textos hardcoded en componentes Legacy y nuevos (Phase 53+).
- [X] **Private Area Localization**: Adaptar el Dashboard, Configuration panels y Workflow Editor a i18n total.
- [X] **Authenticated Language Selector**: Selector de idioma persistente en la Sidebar/UserNav para el área privada.
- [X] **A11Y enforcement**: Implementación de navegación por teclado completa, contraste de color WCAG AAA y etiquetas ARIA dinámicas.
- [ ] **Automated Testing**: Integrar tests de accesibilidad (axe-core) en el pipeline de CI/CD. (Pendiente)
- [ ] **Accessibility Statement**: Página pública de declaración de conformidad. (Pendiente)

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

#### 🛡️ FASE 70: ESTABILIZACIÓN & SEGURIDAD BANK-GRADE (P0 - CRÍTICO)
**Objetivo:** Eliminar deuda técnica de seguridad y unificar patrones de acceso (Ref: `1510.md:227-252`).

- [X] **Unificación de RBAC**: Implementar Enum `UserRole` estricto y helper `requireRole()` centralizado. Corregir inconsistencias 'admin' vs 'SUPER_ADMIN'.
- [X] **Endurecimiento de CSP**: Eliminar `unsafe-inline` / `unsafe-eval` mediante nonces y migración total a Tailwind. 
- [X] **Índices MongoDB**: Crear `scripts/setup-indexes.ts` con índices compuestos (`{ tenantId: 1, status: 1 }`, `{ tenantId: 1, fileMd5: 1 }`).
- [X] **Deduplicación Atómica**: Índice único MD5 + manejo de race conditions en ingestión.

#### ⚡ FASE 71: ESCALABILIDAD & RESILIENCIA OPERATIVA (P1 - ALTO VALOR)
**Objetivo:** Preparar la infraestructura para alta disponibilidad y reducción de costes (Ref: `1501.md:389-428`).

- [ ] **Caché RAG Estratificada**: Implementar Redis (Upstash) para caché de embeddings (L2) y respuestas frecuentes (L1).
- [ ] **Circuit Breakers**: Integrar `cockatiel` o `opossum` para Gemini, Cloudinary y Stripe (Fallo elegante).
- [ ] **Arquitectura de Workers**: Separar `ingest-worker` de la API principal usando BullMQ + Redis.
- [ ] **Paginación Universal**: Estandarizar todos los endpoints de listado con paginación basada en cursos (Cursor-based).

#### 🎨 FASE 72: UX AVANZADA & OBSERVABILIDAD DE NEGOCIO (P2 - PRODUCTO)
**Objetivo:** Mejorar la conversión y simplificar la operación (Ref: `1510.md:101-147`).

- [ ] **Vistas por Rol (Progressive Disclosure)**: Simplificar Dashboard Admin ocultando tabs avanzados según el perfil del usuario.
- [ ] **Intelligence Wizards**: Asistentes guiados para configuración de tenants y creación de checklists inteligentes.
- [ ] **Experiment Journal**: Trazabilidad de cambios en prompts y modelos con impacto en métricas RAG.
- [ ] **Analytics de Negocio**: Dashboard de métricas de ahorro de tokens, ROI estimado y tasa de éxito de queries.

#### 🔮 FASE 73: FRONTERAS TECNOLÓGICAS (VISION 2027+)
**Objetivo:** Diferenciación competitiva extrema mediante tecnologías de vanguardia (Ref: `1502.md`).

- [ ] **Federated Learning Consortium**: Alertas de patrones de fraude/fallo compartidos sin exchange de PII.
- [ ] **Quantum-Classical Hybrid**: Optimización de colateral y riesgos mediante algoritmos cuánticos (QAOA/Monte Carlo).
- [ ] **Neuromorphic Edge AI**: Inferencia ultra-eficiente en sensores industriales (Loihi 2 style).
- [ ] **Digital Twins**: Gemelos digitales de flujo de caja y procesos operativos para simulación predictiva.

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

*Updated and Audited on 2026-02-03 by Antigravity (Skill: roadmap-manager)*
