---
name: hygiene-reviewer
description: Audita y corrige patrones de error recurrentes, deudas técnicas y violaciones de estándares de limpieza en el código.
---

# Hygiene Reviewer Skill

Este skill se encarga de identificar y resolver problemas de "higiene de código" que no siempre son detectados por el linter pero que degradan la mantenibilidad y seguridad de tipos del proyecto.

## Cuándo usar este skill
- Cuando se termine de implementar un nuevo endpoint o componente.
- Cuando el usuario pida "limpiar" o "revisar la calidad" de un archivo.
- Al detectar que se están repitiendo patrones de código inseguros o ineficientes.
- Como parte del ciclo de revisión de `app-full-reviewer`.

## Inputs necesarios
- **TargetFile**: Ruta absoluta del archivo a auditar.

## Workflow
1. **Escaneo de Patrones**: Busca en el archivo las firmas de errores recurrentes definidas en la sección de "Biblioteca de Patrones".
2. **Propuesta de Mejora**: Genera un plan de refactorización para cada hallazgo basado en la solución estándar.
3. **Ejecución de Limpieza**: Aplica los cambios utilizando herramientas de edición de archivos.
4. **Verificación**: Revisa que no queden rastros del patrón original y que el archivo compile sin errores de tipo.

## Biblioteca de Patrones Recurrentes

| ID | Patrón (Symptom) | Solución Estándar | Razón |
|----|------------------|-------------------|-------|
| HYG-001 | `(session.user as any).property` | `session.user.property` (requiere actualización previa de `next-auth.d.ts`) | El casting a `any` anula la seguridad de tipos de TypeScript y oculta errores de propiedad inexistente. |
| HYG-002 | `console.log(...)` en código de producción | Reemplazar por `await logEvento({ level: 'DEBUG', ... })` | El logging debe ser estructurado y persistente para auditoría en Vercel/MongoDB. |
| HYG-003 | Hardcoded limits (ej: `1000`, `1024*1024`) | Mover a constantes en `@/lib/constants.ts` o configuraciones de tenant. | Facilita el ajuste de SLAs y límites sin despliegues de código. |

## Instrucciones Específicas: HYG-001 (Session Type Safety)
Si detectas un cast a `any` en la sesión del usuario:
1. Verifica si la propiedad ya existe en `src/types/next-auth.d.ts`.
2. Si no existe, agrégala primero siguiendo el estándar de `IndustryType`.
3. Elimina el cast `as any` y usa la propiedad directamente.

## Output (formato exacto)
Devuelve un informe de higiene:

### 🧹 Informe de Higiene: [filename]
- **Hallazgos detectados**: [Número]
- **Patrones corregidos**: [Lista de IDs]

| Línea | Patrón | Acción realizada | Estado |
|-------|--------|------------------|--------|
| [L]   | [ID]   | [Refactor]       | [Fix / Pending] |

## Manejo de Errores
- Si un cambio de tipo genera errores colaterales, detente y pide aclaración sobre el modelo de datos.
- Nunca borres código de lógica de negocio, solo refactoriza la estructura o el tipado.
