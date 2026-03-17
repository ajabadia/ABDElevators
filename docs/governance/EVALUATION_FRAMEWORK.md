# Marco de Evaluación RAG

La calidad de la IA en ABDElevators se mide mediante experimentos controlados y benchmarks científicos.

## 1. Golden Sets vs Datasets
| Tipo | Propósito | Audiencia |
|------|-----------|-----------|
| **Golden Sets** | Benchmark contractual y de regresión "Core". | CLIENTE / COO |
| **Datasets** | Experimentación continua y tuning fino. | PRODUCT / RAG ENG |

## 2. Métricas Oficiales
El sistema utiliza el `QualityInsightsService` para monitorear:
- **Faithfulness**: ¿La respuesta se basa estrictamente en el contexto?
- **Answer Relevance**: ¿Responde directamente a la intención del usuario?
- **Context Precision**: ¿Los trozos (chunks) recuperados son los correctos?
- **Hallucination Count**: Detección de datos inventados.

## 3. RagGovernanceMeta: La Llave de la Trazabilidad
> [!IMPORTANT]
> Toda evaluación (offline, experimento o golden set) **DEBE** incluir el objeto `RagGovernanceMeta`. 

Sin este metadato, es imposible responder a la pregunta: *"¿Por qué bajó la calidad este mes?"*. Debe contener:
- `promptKey` & `promptVersion`
- `modelId`
- `isShadow`
- `correlationId`

## 4. Paneles de Calidad
Los dashboards interpretan métricas cruzadas con versiones de prompts y modelos. Una caída en `faithfulness` tras un cambio de prompt activa una alerta de gobernanza inmediata.
