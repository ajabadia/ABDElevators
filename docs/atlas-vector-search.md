# Configuración de MongoDB Atlas Vector Search

Para que el motor RAG de **ABD RAG Plataform** funcione correctamente, es necesario configurar un índice de búsqueda vectorial en la colección `document_chunks`.

## Parámetros del Índice

- **Nombre del Índice:** `vector_index`
- **Colección:** `document_chunks`
- **Base de Datos:** `ABDElevators`

## Definición JSON (Atlas Search Index)

Utilice la siguiente configuración al crear el índice desde el panel de MongoDB Atlas:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "estado"
    },
    {
      "type": "filter",
      "path": "tipo_componente"
    },
    {
      "type": "filter",
      "path": "modelo"
    }
  ]
}
```

### Explicación de Campos:

1.  **embedding**: Campo principal que contiene los vectores generados por `Gemini text-embedding-004`. 
    *   **Dimensiones**: 768 (estándar para el modelo 004).
    *   **Similitud**: `cosine` (recomendado para embeddings de texto).
2.  **estado**: Permite filtrar documentos `obsoletos` o `borradores` durante la búsqueda.
3.  **tipo_componente / modelo**: Permite realizar búsquedas filtradas por metadatos específicos para mejorar la precisión.

## Verificación de Funcionamiento

Puede verificar que el índice está activo ejecutando una búsqueda desde el endpoint:
`GET /api/pedidos/[id]/vector-search`

Si el índice no está configurado, la API devolverá un error de `DatabaseError` indicando que el índice `vector_index` no existe.

---
*Documentación generada por Antigravity (IA).*
