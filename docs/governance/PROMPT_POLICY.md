# Política de Gobernanza de Prompts

Este documento define el ciclo de vida y las reglas operativas para la gestión de prompts y modelos de IA.

## 1. Entidades de Datos
- **Prompt**: El estado "vivo" de un prompt para un tenant específico.
- **PromptVersion**: Historial inmutable de cada cambio. Incluye `changedBy`, `changeReason` y metadatos de entorno.

## 2. Ciclo de Vida del Prompt
Los prompts deben seguir estos estados obligatorios:
1. `DRAFT`: Edición inicial y pruebas locales.
2. `PENDINGREVIEW`: Listo para validación por parte del Domain Expert o AI Governance Lead.
3. `PUBLISHED`: Versión oficial activa para el tráfico de producción.
4. `FLAGGED / REJECTED`: Versiones con problemas detectados o descartadas.

## 3. Estrategia de Sombra (Shadow Mode)
Para probar nuevos prompts o modelos sin riesgo:
- Se activa `isShadowActive` en la configuración.
- El sistema ejecuta el prompt candidato en paralelo.
- Los resultados de sombra no afectan al usuario pero alimentan las métricas de calidad.

## 4. Steering Dinámico
El servicio `AiGovernanceConfig` orquesta qué prompt y modelo se usan por cada tarea (`task`). 
> [!IMPORTANT]
> Nunca se debe sobreescribir un prompt en caliente mediante scripts. Todo cambio debe originarse en el **Prompt Studio** y quedar registrado en `PromptVersion`.

## 5. Fallback de Seguridad
Si un prompt no se encuentra en la base de datos por Tenant, el sistema debe recurrir a las constantes en `lib/prompts.ts` con un log de nivel `WARN`: `PROMPTSERVICE_FALLBACK_USED`.
