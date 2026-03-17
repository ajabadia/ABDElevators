# RAG Governance: Visión General

La plataforma RAG de ABDElevators opera bajo un modelo de **Gobernanza de Tres Capas Conectadas**, diseñado para garantizar que cada respuesta generada por la IA sea trazable, medible y segura.

## Las 3 Capas de Control

1. **Capa de Prompts (Steering)**: Controla *qué* dice la IA y qué modelos se utilizan. Implementa versionado inmutable y ejecución en sombra (Shadow Mode).
2. **Capa de Ontología (OntologyRefiner)**: Controla la taxonomía de componentes y el conocimiento estructurado. Basado en propuestas humanas-en-el-bucle (HITL).
3. **Capa de Evaluación (Golden Sets)**: Mide la calidad objetiva (Faithfulness, Relevance) y valida si un cambio es apto para producción.
4. **Capa de Notificaciones y Reportes**: Gobierna la comunicación hacia el usuario y los informes contractuales, asegurando integridad y trazabilidad de métricas.
5. **Capa de Espacios de Conocimiento**: Define la seguridad y el aislamiento de los datos que alimentan al RAG (visibilidad y jerarquías).

## Objetivo Estratégico
Cualquier cambio en la configuración de la IA (prompts, modelos o taxonomías) debe ser:
- **Trazable**: Registro de quién, cuándo y por qué.
- **Medible**: Validado cuantitativamente contra Golden Sets.
- **Reversible**: Capacidad de rollback inmediato ante degradación de métricas.

Este manual sirve como hoja de ruta para ingenieros de RAG, expertos de dominio y administradores de plataforma.
