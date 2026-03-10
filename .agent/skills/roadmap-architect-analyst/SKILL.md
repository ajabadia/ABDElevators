---
name: roadmap-architect-analyst
description: Analiza documentación técnica (txt, docx, pdf, md), evalúa su impacto y viabilidad en la arquitectura de la app, y actualiza el ROADMAP_MASTER.md con planes detallados y referencias.
---
# Roadmap Architect Analyst

## Cuándo usar este skill

- Al recibir nueva documentación técnica o requerimientos en una carpeta de entrada (ej: especificaciones de clientes, manuales, normativas).
- Cuando sea necesario integrar nuevas funcionalidades externas o especificaciones técnicas en el roadmap del proyecto.
- Al evaluar si nuevos desarrollos implican deprecar funcionalidades existentes.

## Inputs necesarios

- **Ruta de la carpeta/archivos**: Ubicación de los documentos a procesar.
- **ROADMAP_MASTER.md**: Archivo principal para registro y seguimiento.
- **Contexto de la Aplicación**: Conocimiento de la arquitectura actual y stack tecnológico, referenciando `ERA_11_ARCHITECTURE.md`.


## Workflow

### Fase 1: Ingesta y Lectura Estratégica

1) **Descubrimiento**: Listar todos los archivos en la ruta proporcionada.
2) **Estrategia de Lectura**:
   - **.md / .txt**: Leer directamente con `view_file`.
   - **.pdf / .docx**: Intentar extracción de texto mediante herramientas disponibles o scripts en `scripts/`. Si no es posible, solicitar al usuario una versión en texto plano o usar `read_url_content` si están alojados externamente.
3) **Consolidación**: Crear un resumen ejecutivo del contenido extraído, citando la fuente de cada pieza de información.

### Fase 2: Análisis Crítico y Evaluación

1) **Validación**: Comprobar la coherencia interna de la información recibida.
2) **Evaluación de Impacto (App Clash)**:
   - ¿Choca con la lógica actual?
   - ¿Requiere cambios en el esquema de Base de Datos?
   - ¿Es compatible con el stack (Next.js 15, React 19, MongoDB)?
3) **Viabilidad y Riesgo**:
   - ¿Introduce deuda técnica significativa?
   - ¿Conviene implementar ahora o en una fase posterior?
   - Marcar riesgos con `[HIGH RISK]` o `[TECHNICAL DEBT]` según corresponda.

### Fase 3: Planificación Maestra (Roadmap Updates)

1) **Plan Detallado**: Desglosar la implementación en pasos accionables, hitos y sub-tareas.
2) **Actualización de ROADMAP_MASTER.md**:
   - Usar la skill `roadmap-manager` para coordinar los cambios.
   - **Deprecación**: Si el nuevo plan reemplaza algo existente, mover lo antiguo a la sección `🗑️ DEPRECATED & ARCHIVED`. NUNCA borrar.
   - **Fusión**: Si hay tareas pendientes que coinciden con el nuevo desarrollo, fusionarlas para evitar duplicidad.
3) **Trazabilidad**: En cada entrada del roadmap, incluir enlaces o referencias a los archivos originales para ahorrar contexto en futuras sesiones.

## Instrucciones y Reglas

- **Integridad Histórica**: El `ROADMAP_MASTER.md` es la fuente de verdad. No elimines información del pasado.
- **Referencias de Archivo**: Usa rutas claras (procura que sean relativas al root del proyecto) para los documentos analizados.
- **Colaboración**: Si el análisis revela dudas críticas, no estás de acuerdo con lo que dice, DETENER el workflow y preguntar al usuario antes de actualizar el roadmap.

## Output (formato exacto)

1) **Informe de Análisis Técnico**: Tabla comparativa de Requerimientos vs Realidad de la App.
2) **Plan de Integración**: Desglose de tareas listo para ser insertado en el roadmap.
3) **Confirmación de Sincronización**: Resumen de cambios realizados en el `ROADMAP_MASTER.md` y archivos relacionados (`map.md`, etc.).

## Manejo de Errores

- Si un archivo está corrupto o es ilegible: Loggear el error, notificar al usuario y continuar con el resto si es posible.
- Si hay ambigüedad extrema en los requerimientos: Proponer dos caminos posibles y esperar confirmación del usuario.
