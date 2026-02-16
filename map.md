# 🗺️ Mapa de Aplicación - ABD RAG Platform

Este documento relaciona las rutas del sistema con sus funcionalidades principales, sirviendo como guía rápida de la arquitectura funcional.

## 🏢 Área Pública & Marketing
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/` | Landing Page con Hero, Bento y propuesta de valor. | 2026-02-14 |
| `/about` | Visión estratégica y equipo. | 2026-02-14 |
| `/pricing` | Planes de suscripción y límites de uso. | 2026-02-14 |
| `/terms` | Términos de Servicio y condiciones legales. | 2026-02-14 |
| `/privacy` | Política de Privacidad y tratamiento de datos (GDPR). | 2026-02-14 |
| `/accessibility` | Declaración de Accesibilidad y compromiso WCAG 2.1. | 2026-02-14 |
| `/contact` | Formulario de contacto y soporte comercial. | 2026-02-14 |
| `/login` | Acceso de usuarios autenticados. | 2026-02-14 |
| `/upgrade` | Gestión de suscripciones y upgrades. | 2026-02-14 |
| `/sandbox` | Demo interactivo público con documentos de ejemplo (sin autenticación). | 2026-02-09 |

### Features (Landing)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/features/audit-trail` | Auditoría completa de acciones y trazabilidad. | 2026-02-14 |
| `/features/compliance` | Cumplimiento normativo GDPR e ISO. | 2026-02-14 |
| `/features/dual-engine` | Motor dual de procesamiento OCR + IA. | 2026-02-14 |
| `/features/federated` | Búsqueda federada cross-tenant. | 2026-02-14 |
| `/features/pdf-bridge` | Puente de integración con sistemas PDF legacy. | 2026-02-14 |
| `/features/vector-search` | Búsqueda semántica vectorial. | 2026-02-14 |

### Páginas de Autenticación
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/auth-pages/magic-link/verify` | Verificación de Magic Links para autenticación passwordless. | 2026-02-10 |
| `/auth-pages/signup-invite/[token]` | Registro de usuario mediante invitación. | 2026-02-14 |
| `/auth-pages/error` | Página de error de autenticación. | 2026-02-14 |

### Páginas de Error
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/error` | Página de error general. | 2026-02-14 |
| `/error/rate-limit` | Error de límite de peticiones excedido. | 2026-02-14 |

## 👤 Panel de Usuario (Authenticated)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/dashboard` | **NEW** Dashboard Principal (Role-Based Dispatcher). | 2026-02-13 |
| `/profile` | Dashboard personal, estadísticas de uso y avatar. | 2026-02-13 10:00 |
| `/my-documents` | Repositorio personal de archivos analizados. | 2026-02-14 |
| `/search` | Búsqueda Inteligente Conversacional sobre manuales técnicos. | 2026-02-14 |
| `/spaces` | Hub de Espacios personales, colecciones y Quick Q&A (Phase 125). | 2026-02-12 |
| `/spaces/playground` | Entorno de pruebas y experimentación con espacios. | 2026-02-14 |
| `/settings` | Configuración personal del usuario. | 2026-02-14 |
| `/support` | Sistema de tickets y centro de ayuda empresarial. | 2026-02-14 |
| `/support/[id]` | Visualización detallada de ticket de soporte. | 2026-02-14 |
| `/support/nuevo` | Creación de nuevo ticket de soporte. | 2026-02-14 |

## 🛡️ Panel de Administración (Control Center)
Ubicación base: `/admin` (Protegido por Guardian V2)

### 🏠 Admin General (Unified Hubs - Phase 133)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin` | Dashboard principal de administración. | 2026-02-16 |
| `/admin/tasks` | **Tasks Hub**: Gestión de tareas, mi bandeja y asignaciones. | 2026-02-16 |
| `/admin/security` | **Security Hub**: Permisos, Auditoría y Sesiones activas. | 2026-02-16 |
| `/admin/operations` | **Operations Hub**: Ingesta, Logs, Observabilidad y Mantenimiento. | 2026-02-16 |
| `/admin/settings` | **Settings Hub**: Configuración centralizada (Org, Users, Prompts, i18n). | 2026-02-16 |
| `/admin/profile` | Perfil de usuario administrador. | 2026-02-16 |
| `/admin/support` | Centro de soporte técnico. | 2026-02-16 |

### 🧠 Knowledge & RAG
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/knowledge` | **Unified Knowledge Hub**: Activos, Explorador Neural y Espacios. | 2026-02-13 |
| `/admin/knowledge-base` | *Redirects to /admin/knowledge?tab=explorer* | 2026-02-13 |
| `/admin/knowledge-assets` | *Redirects to /admin/knowledge?tab=assets* | 2026-02-13 |
| `/admin/spaces` | *Redirects to /admin/knowledge?tab=spaces* | 2026-02-13 11:00 |
| `/admin/knowledge-base/graph` | **Graph Explorer**: Visualizador de grafos y relaciones (Neo4j). | 2026-02-16 10:15 |
| `/admin/rag-quality` | *Redirects to /admin/ai?tab=rag-quality* | 2026-02-13 |

### 👮 Guardian & Governance (Gobierno & Permisos)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/permissions` | Matriz de permisos (Roles/Políticas) y overrides de usuario. | 2026-02-14 |
| `/admin/permissions/groups` | Jerarquía organizacional de grupos y departamentos. | 2026-02-14 |
| `/admin/permissions/simulator` | Sandbox para probar permisos sin afectar producción. | 2026-02-14 |
| `/admin/permissions/audit` | Registro histórico de decisiones de Guardian. | 2026-02-06 10:15 |
| `/admin/users` | Gestión centralizada de usuarios, roles e invitaciones. | 2026-02-14 |
| `/admin/settings/i18n` | Gobernanza i18n: Editor de traducciones con asistencia de IA. | 2026-02-14 |
| `/admin/document-types` | Gestión de tipos de documento personalizados. | - |

### ⚡ Automation Studio (Workflows)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/ai` | **Unified AI Hub**: Workflows, RAG Quality, Predictive & Playground. | 2026-02-13 11:45 |
| `/admin/workflows` | *Redirects to /admin/ai?tab=workflows* | 2026-02-13 |
| `/admin/workflows/[id]` | Editor y detalle de workflow específico. | - |
| `/admin/workflow-tasks` | Centro de Colaboración de Tareas (Task Hub). | 2026-02-14 |

### 📊 Intelligence & Audit
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/intelligence/trends` | Detección de patrones y anomalías en el uso de la IA. | 2026-02-14 |
| `/admin/audit` | Registro inmutable de acciones críticas (Governance). | 2026-02-06 10:15 |
| `/admin/logs` | Visor de sistema distribuido para depuración técnica. | 2026-02-13 12:00 |
| `/admin/analytics` | Métricas globales, KPIs y analytics de plataforma (SUPER_ADMIN). | 2026-02-13 12:15 |
| `/admin/rag-eval` | Evaluación y testing de calidad RAG. | - |

### 💰 Billing & Organizations
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/billing` | Facturación, consumo de recursos y gestión de planes. | 2026-02-13 11:30 |
| `/admin/billing/contracts` | Gestión de contratos, límites y planes por tenant. | 2026-02-12 |
| `/admin/billing/invoices` | Gestión y visualización de facturas. | - |
| `/admin/billing/plan` | Detalle y gestión del plan actual. | - |
| `/admin/billing/usage` | Métricas de uso y consumo de recursos. | - |
| `/admin/organizations` | Configuración de tenant: branding, almacenamiento, facturación y reportes. | 2026-02-14 |

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
| `/admin/prompts` | Gestión de directivas de IA e i18n avanzada (Phase 109). | 2026-02-12 |
| `/admin/api-keys` | Gestión de claves API industriales con restricción de Espacios. | 2026-02-12 |
| `/admin/ingest/jobs` | Panel de gestión de Dead Letter Queue (DLQ) y jobs atascados (Phase 126). | 2026-02-12 |
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
| `/technical/graphs` | Visualizador de Grafo de Conocimiento (Neo4j). | 2026-02-14 |
| `/entities/[id]/validar` | Validación técnica de entidad específica con workflow. | 2026-02-14 |
| `/architecture` | Diagramas de sistema y documentación viva. | 2026-02-14 |

## 🔌 Infraestructura (API Endpoints Clave)
| Base Path | Propósito | Última Revisión |
|-----------|-----------|-----------------|
| `/api/admin/cases/[id]` | Recuperación segura de detalles de casos (Entity Detail). | 2026-02-13 |
| `/api/admin/ingest` | Pipeline Hexagonal (PrepareIngestionUseCase) + Multi-level Chunking. | 2026-02-13 |
| `/api/admin/ingest/status/[docId]` | Seguimiento de progreso y reintentos (ExecuteIngestionAnalysis). | 2026-02-08 02:00 |
| `/api/admin/knowledge-assets` | Gestión de Assets (ListKnowledgeAssetsUseCase). | 2026-02-10 10:00 |
| `/api/admin/workflows/analytics/[id]` | Analíticas de performance por nodo de workflow. | 2026-02-03 11:25 |
| `/api/admin/workflows/analytics/[id]/report` | Generación de informes industriales en PDF. | 2026-02-06 |
| `/api/admin/workflows/analytics/[id]/logs` | Dashboard de registros de ejecución en tiempo real. | 2026-02-03 11:25 |
| `/api/admin/rag/*` | Búsqueda Híbrida, Re-ranking y expansión de queries. | 2026-02-06 00:30 |
| `/api/admin/permissions`| Evaluación en tiempo real (Guardian Engine). | 2026-02-06 10:15 |
| `/api/admin/environments`| Lógica de aislamiento y promoción (Staging/Prod). | 2026-02-06 00:30 |
| `/api/admin/users/invite/bulk` | Ingesta masiva de invitaciones (Batch Processing). | 2026-02-06 07:45 |
| `/api/admin/workflow-tasks` | Orquestación y actualización de tareas industriales. | 2026-02-14 |
| `/api/admin/i18n/stats` | Estadísticas de namespaces para filtrado dinámico. | 2026-02-06 |
| `/api/swagger/spec` | Generación dinámica de OpenAPI Spec (zod-to-openapi). | 2026-02-08 |
| `/api/sandbox/chat` | Chat público demo con documentos hardcodeados (rate limit 5/min). | 2026-02-09 |
| `/api/auth/magic-link/request` | Generación y envío de Magic Links para autenticación passwordless. | 2026-02-10 |
| `/api/cron/stuck-jobs` | Detección y recuperación automática de procesos de ingesta bloqueados. | 2026-02-10 |
| `/api/admin/spaces` | Gestión administrativa de espacios universales (Quota & Hierarchy). | 2026-02-11 |
| `/api/spaces` | Recuperación de espacios accesibles para navegación del usuario. | 2026-02-11 |
| `/api/core/quick-qa` | Endpoint efímero para preguntas rápidas sobre texto pegado. | 2026-02-11 |
| `/api/collections` | Gestión de colecciones personales (Notebooks). | 2026-02-11 |
| `/api/billing/simulate-change` | Simulación de prorrateo para cambios de plan (Stripe Integration). | 2026-02-14 |
| `/api/admin/prompts/dry-run` | Ejecución de prueba de prompts con Gemini Flash (Sandbox). | 2026-02-15 |
| `/api/admin/prompts/test-ab` | Comparativa A/B de prompts en tiempo real (Performance). | 2026-02-15 |

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

---
*Mapa actualizado por Antigravity v4.5.1 (Unified Experience Edition) - Estructura real al: 2026-02-14*
*Rutas sin fecha (-) están pendientes de auditoría*
