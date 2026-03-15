# ABD Multi-Industry RAG Platform (Vision 7.9.7 - SECURITY & PERFORMANCE HARDENING)

Sistema RAG (Retrieval-Augmented Generation) de grado industrial, genérico y multi-tenant. Diseñado para el análisis masivo de documentos técnicos, legales e industriales con una arquitectura agéntica de vanguardia.

- **v7.9.7** (2026-03-15): [Phase 454] Observability Resilience & Ingestion Recovery — OTel v2 & Ingest Fix ✅🚀
- **v7.9.6** (2026-03-15): [Phase 453] Intelligent Metrics Aggregation & Hook Resilience — Dashboards Consistency ✅📊
- **v7.9.5** (2026-03-13): [Phase 451/452] Global Quality Audit & P95 Latency Optimization — Architecture Hardening ✅🛡️🚀
- **v7.9.0** (2026-03-13): [Phase 450] Canonical Entities & Prompt Governance — Orders Consolidation & AI Rules Alignment ✅🛡️
- **v7.8.5** (2026-03-12): [Phase 413] Modular Component Architecture & Knowledge Refactor — SRP & Clean Architecture Sweep ✅🧹
- **v7.8.0** (2026-03-12): [Phase 430/440] Advanced Compliance & Proactive Observability — PDF Certification & P95 Alerter ✅🛡️
- **Last Audit:** 2026-03-13 (Phase 451/452: Global Quality Audit & Performance Sync — COMPLETED ✅)
**Status:** Era 15 Security & Performance Hardening sweep. High stability verified.
**Routes:** 127 `page.tsx` | 64 Canónicas | 54 Secundarias/Públicas | 12 Redirects | 0 GHOST
Isolation Pentest — ISO 27001 (SGSI), PII Masking & Multitenant Pentest (PASSED) ✅🛡️
- **v7.2.8** (2026-03-11): [Phase 11.3] Public Cluster Modernization — Final 100% Completion (Sandbox, About, Contact, Upgrade, Auth) ✅🚀
- **v7.2.7** (2026-03-11): [Phase 11.2] Legal Cluster Modernization — Full Dark Premium & Server-Client Hybrid ✅⚖️
- **v7.2.5** (2026-03-11): [Phase 350.2] Relational Hardening & Schema Alignment — 100% Branded ID compliance ✅🛡️
- **v7.2.1** (2026-03-10): [Phase 343.1] Workshop Hub Modernization & i18n Debugging — HubPage Integration & Resolved Breadcrumbs 🔨🔗
- **v7.1.0** (2026-03-10): [Phase 344] Relational Performance & Path Optimization — Hierarchical RAG & Multi-space Indexing 🚀📂
- **v7.0.0** (2026-03-10): [Phase 350] Era 12 Relational Integrity & Branded Types — Entity Isolation & RAG/Workflow Traceability 🛡️🔗
- **v6.10.0** (2026-03-09): [Phase 343] SuperAdmin Hub Audit & Full Compliance Sweep — Multi-tenant Management & Canonical Redirects 🛡️📊
- **v6.9.0** (2026-03-09): [Phase 342] Uncodixify UI Compliance & Industrial Error Resilience — Unified Design Tokens & SupportErrorState Integration 🎨🛡️
- **v6.8.2** (2026-03-08): [Phase 310.2] Multi-tenant Guard & Hub Refactor — Definitive Security & Command Modal 🛡️⚙️
- **v6.8.0** (2026-03-08): [Phase 310.2] Backend Consolidation & Observability Polish — Unified Hubs & Entity Engine ⚙️🔗
- **v6.7.0** (2026-03-08): [Phase 310] Golden Benchmarking & RAG Observability — Offline Experiments & Golden Sets 📊🧪
- **v6.6.0** (2026-03-08): [Phase 308] Universal Domain Intelligence — Agent Builder & Quality Insights Dashboard 🤖📊
- **v6.5.0** (2026-03-08): [Phase 305/306] Cognitive Retrieval Engine — Tiered Discovery & Hierarchical RAG 🧠🔍
- **v6.3.0** (2026-03-07): [Phase 304] Bank-Grade Audit, Unified Policy Enforcement & Entity Timeline 🛡️✅
- **v6.2.0** (2026-03-07): [Phases 297-301] ERA 13 — HITL Ranking, Knowledge Graph Hybrid Search, UX Mode Persistence, Pulse v2 & Security Audit Sweep 🧠🔐
- **v6.1.5** (2026-03-06): [Phases 294-296] ZERO-DAY Mitigation, pdf-parse depreciation & Arch Hardening 🛡️
- **v6.1.2** (2026-03-07): [Phase 287] Layout Hardening, Edge Security & MongoDB Tuning 🛡️
- **v6.1.1** (2026-03-07): [Phase 286] Infrastructure Integrity Sweep & Zero-Leak Hooks 🧹
- **v6.1.0** (2026-03-06): [Phase 285] Advanced Security, MongoDB Pooling & Zero-Leak UI 🛡️
- **v6.0.0** (2026-03-06): [Phase 281/282] High-Performance Architecture & Security Hardening (Zero Waterfall) 🚀

## 🚀 Inicio Rápido

### Windows
```bash
start_app.bat
```

### Linux/Mac
```bash
npm run dev
```

## 📋 Requisitos Previos

- **Node.js**: 18.17+ (Recomendado 20.x LTS)
- **Python**: 3.10+ (Requerido para el `PyMuPDF Bridge` de extracción de PDFs)
- **MongoDB Atlas**: Cluster con soporte para Vector Search y Atlas Search.
- **Google AI Studio Key**: API de Gemini 1.5 Pro / Flash.
- **Cloudinary**: Para gestión de activos y PDFs.

## 🛠️ Configuración de Infraestructura Crítica

Para la v2.36, es imperativo configurar los siguientes índices en MongoDB Atlas:

1.  **Vector Search Index**: Llamado `vector_index` en la colección `document_chunks`.
2.  **Atlas Search (BM25)**: Llamado `keyword_index` en la colección `document_chunks`.
    - **Configuración JSON**:
      ```json
      { "mappings": { "dynamic": false, "fields": { "chunkText": { "type": "string", "analyzer": "lucene.standard" } } } }
      ```

## ⚙️ Configuración del Proyecto

1. **Clonar e Instalar**
```bash
git clone https://github.com/ajabadia/ABDElevators
cd ABDElevators
npm install
```

2. **Variables de Entorno (.env.local)**
```env
# Database & Security
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=genera_con_openssl_rand_base64_32
ENCRYPTION_SECRET=hash_hexadecimal_de_32_bytes

# AI Orchestration
GEMINI_API_KEY=AIzaSy...
ENABLE_LOCAL_EMBEDDINGS=false

# Cloudinary & Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

3. **Inicialización de Datos**
```bash
npm run seed-users           # Usuarios de prueba por defecto
npm run seed-prompts         # Prompts maestros del sistema
npm run seed-workflows       # Workflows estándar (Fase 7)
npm run create-super-admin   # Usuario raíz (SuperAdmin)
npm run ensure-indexes       # Verifica índices críticos en DB
```

## 👥 Usuarios de Prueba

Todos los usuarios comparten el patrón de contraseña indicado (`super123`, `tecnico123`, etc).

### 🏆 Master / Global Governance (ABD Global)
| Email | Password | Rol | Propósito |
|-------|----------|-----|-----------|
| **superadmin@abd.com** | `super123` | SUPER_ADMIN | **Acceso Total:** Control global sin restricciones. |
| **admin@abd.com** | `super123` | ADMIN | **Global Admin:** Gestión de la plataforma completa. |

### 🏗️ Sector Elevadores (Elevadores México)
| Email | Password | Rol | Propósito |
|-------|----------|-----|-----------|
| **admin@elevadores.mx** | `super123` | ADMIN | Administrador del Tenant Elevadores. |
| **tecnico@elevadores.mx** | `tecnico123` | TECHNICAL | Validador de checklists e informes técnicos. |
| **ingenieria@elevadores.mx** | `ingenieria123` | ENGINEERING | Consulta técnica y análisis documental. |

### ⚖️ Sector Legal (Legal & Compliance Corp)
| Email | Password | Rol | Propósito |
|-------|----------|-----|-----------|
| **admin@legal.com** | `super123` | ADMIN | Administrador del Tenant Legal. |
| **tecnico@legal.com** | `tecnico123` | TECHNICAL | Auditor de cumplimiento y flujos legales. |
| **ingenieria@legal.com** | `ingenieria123` | ENGINEERING | Revisión de contratos y normativa. |

## 📁 Estructura del Core (v2.36)

```
src/
├── app/                 # Next.js 15 App Router (Portal, Admin, APIs)
├── core/                # Motor agéntico, Ontologías y Business Logic
├── components/          # UI Components (Modernized with ui-styling)
│   ├── workflow/        # Motor de estados y transiciones
│   ├── tecnico/         # Validadores y checklists
│   └── shared/          # Command Center (Ctrl+K), Sidebar semántico
├── lib/                 # Servicios (LLM, RAG, Usage, Auth)
└── scripts/             # Herramientas de mantenimiento y auditoría
```

> [!IMPORTANT]
> **Gobernanza de Puentes Legacy**: Consulta la [Auditoría de Bridges & Stubs](file:///d:/desarrollos/ABDElevators/docs/bridge-audit.md) antes de modificar paquetes desacoplados o stubs operativos.

## 🛡️ Enterprise Security & Compliance (Bank-Grade)

Plataforma blindada siguiendo estándares de seguridad industrial y financiera para despliegues multi-tenant críticos.

1.  **Aislamiento Multi-tenant Verificado**: Aislamiento estricto de datos garantizado por `SecureCollection` y validado mediante pentesting asimétrico (Mar-2026). Bloqueo efectivo de acceso entre tenants en consultas RAG y acceso por ID.
2.  **Gobernanza ISO 27001 (SGSI)**: Implementación de un Sistema de Gestión de Seguridad de la Información con políticas formales, gestión de incidentes y seguimiento de riesgos en el directorio `/security`.
3.  **PII Masking & Privacy**: Enmascaramiento automático de datos sensibles (Emails, IPs) en logs y cumplimiento de GDPR mediante políticas de retención (TTL) automatizadas.
4.  **Gobernanza Guardian V3**: Sistema de permisos ABAC/RBAC granular con herencia y protección de rutas tanto en UI (Sidebar) como en API (Route Handlers).
3.  **Middleware Endurecido**: Mitigación nativa de **CVE-2025-29927** (subrequest bypass), validación estricta de `Host` header y normalización de seguridad en el Edge.
4.  **Defensa-en-Profundidad CSRF**: Doble validación vía cabeceras `x-csrf-token` y cookies `samesite: lax/strict` para prevenir ataques de falsificación de peticiones.
5.  **Audit Trail Inmutable**: Registro forense de cada acción administrativa mediante `AuditService` con persistencia en colección dedicada y sellado de tiempo.
6.  **Observabilidad de Seguridad**: Logs estructurados (`logEvento`) con enmascaramiento automático de PII y filtrado dinámico por `LOG_LEVEL`.
7.  **Headers de Vanguardia**: Implementación de CSP Dinámica (Nonces), HSTS (6 meses), `nosniff`, y políticas de origen estricto para mitigar XSS y Clickjacking.
8.  **Ingesta Blindada**: Validación de archivos por números mágicos (PDF/Images) y deduplicación por hash MD5 para prevenir inyección de binarios maliciosos.
9.  **Rate Limiting Industrial**: Protección contra fuerza bruta y DoS mediante Upstash Redis con cuotas diferenciadas por tenant y rol.
10. **Seguridad en Operaciones (Guards)**: Utilidad `guardProduction` que bloquea la ejecución de scripts de mantenimiento o seeds destructivos en entornos de producción.
11. **Ciclo de Vida de Datos**: Política formal de retención y purga automática documentada en [DATA_LIFECYCLE.md](file:///d:/desarrollos/ABDElevators/Documentaci%C3%B3n/DATA_LIFECYCLE.md).
12. **Command Hub (Modal)**: Nueva arquitectura de configuración unificada mediante Diálogo (Modal) para máxima fiabilidad en entornos de alta concurrencia.
13. **Certificación PDF SGSI (Ph 430)**: Generación automatizada de evidencias legales en PDF con firma de integridad SHA-256 y branding corporativo.
14. **Observabilidad Proactiva P95 (Ph 440)**: Sistema de alertas tempranas para cuellos de botella de latencia y detección de anomalías de seguridad en tiempo real.

## 🏭 Industrial Operations (Vertical Integration)

Optimización de procesos para el sector industrial (Elevadores, Manufactura, Energía).

-   **Reducción de MTTR**: Motor RAG especializado en manuales técnicos y planos eléctricos de Gemini 1.5/2.0 para instrucciones de reparación inmediatas.
-   **Cumplimiento Normativo CE**: Trazabilidad completa de ediciones y fuentes para auditorías de normativa europea (EN 81-20/50, ISO 9001).
-   **Autopilot & Detección de Anomalías**: Sistema inteligente que detecta picos de error en la ingesta o latencia y activa playbooks de auto-reparación.
-   **Control de Costes & ROI**: Dashboards de consumo RAG en tiempo real y simulación de costes por tenant integrados con Stripe Billing.
-   **HITL Feedback Loop**: Mejora continua de la precisión mediante validación humana de respuestas y ajuste dinámico de scores.

## 📊 Características Clave
### 💎 Key Features

- **🚀 Collaborative Spaces**: Multi-tenant "Spaces" architecture allowing shared (Tenant) and personal (User) knowledge silos.
- **🔐 Granular API Security**: API Keys with optional scoping to specific Knowledge Spaces for secure external integrations.
- **🧠 Hybrid RAG Engine**: Combines semantic (BGE-M3), keyword (BM25), and graph-based retrieval for maximum precision.
- **🛡️ Enterprise Governance**: Granular permissions (Guardian V3), PII masking, and full audit trail for SOC2 compliance.
- **⚡ Industrial Ingestion**: High-performance pipeline with MD5 deduplication, asynchronous processing (BullMQ), and self-healing (Phase 199). Features a robust FSM, centralized orchestrator, and persistent cost tracking for auditing.
  - ✅ **Post-ingestion Enrichment (Phase 198)**: Permite añadir capacidades Premium (Vision, Traducción, Cognitive) a documentos ya procesados sin re-subida.
- **📊 Advanced Analytics**: ROI tracking, RAG evaluation (LLM Judge), and real-time usage metrics via Admin Dashboard.
  - ✅ **Centralized Model Governance (Phase 113)**: Single source of truth for all AI Models in the platform. Support for Gemini 2.5 Flash/Pro, Gemini 3.0, and dynamic model mapping.
  - ✅ **Revamped AI Playground**: Advanced experimentation laboratory with real-time parameter tuning (temperature, topK) and model switching.
  - ✅ **Industrial Price Simulator (Phase 83)**: Accurate proration calculation for plan upgrades/downgrades via Stripe Integration.
  - ✅ **Multi-Vertical Intelligence**: Detección automática de dominio (Legal, Seguros, Sanidad) con adaptación dinámica de la lógica de análisis (Vision 2026).
  - ✅ **Infinite Memory & Streaming**: Ingesta en streaming y de-duplicación inteligente para gestionar bibliotecas técnicas ilimitadas.
  - ✅ **Vercel Serverless Stability Path**: Polyfill de DOMMatrix y workers agnósticos al entorno para evitar crashes en despliegues cloud.
  - ✅ **Gobernanza de Tareas & HITL**: Centro de colaboración para validación humana de resultados de IA con trazabilidad completa.
- **Inteligencia Vertical (Phase 98)**: Motores especializados para **Legal** (análisis de contratos), **Banking** (pKYC) e **Insurance** (triaje de siniestros) integrados nativamente.
- **Seguridad Multi-tenant**: Aislamiento estricto de datos por cliente y espacio de conocimiento mediante `SecureCollection`.
- **Packs de Industria Vertical**: Modelos de datos, prompts y flujos de trabajo pre-configurados para Legal, Banca y Seguros, permitiendo un despliegue instantáneo.
- **Automation Studio (Visual Workflow Editor)**: Editor canvas infinito para diseñar flujos agénticos complejos con nodos de decisión, loops y esperas.
  - ✅ **Turing-complete Workflow Logic**: Motor de estados avanzado con soporte para bifurcaciones (Switch), retardos (Wait) e iteraciones (Loop).
  - ✅ **Specialized Engine Architecture (Phase 129)**: Separación de `AIWorkflowEngine` y `CaseWorkflowEngine` para máxima escalabilidad y mantenimiento atómico.
  - ✅ **Full Admin Localization (i18n)**: Área privada 100% traducida (ES/EN) con editor dinámico, **lazy loading con filtros de namespace** y patrón TODOS optimizado.
  - ✅ **Real-time Execution Monitoring**: Panel "Mission Control" integrado en el canvas para seguimiento en vivo de cada paso del proceso.
  - ✅ **Predictive Observability & Alerting**: Monitoreo proactivo de anomalías en flujos de trabajo con detección de picos de error (>15%) y latencia.
  - ✅ **Technical Performance Reporting**: Generación automatizada de informes industriales en PDF para auditoría de procesos.
- ✅ **Relational Observability (Phase 350)**: Full traceability for RAG queries and Workflow executions using Era 12 Relational Integrity standards (SpaceId/TenantId enforced).
- ✅ **Hierarchical Search Engine v2 (Phase 306)**: Fusión avanzada de **BM25 (Atlas Search)** + **Vector (Semantic)** + **Graph (Neo4j)** mediante RRF con ponderación por feedback HITL.
- ✅ **Uncodixify UI Compliance (Phase 342/343)**: Barrido de diseño industrial en Admin Dashboard e Insights (radios 12px, tipografía profesional, tokens unificados). `SupportErrorState` estandarizado como único punto de reporte de errores con pre-relleno automático de tickets (Digest, URL, Timestamp).
- ✅ **Global Tenant Management (Phase 343)**: Nueva interfaz unificada para la gestión global de organizaciones con observabilidad de salud y redirecciones canónicas para Infra/Logs.
- ✅ **Agent Builder & Quality Insights (Phase 308)**: Suite de herramientas para la creación de agentes personalizados y monitoreo de calidad industrial con Juez LLM.
- ✅ **Universal Nested Navigation (Phase 361/363/364)**: Implementación de menús tipo acordeón y anidamiento universal en todos los Hubs (Work, Intelligence, Agents, Insights). Alineación total de i18n entre sidebar, breadcrumbs y títulos de página con sanitización de `common.json`.
- ✅ **High-Performance Hierarchical RAG (Phase 344)**: Optimización radical de listados jerárquicos mediante denormalización de `spacePath`, logrando rendimiento $O(1)$ en navegaciones complejas.
- ✅ **Multi-space Governance (Phase 344)**: Soporte para activos vinculados a múltiples espacios (junction index) y gestión visual de relaciones de conocimiento.
- ✅ **HITL Ranking Loop (Phase 297/306)**: Retroalimentación humana que ajusta el ranking de chunks en tiempo real.
  - ✅ **Persistent UX Mode (Phase 299)**: Preferencia Simple/Expert persistida en base de datos e hidratada automáticamente desde la sesión del usuario.
  - ✅ **Modular Landing Architecture (Phase 413)**: Refactorización completa de páginas de marketing (`Federated`, `PdfBridge`, `VectorSearch`) y secciones compartidas (`Enterprise`, `FeatureGrid`) en componentes atómicos basados en Composición de React.
  - ✅ **Knowledge Admin Hook Rebirth (Phase 413)**: Desacoplamiento total de la lógica de gestión de activos y búsqueda neural a hooks puramente técnicos (`useKnowledgeExplorer`, `useKnowledgeAssets`).
  - ✅ **Pulse v2 — Operational Dashboard (Phase 297/299)**: Panel lateral en tiempo real con p95 latencia, tasa de ingesta, pipeline de reparación y acciones del Autopilot.
  - ✅ **Cron-based Feedback Scoring (Phase 299)**: Job nocturno protegido por CRON_SECRET para estabilizar scores de feedback en chunks indexados.
  - ✅ **Strict TS Hardening (Phase 411)**: Resolution of branded type mismatches (`EntityId`, `TenantId`) and removal of `: any` throughout the platform for absolute type safety.
- ✅ **Mock & Demo Isolation (Phase 410)**: Extraction of mock generators to CLI (`npm run db:seed`) and isolation of vertical demos (Real Estate) via Server Component guards.
- ✅ **Security Audit Verification (Phase 301)**: Barrido completo verificando 18 hallazgos de seguridad (CVE-29927, CSRF, CSP, Rate Limiting, HSTS, etc.).
  - ✅ **Semantic Cache (High Performance)**: Reducción de latencia de ~7s a 2ms (99.9% mejora) y ahorro de costes del 100% en consultas repetitivas.
  - ✅ **PII Masking Engine (Privacy First)**: Desidentificación automática de correos, teléfonos y documentos de identidad antes de procesar con LLMs.
  - ✅ **Graph-Enhanced RAG**: Navegación estructural de conocimiento basada en entidades y relaciones técnicas complejas.
  - ✅ **RAG Evaluation Dashboard**: Observabilidad nativa con Juez LLM (Gemini 1.5 Pro) para medir fidelidad y relevancia de respuestas.
  - ✅ **Visual Intelligence (Multi-modal)**: Comprensión nativa de planos, esquemas y diagramas técnicos con Gemini 2.0/3.
  - ✅ **Async Ingest (High-Scale)**: Procesamiento pesado en segundo plano con BullMQ y seguimiento de progreso en tiempo real con reintentos automáticos.
  - ✅ **Environment Sandboxing**: Aislamiento total entre entornos (Staging / Producción) con flujos de promoción atómicos.
  - ✅ **Shadow Prompts**: A/B Testing asíncrono de prompts en producción sin impacto en latencia.
  - ✅ **Universal Ontology**: Sistema agéntico que mapea y evoluciona entidades automáticamente.
- ✅ **Bank-Grade Hardening (Phase 246/270)**: Monolithic auth and RAG functions refactored into testable, high-performance units. 100% migration from `console` to structured `logEvento` with PII masking and sub-500ms SLA focus. Remediated 15 critical P0 vulnerabilities in Phase 270.
- ✅ **Testing Infrastructure & Suites (Phase 247/370)**: Industrial-grade testing foundation with Vitest, Jest 30 and Playwright. Comprehensive coverage for Auth flows, RAG orchestration, and NoSQL sanitization.
- ✅ **Bank-Grade Hardening (RBAC)**: Unificación total del modelo de permisos mediante Enum `UserRole` y helper `requireRole()`, eliminando ambigüedades en APIs y UI.
  - ✅ **Atomic Data Integrity**: Deduplicación por hash MD5 nativa en MongoDB con protección contra condiciones de carrera durante la ingesta masiva.
  - ✅ **Zero-Waterfall Dashboard (Phase 281)**: Refactorización total a Server Components, eliminando cascadas de red y optimizando el LCP.
  - ✅ **CORS Hardening & Security Whitelist (Phase 282)**: Protección estricta de APIs mediante whitelist de orígenes y cabeceras de seguridad dinámicas.
  - ✅ **Dynamic CSP (Nonces)**: Implementación de Content Security Policy dinámica basada en nonces para una protección XSS de vanguardia.
  - ✅ **Multi-tenant Isolation & Hardening**: Aislamiento lógico estricto garantizado por `SecureCollection` y enrutamiento multi-cluster automatizado (Regla de Oro #11).
  - ✅ **Causal AI Auto-Correction**: Agentic loop that assesses juror feedback to refine hallucinated or incomplete responses with causal reasoning (Phase 86).
  - ✅ **DB Consistency Auditor**: Automated enforcement of multi-cluster routing (`AUTH`, `LOGS`, `MAIN`) to prevent cross-tenant data leaks and ensure structural integrity.
- ✅ **Layout Hardening & Zero-Leak Layouts (Phase 287)**: Implementation of `isMounted` guards and `Ref-Mounted` pattern in complex layouts (Organizations Hub) to prevent memory leaks and redundant fetch loops.
- ✅ **Edge Security & CORS Spoofing Protection (Phase 287)**: Strict `hostname` validation in the edge middleware using `request.nextUrl.hostname` to mitigate Host Header attacks.
- ✅ **Infrastructure Integrity Sweep (Phase 286)**: Eradication of residual `: any` across services, sanitization of `tenantId` in admin APIs, and removal of orphaned/ghost routes.
- ✅ **Optimized MongoDB Pool for Serverless (Phase 287)**: Fine-tuned `maxPoolSize` and connection timeouts optimized for high-concurrency serverless execution in Vercel.
  - ✅ **Accessibility Compliance (WCAG 2.1 AA)**: Declaración oficial de accesibilidad y tests automatizados de grado industrial integrados en el pipeline de desarrollo.
  - ✅ **Billing Circuit Breaker**: Sistema de protección contra fallos en pasarelas de pago y servicios externos con recuperación automática mediante Redis.
  - ✅ **Auto-Domain Ingest Engine**: Clasificación inteligente de documentos por industria durante la ingesta basada en análisis semántico de contenido.
  - ✅ **Enterprise 2FA**: Autenticación de doble factor con códigos de respaldo y protección de sesión (Phase 107).
  - ✅ **OpenAPI Portal**: Documentación interactiva (Swagger) generada automáticamente desde esquemas Zod (Phase 108).
  - ✅ **i18n Governance**: Gestión centralizada de traducciones con soporte de IA (Gemini) y sincronización global (Phase 109).
  - ✅ **Conversational Technical Search**: Interfaz de chat avanzada para consultas sobre manuales y esquemas técnicos (Phase 96).
  - ✅ **Intelligent Onboarding**: Sistema de guías interactivas para nuevos usuarios y tours por página (Phase 96).
  - ✅ **Expert Notification Center**: Gestión de alertas y eventos técnicos con filtrado inteligente (Phase 96).
  - ✅ **Explainable AI Governance**: UI de diagnóstico de decisiones (Decision Trace) que revela el pensamiento de la IA (Phase 120.4).
  - ✅ **B2B ROI Dashboards**: Visualización de impacto económico, precisión y consumo RAG por tenant (Phase 120.4).
  - ✅ **Deep Observability (OTel)**: Trazabilidad distribuida con OpenTelemetry para monitoreo fino del pipeline RAG (Phase 120.3).
  - ✅ **Advanced Checklist Management**: Motor de configuración de reglas industriales para validación técnica (Phase 105.x).
  - ✅ **i18n Multi-tier Performance Cache**: Sistema de sincronización atómica entre JSON L4, MongoDB y Redis local.
  - ✅ **Unified Role-Based Dashboards**: Experiencia de usuario totalmente rediseñada con hubs centrales para Técnicos, Admins y Operaciones (Phase 133).
  - ✅ **Banking-Grade Governance**: Sistema de auditoría forense inmutable, control de políticas centralizado y trazabilidad total de decisiones IA (Phase 132).
  - ✅ **Unified Knowledge Hub**: Gestión consolidada de Documentos, Espacios y Activos en una sola interfaz reactiva (Phase 133).
   - ✅ **Workshop Order Intelligence (Phase 128)**: Módulo vertical de Taller con ingesta de pedidos por IA, checklists dinámicos y sugerencia contextual de manuales (RAG).
  - ✅ **Unified Admin Hubs (Phase 133)**: Reorganización total del panel de administración en Hubs temáticos (Tasks, Security, Settings, Operations) para reducir la carga cognitiva.
  - ✅ **Multi-level Chunking (Phase 134)**: Implementación de sistema de segmentación por niveles: Simple (Caracteres), Semántico (Embeddings) y Cognitivo (LLM) para optimizar costos y precisión RAG.
  - ✅ **Graph RAG Explorer (Phase 136/150/155)**: Interfaz visual interactiva para navegar y **curar profesionalmente** el Grafo de Conocimiento (Neo4j), con soporte para fusión de nodos (Merging) y borrado masivo.
- ✅ **Enterprise i18n Governance (Phase 155)**: Localización completa del área administrativa con soporte dinámico para ES/EN y traducción asistida por IA.
- ✅ **Industrial Reporting Engine (Phase 160)**: Motor de generación de PDFs basado en templates declarativos (Inspección, Auditoría, Calidad RAG) con persistencia y firma digital.
- ✅ **SSE Heartbeat & Connection Recovery (Phase 84)**: Sistema robusto de mantenimiento de conexiones Server-Sent Events con reintentos exponenciales y recuperación automática para streams RAG de larga duración.
- ✅ **HITL Learning Loop (Phase 82)**: Captura estructurada de feedback humano (categoría de error, corrección) para la mejora continua del motor agéntico.
- ✅ **Self-Healing Knowledge (Phase 110)**: Auditoría automática de activos expirados y marcado de obsolescencia para garantizar la frescura del RAG.
- ✅ **Self-Healing RAG (Phase 254)**: Detección de alucinaciones (Fact-Checking) y reparación automática de respuestas RAG con inyección de claims fallidos en reintentos.
- ✅ **Self-Healing AI (Phase 266)**: Closed-loop correction system that allows users to trigger high-precision document re-analysis upon negative feedback. Includes `assetId` traceability and specialized re-processing API.
- ✅ **Global SuperAdmin Dashboard (Phase 110)**: Consola centralizada para monitoreo de métricas multi-tenant, precisión de IA y salud del cluster.
- ✅ **Causal AI Simulation Engine (Phase 86)**: Análisis de impacto 'What-If' integrado en Digital Twins para predecir consecuencias en cascada y sugerir planes de mitigación técnica.
- ✅ **Industrial Stability Cleanup (Era 5)**: Erradicación de +140 errores estructurales de TypeScript, normalización de sesiones multi-tenant y gobernanza estricta de Enums.
- ✅ **Monorepo Namespace Architecture**: Desacoplamiento físico de @abd/platform-core, @abd/ui, @abd/workflow-engine y @abd/rag-engine para máxima reutilización de servicios.
- ✅ **Domain Decoupling & Industry Agnosticism**: Aislamiento total entre RAG y Workflows, permitiendo desplegar verticales de industria (Legal, Seguros, etc.) sin dependencias cruzadas.
- ✅ **Security Hardening & Internal Gateway (Phase 183)**: Implementación de IP allow-listing, rotación de secretos y sanitización profunda de PII en logs industriales.
- ✅ **Suite Evolution & Next-Gen Utilities (Phase 184)**: Infraestructura multi-producto, Feature Flags persistentes, Job Scheduler genérico y Gobernanza de IA por tenant.
- ✅ **Unified Experience (ERA 6)**: Rediseño visual masivo, dashboard "Hub" unificado y simplificación de navegación para técnicos (Phases 190-193).
- ✅ **Onboarding Real & Contextual Help (Phase 194)**: Sistema de guías interactivas personalizado por rol (WorkContext) y ayuda contextual integrada en todos los PageHeaders.
- ✅ **Feedback Loop & Value Dashboard (Phase 195/196)**: Captura de feedback 👍/👎 en chat, métricas de ROI (tiempo ahorrado) y limpieza de deuda técnica industrial.
- ✅ **Simplified Support Hub (Phase 200)**: Módulo de soporte independiente con gestión unificada de tickets y aislamiento de datos por tenant.
- ✅ **Centralized Observability Hub (Phase 201/213)**: Telemetría unificada, auditoría forense inmutable y monitoreo de performance SLA integrado.
- ✅ **Quality Shield (Phase 215)**: Suite de tests unitarios e integración para LLM Core y Repositorios con aislamiento multi-tenant verificado.
- ✅ **Domain-Specialized Dashboards (Phase 214)**: Experiencia diferenciada para perfiles Técnicos y de Soporte con KPIs específicos.
- ✅ **UX Surgical Polish & Interaction Excellence (Phase 216-217)**: Navegación por teclado avanzada (CMD+K), resaltado multi-modal de fuentes, sugerencias dinámicas agénticas y predicción de tiempo de ingesta (ETA).
- ✅ **Infrastructure Consolidation (Phase 222-222B)**: Service layer clean-up, multi-tenant data isolation enforcement, structured API logging (`logEvento`), and UI DRY patterns with atomic `<HubPage>` and `<MetricCard>` components. Universal notification system with Sonner.
- ✅ **Guardian Permission Alignment (Phase 220)**: Unified ABAC policy enforcement across Sidebar and Backend. Robust server-side protection for all critical administrative routes (Billing, Audit, Security, Organizations, AI Governance, Prompts, SuperAdmin). High-performance bulk permission checks.
- ✅ **Vertical Architecture & Tech Hygiene (Phase 232)**: Standardized industry extensions (`elevators`, `real-estate`), unified canonical onboarding hooks, and total eradication of `localStorage` (Regla #5 compliance). Hardened diagnostic APIs for `SUPER_ADMIN`.
- ✅ **Strict Typing Sweep (Phase 238)**: Erradicación masiva de `: any` en la capa de servicios (`src/services`), incluyendo Ingestión, Operaciones e Infraestructura, garantizando la resiliencia del sistema bajo la Regla #1.
- ✅ **Testing Infrastructure & Core Unit Tests (Phase 239)**: Robustecimiento del entorno de Jest con soporte para monorepo y Next.js, junto a tests críticos para Guardian V3 y Validación de Esquemas, asegurando la integridad de datos y gobernanza de IA.
- ✅ **Massive TypeScript Strictness (Phase 225C)**: Erradicación sistemática de validaciones `catch(error: any)` migrando al standard industrial `unknown` con inferencia de `AppError` para resiliencia absoluta.
- ✅ **Middleware Hardening (Phase 234)**: Protección de rutas y gestión de sesiones con tipado estricto y blindaje contra accesos no autorizados en el edge.
- ✅ **Guardian ABAC Enforcement Sweep (Phase 236)**: Extensión de la protección Guardian V3 a todas las APIs de uso diario (Core, Facturación, Perfiles), garantizando el aislamiento total multi-tenant.
- ✅ **Guardian Enforcement Sweep (Phase 244)**: Blindaje sistemático y monitoreo de performance del 100% de la superficie de la API (195 rutas). Asegura que cada endpoint cumple con los estándares de seguridad ABAC V3 y observabilidad industrial.
- ✅ **Systematic Hygiene & Zero-Any Core (Phase 233)**: Barrido fundacional de todas las rutas de la plataforma uniendo (1) Aislamiento Multi-tenant DB, (2) UI/UX Hub Consolidation, (3) i18n Hardcode Purge, y (4) Strict Typing de la suite completa. El sistema compila con `tsc --noEmit` a cero errores.
- ✅ **Architecture Hardening Tier 1 (Phase 249)**: Implementación de `PartialStateRecoveryWorker` para recuperación automática de estados parciales, evolución de la DLQ con auto-retry funcional y robustecimiento del `IngestOrchestrator`.
- ✅ **Operational Autopilot (Phase 251)**: Conexión de `AnomalyDetectionService` con playbooks operativos automatizados. Incluye visibilidad en tiempo real de ejecuciones de playbooks en el SuperAdmin Hub.
- ✅ **Intel-driven Knowledge Curation (Phase 255)**: Automatización de la maduración de activos mediante generación autónoma de FAQs y monitoreo proactivo de la calidad de recuperación (RAG).
- ✅ **Centro de Ingesta 360 (FASE 261)**: Gestión integral del ciclo de vida de los documentos, desde la ingesta hasta el enriquecimiento y la curación.
- ✅ **Ingestion Center 360 (Ph 261)**: Comprehensive document lifecycle management, from ingestion to enrichment and curation.
- 🌅 **ERA 10: CLARITY — Three Mother Views (Phases 260-269, 273)**: Rediseño fundamental de la UX: de 36 subdirectorios de admin a 3 vistas madre por rol (Trabajo Diario, Centro de Ingesta, Panel del Tenant). Incluye la unificación de ajustes (Phase 273) y reinicio de experiencia. Feature-flagged con `NEXT_PUBLIC_ERA10_UX` para transición sin riesgo.

## 🔧 Scripts Disponibles

```bash
npm run dev                  # Servidor de desarrollo
npm run build                # Build optimizado para Vercel
npm run test                 # Suite de tests unitarios y RAG coverage
npm run ensure-indexes       # Reparación automática de índices de base de datos
```

## 📝 Licencia & Propiedad

**ABD RAG Platform © 2026** - *Leading Engineering for the AI Evolution Era.*
