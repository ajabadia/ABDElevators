# 🗺️ Mapa de Aplicación - ABD RAG Platform

Este documento relaciona las rutas del sistema con sus funcionalidades principales, sirviendo como guía rápida de la arquitectura funcional.

## 🏢 Área Pública & Marketing
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/` | Landing Page con Hero, Bento y propuesta de valor. | 2026-02-06 |
| `/features/*` | Detalle de capacidades (Dual Engine, Compliance, etc.). | 2026-02-06 |
| `/pricing` | Planes de suscripción y límites de uso. | 2026-02-06 |
| `/about` | Visión estratégica y equipo. | 2026-02-06 |
| `/terms` | Términos de Servicio y condiciones legales. | 2026-02-06 |
| `/privacy` | Política de Privacidad y tratamiento de datos (GDPR). | 2026-02-06 |
| `/login` / `/upgrade` | Acceso y gestión de suscripciones. | 2026-02-10 |
| `/accessibility` | Declaración de Accesibilidad y compromiso WCAG 2.1. | 2026-02-06 |
| `/sandbox` | Demo interactivo público con documentos de ejemplo (sin autenticación). | 2026-02-09 |
| `/auth-pages/magic-link/verify` | Verificación de Magic Links para autenticación passwordless. | 2026-02-10 |

## 👤 Panel de Usuario (Authenticated)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/profile` | Dashboard personal, estadísticas de uso y avatar. | - |
| `/my-documents` | Repositorio personal de archivos analizados. | - |
| `/search` | Búsqueda Inteligente Conversacional sobre manuales técnicos. | 2026-02-08 |
| `/spaces` | Hub de Espacios personales, colecciones y Quick Q&A (Phase 125). | 2026-02-12 |
| `/support` | Sistema de tickets y centro de ayuda empresarial. | - |

## 🛡️ Panel de Administración (Control Center)
Ubicación base: `/admin` (Protegido por Guardian V2)

### 🧠 Knowledge & RAG
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/knowledge-base` | Explorador vectorial, visualización de chunks y rankings. | 2026-02-03 12:20 |
| `/admin/knowledge-assets` | Gestión de archivos (PDFs), ingesta masiva y estado de análisis. | 2026-02-10 |
| `/admin/spaces` | Dashboard administrativo de Espacios Industriales. | 2026-02-12 |
| `/admin/rag-quality` | Dashboard de evaluación (RAGAs) y métricas de precisión + Decision Tracing. | 2026-02-08 21:00 |

### 👮 Guardian & Governance (Gobierno & Permisos)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/permissions` | Matriz de permisos (Roles/Políticas) y overrides de usuario. | 2026-02-10 |
| `/admin/permissions/groups` | Jerarquía organizacional de grupos y departamentos. | 2026-02-10 |
| `/admin/permissions/simulator` | Sandbox para probar permisos sin afectar producción. | 2026-02-10 |
| `/admin/users` | Gestión centralizada de usuarios, roles e invitaciones. | 2026-02-10 |
| `/admin/settings/i18n` | Gobernanza i18n: Editor de traducciones con asistencia de IA. | 2026-02-06 12:00 |

### ⚡ Automation Studio (Workflows)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/workflows` | Editor visual de grafos para automatizar flujos RAG. | 2026-02-03 23:45 |
| `/admin/workflows/active` | Monitor de ejecuciones en tiempo real. | 2026-02-03 23:45 |
| `/admin/workflow-tasks` | Centro de Colaboración de Tareas (Task Hub). | 2026-02-06 00:00 |

### 📊 Intelligence & Audit
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/intelligence/trends` | Detección de patrones y anomalías en el uso de la IA. | 2026-02-03 23:45 |
| `/admin/audit` | Registro inmutable de acciones críticas (Governance). | 2026-02-06 10:15 |
| `/admin/logs` | Visor de sistema distribuido para depuración técnica. | 2026-02-06 10:15 |
| `/admin/profile` | Gestión de identidad, seguridad y preferencias del usuario. | 2026-02-07 14:30 |
| `/admin/permissions/audit` | Registro histórico de decisiones de Guardian. | 2026-02-06 10:15 |
| `/admin/billing/contracts` | Gestión de contratos, límites y planes por tenant. | 2026-02-10 |
| `/admin/api-keys` | Gestión de claves API industriales con restricción de Espacios. | 2026-02-12 |
| `/admin/ingest/jobs` | Panel de gestión de Dead Letter Queue (DLQ) y jobs atascados (Phase 126). | 2026-02-12 |
| `/admin/workflows` | Diseñador visual de grafos para automatizar flujos RAG (Phase 127). | 2026-02-12 |
| `/admin/checklist-configs` | Configuración de reglas de negocio para checklists IA. | 2026-02-10 |

## 🏭 Verticales Industriales (Workshop & Taller)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/workshop/orders/new` | Registro de pedidos de taller con extracción de manuales (Phase 128). | 2026-02-12 |

## 🛠️ Herramientas Técnicas (Expert Mode)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/graphs` | Explorador de Grafo de Conocimiento (Neo4j Visualizer). | - |
| `/entities` | Dashboard de validación de entidades extraídas. | 2026-02-06 |
| `/architecture` | Diagramas de sistema y documentación viva. | 2026-02-06 |
| `/admin/api-docs` | Portal Interactivo Swagger (OAS 3.0). | 2026-02-08 |

## 🔌 Infraestructura (API Endpoints Clave)
| Base Path | Propósito | Última Revisión |
|-----------|-----------|-----------------|
| `/api/admin/ingest` | Pipeline Hexagonal (PrepareIngestionUseCase). | 2026-02-10 10:00 |
| `/api/admin/ingest/status/[docId]` | Seguimiento de progreso y reintentos (ExecuteIngestionAnalysis). | 2026-02-08 02:00 |
| `/api/admin/knowledge-assets` | Gestión de Assets (ListKnowledgeAssetsUseCase). | 2026-02-10 10:00 |
| `/api/admin/workflows/analytics/[id]` | Analíticas de performance por nodo de workflow. | 2026-02-03 11:25 |
| `/api/admin/workflows/analytics/[id]/report` | Generación de informes industriales en PDF. | 2026-02-06 |
| `/api/admin/workflows/analytics/[id]/logs` | Dashboard de registros de ejecución en tiempo real. | 2026-02-03 11:25 |
| `/api/admin/rag/*` | Búsqueda Híbrida, Re-ranking y expansión de queries. | 2026-02-06 00:30 |
| `/api/admin/permissions`| Evaluación en tiempo real (Guardian Engine). | 2026-02-06 10:15 |
| `/api/admin/environments`| Lógica de aislamiento y promoción (Staging/Prod). | 2026-02-06 00:30 |
| `/api/admin/users/invite/bulk` | Ingesta masiva de invitaciones (Batch Processing). | 2026-02-06 07:45 |
| `/api/admin/workflow-tasks` | Orquestación y actualización de tareas industriales. | 2026-02-06 00:00 |
| `/api/admin/i18n/stats` | Estadísticas de namespaces para filtrado dinámico. | 2026-02-06 |
| `/api/swagger/spec` | Generación dinámica de OpenAPI Spec (zod-to-openapi). | 2026-02-08 |
| `/api/sandbox/chat` | Chat público demo con documentos hardcodeados (rate limit 5/min). | 2026-02-09 |
| `/api/auth/magic-link/request` | Generación y envío de Magic Links para autenticación passwordless. | 2026-02-10 |
| `/api/cron/stuck-jobs` | Detección y recuperación automática de procesos de ingesta bloqueados. | 2026-02-10 |
| `/admin/ingest/jobs` | Panel de gestión de Dead Letter Queue (DLQ) y jobs atascados (Phase 126). | 2026-02-11 |
| `/api/admin/spaces` | Gestión administrativa de espacios universales (Quota & Hierarchy). | 2026-02-11 |
| `/api/spaces` | Recuperación de espacios accesibles para navegación del usuario. | 2026-02-11 |
| `/api/core/quick-qa` | Endpoint efímero para preguntas rápidas sobre texto pegado. | 2026-02-11 |
| `/api/collections` | Gestión de colecciones personales (Notebooks). | 2026-02-11 |

---
*Mapa actualizado por Antigravity v4.4.3 (Industrial Refinement Edition) - 2026-02-12*
