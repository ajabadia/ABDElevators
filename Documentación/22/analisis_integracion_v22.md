# Informe de Análisis Técnico: Serie v22 (Estrategia Industrial & Agentic RAG)

## 📊 Requerimientos vs Realidad de la App

| Área | Requerimiento (v22) | Estado Actual | Gap / Acción Requerida |
| :--- | :--- | :--- | :--- |
| **Resiliencia & Ingesta** | Gestión de DLQ y Stuck Jobs con Panel Admin. | Servicios en backend listos (StuckDetector, SHA-256 validation). | **FALTA UI**: Crear panel de control de Jobs y Dead Letter Queue. |
| **Observabilidad** | Auditoría Universal (AuditTrailSchema) e Ingest Tracer. | Implementado en Ingest/Assets (~90%). | **FALTA**: Extender a todas las operaciones administrativas (i18n, prompts). |
| **i18n & Errores** | Cero textos hardcoded y manejo `AppError` universal. | ~80%. Muchas APIs con errores genéricos. | **REFACTOR**: Migrar rutas legacy a `handleApiError` e internacionalizar mensajes. |
| **Workflows** | Diseñador visual y orquestación dinámica por LLM. | Motor FSM básico y servicios de tareas listos. | **EVOLUCIÓN**: Implementar `llmNode` y editor visual en `/admin/workflows`. |
| **Gobernanza API** | MFA obligatorio para operaciones sensibles. | `MfaService` listo, UI de usuarios con flags. | **ENFORCEMENT**: Middleware para bloquear accesos sensibles sin MFA activo. |
| **HITL (Checklists)** | Checklists dinámicas enlazadas a tareas de revisión. | `ChecklistConfig` y `HumanTaskHandler` funcionales. | **UI/UX**: Especializar el Inbox de tareas para mostrar checklists y propuestas de IA. |
| **Vertical Taller** | Flujo especializado: Operario -> Revisor con RAG de manuales. | Piezas base (RAG, Task Inbox) operativas. | **NEW FEATURE**: Pantalla de "Nuevo Pedido" con extractor de partes automáticos. |

## 🏗️ Evaluación de Impacto (App Clash Check)

- **Lógica Actual:** No hay choques críticos. El motor de workflows actual es extendible mediante metadatos en el esquema.
- **Base de Datos:** Requiere extensiones menores en `WorkflowDefinitionSchema` (campos `llmNode`, `decisionStrategy`) y `WorkflowTaskSchema` (campo `decision`, `chosenNextState`).
- **Stack:** Compatible 100% con Next.js 15, React 19 y MongoDB. No se requiere cambio de tecnología (LangGraph no es necesario por ahora, el FSM interno es suficiente).
- **Riesgos:** 
    - `[HIGH RISK]`: La latencia del "Stuck Detector" si no se gestiona vía Cron externo robusto.
    - `[TECHNICAL DEBT]`: Existe una "doble arquitectura" de ingesta (Scripts vs API Handler) que debe unificarse en la Fase 126.

## 🚀 Plan de Integración (Roadmap Updates)

### **Fase 126: Industrial Resilience & Dead Letter Zero**
- **126.1: Unified Error Handling**: Migración masiva a `AppError` + `handleApiError` + `i18n` strings.
- **126.2: Reliability Dashboard**: UI de gestión de DLQ e inspección de Jobs atascados.
- **126.3: Multi-tenant Audit**: Activación de `AuditTrailSchema` en toda la plataforma administrativa.

### **Fase 127: Agentic Orchestration & HITL Phase I**
- **127.1: Visual Workflow Editor**: Diseñador "low-code" para estados y transiciones en el admin.
- **127.2: LLM Router Implementation**: Integración de `llmNode` en el motor de estados.
- **127.3: MFA Guard**: Bloqueo de operaciones críticas por falta de MFA.

### **Fase 128: Workshop Vertical & Automated Compliance**
- **128.1: Workshop Order Screen**: Formulario especializado con subida de docs industrial.
- **128.2: RAG Parts Matcher**: Extractor automático de partes y búsqueda de manuales v2.
- **128.3: RAG Quality v2**: Enlace directo métricas -> trazas -> corrección de assets.
