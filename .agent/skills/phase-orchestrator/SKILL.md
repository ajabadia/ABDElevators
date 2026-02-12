---
name: phase-orchestrator
description: Orquesta el inicio de nuevas fases o adaptaciones, activando los skills de calidad, arquitectura y diseño necesarios para garantizar el cumplimiento de los estándares de ABD RAG Platform.
---

# 🚀 Phase Orchestrator

## Cuándo usar este skill
- Al inicio de una nueva **Fase** o **Subfase** del proyecto.
- Cuando se solicita una **adaptación significativa** de una funcionalidad existente.
- Antes de generar un `implementation_plan.md` complejo.
- Para asegurar que no se ignoran reglas críticas (`rules.md`) o skills especializados.

## Inputs necesarios
- **Descripción de la Fase**: Qué se quiere lograr.
- **Tipo de Intervención**: Nueva funcionalidad, Refactorización, Hotfix o UI/UX.
- **Contexto del Roadmap**: En qué punto del `ROADMAP_MASTER.md` nos encontramos.

## Workflow

### Fase 0: Auditoría de Estado y Juicio Arquitectónico (CRÍTICO)
Antes de planificar, el agente DEBE actuar como un Arquitecto Senior:
1) **Detección de Duplicados**: Investigar exhaustivamente el código y KIs para ver si lo solicitado ya existe (parcial o totalmente) para evitar redundancias.
2) **Validación de Retrocompatibilidad**: Evaluar si los cambios propuestos rompen funcionalidades, esquemas de DB o flujos existentes.
3) **Preservación de Excelencia**: Si existe una implementación previa superior o más moderna que la solicitada, se debe proponer mantenerla o integrarla, NUNCA degradarla.
4) **Prevención de Regresiones**: Detectar si la petición es "antigua" o ha sido superada por avances recientes en el Roadmap o arquitectura global.

### Fase 1: Carga de Contexto y Reglas
1) Cargar el contexto del proyecto usando el skill `project-context-loader`.
2) Leer y memorizar las reglas no negociables de `rules.md`.
3) Consultar el `ROADMAP_MASTER.md` para situar la tarea en el tiempo y dependencias.

### Fase 2: Selección de Herramientas (Skills)
4) Identificar los skills necesarios según el tipo de trabajo:
   - **Nuevos archivos/Lógica**: Obligatorio usar `code-scaffolder`.
   - **Modificaciones/Auditoría**: Obligatorio usar `code-quality-auditor`.
   - **Frontend/UI**: Activar `web-design-guidelines`, `ui-styling`, `composition-patterns` y `toast-notifier-auditor`.
   - **Internacionalización/Accesibilidad**: Activar `i18n-a11y-auditor`.
   - **Base de Datos/Listas**: Activar `db-consistency-auditor` y `lazy-loading-list-auditor`.
   - **Seguridad/Permisos**: Activar `guardian-auditor` y `security-auditor`.
   - **Mantenimiento/Deuda**: Activar `hygiene-reviewer` y `error-resolution-handler`.
   - **Gestión de Roadmap**: Activar `roadmap-manager` y `roadmap-architect-analyst`.
   - **IA/LLM**: Activar `prompt-governance`.

### Fase 3: Planificación Estándar
5) Crear el `implementation_plan.md` integrando explícitamente las directrices de los skills seleccionados.
6) Validar que el plan incluye una sección de "Cumplimiento de Estándares" citando los skills aplicados.
7) Usar `app-full-reviewer` al finalizar la ejecución si se trata de un módulo completo.

## Instrucciones Críticas
- **JUICIO SOBRE OBEDIENCIA**: Si una instrucción del usuario supone un paso atrás técnico, una regresión de calidad o rompe la retrocompatibilidad, el agente DEBE advertir al usuario con una comparativa técnica de "Antes vs Después" y pedir confirmación antes de proceder.
- **REGLA DE ORO**: Si detectas que se van a crear nuevos componentes de UI, debes advertir sobre el uso de `composition-patterns` (React 19) antes de escribir una sola línea.
- **VALIDACIÓN PREVIA**: Antes de ejecutar cualquier comando `run_command`, verifica con `rules.md` que no se está violando ninguna restricción de seguridad o entorno.
- **TRUCO TURBO**: Si el usuario ha concedido el "autonomous mode" (Memoria Global), este skill debe automatizar la compilación y el fix de lints al final de cada subfase.

## Output (Formato)
Siempre devuelve un resumen de activación al inicio de la fase:
```markdown
### 🛠️ Entorno de Trabajo Activado: [Nombre de la Fase]
- **Skills Activos**: [Lista de skills]
- **Reglas Críticas**: [Top 3 reglas de rules.md más relevantes para esta tarea]
- **Roadmap Ref**: [Hito del Roadmap]
---
[Implementation Plan inicial...]
```

## Manejo de Errores
- Si olvidas un skill obligatorio, detente y pide perdón, indica el skill omitido y re-genera el plan.
- Si hay ambigüedad entre dos skills (ej. auditores solapados), prioriza siempre el que sea más específico a la tarea actual.
