# RAG Governance: Reglas de Revisión de PR

Para proteger la integridad del sistema RAG, cualquier Pull Request que afecte a la capa de inteligencia debe cumplir estas 6 reglas de oro.

## 1. Uso Obligatorio de PromptService
Prohibido llamar a modelos LLM directamente (ej: `gemini.generateContent`) sin pasar por el `PromptService` o un wrapper oficial.
- **Validación**: Buscar `PromptKey` y `PromptVersion` en la llamada.

## 2. Versionado de Prompts
Si el PR modifica un prompt:
- Debe crear/actualizar una `PromptVersion`.
- No debe forzar el estado `PUBLISHED` directamente en el código; el estado inicial debe ser `DRAFT` o `PENDINGREVIEW`.

## 3. Trazabilidad de Evaluaciones
Código que genere `RagEvaluation` o `RagOfflineExperiment`:
- Debe rellenar obligatoriamente el objeto `RagGovernanceMeta`.
- No se aceptan métricas "huérfanas" sin `promptKey` o `modelId`.

## 4. Ontología HITL
Los cambios estructurales en taxonomías:
- Deben realizarse mediante `OntologyProposal`.
- No se permite la escritura directa en colecciones de taxonomía sin registro de propuesta y snapshot.

## 5. Validación Cuantitativa
El PR debe incluir en su descripción:
- Enlace a los resultados de Golden Sets o Datasets comparativos.
- Justificación de por qué el cambio mejora los KPIs de calidad.

## 6. Aislamiento Multi-tenant
Si se aplica un cambio de gobernanza:
- Verificar que se usa el `tenantId` correcto en `AiGovernanceConfig`.
- Asegurar que no se está modificando un valor global cuando se requiere un override por cliente.
