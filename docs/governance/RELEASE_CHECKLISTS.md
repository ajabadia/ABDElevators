# RAG Release Checklists

Guía operativa para desplegar cambios en modelos, prompts u ontologías de forma segura.

## Checklist de Despliegue Estándar
1. **Versionado**: Confirmar que existe una `PromptVersion` en estado `PENDINGREVIEW`.
2. **Sombra**: Activar el cambio como sombra (`isShadowActive = true`) en `AiGovernanceConfig`.
3. **Baseline**: Ejecutar Golden Sets con la configuración actual.
4. **Candidato**: Ejecutar los mismos Golden Sets con la configuración de sombra.
5. **Comparativa**: Validar en el Dashboard de Calidad que los KPIs no se degradan.
6. **Promoción**: Cambiar estado a `PUBLISHED` y desactivar sombra.

## Procedimiento Multi-tenant (Overrides)
1. **Aislamiento**: Identificar si el cambio afecta a un tenant específico o es global.
2. **Configuración**: Aplicar el override en `AiGovernanceConfig` usando el `tenantId` correspondiente.
3. **Evaluación Local**: Usar el `RagEvaluationDataset` específico del cliente para validar el cambio.
4. **Validación Cliente**: En cuentas Enterprise, obtener el visto bueno del COO/Quality del cliente antes de promover.

## Plan de Rollback
En caso de detectar problemas post-despliegue:
1. Revertir `activePromptVersion` a la versión anterior en `AiGovernanceConfig`.
2. Si hubo cambios de ontología, marcar `OntologyProposal` como `ROLLEDBACK`.
3. Documentar el incidente con el `correlationId` de la evaluación fallida.
