---
name: prompt-governance
description: Audita y estandariza la gestión de prompts dinámicos, asegurando el uso de PromptService con fallbacks maestros en lib/prompts.ts y manejo de errores robusto.
---
# Prompt Governance Skill

Este skill asegura que todos los servicios de IA de la plataforma ABDElevators sigan el patrón de "Prompt de Dos Capas": una capa dinámica en Base de Datos y una capa de seguridad (fallback) en código.

## Cuándo usar este skill
- Al crear un nuevo servicio que consuma modelos LLM (Gemini).
- Durante auditorías de servicios de IA existentes.
- Cuando se detectan fallos en producción por "Prompt Not Found".
- Al migrar prompts hardcodeados al sistema centralizado.

## Principios de Diseño
1. **Prioridad Dinámica**: El prompt debe cargarse desde `PromptService.getRenderedPrompt` para permitir ajustes en caliente por el administrador.
2. **Resiliencia Total**: Todo servicio DEBE tener una constante en `src/lib/prompts.ts` que actúe como "Master Fallback" si la BD falla o el prompt no existe.
3. **Manejo de Errores Silencioso**: El sistema debe registrar un aviso (`console.warn` / `logEvento`) pero continuar operando usando el fallback.
4. **Registro Único de Modelos**: Ningún componente o servicio debe usar strings hardcodeadas (ej: "gemini-1.5-pro"). Se debe usar EXCLUSIVAMENTE el registro en `src/lib/constants/ai-models.ts`.

## Checklist de Auditoría
- [ ] ¿El prompt tiene una entrada en `PromptService`? (Clave única)
- [ ] ¿Existe una constante equivalente en `src/lib/prompts.ts`?
- [ ] ¿El servicio usa `try/catch` envolviendo el `getRenderedPrompt`?
- [ ] ¿Se realiza el reemplazo manual de variables en la rama del `catch`?
- [ ] ¿Se loguea un aviso cuando ocurre el fallback?
- [ ] ¿El payload de resultado usa los tipos de `src/types/ai.ts`? (Fase 130.5)
- [ ] ¿El modelo utilizado está definido en `src/lib/constants/ai-models.ts`?
- [ ] ¿Los dropdowns o selectores de modelos mapean sobre la constante `AI_MODELS`?

## Flujo de Creación/Modificación
Al crear una nueva parte de la aplicación que interactúe con IA:
1. **Verificar**: Consultar `src/lib/constants/ai-models.ts` para ver qué modelos están habilitados.
2. **Implementar**: Usar `AI_MODELS` para cualquier selector de UI.
3. **Mapear**: Asegurar que `src/lib/gemini-client.ts` (`mapModelName`) reconozca el ID del modelo para evitar fallbacks inesperados.

## Output Esperado
Al auditar, genera un informe con:
1. **Estado Actual**: Fragmento de código problemático.
2. **Corrección Sugerida**: Fragmento corregido siguiendo el patrón.
3. **Acciones en `prompts.ts`**: Texto exacto a añadir.
