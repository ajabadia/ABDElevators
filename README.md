# ABD Multi-Industry RAG Platform (Vision 2.36 - EVOLUTION ERA)

Sistema RAG (Retrieval-Augmented Generation) de grado industrial, genérico y multi-tenant. Diseñado para el análisis masivo de documentos técnicos, legales e industriales con una arquitectura agéntica de vanguardia.

Actualizado a la **v2.36** con capacidades avanzadas de orquestación IA y búsqueda híbrida.

## 🚀 Inicio Rápido

### Windows
```bash
start_app.bat
```

### Linux/Mac
```bash
npm run dev
```

## 📋 Requisitos Previos

- **Node.js**: 18.17+ (Recomendado 20.xLTS)
- **MongoDB Atlas**: Cluster con soporte para Vector Search y Atlas Search.
- **Google AI Studio Key**: API de Gemini 1.5 Pro / Flash.
- **Cloudinary**: Para gestión de activos y PDFs.

## 🛠️ Configuración de Infraestructura Crítica

Para la v2.36, es imperativo configurar los siguientes índices en MongoDB Atlas:

1.  **Vector Search Index**: Llamado `vector_index` en la colección `document_chunks`.
2.  **Atlas Search (BM25)**: Llamado `keyword_index` en la colección `document_chunks`.
    - **Configuración JSON**:
      ```json
      { "mappings": { "dynamic": false, "fields": { "chunkText": { "type": "string", "analyzer": "lucene.standard" } } } }
      ```

## ⚙️ Variables de Entorno (.env.local)

```env
# Database & Security
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=tu_secreto_robusto
ENCRYPTION_SECRET=hash_hexadecimal_de_32_bytes

# AI Orchestration
GEMINI_API_KEY=AIzaSy...
ENABLE_LOCAL_EMBEDDINGS=false

# Cloudinary & Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Monitoring (Optional)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 # Para Tracing
```

## 📊 Características de la Era de Evolución (v2.30 - v2.36)

- 🔍 **Hybrid Search Engine**: Fusión de búsqueda semántica (Vector) y palabra clave (BM25) mediante **RRF (Reciprocal Rank Fusion)** para máxima precisión técnica.
- 🧠 **Shadow Prompts**: Orquestación agéntica que permite probar nuevos prompts en segundo plano (A/B Testing) sin afectar la experiencia del usuario.
- 🛡️ **Enterprise Hardening**: Protección contra Inyección de Prompts, Rate Limiting atómico y hashing de PII en logs.
- 📊 **Advanced Observability**: Tracing distribuido con OpenTelemetry para monitorear cada paso del pipeline RAG e IA.
- 📦 **Compliance Suite**: Exportación de conocimiento en formato ZIP portátil y certificados de derecho al olvido (GDPR).
- 🧬 **Universal Ontology Engine**: Motor de entidades adaptativo que evoluciona el esquema de datos según el aprendizaje del sistema.
- ⚡ **Stream Ingestion**: Pipeline de ingesta optimizado con deduplicación MD5 y soporte para streams pesados.

## 📁 Estructura del Core

```
src/
├── app/                 # Next.js 15 App Router (RSCs & API Routes)
├── core/                # Engine agéntico y de ontologías
├── components/          # UI Components (Admin, Técnico, Shared)
├── lib/                 # Core Services (LLM, RAG, Usage, Mapping)
└── scripts/             # Herramientas de mantenimiento e índices
```

## 🔧 Scripts de Mantenimiento

```bash
npm run dev                  # Servidor de desarrollo
npm run ensure-indexes       # Verifica y crea índices críticos en DB
npm run seed-prompts         # Inicializa los prompts maestros del sistema
npm run create-super-admin   # Genera el usuario de gobierno global
npm run test                 # Suite de tests unitarios y RAG coverage
```

## 📝 Licencia & Propiedad

**ABD RAG Platform © 2026** - *State-of-the-Art Engineering for the AI Era.*

