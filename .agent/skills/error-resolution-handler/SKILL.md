---
name: error-resolution-handler
description: Skill para gestionar y resolver errores recurrentes consultando una base de conocimientos (KB).
---

# Error Resolution Handler

## Cuándo usar este skill
- Cuando el usuario reporte un error de consola, runtime o build.
- Antes de investigar desde cero, para verificar si ya existe una solución conocida.
- Para documentar nuevas soluciones a errores no registrados.

## Inputs necesarios
- **Error Type**: (e.g., Console Error, Runtime Error)
- **Error Message**: El mensaje exacto o patrón del error.
- **Context**: Archivo afectado o stack trace relevante.

## Workflow
1.  **Buscar**: Consulta `recursos/known_errors.md` buscando el mensaje de error o palabras clave.
2.  **Si existe solución**:
    - Aplica la solución descrita.
    - **Incrementa el contador**: Actualiza `recursos/error_stats.json` sumando +1 al tipo de error correspondiente.
3.  **Si NO existe solución**:
    - Investiga y soluciona el problema usando tus herramientas estándar.
    - **Registrar**: Añade una nueva entrada en `recursos/known_errors.md` con:
        - Título del Error
        - Patrón de búsqueda (Regex o String)
        - Causa raíz
        - Solución paso a paso
    - **Inicializar contador**: Añade la entrada en `recursos/error_stats.json` con valor 1.

## Instrucciones de Actualización
- Mantén `known_errors.md` limpio y estructurado.
- Usa claves cortas y descriptivas en `error_stats.json`.

## Recursos
- **Base de Conocimientos**: `recursos/known_errors.md`
- **Estadísticas**: `recursos/error_stats.json`
- **Scripts de Solución**: `scripts/` (e.g., `force-sync-i18n.ts`)
