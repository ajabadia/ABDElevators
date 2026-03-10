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

## Estándares de UI de Error (Uncodixify - Normal UI)
Todo componente de error debe seguir estas reglas:
- **Radios**: Máximo 12px (`rounded-xl`). Sin formas de píldora.
- **Colores**: Evitar degradados "AI-style". Usar colores sólidos de marca con opacidad (e.g., `bg-red-50/10` con border `border-red-500/20`).
- **Integración de Soporte**:
    - Usar `SupportErrorState` para errores bloqueantes.
    - **Copy Technical Details**: El componente debe ofrecer un botón para copiar los detalles técnicos (Message, Digest, URL, Timestamp) al portapapeles.
    - **Auto-populate & Context**: Al abrir el diálogo de ticket de soporte, la descripción debe estar pre-rellenada con el contexto técnico del error. Es crítico preservar el `Digest` y la `URL` para el equipo de infraestructura.

## Workflow de Resolución
1.  **Buscar**: Consulta `recursos/known_errors.md` buscando el mensaje de error o palabras clave.
2.  **Si existe solución**:
    - Aplica la solución descrita.
    - **Incrementa el contador**: Actualiza `recursos/error_stats.json` sumando +1 al tipo de error correspondiente.
3.  **Si NO existe solución**:
    - Investiga y soluciona el problema usando tus herramientas estándar.
    - **Validar UI**: Asegura que el estado de error use `SupportErrorState` y cumpla Uncodixify.
    - **Registrar**: Añade una nueva entrada en `recursos/known_errors.md`.

## Recursos
- **Base de Conocimientos**: `recursos/known_errors.md`
- **Estadísticas**: `recursos/error_stats.json`
- **UI Base**: `src/components/shared/SupportErrorState.tsx`
- **Scripts de Solución Era 11**: 
    - `scripts/sync-translations.ts` (Sincronización de i18n a DB)
    - `scripts/cleanup-dotted-keys.ts` (Limpieza de colisiones de objetos y strings en i18n)

