---
name: app-full-reviewer
description: Ejecuta un ciclo completo de auditoría (UI/UX, i18n/a11y, Permisos y Seguridad Técnica) sobre una parte específica de la aplicación.
---
# App Full Reviewer Skill (Meta-Auditor)

## Cuándo usar este skill

- Cuando el usuario pida un "repaso completo" o "revisión general" de una nueva feature o página.
- Antes de despliegues importantes a producción.
- Para garantizar que una pantalla cumple con todos los estándares del proyecto (Estilo, Accesibilidad, Idioma, Seguridad e Industrial Performance).

## Inputs necesarios

- **Ruta del archivo o carpeta**: Lo que se quiere revisar.

## Workflow (Route-Aware)

Antes de iniciar, determina si el archivo pertenece a **Área Pública (Marketing)** o **Área Privada (App/Admin)**:

- **Área Pública**: Rutas como `/`, `/about`, `/terms`, `/privacy`, `/pricing`, `/accessibility`, componentes en `src/components/landing`.
- **Área Privada**: Rutas bajo `/work`, `/intelligence`, `/agents`, `/insights`, `/settings`, `/dashboard`, componentes en `src/components/shared`, `src/components/navigation`, `src/components/ui`.


### Fase 1: Auditoría de Estilo

- **Área Privada**: Usa skill `ui-styling` (Consistencia, Dashboards, Zustand) y `hub-dashboard-architect` (Reducción de navbars densas por fichas/cards).
- **Área Pública**: Usa skill `marketing-styling` (Impacto visual, Gradients, Conversión).
- En ambos casos: Usa skill `web-design-guidelines`

### Fase 2: Auditoría de Internacionalización y Accesibilidad (Skill: i18n-a11y-auditor)

1. Detecta textos hardcodeados y garantiza sincronización ES/EN.
2. Revisa semántica HTML, ARIA labels y compatibilidad con lectores de pantalla.
3. **Público Solo**: Verifica metadatos SEO (Title, Description).

### Fase 2.5: Auditoría de Feedback Visual (Skill: toast-notifier-auditor)

1. Escanea interacciones asíncronas (con API/Server Actions).
2. Verifica si existe feedback visual inmediato (Toasts) para éxito y error.
3. Implementa `useToast` si falta.

### Fase 3: Auditoría de Seguridad Integral

Combina la lógica de permisos con la robustez técnica:

1. **Permisos (Skill: guardian-auditor)**:
   - **Área Privada**: Verifica `enforcePermission`, `requireRole` (incluyendo nuevos roles V3) y aislamiento de tenant.
2. **Seguridad Técnica (Skill: security-auditor)**:
   - **Regla de Oro #11**: Verifica el uso de `SecureCollection` / `getTenantCollection` para aislamiento total. ❌ **RED FLAG**: `db.collection()` directo.
   - **Inyecciones**: Verifica validación Zod en todos los inputs.
   - **Privacidad**: Verifica encriptación de campos sensibles y máscara de PII.
   - **Infra**: Verifica rate limiting y headers de seguridad (CSP).
3. **Área Pública**: Verifica que NO haya exposición de datos internos, APIs administrativas o PII (Bypass autorizado).

### Fase 3.5: Auditoría de Consistencia de Base de Datos (Skill: db-consistency-auditor) [CONDICIONAL]

**Ejecutar comando `grep -E "getTenantCollection|connectDB" <archivo>` para comprobar si aplica:**

1. Verifica que las colecciones de identidad (`users`, `tenants`) apanten a `AUTH`.
2. Verifica que los logs (`usage_logs`) apunten a `LOGS`.
3. Valida que no haya fugas de datos entre clústeres.

### Fase 3.6: Auditoría de Lazy Loading en Listas (Skill: lazy-loading-list-auditor) [CONDICIONAL]

**Ejecutar comando `grep -E "useApiList|useApiItem" <archivo>` para comprobar si aplica:**

1. Verifica si la lista carga > 50 items inicialmente sin filtros.
2. Evalúa si implementa lazy loading con estado vacío inicial.
3. Valida que existan filtros apropiados (categoría, namespace, tipo, etc.).
4. Confirma que `autoFetch` esté condicionado a filtros activos.
5. Verifica que haya empty state guidance para el usuario.

### Fase 4: Gobernanza de Prompts (Skill: prompt-governance) [CONDICIONAL]

**Ejecutar comando `grep -E "PromptService|callGemini" <archivo>` para comprobar si aplica:**

1. Verifica el uso de la arquitectura de dos capas (DB + Master Fallback).
2. Asegura que los prompts sigan la Regla de Oro #4 (Trazabilidad con `correlationId`).
3. Valida que el prompt esté centralizado y no hardcodeado.
4. **Tipado IA (Fase 130.5)**: Verifica que los payloads de IA usen tipos desde `@/types/ai`.

### Fase 4.5: Gobernanza Dinámica de Modelos IA (Skill: ai-governance-migrator) [CONDICIONAL]

**Ejecutar comando `grep -iE "Gemini|gemini-|getFunctionalModel" <archivo>` para comprobar si aplica:**

1. Verifica que no haya strings hardcodeados con versiones antiguas (`Gemini 1.5`, `Gemini 2.0`, `gemini-2.0-flash-exp`, etc.).
2. En llamadas backend, exige que el modelo provenga de `AiModelManager.getFunctionalModel(...)` o se herede dinámicamente de una configuración.
3. Aplica refactorización reemplazando valores estáticos.

### Paso 5: Sidekick Context Coverage (Fase 360)
- **Context Registry**: Validar que la ruta (y sus parámetros dinámicos) existen en `SidekickContextService.ts` (`ROUTE_CONTEXT_MAP`).
- **Completitud de Prompt**: Asegurar que el `llmDescription` para la ruta explica claramente qué hace la vista y qué KPIs maneja, sin depender de textos genéricos.

### Paso 6: Informe de Auditoría de Higiene y Deuda Técnica (Skill: hygiene-reviewer)

1. Escanea patrones de error recurrentes.
2. **Workflows (Fase 129.1)**: Verifica migración de `WorkflowEngine` legacy a especializados (`AI`/`Case`).
3. **Errors (Fase 130.2)**: Verifica el uso de `handleApiError` en catches.
4. Aplica refactorizaciones automáticas.

### Fase 5.5: Auditoría de Rendimiento Enterprise (Skill: react-best-practices)

1. Escanea "waterfalls" de promesas y promueve paralelismo.
2. Verifica el uso óptimo de Server Components vs Client Components.
3. Evalúa oportunidades de `next/dynamic` y optimización de bundle.
4. Revisa eficiencia de re-renders y uso de hooks de performance.

### Fase 5.6: Auditoría de Arquitectura de Componentes (Skill: composition-patterns)

1. Detecta componentes con proliferación de props booleanas.
2. Sugiere refactorización a compound components donde aplique.
3. Valida el uso de composición sobre render props.
4. Revisa el desacoplamiento de implementación en providers.

### Fase 5.7: Auditoría de Web Design Guidelines (Skill: web-design-guidelines)

**Solo para Área Pública (Marketing) y componentes de UI críticos:**

1. Valida accesibilidad (aria-labels, semantic HTML, keyboard handlers).
2. Revisa estados de foco y patrones de navegación.
3. Verifica formularios (autocomplete, validation, error handling).
4. Audita animaciones (prefers-reduced-motion, compositor-friendly).
5. Revisa tipografía, imágenes y rendimiento de UI.

### Fase 6: Sincronización con el Mapa de Aplicación (map.md)

1. Comprueba si la ruta o funcionalidad revisada está presente en `map.md`.
2. Si **no está** y es una ruta pública, autenticada, administrativa o de API, debes **agregarla** siguiendo el formato de la tabla correspondiente.
3. Actualiza (o agrega) la columna **Última Revisión** con la fecha y hora actual de la ejecución de esta skill.

## Registro de Ejecución (Checklist)

- [ ] Identificada Área (Pública vs Privada)
- [ ] Ejecutada Auditoría UI/Styling (ui-styling O marketing-styling)
- [ ] Ejecutada Auditoría Hub/Dashboard Architect (hub-dashboard-architect, para Área Privada)
- [ ] Ejecutada Auditoría i18n/a11y (+ SEO si es público)
- [ ] Ejecutada Auditoría Feedback Visual (toast-notifier-auditor)
- [ ] Ejecutada Auditoría Seguridad Integral (guardian-auditor + security-auditor)
- [ ] Ejecutada Auditoría de Prompts (Solo si aplica)
- [ ] Ejecutada Gobernanza de IA Dinámica (ai-governance-migrator, si aplica)
- [ ] Ejecutada Auditoría de Consistencia DB (Solo si aplica)
- [ ] Ejecutada Auditoría de Lazy Loading (Solo si hay listas grandes)
- [ ] Ejecutada Auditoría de Higiene (Technical Debt)
- [ ] Ejecutada Auditoría de Rendimiento (react-best-practices)
- [ ] Ejecutada Auditoría de Composición (composition-patterns)
- [ ] Ejecutada Auditoría de Web Guidelines (web-design-guidelines, si aplica)
- [ ] Sincronizado map.md (Agregado/Actualizado con timestamp)

## Output (formato exacto)

Presenta un **Dashboard de Calidad** consolidado:

### 🏆 Resumen de Calidad: [Nombre del Componente]

| Categoría     | Calificación | Hallazgos Críticos |
| -------------- | ------------- | ------------------- |
| UI / UX        | A-F           | [X]                 |
| Hub Archi      | A-F / N/A     | [X]                 |
| i18n/a11y      | A-F           | [X]                 |
| Seguridad      | A-F           | [X]                 |
| Prompts        | A-F / N/A     | [X]                 |
| IA Gobernanza  | A-F / N/A     | [X]                 |
| DB Cluster     | A-F / N/A     | [X]                 |
| Higiene        | A-F           | [X]                 |
| Performance    | A-F           | [X]                 |
| Composition    | A-F           | [X]                 |
| Web Guidelines | A-F / N/A     | [X]                 |

### 📝 Plan de Acción Integrado

Lista priorizada de cambios necesarios mezclando las disciplinas.

### 🛠️ Aplicación de Cambios

Propuesta de refactorización final que resuelva todos los puntos detectados.

## Instrucciones y Reglas

- **ORQUESTACIÓN**: Debes llamar mentalmente o explícitamente a las instrucciones de las otras skills (`ui-styling/marketing-styling`, `i18n-a11y`, `guardian+security`, `prompt-governance`, `hygiene`).
- **PRIORIDAD**: La seguridad siempre tiene prioridad máxima si se detecta una vulnerabilidad.
- **COHERENCIA**: Asegura que una mejora de UI no rompa la accesibilidad.
