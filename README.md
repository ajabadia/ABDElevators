# ABD Multi-Industry RAG Platform (Vision 5.1.0 - SUITE ERA)

Sistema RAG (Retrieval-Augmented Generation) de grado industrial, genérico y multi-tenant. Diseñado para el análisis masivo de documentos técnicos, legales e industriales con una arquitectura agéntica de vanguardia.

Esta versión **v5.1.0** introduce la **Consolidación de Hubs de Soporte y Observabilidad**, reforzando la independencia de módulos en la **Arquitectura Monorepo**.

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
git clone https://github.com/ajabadia/ABDElevators.git
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

## 📊 Características Clave
### 💎 Key Features

- **🚀 Collaborative Spaces**: Multi-tenant "Spaces" architecture allowing shared (Tenant) and personal (User) knowledge silos.
- **🔐 Granular API Security**: API Keys with optional scoping to specific Knowledge Spaces for secure external integrations.
- **🧠 Hybrid RAG Engine**: Combines semantic (BGE-M3), keyword (BM25), and graph-based retrieval for maximum precision.
- **🛡️ Enterprise Governance**: Granular permissions (Guardian V3), PII masking, and full audit trail for SOC2 compliance.
- **⚡ Industrial Ingestion**: High-performance pipeline with MD5 deduplication, asynchronous processing (BullMQ), and self-healing (Phase 199). Features a robust FSM, centralized orchestrator, and persistent cost tracking for auditing.
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
  - ✅ **Hybrid Search Engine**: Fusión de **BM25 (Atlas Search)** + **Vector (Semantic)** + **Graph (Neo4j)** mediante RRF para precisión técnica absoluta.
  - ✅ **Semantic Cache (High Performance)**: Reducción de latencia de ~7s a 2ms (99.9% mejora) y ahorro de costes del 100% en consultas repetitivas.
  - ✅ **PII Masking Engine (Privacy First)**: Desidentificación automática de correos, teléfonos y documentos de identidad antes de procesar con LLMs.
  - ✅ **Graph-Enhanced RAG**: Navegación estructural de conocimiento basada en entidades y relaciones técnicas complejas.
  - ✅ **RAG Evaluation Dashboard**: Observabilidad nativa con Juez LLM (Gemini 1.5 Pro) para medir fidelidad y relevancia de respuestas.
  - ✅ **Visual Intelligence (Multi-modal)**: Comprensión nativa de planos, esquemas y diagramas técnicos con Gemini 2.0/3.
  - ✅ **Async Ingest (High-Scale)**: Procesamiento pesado en segundo plano con BullMQ y seguimiento de progreso en tiempo real con reintentos automáticos.
  - ✅ **Environment Sandboxing**: Aislamiento total entre entornos (Staging / Producción) con flujos de promoción atómicos.
  - ✅ **Shadow Prompts**: A/B Testing asíncrono de prompts en producción sin impacto en latencia.
  - ✅ **Universal Ontology**: Sistema agéntico que mapea y evoluciona entidades automáticamente.
  - ✅ **Bank-Grade Hardening (RBAC)**: Unificación total del modelo de permisos mediante Enum `UserRole` y helper `requireRole()`, eliminando ambigüedades en APIs y UI.
  - ✅ **Atomic Data Integrity**: Deduplicación por hash MD5 nativa en MongoDB con protección contra condiciones de carrera durante la ingesta masiva.
  - ✅ **Dynamic CSP (Nonces)**: Implementación de Content Security Policy dinámica basada en nonces para una protección XSS de vanguardia.
  - ✅ **Multi-tenant Isolation & Hardening**: Aislamiento lógico estricto garantizado por `SecureCollection` y enrutamiento multi-cluster automatizado (Regla de Oro #11).
  - ✅ **Causal AI Auto-Correction**: Agentic loop that assesses juror feedback to refine hallucinated or incomplete responses with causal reasoning (Phase 86).
  - ✅ **DB Consistency Auditor**: Automated enforcement of multi-cluster routing (`AUTH`, `LOGS`, `MAIN`) to prevent cross-tenant data leaks and ensure structural integrity.
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
- ✅ **Global SuperAdmin Dashboard (Phase 110)**: Consola centralizada para monitoreo de métricas multi-tenant, precisión de IA y salud del cluster.
- ✅ **Causal AI Simulation Engine (Phase 86)**: Análisis de impacto 'What-If' integrado en Digital Twins para predecir consecuencias en cascada y sugerir planes de mitigación técnica.
- ✅ **Industrial Stability Cleanup (Era 5)**: Erradicación de +140 errores estructurales de TypeScript, normalización de sesiones multi-tenant y gobernanza estricta de Enums.
- ✅ **Monorepo Namespace Architecture**: Desacoplamiento físico de @abd/platform-core, @abd/ui, @abd/workflow-engine y @abd/rag-engine para máxima reutilización de servicios.
- ✅ **Domain Decoupling & Industry Agnosticism**: Aislamiento total entre RAG y Workflows, permitiendo desplegar verticales de industria (Legal, Seguros, etc.) sin dependencias cruzadas.
- ✅ **Security Hardening & Internal Gateway (Phase 183)**: Implementación de IP allow-listing, rotación de secretos y sanitización profunda de PII en logs industriales.
- ✅ **Suite Evolution & Next-Gen Utilities (Phase 184)**: Infraestructura multi-producto, Feature Flags persistentes, Job Scheduler genérico y Gobernanza de IA por tenant.
- ✅ **Unified Experience (ERA 6)**: Rediseño visual masivo, dashboard "Hub" unificado y simplificación de navegación para técnicos (Phases 190-193).
187: - ✅ **Onboarding Real & Contextual Help (Phase 194)**: Sistema de guías interactivas personalizado por rol (WorkContext) y ayuda contextual integrada en todos los PageHeaders.
188: - ✅ **Feedback Loop & Value Dashboard (Phase 195/196)**: Captura de feedback 👍/👎 en chat, métricas de ROI (tiempo ahorrado) y limpieza de deuda técnica industrial.
- ✅ **Simplified Support Hub (Phase 200)**: Módulo de soporte independiente con gestión unificada de tickets y aislamiento de datos por tenant.
- ✅ **Centralized Observability Hub (Phase 201)**: Telemetría unificada, auditoría forense inmutable y monitoreo de performance SLA integrado.

## 🔧 Scripts Disponibles

```bash
npm run dev                  # Servidor de desarrollo
npm run build                # Build optimizado para Vercel
npm run test                 # Suite de tests unitarios y RAG coverage
npm run ensure-indexes       # Reparación automática de índices de base de datos
```

## 📝 Licencia & Propiedad

**ABD RAG Platform © 2026** - *Leading Engineering for the AI Evolution Era.*
