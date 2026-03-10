# ERA 12 Architecture & Navigation Structure

Este documento detalla la arquitectura de navegación, dependencias y aplicaciones del ecosistema **ABD RAG Platform (Era 12: Relational Integrity & Cognitive Evolution)**.

## 🗺️ VISTA POR ROL (Estructura de Menú)

El sistema evoluciona hacia una navegación dinámica basada en el dominio y la integridad de datos, filtrada por `Guardian V3`.

### 👤 SuperAdministrador / Administrador
```plain
┌────────────────────────────────────────┐
│  🔍 Búsqueda RAG (Era 12 Cognition)    │
├────────────────────────────────────────┤
│  🏠 Dashboard (Era 12 - Data Health)   │
│  ───────────────────────────────────── │
│  📋 TRABAJO (WORK)                     │
│  ├─ Pedidos y Análisis              12 │
│  ├─ Validaciones                       │
│  ├─ Mis Tareas                      5  │
│  └─ Documentos (Relational Assets)     │
│  ───────────────────────────────────── │
│  🧠 INTELIGENCIA                       │
│  ├─ Búsqueda RAG                       │
│  ├─ Explorador (SpacePath Navigation)  │
│  └─ Mis Docs                           │
│  ───────────────────────────────────── │
│  🤖 AGENTES                            │
│  ├─ Biblioteca (Flow Studio)           │
│  └─ Ejecuciones (Execution Tracking)    │
│  ───────────────────────────────────── │
│  📊 INSIGHTS                           │
│  └─ Reportes (Quality Benchmarking)    │
│  ───────────────────────────────────── │
│  ⚙️ CONFIGURACIÓN                      │
│  ├─ Sistema (Governance Hub)           │
│  ├─ Usuarios (RBAC & Roles)            │
│  └─ Auditoría (Relational Audit)       │
└────────────────────────────────────────┘
```

---

## 🔗 CANONICAL URLS & CLUSTERS

La Era 12 mantiene los clusters funcionales pero optimiza la carga mediante **Relational Caching** y **SpacePath** navigation.

| Cluster | Ruta Base | Descripción |
| :--- | :--- | :--- |
| **Work** | `/work/*` | Operaciones de negocio normalizadas con `EntityId`. |
| **Intelligence** | `/intelligence/*` | RAG con `doc_profiles`, `doc_sections` y `AssetChunk` bridge. |
| **Agents** | `/agents/*` | Automatizaciones con trazabilidad total en `workflow_executions`. |
| **Insights** | `/insights/*` | Calidad RAG basada en `RAGEvaluation` y `GoldenSets`. |
| **Settings** | `/settings/*` | Gobernanza, RBAC dinámico y multi-tenant isolation. |

---

## 🛠️ APLICACIONES & UTILIDADES CORE (Era 12)

### 1. Relational Integrity Bridge
- **Motor**: Mongoose + VectorDB Sync (Pinecone/Weaviate).
- **Core**: Estandarización de `EntityId` y `TenantScoped` schemas.
- **Vistas**: Uso de `SpacePath` para navegación jerárquica instantánea.

### 2. Autonomous Governance (Guardian V3.1)
- **Middleware**: Protección basada en roles dinámicos con caché en Redis.
- **Gobernanza**: Auditoría inmutable con relaciones cruzadas entre Logs y Entidades.

### 3. RAG Quality Loop (Cognitive Evolution)
- **Benchmarking**: Golden Sets integrados en el flujo de usuario.
- **Evaluación**: `RAGEvaluation` automática para detectar alucinaciones vs errores de recuperación.

---

## 📚 SKILLS AGÉNTICOS (Era 12 Compliant)

- **`project-context-loader`**: Actualizado para Era 12 y Regla #18.
- **`phase-orchestrator`**: Ahora audita "Islas de Datos" antes de planificar.
- **`roadmap-architect-analyst`**: Alineado con la visión de arquitectura relacional.

---
**Versión**: 1.2 (Era 12 Inauguration)
**Fecha**: 9 de Marzo, 2026
