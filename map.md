## 🛡️ Panel de Administración (Control Center)
Ubicación base: `/admin` (Protegido por Guardian V2)

### 🏠 Admin General (Unified Hubs - Phase 133)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin` | Dashboard principal de administración. | 2026-02-16 |
| `/admin/tasks` | **Tasks Hub**: Gestión de tareas, mi bandeja y asignaciones. | 2026-02-17 |
| `/admin/security` | **Security Hub Dashboard**: Navegación centralizada a módulos de seguridad. | 2026-02-19 (Phase 183 Hardening) ✅ |
| `/admin/security/audit` | **Audit Trail**: Registro inmutable de acciones del sistema. | 2026-02-19 |
| `/admin/operations/maintenance` | Herramientas de mantenimiento y corrección de datos. | 2026-02-16 |
| `/admin/operations/status` | Estado de servicios externos e infraestructura. | 2026-02-19 |
| `/admin/settings` | **Settings Hub**: Configuración centralizada (Org, Users, Prompts, i18n). | 2026-02-19 |
| `/admin/profile` | Perfil de usuario administrador. | 2026-02-16 |
| `/admin/reports` | Report Hub: Dashboard de informes. | 2026-02-16 |
| `/admin/reports/schedules` | Schedule Management: Gestión de programación de informes. | 2026-02-16 |
| `/admin/superadmin` | **Global Platform Dashboard**: Observabilidad multi-tenant, salud del cluster y **Salud Financiera (Predictiva)** (SUPER_ADMIN). | 2026-02-18 (Stabilized) ✅ |

### 🧠 Knowledge & RAG
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/knowledge` | **Knowledge Hub Dashboard**: Navegación centralizada a módulos de conocimiento. | 2026-02-17 |
| `/admin/knowledge/explorer` | **Neural Explorer**: Exploración de chunks vectorizados y simulación RAG. | 2026-02-17 |
| `/admin/knowledge/assets` | **Asset Management**: Gestión unificada de activos de conocimiento. | 2026-02-17 |
| `/admin/knowledge/my-docs` | **My Documents**: Gestión personal de documentos del usuario. | 2026-02-17 |
| `/admin/knowledge/spaces` | **Knowledge Spaces**: Configuración de espacios y permisos. | 2026-02-17 |
| `/admin/knowledge-base` | *Redirect to /admin/knowledge* | 2026-02-17 |
| `/admin/knowledge-assets` | *Redirect to /admin/knowledge/assets* | 2026-02-17 |
| `/admin/spaces` | *Redirect to /admin/knowledge/spaces* | 2026-02-17 |
| `/admin/knowledge-base/graph` | **Graph Explorer**: Visualizador de grafos y relaciones (Neo4j) con edición directa. | 2026-02-16 |
| `/admin/rag-quality` | *Redirects to /admin/ai?tab=rag-quality* | 2026-02-13 |

### 👮 Guardian & Governance (Gobierno & Permisos)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/permissions` | Matriz de permisos (Roles/Políticas) y overrides de usuario. | 2026-02-17 (Reviewed Audit 2307) ✅ |
| `/admin/permissions/groups` | Jerarquía organizacional de grupos y departamentos. | 2026-02-17 |
| `/admin/permissions/simulator` | Sandbox para probar permisos sin afectar producción. | 2026-02-17 |
| `/admin/permissions/audit` | Registro histórico de decisiones de Guardian. | 2026-02-17 |
| `/admin/users` | **Users Hub Dashboard**: Navegación centralizada a gestión de usuarios. | 2026-02-17 |
| `/admin/users/active` | **Active Users**: Gestión de usuarios registrados. | 2026-02-17 |
| `/admin/users/pending` | **Pending Invitations**: Gestión de invitaciones pendientes. | 2026-02-17 |
| `/admin/settings/i18n` | Gobernanza i18n: Editor de traducciones con asistencia de IA. | 2026-02-14 |
| `/admin/document-types` | Gestión de tipos de documento personalizados. | 2026-02-17 ✅ |

### ⚡ Automation Studio (Workflows)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/ai` | **AI Hub Dashboard**: Navegación centralizada a módulos de IA. | 2026-02-17 |
| `/admin/ai/rag-quality` | **RAG Quality**: Evaluación de calidad y precisión de respuestas. | 2026-02-17 |
| `/admin/ai/workflows` | **Workflows**: Editor de flujos de trabajo y orquestación. | 2026-02-17 |
| `/admin/ai/predictive` | **Predictive Maintenance**: Análisis de patrones (Próximamente). | 2026-02-17 |
| `/admin/ai/playground` | **AI Playground**: Entorno de experimentación RAG con multi-modelo y ajuste de parámetros dinámicos. | 2026-02-17 ✅ |
| `/admin/workflows` | *Redirect to /admin/ai/workflows* | 2026-02-17 |
| `/admin/workflows/[id]` | Editor y detalle de workflow específico. | - |
| `/admin/workflow-tasks` | Centro de Colaboración de Tareas (Task Hub). | 2026-02-17 |

### 📊 Intelligence & Audit
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/intelligence/trends` | Detección de patrones y anomalías en el uso de la IA. | 2026-02-14 |
| `/admin/audit` | Registro inmutable de acciones críticas (Governance). | 2026-02-06 10:15 |
| `/admin/audit/config-changes` | **Config Audit**: Historial de cambios en configuración (Prompts, Feature Flags). | 2026-02-16 |
| `/admin/logs` | *Redirects to /admin/operations/logs* | 2026-02-16 |
| `/admin/analytics` | Métricas globales, KPIs y analytics de plataforma (SUPER_ADMIN). | 2026-02-13 12:15 |
| `/admin/rag-eval` | Evaluación y testing de calidad RAG. | - |
| `/api/intelligence/causal-analysis` | **Causal Analysis API**: Motor de simulación de impacto 'What-If'. | 2026-02-17 ✅ |
| `/admin/reports` | **Report Hub**: Generación y gestión de informes industriales PDF. | 2026-02-16 |

### 💰 Billing & Organizations
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/billing` | Facturación, consumo de recursos y gestión de planes. | 2026-02-13 11:30 |
| `/admin/billing/contracts` | Gestión de contratos, límites y planes por tenant. | 2026-02-17 |
| `/admin/billing/invoices` | Gestión y visualización de facturas. | 2026-02-17 |
| `/admin/billing/plan` | Detalle y gestión del plan actual. | 2026-02-17 |
| `/admin/billing/usage` | Métricas de uso y consumo de recursos. | 2026-02-17 |
| `/admin/organizations` | **Organizations Hub Dashboard**: Navegación centralizada a configuración del tenant. | 2026-02-17 |
| `/admin/organizations/general` | **General Settings**: Configuración básica del tenant. | 2026-02-17 |
| `/admin/organizations/branding` | **Branding**: Personalización de marca y colores. | 2026-02-17 |
| `/admin/organizations/storage` | **Storage**: Configuración de almacenamiento y cuotas. | 2026-02-17 |
| `/admin/organizations/features` | **Features**: Gestión de módulos y características. | 2026-02-17 |
| `/admin/organizations/billing` | **Billing**: Facturación y datos fiscales. | 2026-02-17 |

### 📋 Checklist & Compliance
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/checklist-configs` | Configuración de reglas de negocio para checklists IA. | 2026-02-14 |
| `/admin/checklist-configs/new` | Creación de nueva configuración de checklist. | - |
| `/admin/checklist-configs/[id]` | Edición de configuración específica. | - |
| `/admin/compliance` | Centro de Cumplimiento GDPR: Portabilidad de datos y Certificados de destrucción. | 2026-02-14 |

### 🔧 Configuración Avanzada
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/prompts` | Gestión de directivas de IA e i18n avanzada (Integrado en AI Hub). | 2026-02-17 ✅ |
| `/admin/api-keys` | Gestión de claves API industriales con restricción de Espacios. | 2026-02-12 |
| `/admin/ingest/jobs` | *Redirects to /admin/operations/ingest* | 2026-02-16 |
| `/admin/api-docs` | Portal Interactivo Swagger (OAS 3.0). | 2026-02-08 |

### 🔔 Notificaciones
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/notifications` | Centro de notificaciones y alertas del sistema. | - |
| `/admin/notifications/settings` | Configuración de preferencias de notificación. | - |
| `/admin/notifications/templates` | Gestión de plantillas de notificación. | - |
| `/admin/notifications/templates/[type]` | Edición de plantilla específica. | - |

### 👤 My Documents (Admin)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/my-documents` | *Redirect a /my-documents* | 2026-02-14 |

### 📁 Cases (Gestión de Casos)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/cases/[id]` | **Case Hero Layout**: Detalle de caso, timeline y chat. | 2026-02-13 |

## 🏭 Verticales Industriales (Workshop & Taller)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/workshop/orders/new` | Registro de pedidos de taller con extracción de manuales (Phase 128). | 2026-02-14 |

## 🛠️ Herramientas Técnicas (Expert Mode)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/technical/entities` | Dashboard técnico de análisis de entidades (pedidos) con IA. | 2026-02-14 |
| `/technical/graphs` | Visualizador de Grafo de Conocimiento (Neo4j) con soporte de mutación masiva. | 2026-02-16 |
| `/entities/[id]/validar` | Validación técnica de entidad específica con workflow. | 2026-02-14 |
| `/architecture` | Diagramas de sistema y documentación viva. | 2026-02-14 |

## 🔌 Infraestructura (API Endpoints Clave)
| Base Path | Propósito | Última Revisión |
|-----------|-----------|-----------------|
| `/api/admin/cases/[id]` | Recuperación segura de detalles de casos (Entity Detail). | 2026-02-13 |
| `/api/admin/ingest` | Pipeline Hexagonal (PrepareIngestionUseCase) + Multi-level Chunking. | 2026-02-16 |
| `/api/admin/ingest/status/[docId]` | Seguimiento de progreso y reintentos (ExecuteIngestionAnalysis). | 2026-02-08 02:00 |
| `/api/admin/knowledge-assets` | Gestión de Assets (ListKnowledgeAssetsUseCase). | 2026-02-10 10:00 |
| `/api/admin/workflows/analytics/[id]` | Analíticas de performance por nodo de workflow. | 2026-02-03 11:25 |
| `/api/admin/workflows/analytics/[id]/report` | Generación de informes industriales en PDF. | 2026-02-06 |
| `/api/admin/reports` | **GET**: Listado histórico de informes generados. | 2026-02-16 |
| `/api/admin/reports/generate` | **POST**: Motor de generación de PDF basado en templates (ReportEngine). | 2026-02-16 |
| `/api/admin/workflows/analytics/[id]/logs` | Dashboard de registros de ejecución en tiempo real. | 2026-02-03 11:25 |
| `/api/admin/rag/*` | Búsqueda Híbrida, Re-ranking y expansión de queries. | 2026-02-06 00:30 |
| `/api/admin/permissions`| Evaluación en tiempo real (Guardian Engine). | 2026-02-06 10:15 |
| `/api/admin/environments`| Lógica de aislamiento y promoción (Staging/Prod). | 2026-02-06 00:30 |
| `/api/admin/users/invite/bulk` | Ingesta masiva de invitaciones (Batch Processing). | 2026-02-06 07:45 |
| `/api/core/quick-qa` | Endpoint efímero para preguntas rápidas sobre texto pegado. | 2026-02-11 |
| `/api/collections` | Gestión de colecciones personales (Notebooks). | 2026-02-11 |
| `/api/billing/simulate-change` | Simulación de prorrateo para cambios de plan (Stripe Integration). | 2026-02-14 |
| `/api/admin/billing/prediction` | Proyección de costes y burn rate por tenant (Phase 110). | 2026-02-18 ✅ |
| `/api/admin/prompts/dry-run` | Ejecución de prueba de prompts con Gemini Flash (Sandbox). | 2026-02-15 |
| `/api/admin/prompts/test-ab` | Comparativa A/B de prompts en tiempo real (Performance). | 2026-02-15 |
| `/api/admin/superadmin/metrics` | Agregación global de métricas multi-tenant para el Dashboard. | 2026-02-17 ✅ |
| `/api/admin/superadmin/anomalies` | Detección estadística de anomalías en latencia y errores. | 2026-02-17 ✅ |
| `/api/admin/superadmin/ontology/evolution` | Review de la deriva de ontología y propuestas del Sovereign Engine. | 2026-02-17 ✅ |
| `/api/cron/self-healing` | Trigger de auto-curación y auditoría de documentos (Secure Cron). | 2026-02-17 ✅ |
| `/api/cron/status-check` | Auditoría predictiva y detección de anomalías programada. | 2026-02-17 ✅ |

## 🗑️ Rutas Deprecadas / No Encontradas
Rutas que aparecen en versiones anteriores del mapa pero no existen físicamente en el código:

| Ruta | Estado | Notas |
|------|--------|-------|
| `/admin/workflows/active` | ❌ No existe | Posiblemente integrado en `/admin/workflows` o `/admin/ai` |
| `/workshop/orders/new` | ❌ No existe | Ruta incorrecta, el workshop está bajo `/admin/workshop/orders/new` |
| `/features/*` | ⚠️ Comodín | Reemplazado por rutas específicas: `/features/audit-trail`, `/features/compliance`, etc. |
| `/graphs` | ❌ Ruta incorrecta | La ruta correcta es `/technical/graphs` |
| `/admin/dashboard` | 🔄 Redirect | Redirige a `/admin` (Phase 133) |
| `/admin/settings/general` | 🔄 Redirect | Redirige a `/admin/settings` (Phase 133) |
| `/admin/knowledge-base` | 🔄 Redirect | Redirige a `/admin/knowledge` |
| `/admin/workflow-tasks` | 🔄 Redirect | Reemplazado por `/admin/tasks` |
| `/admin/rag-eval` | ⛔ Deleted | Eliminado por seguridad (usar `/admin/rag-quality`) |
| `/api/debug/*` | ⛔ Deleted | Endpoints de debug eliminados de producción |

---
---
### 🏛️ Estructura Futura (Suite Era - FASE 180+)
*En curso de migración a Monorepo:*

- `apps/rag-app`: Aplicación actual de análisis RAG.
- `packages/platform-core`: Auth, DB, RBAC, Propmts, Logging.
- `packages/ui-kit`: Layouts, Themes, Componentes compartidos.
- `packages/workflow-engine`: Motor de estados agnóstico.
- `packages/rag-engine`: Lógica específica de ingesta y retrieval.

---
*Mapa actualizado por Antigravity v5.0.0 (Suite Edition) - Estructura real al: 2026-02-18*
*Rutas sin fecha (-) están pendientes de auditoría*
