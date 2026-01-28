---
name: roadmap-manager
description: Gestiona y actualiza el ROADMAP_MASTER.md, documentando avances, nuevas funcionalidades y deprecando elementos obsoletos sin borrar el historial.
---
# Roadmap Manager Skill

## Cuándo usar este skill
- Cuando se finalice una fase de desarrollo (al terminar un `walkthrough.md`).
- Cuando el usuario solicite añadir nuevas funcionalidades a futuro.
- Cuando se decida abandonar o sustituir una funcionalidad existente (deprecación).
- Al iniciar una nueva sesión de desarrollo para sincronizar el estado global.

## Inputs necesarios
- `ROADMAP_MASTER.md`: El documento fuente de verdad.
- `walkthrough.md` (o historial reciente): Para identificar qué se ha completado.
- Instrucciones del usuario sobre nuevas ideas o cambios de dirección.

## Workflow

### 1. Análisis de Estado
- Lee el `ROADMAP_MASTER.md` actual.
- Revisa los últimos cambios en el código y el archivo `walkthrough.md` más reciente.
- Identifica qué hitos se han cumplido y cuáles han cambiado de prioridad.

### 2. Actualización de Avances
- Marca como completados `[x]` los hitos realizados.
- Actualiza la sección de **Status & Metrics** (Global Progress, Recent Ship, Current Focus).
- Si un hito se ha completado parcialmente, añade sub-pasos detallados.

### 3. Gestión de Nuevas Funcionalidades
- Añade las nuevas propuestas del usuario en la sección correspondiente (`Upcoming & To-Do` o una nueva `FASE`).
- Asegúrate de asignarles un objetivo claro y una lista de hitos iniciales.

### 4. Deprecación de Funcionalidades (REGLA DE ORO)
- **NUNCA BORRES INFORMACIÓN HISTÓRICA**.
- Si una funcionalidad, plan o fase ya no se va a realizar o ha sido sustituida:
    1. Cámbiala de su sección actual.
    2. Muévela a la sección `## 🗑️ DEPRECATED & ARCHIVED`.
    3. Añade metadatos: `[DEPRECADO: AAAA-MM-DD]`, `[MOTIVO: descripción breve]`.
    4. Si hay una nueva funcionalidad que la sustituye, añade un link o referencia.

### 5. Consolidación
- Verifica que el documento sigue siendo legible y está bien estructurado.
- Firma la actualización con la fecha actual y la versión si aplica.

## Output (formato exacto)
- `ROADMAP_MASTER.md` actualizado.
- Un breve resumen para el usuario de qué ha cambiado (Nuevos hitos, Completados, Deprecados).

## Sección de Deprecados (Plantilla)
```markdown
## 🗑️ DEPRECATED & ARCHIVED
Listado de funcionalidades o planes que han sido descartados o sustituidos.

- ~~[FASE X: Nombre Original]~~
    - **Fecha:** 2026-01-28
    - **Motivo:** Sustituido por la arquitectura de microservicios en Fase 42.
    - **Estado:** Histórico conservado.
```
