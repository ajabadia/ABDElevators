---
name: ai-governance-migrator
description: Audita rutas o archivos en busca de modelos de IA hardcodeados (Gemini 1.5, 2.0, etc.) y los migra para usar AiModelManager según la gobernanza dinámica.
---
# Migrador a Gobernanza Dinámica de IA

## Cuándo usar este skill

- Cuando se detecte el uso de modelos de IA con nombres en texto plano (hardcodeados) como "Gemini 1.5 Pro", "Gemini 1.5 Flash", "Gemini 2.0 Flash", "gemini-2.0-flash-exp", etc.
- Cuando se cree o modifique un servicio en el backend que invoque a un LLM y no esté respetando la selección dinámica del tenant.
- Cuando un componente de UI muestre información estática de un modelo de IA en lugar de obtenerla dinámicamente o de usar nombres neutros genéricos.
- **Nota Architecture:** Las configuraciones de IA residen en el cluster `CONFIG`.

## Inputs necesarios

- **Ruta del archivo o carpeta**: Código donde se deben buscar strings hardcodeados y aplicar la migración a `AiModelManager`.

## Workflow

1. **Escaneo (Reconocimiento)**: Revisa el archivo buscado cadenas asociadas a modelos específicos.
2. **Clasificación del Archivo**:
   - ¿Es un servicio de **Backend/API** que realiza invocaciones a LLM? (Ej. usa `callGeminiMini`, `getGenAI`, etc.)
   - ¿Es un archivo de **Frontend/UI** que muestra el modelo que usa la plataforma en la pantalla?
3. **Migración en Backend**:
   - Eliminar el string estático del modelo.
   - Importar: `import { AiModelManager } from '@/services/llm/ai-model-manager';`
   - Recuperar el modelo de forma dinámica basada en el tenant actual y el rol funcional deseado (ej. `WORKFLOW_ROUTER`, `RAG_GENERATOR`, `WORKFLOW_NODE_ANALYZER`, `KNOWLEDGE_GRAPH`).
   - Ejemplo: `const modelToUse = await AiModelManager.getFunctionalModel(session, 'WORKFLOW_ROUTER');`
   - Usar `modelToUse` en la invocación a la IA.
4. **Migración en Frontend**:
   - Reemplazar versiones desactualizadas (Gemini 1.5, 2.0) por el modelo actual (Gemini 2.5 Flash / Gemini 3.0) o idealmente hacerlo depender de una variable si la arquitectura lo permite.
5. **Validación**: Asegurar que las importaciones estén resueltas y que la sesión/tenant se esté proporcionando correctamente a `AiModelManager`.

## Instrucciones

- No rompas el código existente. Si el `session` no está disponible en una función de backend, deberás modificar la firma para pasarlo (o pasar explícitamente el `tenantId` e inyectarlo en un objeto `fauxSession` como `{ user: { tenantId } }` si la sesión no es requerida).
- Si el contexto no queda claro, pide aclaraciones al desarrollador antes de refactorizar servicios críticos.

## Output (formato exacto)

- Lista de archivos modificados.
- Diff de cómo se ha reemplazado el texto plano por la llamada a `AiModelManager.getFunctionalModel()`.
- Confirmación de si quedaron deudas técnicas.
