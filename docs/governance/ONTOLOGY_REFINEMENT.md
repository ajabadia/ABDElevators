# Refinamiento de Ontología y Proposals

El `OntologyRefiner` evoluciona las taxonomías de componentes basándose en el drift de datos reales, pero siempre bajo control humano.

## 1. El Modelo de Propuestas (OntologyProposal)
El refiner nunca aplica cambios directamente. Crea un `OntologyProposal` que captura:
- **Snapshots**: El estado de las taxonomías antes del refinamiento.
- **Reasoning**: La justificación basada en datos para cada cambio.
- **Proposals**: Acciones específicas (`CREATE`, `UPDATE`, `MERGE`, `DELETE`) con un score de `confidence`.

## 2. Reglas de Aplicación por Entorno
- **Modo AUTO**: Permitido en entornos de `STAGING` o para acciones de bajo riesgo (p.ej. `CREATE` de nuevas categorías con >0.95 confidence).
- **Modo REVIEW_REQUIRED**: Obligatorio para `DELETE`, `MERGE` o cualquier cambio en entornos de `PRODUCTION`.

## 3. Criterios de Revisión Humana
El Domain Expert debe validar:
- **Impacto en Queries**: ¿El cambio romperá la recuperación de documentos antiguos?
- **Backward Compatibility**: ¿Siguen funcionando los dashboards con la nueva estructura?
- **Razonamiento**: ¿La IA ha detectado un drift real o es ruido semántico?

## 4. Política de Rollback
Ante cualquier anomalía tras la aplicación de una propuesta:
1. Marcar la propuesta como `ROLLEDBACK`.
2. El sistema restaura automáticamente el snapshot previo a la aplicación.
3. Registrar el incidente para mejorar los prompts del `OntologyRefiner`.
