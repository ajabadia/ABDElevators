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
| HYG-002 | `console.log(...)` o `logEvento` sin `correlationId` | Usar `await logEvento` incluyendo explícitamente un `correlationId` | Trazabilidad estructurada y cumplimiento Regla #4. |
| HYG-003 | Hardcoded limits (ej: `1000`, `1024*1024`) | Mover a constantes en `@/lib/constants.ts` o configuraciones de tenant. | Facilita el ajuste de SLAs y límites sin despliegues de código. |
| HYG-004 | Operación costosa sin monitoreo de performance | Envolver en `withSla(source, action, threshold, correlationId, fn)` | Permite detectar violaciones de performance y degradación de servicio (Fase 130.7). |
| HYG-005 | Uso de `db.collection(...)` directo en API | Migrar a `getTenantCollection` o `SecureCollection` | Vital para el aislamiento multi-tenant y Soft Delete (Regla de Oro #11). |
| HYG-006 | API Catch block sin estandarización | Usar `handleApiError(error, source, correlationId)` | Garantiza respuestas de error coherentes y logueo centralizado (Fase 130.2). |
| HYG-007 | Uso de `WorkflowEngine` (Legacy) | Migrar a `AIWorkflowEngine` o `CaseWorkflowEngine` | El motor monolítico está deprecado. Se debe usar el motor especializado (Fase 129.1). |
| HYG-008 | `: any` detectado en `src/lib`, `src/services` o APIs | Definir interface explícita o usar `unknown` (ERA 9 Zero-Any) | Viola Regla #1 estricta de ERA 8/9. |
| HYG-009 | Uso de `localStorage` / `sessionStorage` | Migrar a React Context o Cookies | Viola Regla #5 (Security/Vercel). |
| HYG-010 | Uso de `@/hooks/use-toast` | Migrar a `import { toast } from 'sonner'` | Duplicación de librerías UI. DECISIÓN ERA 8. |
| HYG-011 | Uso de `alert()` o `confirm()` | Migrar a `import { toast } from 'sonner'` con promesas o custom JSX | UX invasiva y bloqueante. Estandarización Fase 293. |
| HYG-012 | Tareas monolíticas pesadas en `/api` (>2s) | Migrar a orquestación asíncrona (BullMQ workers + Polling en UI) | Evita timeouts Serverless (Refactor Fase 292). |
| HYG-013 | Fetch o side-effects sin control de latencia | Aplicar patrón Zero-Leak (ERA 11: `isMounted` o `AbortController`) | Previene memory leaks y actualizaciones en componentes desmontados. |
| HYG-014 | Nuevas vistas o layouts disruptivos sin Feature Flag | Condicionar usando `NEXT_PUBLIC_ERA11_UX` o hook `useUxMode` | Fundamental en ERA 11 para coexistencia de versiones. |
| HYG-015 | Dotted keys en i18n que colisionan con objetos | Renombrar a snake_case (ej: `desc` en lugar de `.desc`) | Previene `TypeError: INSUFFICIENT_PATH` en `next-intl`. |
| HYG-016 | Uso de `t('label')` sin `t.has('label')` en Navigation | Envolver con `t.has()` o usar helper `getTranslation` | Evita que la UI rompa por claves faltantes en el Sidebar. |
| HYG-017 | "God Components" (Mezcla UI, Fetch, Lógica > 250 líneas) | Extraer lógica a Hooks, o dividir en Contenedor (datos) y Presentación (UI) | Violación de SRP detectada en auditoría (ej. `PromptsHubClient`). |
| HYG-018 | Strings mágicos definidos *inline* repetidamente | Mover a `consts.ts` o tipar con Enums / Uniones literales | Facilita mantención y minimiza errores tipográficos (ej. paths de middleware). |
| HYG-019 | Múltiples lógicas de data-fetching ad-hoc | Unificar bajo `useApiList` / `useApiItem` o Server Actions puros | Evita inconsistencia en manejo de errores y loading states. |
| HYG-020 | Operaciones DB en bucles sin uso de `JOIN/$lookup` (N+1 queries) | Modificar query para hacer fetching en batch antes o `$lookup` | Rendimiento crítico; degrada la plataforma con bases de datos grandes. |
| HYG-021 | Foreign Keys como `string` plano | Usar `EntityIdSchema` (Branded types) | Previene "Islas de Datos" e inconsistencia referencial (ERA 12). |
| HYG-022 | Uso de `forwardRef` en componentes nuevos | Pasar `ref` como prop directa | Estandarización React 19. |
| HYG-023 | Redis URL sin `rediss://` en prod | Forzar protocolo seguro y validar TLS | Seguridad de canal (Wave 4 Hardening). |


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
