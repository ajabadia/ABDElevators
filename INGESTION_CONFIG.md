# Configuración Requerida para Ingesta

## Variables de Entorno Críticas

### ENABLE_LOCAL_EMBEDDINGS
**Ubicación**: `.env.local`  
**Valor requerido**: `true`  
**Propósito**: Habilita la generación de embeddings multilingües con BGE-M3 para búsquedas avanzadas.

```bash
ENABLE_LOCAL_EMBEDDINGS=true
```

**Impacto si falta**:
- Los chunks se crean sin `embedding_multilingual`.
- Las búsquedas multilingües devuelven 0 resultados.
- El sistema solo usa embeddings de Gemini (menos precisos para búsquedas cross-language).

### MONGODB_URI
**Ubicación**: `.env.local`  
**Valor**: Tu connection string de MongoDB Atlas  
**Propósito**: Conexión a la base de datos principal.

### CLOUDINARY_*
**Ubicación**: `.env.local`  
**Variables requeridas**:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Propósito**: Subida y descarga de documentos PDF.

## Verificación

Ejecuta el script de diagnóstico para verificar la configuración:

```bash
npx tsx src/scripts/diagnose-ingestion-state.ts
```

Busca en la salida:
```
6. ENVIRONMENT CONFIG:
  ENABLE_LOCAL_EMBEDDINGS: true  ← Debe ser 'true'
```

Si dice `NOT SET`, añade la variable a `.env.local` y reinicia el servidor.
