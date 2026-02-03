# 🗺️ Mapa de Aplicación - ABD RAG Platform

Este documento relaciona las rutas del sistema con sus funcionalidades principales, sirviendo como guía rápida de la arquitectura funcional.

## 🏢 Área Pública & Marketing
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/` | Landing Page con Hero, Bento y propuesta de valor. | - |
| `/features/*` | Detalle de capacidades (Dual Engine, Compliance, etc.). | - |
| `/pricing` | Planes de suscripción y límites de uso. | - |
| `/about` | Visión estratégica y equipo. | - |
| `/login` / `/upgrade` | Acceso y gestión de suscripciones. | - |

## 👤 Panel de Usuario (Authenticated)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/profile` | Dashboard personal, estadísticas de uso y avatar. | - |
| `/my-documents` | Repositorio personal de archivos analizados. | - |
| `/support` | Sistema de tickets y centro de ayuda empresarial. | - |

## 🛡️ Panel de Administración (Control Center)
Ubicación base: `/admin` (Protegido por Guardian V2)

### 🧠 Knowledge & RAG
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/knowledge-base` | Explorador vectorial, visualización de chunks y rankings. | 2026-02-03 12:20 |
| `/admin/knowledge-assets` | Gestión de archivos (PDFs), ingesta masiva y estado de análisis. | 2026-02-03 00:18 |
| `/admin/rag-quality` | Dashboard de evaluación (RAGAs) y métricas de precisión. | 2026-02-03 12:35 |

### 👮 Guardian (Gobierno & Permisos)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/permissions` | Matriz de permisos (Roles/Políticas) y overrides de usuario. | 2026-02-04 10:15 |
| `/admin/permissions/groups` | Jerarquía organizacional de grupos y departamentos. | 2026-02-04 10:15 |
| `/admin/permissions/simulator` | Sandbox para probar permisos sin afectar producción. | 2026-02-04 10:15 |

### ⚡ Automation Studio (Workflows)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/workflows` | Editor visual de grafos para automatizar flujos RAG. | 2026-02-03 23:45 |
| `/admin/workflows/active` | Monitor de ejecuciones en tiempo real. | 2026-02-03 23:45 |

### 📊 Intelligence & Audit
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/admin/intelligence/trends` | Detección de patrones y anomalías en el uso de la IA. | 2026-02-03 23:45 |
| `/admin/audit` | Registro inmutable de acciones críticas (Governance). | 2026-02-04 10:15 |
| `/admin/logs` | Visor de sistema distribuido para depuración técnica. | 2026-02-04 10:15 |
| `/admin/permissions/audit` | Registro histórico de decisiones de Guardian. | 2026-02-04 10:15 |

## 🛠️ Herramientas Técnicas (Expert Mode)
| Ruta | Funcionalidad | Última Revisión |
|------|---------------|-----------------|
| `/graphs` | Explorador de Grafo de Conocimiento (Neo4j Visualizer). | - |
| `/entities` | Dashboard de validación de entidades extraídas. | - |
| `/architecture` | Diagramas de sistema y documentación viva. | - |

## 🔌 Infraestructura (API Endpoints Clave)
| Base Path | Propósito | Última Revisión |
|-----------|-----------|-----------------|
| `/api/admin/ingest` | Pipeline de procesamiento Multi-modal. | 2026-02-04 00:30 |
| `/api/admin/ingest/status/[docId]` | Seguimiento de progreso y reintentos de ingesta. | 2026-02-04 00:30 |
| `/api/admin/workflows/analytics/[id]` | Analíticas de performance por nodo de workflow. | 2026-02-03 11:25 |
| `/api/admin/workflows/analytics/[id]/report` | Generación de informes industriales en PDF. | 2026-02-03 11:25 |
| `/api/admin/workflows/analytics/[id]/logs` | Dashboard de registros de ejecución en tiempo real. | 2026-02-03 11:25 |
| `/api/admin/rag/*` | Búsqueda Híbrida, Re-ranking y expansión de queries. | 2026-02-04 00:30 |
| `/api/admin/permissions`| Evaluación en tiempo real (Guardian Engine). | 2026-02-04 10:15 |
| `/api/admin/environments`| Lógica de aislamiento y promoción (Staging/Prod). | 2026-02-04 00:30 |


---
*Mapa generado y auditado por Antigravity v3.4.3*

