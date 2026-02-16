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

## Workflow de Implementación

### 1) Definición del Master Fallback
Añadir la constante al objeto `PROMPTS` en `src/lib/prompts.ts`.
```typescript
// src/lib/prompts.ts
export const PROMPTS = {
    MI_NUEVO_PROMPT: `Instrucciones maestras aquí... {{variable}}`
}
```

### 2) Consumo en el Servicio
Implementar el bloque `try/catch` con renderizado manual para el fallback.

```typescript
// src/services/mi-servicio.ts
let renderedPrompt: string;
let modelName = 'gemini-1.5-flash';

try {
    const { text, model } = await PromptService.getRenderedPrompt(
        'MI_NUEVO_PROMPT',
        { variable: valor },
        tenantId
    );
    renderedPrompt = text;
    modelName = model;
} catch (err) {
    console.warn(`[MI_SERVICIO] ⚠️ Fallback to Master Prompt:`, err);
    renderedPrompt = PROMPTS.MI_NUEVO_PROMPT.replace('{{variable}}', valor);
}

const response = await callGemini(renderedPrompt, tenantId, correlationId, { model: modelName });
```

### 3) Tipado de Payloads (Fase 130.5)
Asegurar que los datos extraídos o analizados por la IA sigan las interfaces estándar de la plataforma para garantizar la interoperabilidad entre motores.

- ✅ **OBLIGATORIO**: Uso de tipos desde `@/types/ai` (`AIModelFinding`, `AIRiskFinding`, `AIGraphPattern`).
- ❌ **RED FLAG**: Uso de `any[]` para almacenar resultados de motores agénticos.

## Checklist de Auditoría
- [ ] ¿El prompt tiene una entrada en `PromptService`? (Clave única)
- [ ] ¿Existe una constante equivalente en `src/lib/prompts.ts`?
- [ ] ¿El servicio usa `try/catch` envolviendo el `getRenderedPrompt`?
- [ ] ¿Se realiza el reemplazo manual de variables en la rama del `catch`?
- [ ] ¿Se loguea un aviso cuando ocurre el fallback para que el admin sepa que debe crear el prompt en la BD?
- [ ] ¿El payload de resultado usa los tipos de `src/types/ai.ts`? (Fase 130.5)

## Output Esperado
Al auditar, genera un informe con:
1. **Estado Actual**: Fragmento de código problemático.
2. **Corrección Sugerida**: Fragmento corregido siguiendo el patrón.
3. **Acciones en `prompts.ts`**: Texto exacto a añadir.
