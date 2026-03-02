# 🏗️ Arquitectura de la Plataforma ABD RAG — ERA 9 SYMPHONY

> **Versión:** 5.6.5 | **Última actualización:** 2026-03-02 | **Fase:** 242

## 1. Visión General

ABD RAG Platform es un sistema **multi-tenant**, **multi-vertical** de grado industrial para análisis masivo de documentación técnica mediante Retrieval-Augmented Generation (RAG).

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL EDGE RUNTIME                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Middleware   │  │  Next.js 16  │  │  API Routes   │  │
│  │  (Auth+ABAC) │  │  App Router  │  │  (128 endpts) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘  │
│         │                 │                 │           │
│  ┌──────▼─────────────────▼─────────────────▼────────┐  │
│  │           Guardian V3 (ABAC Engine)               │  │
│  │   enforcePermission(resource, action) → session   │  │
│  └──────┬────────────────────────────────────────────┘  │
│         │                                               │
│  ┌──────▼────────────────────────────────────────────┐  │
│  │          SecureCollection (Multi-tenant)           │  │
│  │   getTenantCollection(name, session, dbType)      │  │
│  └──────┬────────────────────────────────────────────┘  │
└─────────┼───────────────────────────────────────────────┘
          │
    ┌─────▼─────┐   ┌──────────┐   ┌──────────┐
    │  MAIN DB  │   │ AUTH DB  │   │ LOGS DB  │
    │(ABDElev.) │   │(ABD-Auth)│   │(ABD-Logs)│
    └───────────┘   └──────────┘   └──────────┘
```

## 2. Monorepo & Paquetes

```
ABDElevators/
├── packages/
│   ├── platform-core/     # Auth, DB, Logger, Errors, Schemas
│   ├── rag-engine/        # Ingesta, Chunking, Retrieval, Embeddings
│   └── workflow-engine/   # FSM, HITL Tasks, Case Management
├── src/
│   ├── app/               # Next.js 16 App Router (101 rutas)
│   ├── core/              # Motor agéntico, Guardian, Ontología
│   ├── components/        # UI (Shadcn + Custom Primitives)
│   ├── hooks/             # React 19 hooks compartidos
│   ├── lib/               # Bridges a platform-core + utilidades
│   ├── services/          # 16 módulos de servicio (ver §3)
│   └── verticals/         # Extensiones de industria (elevators, real-estate)
├── messages/              # i18n JSON (es/, en/)
├── tests/                 # Unit & Integration tests (Jest)
└── config/                # ESLint, Tailwind, TSConfig base
```

### Aliases de Importación

| Alias | Paquete | Propósito |
|-------|---------|-----------|
| `@abd/platform-core` | `packages/platform-core` | Auth, DB, Logger, Errors, Schemas base |
| `@abd/platform-core/server` | `packages/platform-core/src/server.ts` | `getTenantCollection`, `connectDB`, `logEvento` |
| `@abd/rag-engine` | `packages/rag-engine` | Ingesta, Chunking, Retrieval |
| `@abd/workflow-engine` | `packages/workflow-engine` | FSM, Cases, HITL Tasks |
| `@/` | `src/` | Código de la aplicación principal |

## 3. Módulos de Servicio (`src/services/`)

| Módulo | Archivos | Responsabilidad |
|--------|----------|-----------------|
| `admin/` | 6 | AuditService, BillingAdminService, TenantAdminService |
| `audit/` | 1 | Auditoría forense inmutable |
| `auth/` | 3 | Sesiones, MFA, Invitaciones |
| `core/` | 43 | Traducción, Búsqueda, Dashboard, RAG Core |
| `graph/` | 2 | Neo4j, Knowledge Graph |
| `infra/` | 20 | Redis, BullMQ, Feature Flags, Scheduler |
| `ingest/` | 29 | Pipeline de ingesta (FSM, Workers, Enrichment) |
| `llm/` | 7 | PromptRunner, LLM Gateway, Cost Tracking |
| `observability/` | 12 | Trazas, Métricas, Alertas, Performance SLA |
| `ops/` | 20 | Workflow Tasks, Usage, Quotas, Contracts |
| `security/` | 12 | Permissions, PII Masking, Encryption |
| `storage/` | 1 | BlobStorage (Cloudinary) |
| `support/` | 6 | Tickets, SLA, Routing |
| `tenant/` | 6 | Multi-tenant Config, Limits, Onboarding |

## 4. Core Domain (`src/core/`)

| Módulo | Propósito |
|--------|-----------|
| `adapters/` | Puentes entre dominio y infraestructura |
| `application/` | Use Cases (PrepareIngestion, Billing, etc.) |
| `domain/` | Entidades de dominio y Value Objects |
| `engine/` | Motor agéntico y orquestación de LLMs |
| `entity-engine/` | Motor de entidades técnicas (Ontología) |
| `guardian/` | GuardianEngine V3 (ABAC) |
| `registry/` | Registros de modelos, templates, verticales |
| `services/` | Servicios de dominio puros |

## 5. Principios de Seguridad (3 Capas)

```
Request → [Middleware] → [Guardian V3] → [Zod Validation] → Lógica
           Auth          ABAC Enforce    Input Sanitize
           Rate Limit    Resource:Action Schema.parse()
           CSP Headers   Deny-by-default AppError throw
```

1. **Middleware** (`middleware.ts`): Auth via NextAuth, Rate Limiting (Upstash), Security Headers, CSP Nonces.
2. **Guardian V3** (`enforcePermission`): Evaluación de permisos basada en atributos (recurso + acción). Fail-closed.
3. **Zod Validation**: Todo input validado ANTES de procesamiento. `AppError` tipado para cada fallo.

## 6. Bases de Datos (Multi-Cluster)

| Cluster | Variable de Entorno | Colecciones Clave |
|---------|--------------------|--------------------|
| **MAIN** | `MONGODB_URI` | `knowledge_assets`, `document_chunks`, `cases`, `workflow_tasks`, `spaces`, `document_types` |
| **AUTH** | `MONGODB_AUTH_URI` | `users`, `v2_users`, `tenants`, `permission_groups`, `mfa_configs` |
| **LOGS** | `MONGODB_LOGS_URI` | `application_logs`, `audit_trails`, `usage_logs`, `notifications` |

El enrutamiento es **automático** vía `getTenantCollection()` que detecta la colección y la asigna al cluster correcto.

## 7. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Next.js + React | 16.1.4 + 19 |
| **Styling** | Tailwind CSS + Shadcn UI | 4.x |
| **Backend** | Next.js API Routes | Edge Runtime Compatible |
| **Base de Datos** | MongoDB Atlas | 7.x (Vector Search + Atlas Search) |
| **AI/ML** | Google Gemini API | 2.5 Flash/Pro, 3.0 |
| **Embeddings** | BGE-M3 (local) / Gemini | Hybrid |
| **Queue** | BullMQ + Redis | Via Upstash |
| **Storage** | Cloudinary | Enterprise |
| **Auth** | NextAuth.js | v5 |
| **i18n** | next-intl | Namespace-based |
| **Testing** | Jest | Unit + Integration |
| **Build** | Turbopack | Incremental |

## 8. Verticales de Industria

La plataforma soporta verticales de industria mediante `src/verticals/`:

- **Elevadores** (`elevators/`): Configurador de ascensores, inventario técnico, checklists de mantenimiento.
- **Real Estate** (`real-estate/`): Análisis de contratos inmobiliarios (en desarrollo).
- **Legal / Banking / Insurance**: Infraestructura base disponible (Fase 98).

Cada vertical extiende la plataforma mediante:
- Componentes UI específicos
- Schemas Zod de dominio
- Prompts LLM especializados
- Flujos de workflow pre-configurados
