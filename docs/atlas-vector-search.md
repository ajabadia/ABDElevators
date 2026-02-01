# Configuración de Búsqueda Atlas (Vector + Keyword)

Para que el motor RAG de **ABD RAG Plataform** funcione correctamente en la v2.36+, es necesario configurar dos tipos de índices en la colección `document_chunks`.

## 1. Vector Search Index (Semántico)

- **Nombre del Índice:** `vector_index`
- **Colección:** `document_chunks`

### Definición JSON:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    { "type": "filter", "path": "status" },
    { "type": "filter", "path": "industry" },
    { "type": "filter", "path": "tenantId" }
  ]
}
```

## 2. Atlas Search Index (Keyword/BM25)

Este índice es crítico para la recuperación de términos técnicos exactos (IDs de error, números de pieza).

- **Nombre del Índice:** `keyword_index`
- **Colección:** `document_chunks`

### Definición JSON:
```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "chunkText": {
        "type": "string",
        "analyzer": "lucene.standard"
      }
    }
  }
}
```

## 🔄 Lógica Híbrida (RRF)

El sistema combina ambos resultados usando el algoritmo **Reciprocal Rank Fusion (RRF)**:
1.  **Vector Search**: Recupera contexto semántico (MMR).
2.  **Multilingual Search**: Soporte Cross-Language (BGE-M3).
3.  **Keyword Search**: Prioriza coincidencias exactas (BM25).

Los resultados se unifican con un factor de suavizado `k=60`, dando mayor peso relativo a las coincidencias por palabra clave para asegurar la precisión técnica.

---
*Documentación avanzada - v2.36.*
