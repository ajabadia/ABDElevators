# ABD Multi-Industry RAG Platform (Vision 2.36 - EVOLUTION ERA)

Sistema RAG (Retrieval-Augmented Generation) de grado industrial, genérico y multi-tenant. Diseñado para el análisis masivo de documentos técnicos, legales e industriales con una arquitectura agéntica de vanguardia.

Esta versión **v2.36** marca la entrada en la "Era de Evolución", con capacidades de orquestación IA distribuida, búsqueda híbrida y gobierno corporativo avanzado.

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

- **Node.js**: 18.17+ (Recomendado 20.x LTS)
- **Python**: 3.10+ (Requerido para el `PyMuPDF Bridge` de extracción de PDFs)
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

## ⚙️ Configuración del Proyecto

1. **Clonar e Instalar**
```bash
git clone https://github.com/ajabadia/ABDElevators.git
cd ABDElevators
npm install
```

2. **Variables de Entorno (.env.local)**
```env
# Database & Security
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=genera_con_openssl_rand_base64_32
ENCRYPTION_SECRET=hash_hexadecimal_de_32_bytes

# AI Orchestration
GEMINI_API_KEY=AIzaSy...
ENABLE_LOCAL_EMBEDDINGS=false

# Cloudinary & Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

3. **Inicialización de Datos**
```bash
npm run seed-users           # Usuarios de prueba por defecto
npm run seed-prompts         # Prompts maestros del sistema
npm run seed-workflows       # Workflows estándar (Fase 7)
npm run create-super-admin   # Usuario raíz (SuperAdmin)
npm run ensure-indexes       # Verifica índices críticos en DB
```

## 👥 Usuarios de Prueba

| Email | Password | Rol | Permisos |
|-------|----------|-----|----------|
| **superadmin@abd.com** | `super123` | SUPER_ADMIN | **Acceso Total:** Gobierno global y multinivel |
| **admin@abd.com** | `admin123` | ADMIN | **Tenant Admin:** Gestión de usuarios y documentos |
| **tecnico@abd.com** | `tecnico123` | TECNICO | **Técnico:** Portal de validación y workflow |
| **ingenieria@abd.com** | `ingenieria123` | INGENIERIA | **Consulta:** Solo lectura documentos técnicos |

## 📁 Estructura del Core (v2.36)

```
src/
├── app/                 # Next.js 15 App Router (Portal, Admin, APIs)
├── core/                # Motor agéntico, Ontologías y Business Logic
├── components/          # UI Components (Modernized with ui-styling)
│   ├── workflow/        # Motor de estados y transiciones
│   ├── tecnico/         # Validadores y checklists
│   └── shared/          # Command Center (Ctrl+K), Sidebar semántico
├── lib/                 # Servicios (LLM, RAG, Usage, Auth)
└── scripts/             # Herramientas de mantenimiento y auditoría
```

## 📊 Características Clave

- ✅ **Hybrid Search Engine**: Fusión de **BM25 (Atlas Search)** + **Vector (Semantic)** mediante RRF para precisión técnica absoluta.
- ✅ **Shadow Prompts**: A/B Testing asíncrono de prompts en producción sin impacto en latencia.
- ✅ **Universal Ontology**: Sistema agéntico que mapea y evoluciona entidades automáticamente.
- ✅ **Enterprise Hardening**: Protección contra Inyecciones, Rate Limiting atómico y PII Obfuscation.
- ✅ **Compliance & Portability**: Backup encriptado (.zip) y generación de Certificados GDPR.
- ✅ **Multi-tenant Isolation**: Aislamiento lógicos de datos y configuraciones por organización/industria.
- ✅ **Python PDF Bridge**: Integración de alto rendimiento con PyMuPDF para documentos complejos.

## 🔧 Scripts Disponibles

```bash
npm run dev                  # Servidor de desarrollo
npm run build                # Build optimizado para Vercel
npm run test                 # Suite de tests unitarios y RAG coverage
npm run ensure-indexes       # Reparación automática de índices de base de datos
```

## 📝 Licencia & Propiedad

**ABD RAG Platform © 2026** - *Leading Engineering for the AI Evolution Era.*
