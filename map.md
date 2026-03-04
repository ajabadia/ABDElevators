# 🗺️ Application Map & Architecture Registry
**Last Audit:** 2026-03-04 (ERA 9 — Hardened & Intelligence)
**Status:** Full 195-route security sweep complete (FASE 244). Tier 1 Hardening (FASE 249), Operational Autopilot (FASE 251), Core refactoring (FASE 246), Test Suites (FASE 247), UX Micro-surgery (FASE 248) and Critical Security Hardening P0 (FASE 270) implemented.
**Routes:** 101 `page.tsx` | 44 Canónicas | 31 No Documentadas | 7 Redirects | 1 Placeholder | 0 DEPRECATED zombi

## 🧠 Site Structure (Mermaid)

```mermaid
graph TD
    User((User)) --> Login[Login Page]

    subgraph User_Experience["🌐 User Experience"]
        User --> Dashboard[Dashboard]
        User --> Search[RAG Search]
        User --> MyDocs[My Documents]
        User --> Profile[Profile]
        User --> UserSettings[Settings]
        User --> SpacesHub[Spaces Hub]
        User --> SupportClient[Support Center]

        SpacesHub --> SpCollections[Collections]
        SpacesHub --> SpPersonal[Personal Space]
        SpacesHub --> SpPlayground[Playground]
        SpacesHub --> SpQuickQA[Quick Q&A]

        SupportClient --> TicketNew[New Ticket]
        SupportClient --> TicketDetail["Ticket [id]"]
    end

    subgraph Admin_Panel["🏢 Admin Panel"]
        User --> Admin[Admin Dashboard Hub]
        Admin --> Superadmin[Platform Dashboard]

        subgraph Knowledge_RAG["🧠 Knowledge & RAG"]
            Admin --> KnowledgeHub[Knowledge Hub]
            KnowledgeHub --> KExplorer[Neural Explorer]
            KnowledgeHub --> KAssets[Asset Management]
            KnowledgeHub --> KMyDocs[My Docs - Admin]
            KnowledgeHub --> KSpaces[Space Config]
            Admin --> IntelTrends[Intelligence Trends]
        end

        subgraph AI_Automation["⚡ AI & Automation"]
            Admin --> AIHub[AI Hub]
            AIHub --> AIPlayground[AI Playground]
            AIHub --> AIWorkflows[Workflow Editor]
            AIHub --> AIRagQuality[RAG Quality]
            AIHub --> AIPredictive[Predictive Maint.]
            AIHub --> AIGovernance[AI Governance]
            Admin --> Prompts[Prompt Management]
            Admin --> Checklists[Checklist Configs]
            Admin --> Workflows["Workflows Editor"]
        end

        subgraph Security_Audit["🛡️ Security & Audit"]
            Admin --> SecurityHub[Security Hub]
            SecurityHub --> SecAudit[Security Audit Trail]
            SecurityHub --> SecSessions[Active Sessions]
            Admin --> AuditPage[Audit Log Explorer]
            AuditPage --> ConfigChanges[Config Changes]
        end

            UsersHub --> UsersActive[Active Users]
            UsersHub --> UsersInvitations[Invitations]
            Admin --> Permissions[Permissions]
            Permissions --> PermGroups[Groups]
            Permissions --> PermSimulator[Simulator]
            Permissions --> PermMatrix[Matrix]
            Admin --> DocTypes[Document Types]
        end

        subgraph Billing_Orgs["💰 Billing & Organizations"]
            Admin --> BillingHub[Billing Hub]
            BillingHub --> Invoices[Invoices]
            BillingHub --> Contracts[Contracts]
            BillingHub --> BillingPlan[Plan Selector]
            BillingHub --> BillingUsage[Usage & ROI]
            Admin --> OrgHub[Organization Hub]
            OrgHub --> OrgGeneral[General Config]
            OrgHub --> OrgBranding[Branding]
            OrgHub --> OrgFeatures[Feature Toggles]
            OrgHub --> OrgBilling[Org Billing]
            Admin --> Compliance[Compliance GDPR]
        end

        subgraph Operations["⚙️ Operations"]
            Admin --> OpsHub[Operations Hub]
            OpsHub --> OpsStatus[Service Status]
            OpsHub --> OpsMaintenance[Maintenance]
            OpsHub --> OpsLogs[System Logs]
            OpsHub --> OpsIngest[Ingest Jobs]
            OpsHub --> OpsTrace[Trace Viewer]
            OpsHub --> OpsObserv[Observability]
        end

        subgraph Comms["📣 Communications"]
            Admin --> NotifHub[Notifications Hub]
            NotifHub --> NotifSettings[Settings]
            NotifHub --> NotifTemplates[Templates]
            NotifTemplates --> NotifTemplateType["Template Editor"]
        end

        subgraph Settings_Admin["⚙️ Settings"]
            Admin --> SettingsHub[Settings Hub]
            SettingsHub --> SetBranding["Branding (Placeholder)"]
            SettingsHub --> SetI18n[Translation Editor]
        end

        subgraph Reports_Analytics["📊 Reports & Analytics"]
            Admin --> ReportsHub[Reports Hub]
            ReportsHub --> RepSchedules[Report Schedules]
            Admin --> Analytics[Analytics Center]
            Admin --> APIDocs[API Reference]
            Admin --> APIKeys[Key Management]
        end

        subgraph Verticals_Workshop["🏭 Verticals"]
            Admin --> Tasks[Tasks Hub]
            Admin --> WorkflowTasks[Workflow Tasks]
            Admin --> Workshop["Workshop Orders"]
            Admin --> Cases["Case Detail"]
            Admin --> SupportDash[Support Dashboard - Staff]
        end
    end

    subgraph Technical_Panel["🛠️ Technical Panel"]
        User --> Technical[Technical Hub]
        Technical --> Entities[Entity Explorer]
        Entities --> Validate["Entity Validation"]
        Technical --> Graphs[Neo4j Graph]
    end

    subgraph Ops_Panel["🔧 Ops Portal"]
        User --> OpsReports[Ops Reports]
    end

    subgraph Vertical_Demos["🏢 Vertical Demos"]
        User --> RealEstate["Real Estate Demo"]
    end
```

---
 
 ## 🏢 Panel de Administración
 Ubicación base: `/admin` (Protegido por Guardian)
 
 ### 🏠 Admin General
 | Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
 |------|---------------|--------------|---------|--------|--------|----------|
 | `/admin` | **Dashboard Unificado (Hub)**: DashboardTabs compound component | `/api/admin/stats` | Platform | ✅ | — | 2026-02-23 |
 | `/admin/superadmin` | **Platform Dashboard**: Observabilidad global (SuperAdmin) | - | Platform | ✅ | 489 | 2026-02-23 |
 | `/admin/tasks` | **Tasks Hub**: Gestión de tareas de negocio | - | Operations | ✅ | — | 2026-02-23 |
 | `/admin/workflow-tasks` | **Workflow Ops**: Tareas de orquestación técnica | - | Operations | ✅ | — | 2026-02-23 |
 | `/admin/profile` | Perfil de usuario administrativo | - | Platform | ✅ | — | 2026-02-23 |
 
 ### 🧠 Knowledge & RAG
 | Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
 |------|---------------|--------------|---------|--------|--------|----------|
 | `/admin/knowledge` | **Knowledge Hub**: Dashboard de conocimiento | `/api/knowledge/stats` | Knowledge | ✅ | — | 2026-02-26 18:00 |
 | `/admin/knowledge/explorer` | **Neural Explorer**: Simulación RAG y búsqueda | - | Knowledge | ✅ | — | 2026-02-26 18:00 |
 | `/admin/knowledge/assets` | **Asset Management**: Gestión de activos | - | Knowledge | ✅ | — | 2026-02-26 18:00 |
 | `/admin/knowledge/my-docs` | **Knowledge > My Docs**: Documentos personales (admin) | - | Knowledge | ✅ | — | 2026-02-26 18:00 |
 | `/admin/knowledge/spaces` | **Space Config**: Gestión administrativa de espacios | - | Knowledge | ✅ | — | 2026-02-26 18:00 |
 | `/admin/my-documents` | **Personal Multi-tenant Store**: Almacén personal (admin) | - | Knowledge | ✅ | — | 2026-02-26 18:00 |
 | `/admin/intelligence/trends` | **Trend Analysis**: Inteligencia industrial | - | Knowledge | ✅ | — | 2026-02-26 18:00 |
 
 ### ⚡ AI & Automation Studio
 | Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
 |------|---------------|--------------|---------|--------|--------|----------|
 | `/admin/ai` | **AI Hub**: Dashboard de Inteligencia | `/api/ai/stats` | AI | ✅ | — | 2026-02-26 19:30 |
| `/admin/ai/playground` | **Playground**: Experimentación RAG | - | AI | ✅ | — | 2026-02-26 16:50 |
| `/admin/ai/workflows` | **Workflows**: Editor de flujos | - | AI | ✅ | — | 2026-02-26 19:30 |
| `/admin/ai/rag-quality` | **RAG Quality**: Métricas de calidad RAG | - | AI | ✅ | — | 2026-02-26 19:30 |
| `/admin/ai/predictive` | **Predictive Maintenance**: Mantenimiento predictivo | - | AI | ✅ | — | 2026-02-26 19:30 |
| `/admin/ai/governance` | **AI Governance**: LLM guardrails y rate limits | `/api/admin/ai/guardrails` | AI | ✅ | — | 2026-02-26 19:30 |
| `/admin/prompts` | **Prompt Studio**: Gestión de system prompts y tuning | `/api/admin/prompts` | AI | ✅ | — | 2026-02-26 19:30 |
| `/admin/checklist-configs` | **Checklist Rules**: Motor de reglas de negocio | `/api/admin/checklist-configs` | Configuration | ✅ | — | 2026-02-26 19:30 |
| `/admin/workflows` | **Workflows List**: Lista de workflows | - | AI | 🆕 | — | 2026-02-23 |
| `/admin/workflows/[id]` | **Workflow Editor**: Editor individual de workflow | - | AI | 🆕 | — | 2026-02-23 |
| `/admin/checklist-configs` | **Checklists**: Configuración de Checklists | - | Operations | ✅ | — | 2026-02-23 |
| `/admin/checklist-configs/[id]` | **Checklist Editor**: Edición de Checklist | - | Operations | ✅ | — | 2026-02-23 |
| `/admin/checklist-configs/new` | **New Checklist**: Crear checklist | - | Operations | 🆕 | — | 2026-02-23 |

### 🛡️ Security & Audit
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/admin/security` | **Security Hub**: Dashboard de seguridad | `/api/admin/security` | Security | ✅ | 123 | 2026-02-23 |
| `/admin/security/audit` | **Security Audit Trail**: Registro inmutable (security-focused) | - | Security | ✅ | — | 2026-02-23 |
| `/admin/security/sessions` | **Active Sessions**: Gestión de sesiones concurrentes | - | Security | ✅ | — | 2026-02-23 |
| `/admin/audit` | **Audit Log Explorer**: Explorador industrial de logs con filtros y métricas | - | Security | 🆕 | 260 | 2026-02-23 |
| `/admin/audit/config-changes` | **Config Audit**: Auditoría SOC2 inmutable de cambios de configuración | - | Security | 🆕 | 40 | 2026-02-23 |

> **Nota**: `/admin/audit` y `/admin/security/audit` son módulos DIFERENTES. `audit` = log explorer industrial con filtros. `security/audit` = trail inmutable de seguridad.

### 👮 Users & Permissions
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/admin/users` | **Users Hub**: Gestión de usuarios | `/api/admin/users/stats`| Users | ✅ | — | 2026-02-26 17:50 |
| `/admin/users/active` | Usuarios activos | - | Users | ✅ | — | 2026-02-26 17:50 |
| `/admin/users/invitations` | Gestión de Invitaciones | - | Users | ✅ | — | 2026-02-27 19:45 |
| `/admin/permissions` | Matriz de permisos (Guardian) | - | Users | ✅ | — | 2026-02-23 |
| `/admin/permissions/groups` | Jerarquía de grupos | - | Users | ✅ | — | 2026-02-23 |
| `/admin/permissions/simulator` | Sandbox de permisos | - | Users | ✅ | — | 2026-02-23 |
| `/admin/permissions/matrix` | Vista matricial de permisos | - | Users | 🆕 | — | 2026-02-23 |
| `/admin/document-types` | Tipos de documento | - | Knowledge | ✅ | — | 2026-02-23 |
| `/admin/profile` | **Mi Perfil**: Perfil del usuario actual | - | Personal | ✅ | — | 2026-03-03 |

### 🛡️ Security
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/admin/security` | **Security Hub**: Panel de seguridad | - | Operations | ✅ | — | 2026-02-26 17:50 |
| `/admin/security/audit` | **Audit Logs**: Registro de eventos | `/api/admin/audit` | Operations | ✅ | — | 2026-02-26 17:50 |
| `/admin/security/sessions` | **Active Sessions**: Sesiones activas | `/api/admin/sessions` | Operations | ✅ | — | 2026-02-26 17:50 |


### 💰 Billing & Organizations
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/admin/billing` | **Billing Hub**: Suscripciones y facturación | `/api/admin/billing` | Billing | ✅ | — | 2026-02-23 |
| `/admin/billing/invoices` | Historial de facturas | - | Billing | ✅ | — | 2026-02-23 |
| `/admin/billing/contracts` | Gestión de contratos PDF | - | Billing | ✅ | — | 2026-02-23 |
| `/admin/billing/plan` | **Plan Selector**: Selector de plan de suscripción | - | Billing | 🆕 | 95 | 2026-02-23 |
| `/admin/billing/usage` | **Usage & ROI**: Métricas de uso, cuotas y ROI | - | Billing | 🆕 | 373 | 2026-02-23 |
| `/admin/organizations` | **Organization Hub**: Dashboard multitenant | `/api/organizations` | Organizations | ✅ | — | 2026-02-23 |
| `/admin/organizations/general` | Configuración básica del tenant | - | Organizations | ✅ | — | 2026-02-23 |
| `/admin/organizations/branding" | Personalización visual (Logo/Colores) | - | Organizations | ✅ | — | 2026-02-23 |
| `/admin/organizations/features` | Control de módulos activos por tenant | - | Organizations | ✅ | — | 2026-02-23 |
| `/admin/organizations/billing` | Facturación por organización | - | Organizations | 🆕 | — | 2026-02-23 |
| `/admin/compliance` | Centro de Cumplimiento GDPR / Auditoría | - | Security | ✅ | — | 2026-02-23 |

### ⚙️ Operations
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/admin/operations` | **Operations Hub**: Punto de entrada operaciones | `/api/admin/operations` | Operations | ✅ | 137 | 2026-02-23 |
| `/admin/operations/status` | Estado de servicios e infraestructura | - | Operations | ✅ | — | 2026-02-23 |
| `/admin/operations/maintenance` | Mantenimiento y corrección de datos | - | Operations | ✅ | — | 2026-02-23 |
| `/admin/operations/logs` | **System Logs**: Logs del sistema (canónica) | - | Operations | ✅ | — | 2026-02-23 |
| `/admin/operations/ingest` | **Ingest Jobs**: Trabajos de ingesta (canónica) | - | Operations | ✅ | — | 2026-02-23 |
| `/admin/operations/trace` | **Trace Viewer**: Auditoría forense de decisiones IA | - | Operations | ✅ | — | 2026-02-23 |
| `/admin/operations/observability` | **Observability**: Observabilidad del sistema | - | Operations | 🆕 | — | 2026-02-23 |

### 📣 Communications
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/admin/notifications` | **Communication Hub**: Plantillas y log de envíos | `/api/admin/notifications` | Comms | ✅ | — | 2026-02-26 14:40 |
| `/admin/notifications/settings` | Configuración de notificaciones | - | Comms | 🆕 | — | 2026-02-23 |
| `/admin/notifications/templates` | Lista de plantillas de notificación | - | Comms | 🆕 | — | 2026-02-26 14:40 |
| `/admin/notifications/templates/[type]` | Editor de plantilla por tipo | - | Comms | 🆕 | — | 2026-02-26 14:40 |

### ⚙️ Settings
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/admin/settings` | **Settings Hub**: Configuración centralizada | `/api/admin/settings` | Settings | ✅ | — | 2026-02-23 |
| `/admin/settings/branding` | **Branding** (Placeholder: "Próximamente") | - | Settings | 🏗️ | 20 | 2026-02-23 |
| `/admin/settings/i18n` | **Translation Editor**: Gestión maestra de traducciones | - | Settings | 🆕 | 317 | 2026-02-23 |

### 📊 Reports & Analytics
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/admin/reports` | **Report Hub**: Dashboard de informes de negocio | `/api/admin/reports` | Reports | ✅ | — | 2026-02-23 |
| `/admin/reports/schedules` | Programación de informes | - | Reports | 🆕 | — | 2026-02-23 |
| `/admin/analytics` | **Analytics Center**: Métricas de uso y adopción | - | Reports | ✅ | — | 2026-02-23 |
| `/admin/api-docs` | **API Reference**: Swagger/Doc interna | - | Platform | ✅ | — | 2026-02-23 |
| `/admin/api-keys` | **Key Management**: Tokens de integración | - | Platform | ✅ | — | 2026-02-23 |

### 🏭 Verticales, Taller & Soporte Admin
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/admin/workshop/orders/new` | Registro de pedidos de taller | - | Vertical | ✅ | — | 2026-02-23 |
| `/admin/cases/[id]` | Detalle de Caso (Case Hero). Sin hub page | - | Operations | ✅ | — | 2026-02-23 |
| `/admin/support` | *Admin Support Redirect* | - | Support | ✅ | — | 2026-02-23 |

### 🔀 Redirects (Admin)
| Ruta | Destino | Notas |
|------|---------|-------|
| `/admin/logs` | → `/admin/operations/logs` | Legacy redirect |
| `/admin/ingest/jobs` | → `/admin/operations/ingest` | Legacy redirect |
| `/admin/knowledge-base` | → `/admin/knowledge` | Legacy redirect |
| `/admin/knowledge-assets` | → `/admin/knowledge/assets` | Legacy redirect |
| `/admin/rag-quality` | → `/admin/ai/rag-quality` | Legacy redirect |
| `/admin/spaces` | → `/admin/knowledge/spaces` | Legacy redirect |

---

## 🌐 User Experience (Non-Admin)
Rutas accesibles por usuarios autenticados sin rol de admin.

| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/dashboard` | **Dashboard**: Entry point por rol (DashboardDispatcher) | - | Platform | 🆕 | 9 | 2026-02-23 |
| `/search` | **RAG Search**: Búsqueda conversacional con ConversationalSearch | - | Knowledge | 🆕 | 53 | 2026-02-23 |
| `/my-documents` | **My Documents**: Almacén personal de documentos (user-facing) | - | Personal | 🆕 | 379 | 2026-02-23 |
| `/profile` | **Profile**: Perfil de usuario | - | Platform | ✅ | — | 2026-03-03 |
| `/settings` | **Settings**: Configuración de usuario | - | Platform | 🆕 | — | 2026-02-23 |

### 🪐 Spaces
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/spaces` | **Spaces Hub**: Navegación por espacios de usuario | - | Personal | ✅ | — | 2026-02-23 |
| `/spaces/collections` | Colecciones del usuario | - | Personal | 🆕 | — | 2026-02-23 |
| `/spaces/personal` | Espacio personal | - | Personal | 🆕 | — | 2026-02-23 |
| `/spaces/playground` | Playground de espacio | - | Personal | 🆕 | — | 2026-02-23 |
| `/spaces/quick-qa` | Preguntas rápidas | - | Personal | 🆕 | — | 2026-02-23 |

### 💬 Support (Client)
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/support` | **Support Center (Client)**: Centro de ayuda y tickets | - | Support | ✅ | — | 2026-02-23 |
| `/support/[id]` | Detalle de ticket | - | Support | 🆕 | — | 2026-02-23 |
| `/support/nuevo` | Crear nuevo ticket | - | Support | 🆕 | — | 2026-02-23 |
| `/support-dashboard` | **Support Hub (Staff)**: Gestión de soporte interno | - | Support | ✅ | — | 2026-02-23 |

### 🔀 Redirects (User)
| Ruta | Destino | Notas |
|------|---------|-------|
| `/support-ticket` | → `/support/nuevo` | Legacy redirect |

---

## 🛠️ Technical Panel
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/technical` | **Technical Hub**: Punto de entrada técnico | - | Technical | 🆕 | — | 2026-02-23 |
| `/entities` | **Entity Explorer**: Dashboard de Entidades | - | Technical | ✅ | — | 2026-02-23 |
| `/entities/[id]/validar` | Validación Técnica de Entidad | - | Technical | ✅ | — | 2026-02-23 |
| `/graphs` | **Neo4j Explorer**: Visualizador de Grafo | - | Technical | ✅ | — | 2026-02-23 |

## 🔧 Ops Portal
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/ops/reports` | **Ops Reports**: Reportes operacionales | - | Operations | 🆕 | — | 2026-02-23 |

## 🏢 Vertical Demos
| Ruta | Funcionalidad | API Contract | Dominio | Estado | Líneas | Revisión |
|------|---------------|--------------|---------|--------|--------|----------|
| `/real-estate` | **Real Estate Demo**: Property Twin con datos mock (Fase 85) | - | Vertical (Demo) | 🎭 | 120 | 2026-02-23 |

---

## 🔌 API Routes (Principales)
| Ruta | Funcionalidad | Revisión |
|------|---------------|----------|
| `/api/technical/*` | **Modular API**: RAG, Entities, Workflows | 2026-02-23 |
| `/api/support/*` | **Modular API**: Tickets, Support Knowledge | 2026-02-23 |
| `/api/ops/*` | **Modular API**: Logs, Audit, Health, ETA | 2026-02-23 |
| `/api/admin/prompts/sync` | Sincronización de prompts maestros DB ↔ Code | 2026-02-23 |
| `/api/admin/ai/governance` | Config LLM (GET/PATCH) | 2026-02-23 |
| `/api/admin/billing/usage` | Usage metrics & ROI | 2026-02-23 |
| `/api/admin/i18n/*` | Translation management | 2026-02-23 |
| `/api/admin/ingest/[id]/enrich` | Post-ingesta premium triggers | 2026-02-23 |
| `/api/admin/workers/intelligence` | Generación de FAQ y Monitoreo de Calidad | 2026-03-04 |
| `/api/admin/superadmin/playbooks` | Ops Playbook Execution History | 2026-03-03 |

---

## ⚠️ Clusters de Duplicación Pendientes (ERA 8)

### 📄 "Mis Documentos" × 3
| Ruta | API | Contexto |
|------|-----|----------|
| `/admin/my-documents` | TBD | Admin-only |
| `/admin/knowledge/my-docs` | TBD | Bajo Knowledge Hub |
| `/my-documents` (379 líneas) | `/api/auth/knowledge-assets` | User-facing, hooks estándar |

### 💬 "Soporte" × 4 puntos de entrada
| Ruta | Rol | Datos |
|------|-----|-------|
| `/support` + sub-rutas | Client | Funcional |
| `/admin/support` | Admin | Redirect |
| `/support-dashboard` | Staff | **100% FAKE DATA** |
| `/support-ticket` | Legacy | Redirect → `/support/nuevo` |

### 🔍 "Audit / Logs" × 3
| Ruta | Propósito |
|------|-----------|
| `/admin/audit` (260 líneas) | Log explorer industrial, filtros, métricas |
| `/admin/security/audit` | Audit trail inmutable (security) |
| `/admin/operations/logs` | System logs operacionales |

---

## 🗑️ DEPRECATED & ARCHIVED
**Rutas eliminadas/renombradas. Solo existen como redirects:**

- `/admin/knowledge-base` → Redirect a `/admin/knowledge`
- `/admin/knowledge-assets` → Redirect a `/admin/knowledge/assets`
- `/admin/logs` → Redirect a `/admin/operations/logs`
- `/admin/ingest/jobs` → Redirect a `/admin/operations/ingest`
- `/admin/rag-quality` → Redirect a `/admin/ai/rag-quality`
- `/admin/spaces` → Redirect a `/admin/knowledge/spaces`
- `/support-ticket` → Redirect a `/support/nuevo`
- `/technical/entities` → Movido a `/entities`
- `/technical/graphs` → Movido a `/graphs`
- `/admin/security/logs` → Movido a `/admin/operations/logs`
- `/admin/intelligence` → Reemplazado por `/admin/ai` y `/admin/intelligence/trends`
- `/admin/billing/plan` → ⚠️ map.md lo declaraba deprecated pero es funcional (95 líneas, i18n OK). **Reclasificado como CANÓNICA.**
