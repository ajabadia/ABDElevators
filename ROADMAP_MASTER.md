# ROADMAP_MASTER – Era 11: Cognitive & Hierarchical Intelligence

## 🌅 ERA 11: HIERARCHICAL RAG & COGNITIVE ARCHITECTURE (Q2 2026)

**Objetivo:** Evolucionar hacia un sistema de RAG jerárquico (MemoRAG style) con observabilidad profunda y automatización de cumplimiento industrial.

### ✅ FASE 305: Hierarchical RAG Foundation (Marzo 2026)
- **Meta:** Superar las limitaciones de búsqueda plana de fragmentos mediante perfiles de documentos y secciones.
- [x] **Data Model v2**: Implementar colecciones `doc_profiles` y `doc_sections`.
- [x] **Hierarchical Indexing**: Nuevo pipeline de ingesta que genera resúmenes y embeddings en tres niveles (Doc, Sección, Fragmento).
- [x] **Structural Segmentation**: Segmentación inteligente de PDFs basada en jerarquía semántica e integración en UI/Trailing.

### ✅ FASE 306: Cognitive Retrieval Engine (Marzo 2026)
- **Meta:** Implementar el motor de búsqueda jerárquica con pre-procesamiento de consultas.
- [x] **Tiered Discovery**: Búsqueda en cascada (Profile -> Section -> Chunk) para maximizar relevancia y minimizar ruido.
- [x] **Query Normalization**: Normalización y traducción automática de consultas antes de la búsqueda.
- [x] **Context Orchestration**: Constructor de contexto inteligente ajustado a presupuestos de tokens.

### ✅ FASE 307: Reliability & Quality (RagJudge) - Marzo 2026
- **Meta:** Implementar "LLM as a Judge" para garantizar la fiabilidad industrial de las respuestas.
- [x] **RagJudge Service**: Evaluación automática de *Faithfulness*, *Relevance* y *Precision*. (Integrated in Quality Dashboard)
- [x] **Causal Analytics**: Clasificación de fallos (Alucinación vs. Mala Recuperación).
- [x] **Reliability Dashboard**: Visualización de *Hallucination Score* y KPIs de fiabilidad para el COO.

### 🏭 FASE 308: Universal Domain Intelligence (Suite Evolution)
- **Meta:** Generalizar la inteligencia de cumplimiento industrial y exponer los primeros módulos de la Suite Era 10.
- [x] **Quality Insights Service**: Panel de KPIs por operario/parte basado en `ragevaluations` y ejecución enriquecida. (Ref: 2802.txt Phase 1)
- [x] **Domain Linker**: Vinculación automática entre Pedidos/Activos y Documentación técnica.
- [x] **Agentic Builder (Alpha)**: No-code/low-code builder para asistentes técnicos basados en plantillas de workflows. (Ref: 2802.txt Phase 2)
- [x] **Compliance Hub**: Trazabilidad completa de "Documento -> Instrucción -> Ejecución -> Verificación".

### ✅ FASE 310: Golden Benchmarking & RAG Observability (Marzo 2026)
- **Meta:** Implementar un ciclo de evaluación científica mediante Golden Sets y experimentos comparativos.
- [x] **Golden Set Engine**: Sistema de gestión de colecciones de prueba maestro para benchmark industrial.
- [x] **Offline Experiment Runner**: Motor de comparación v1 vs v2 con cálculo automático de *Recall* y *Faithfulness*.
- [x] **Deep Observability**: Captura extendida de `flowType`, `engineVersion` y `agentKey` en cada consulta.
- [x] **Elevator Industry Pack**: 20+ queries especializadas para troubleshooting de maniobras (Arca II, etc.).

### ✅ FASE 310.2: Backend Consolidation & Observability Polish (Marzo 2026)
- **Meta:** Unificar los hubs de Operaciones y Entidades, eliminando deuda técnica y estandarizando las notificaciones.
- [x] **Entity Consolidation**: Rutas centralizadas en `/api/core/entities` y abstracción al hook `useEntity`.
- [x] **Hubs Unification**: Fusión de reportes (Schedules, History, Exports) en una única vista `Tabs` responsiva.
- [x] **Multi-tenant Guard (Definitive)**: Estandarización de `SecureCollection` y corrección de privilegios `SUPER_ADMIN` en servicios de observabilidad.
- [x] **Command Hub (Modal)**: Refactorización del System Hub a arquitectura de Diálogo (Modal) para máxima fiabilidad y UX.
- [x] **Notification Bridge**: Hook universal `useNotification` que coordina Toasts + DB Logging sincronizados.
- [x] **SLA Dashboard**: Monitor de rendimiento con agregaciones p95 para rutas y triggers de autodiagnóstico.

### ✅ FASE 320: Unified Navigation Architecture & Role-Agnostic Routing (Marzo 2026)
- **Meta:** Transición de enrutamiento basado en roles (`/admin/...`) a enrutamiento basado en dominios (`/work`, `/intelligence`, `/agents`, `/insights`), filtrado dinámicamente por Guardian V3.
- [x] **Fase 1: Foundations**: `NAVIGATION_CONFIG` centralizado y `NavigationShell` adaptativo.
- [x] **Fase 2: Gradual Migration**: Redirección y movimiento de rutas Core Hubs.
- [x] **Fase 3: Consolidation**: Unificación de configuraciones y purga de rutas legacy.
- [x] **Fase 4: Polish**: Búsqueda global de navegación (CMD+K) y analíticas de uso. (CMD+K updated with and domain context).

---

## 📜 History & Archived Milestones

### ✅ ERA 11: COGNITIVE & HIERARCHICAL (MARZO 2026)
- **Phase 308: Universal Domain Intelligence** -> Agent Builder, Quality Insights, Compliance Hub, Domain Linker.
- **Phase 307: Reliability & Quality** -> RagJudge Service, Causal Analytics, Quality Dashboard.
- **Phase 306: Cognitive Retrieval Engine** -> Tiered discovery, query normalization, context orchestration.
- **Phase 305: Hierarchical RAG Foundation** (Marzo 2026) -> Multi-tier indexing, structural segmentation, doc_profiles/sections.

### ✅ ERA 10: ENTERPRISE CONSOLIDATION (COMPLETADA)
- **Phase 304: Enterprise Reliability & Unified Audit** (Marzo 2026) -> Inmutable auditing, bank-grade policy enforcement, data lifecycle.
- **Phase 300-303: Industrial Scale & UI Refinements** -> Dashboards pro, detailed metrics, i18n alignment.

### ✅ ERA 1-9: FOUNDATIONS & SUITE TRANSITION
- **Monorepo Architecture** (Phases 180-182).
- **Core Platform Shell** (v5.0.0).
- **SaaS Readiness** (Multitenancy, Quotas, Security Hardening).

---

## 🚀 VISION 2028: FRONTERAS TECNOLÓGICAS
- [ ] Federated Learning Consortium (patterns without PII sharing).
- [ ] Predictive Digital Twins (Operational & Financial simulation).
- [ ] Self-Healing Governance (AI autonomously audits and corrects policy violations).
