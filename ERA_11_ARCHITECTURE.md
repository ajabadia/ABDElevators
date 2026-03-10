# ERA 11 Architecture & Navigation Structure

Este documento detalla la arquitectura de navegación, dependencias y aplicaciones del ecosistema **ABD RAG Platform (Era 11)**.

## 🗺️ VISTA POR ROL (Estructura de Menú)

El sistema utiliza una navegación dinámica basada en el rol del usuario y los permisos `Guardian V3`.

### 👤 SuperAdministrador / Administrador
```plain
┌────────────────────────────────────────┐
│  🔍 Búsqueda RAG...                    │
├────────────────────────────────────────┤
│  🏠 Dashboard (Hub Principal)          │
│  ───────────────────────────────────── │
│  📋 TRABAJO (WORK)                     │
│  ├─ Pedidos y Análisis              12 │
│  ├─ Validaciones                       │
│  ├─ Mis Tareas                      5  │
│  └─ Documentos                         │
│  ───────────────────────────────────── │
│  🧠 INTELIGENCIA                       │
│  ├─ Búsqueda RAG                       │
│  ├─ Explorador                         │
│  └─ Mis Docs                           │
│  ───────────────────────────────────── │
│  🤖 AGENTES                            │
│  ├─ Biblioteca                         │
│  └─ Ejecuciones                        │
│  ───────────────────────────────────── │
│  📊 INSIGHTS                           │
│  └─ Reportes                           │
│  ───────────────────────────────────── │
│  ⚙️ CONFIGURACIÓN                      │
│  ├─ Sistema                            │
│  ├─ Usuarios                           │
│  └─ Auditoría                          │
└────────────────────────────────────────┘
```

### 👤 Perfil Técnico / Ingeniería
- Acceso simplificado a **WORK** y **INTELIGENCIA**.
- Menú de **AGENTES** enfocado a ejecución.
- Configuración limitada a sus propios ajustes.

---

## 🔗 CANONICAL URLS & CLUSTERS

La Era 11 consolida las rutas en clusters funcionales para evitar "páginas fantasma".

| Cluster | Ruta Base | Descripción |
| :--- | :--- | :--- |
| **Work** | `/work/*` | Operaciones de negocio, pedidos, validaciones y tareas. |
| **Intelligence** | `/intelligence/*` | RAG, búsqueda semántica y gestión de conocimiento. |
| **Agents** | `/agents/*` | Orquestación de LLMs, Playbooks y Automatizaciones. |
| **Insights** | `/insights/*` | Dashboards ejecutivos y analítica avanzada. |
| **Settings** | `/settings/*` | Configuración de sistema, i18n, usuarios y seguridad. |

---

## 🛠️ APLICACIONES & UTILIDADES CORE

### 1. Centro del Sistema (System Settings)
- **Localización**: `/settings/system` (via Dialog/Hub).
- **Alcance**: Gestión de Verticales (Banca, Seguros, Inmuebles), Idiomas y Branding.
- **I18n**: Sincronización en caliente con MongoDB Atlas via `scripts/sync-translations.ts`.

### 2. Guardián V3 (Security)
- **Middleware**: Protección de rutas por cluster.
- **Permisos**: Basados en `enforcePermission(resource, action)`.
- **Aislamiento**: `getTenantCollection` garantiza Zero-Leak entre clientes.

### 3. Buscador Inteligente (RAG Explorer)
- **Motor**: Gemini 1.5/2.0 + Vector Search.
- **Contexto**: Cognición Jerárquica (Análisis por perfiles y secciones).

---

## 📚 SKILLS AGÉNTICOS (Era 11 Compliant)

Todos los skills en `.agent/skills/` han sido auditados para esta era:
- **`guardian-auditor`**: Valida permisos en las nuevas rutas `/work`, `/intelligence`.
- **`hub-dashboard-architect`**: Impulsa el uso de `<HubPage>` y `<MetricCard>`.
- **`i18n-a11y-auditor`**: Enforce de `sonner` y limpieza de `dotted keys`.
- **`ai-governance-migrator`**: Gestión dinámica de modelos via `AiModelManager`.

---
**Versión**: 1.1 (Final Integration)
**Fecha**: 8 de Marzo, 2026
