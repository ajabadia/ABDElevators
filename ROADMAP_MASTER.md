# ROADMAP_MASTER – Era 11: Cognitive & Hierarchical Intelligence

## 🌅 ERA 11: HIERARCHICAL RAG & COGNITIVE ARCHITECTURE (Q2 2026)

**Objetivo:** Evolucionar hacia un sistema de RAG jerárquico (MemoRAG style) con observabilidad profunda y automatización de cumplimiento industrial.

### ✅ FASE 305: Hierarchical RAG Foundation (Marzo 2026)
- **Meta:** Superar las limitaciones de búsqueda plana de fragmentos mediante perfiles de documentos y secciones.
- [x] **Data Model v2**: Implementar colecciones `doc_profiles` y `doc_sections`.
- [x] **Hierarchical Indexing**: Nuevo pipeline de ingesta que genera resúmenes y embeddings en tres niveles (Doc, Sección, Fragmento).
- [x] **Structural Segmentation**: Segmentación inteligente de PDFs basada en jerarquía semántica e integración en UI/Trailing.

### 🔍 FASE 306: Cognitive Retrieval Engine
- **Meta:** Implementar el motor de búsqueda jerárquica con pre-procesamiento de consultas.
- [ ] **Tiered Discovery**: Búsqueda en cascada (Profile -> Section -> Chunk) para maximizar relevancia y minimizar ruido.
- [ ] **Query Normalization**: Normalización y traducción automática de consultas antes de la búsqueda.
- [ ] **Context Orchestration**: Constructor de contexto inteligente ajustado a presupuestos de tokens.

### 🛡️ FASE 307: Reliability & Quality (RagJudge)
- **Meta:** Implementar "LLM as a Judge" para garantizar la fiabilidad industrial de las respuestas.
- [ ] **RagJudge Service**: Evaluación automática de *Faithfulness*, *Relevance* y *Precision*.
- [ ] **Causal Analytics**: Clasificación de fallos (Alucinación vs. Mala Recuperación).
- [ ] **Reliability Dashboard**: Visualización de *Hallucination Score* y KPIs de fiabilidad para el COO.

### 🏭 FASE 308: Universal Domain Intelligence
- **Meta:** Generalizar la inteligencia de cumplimiento industrial (Ref: Elevator Order Case).
- [ ] **Domain Linker Service**: Vincular entidades dinámicas (Pedidos, Activos) con activos de conocimiento de forma automática.
- [ ] **Actionable Assistants**: Generación dinámica de guías de montaje y checklists basados en documentación técnica.
- [ ] **Compliance Hub**: Trazabilidad completa de "Documento -> Instrucción -> Ejecución -> Verificación".

---

## 📜 History & Archived Milestones

### ✅ ERA 11: COGNITIVE & HIERARCHICAL (IN PROGRESS)
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
