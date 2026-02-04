# ABD Multi-Industry RAG Platform (Vision 3.8.0 - EVOLUTION ERA)

Sistema RAG (Retrieval-Augmented Generation) de grado industrial, genérico y multi-tenant. Diseñado para el análisis masivo de documentos técnicos, legales e industriales con una arquitectura agéntica de vanguardia.

Esta versión **v3.8.0** marca el cierre de la "Fase 95: Product Readiness & Stabilization", consolidando el Dashboard de ROI, Navegación Inteligente y Resiliencia de UI.

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
| **admin@abd.com** | `super123` | ADMIN | **Tenant Admin:** Gestión de usuarios y documentos |
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
  - ✅ **Turing-complete Workflow Logic**: Motor de estados avanzado con soporte para bifurcaciones (Switch), retardos (Wait) e iteraciones (Loop).
  - ✅ **Full Admin Localization (i18n)**: Área privada 100% traducida (ES/EN) con validación industrial y fallback seguro contra fallos de carga.
  - ✅ **Real-time Execution Monitoring**: Panel "Mission Control" integrado en el canvas para seguimiento en vivo de cada paso del proceso.
  - ✅ **Predictive Observability & Alerting**: Monitoreo proactivo de anomalías en flujos de trabajo con detección de picos de error (>15%) y latencia.
  - ✅ **Technical Performance Reporting**: Generación automatizada de informes industriales en PDF para auditoría de procesos.
  - ✅ **Hybrid Search Engine**: Fusión de **BM25 (Atlas Search)** + **Vector (Semantic)** + **Graph (Neo4j)** mediante RRF para precisión técnica absoluta.
  - ✅ **Semantic Cache (High Performance)**: Reducción de latencia de ~7s a 2ms (99.9% mejora) y ahorro de costes del 100% en consultas repetitivas.
  - ✅ **PII Masking Engine (Privacy First)**: Desidentificación automática de correos, teléfonos y documentos de identidad antes de procesar con LLMs.
  - ✅ **Graph-Enhanced RAG**: Navegación estructural de conocimiento basada en entidades y relaciones técnicas complejas.
  - ✅ **RAG Evaluation Dashboard**: Observabilidad nativa con Juez LLM (Gemini 1.5 Pro) para medir fidelidad y relevancia de respuestas.
  - ✅ **Visual Intelligence (Multi-modal)**: Comprensión nativa de planos, esquemas y diagramas técnicos con Gemini 2.0/3.
  - ✅ **Async Ingest (High-Scale)**: Procesamiento pesado en segundo plano con BullMQ y seguimiento de progreso en tiempo real con reintentos automáticos.
  - ✅ **Environment Sandboxing**: Aislamiento total entre entornos (Staging / Producción) con flujos de promoción atómicos.
  - ✅ **Shadow Prompts**: A/B Testing asíncrono de prompts en producción sin impacto en latencia.
  - ✅ **Universal Ontology**: Sistema agéntico que mapea y evoluciona entidades automáticamente.
  - ✅ **Bank-Grade Hardening (RBAC)**: Unificación total del modelo de permisos mediante Enum `UserRole` y helper `requireRole()`, eliminando ambigüedades en APIs y UI.
  - ✅ **Atomic Data Integrity**: Deduplicación por hash MD5 nativa en MongoDB con protección contra condiciones de carrera durante la ingesta masiva.
  - ✅ **Dynamic CSP (Nonces)**: Implementación de Content Security Policy dinámica basada en nonces para una protección XSS de vanguardia.
  - ✅ **Multi-tenant Isolation**: Aislamiento lógico de datos y configuraciones por organización/industria garantizado por índices compuestos.
  - ✅ **Accessibility Compliance (WCAG 2.1 AA)**: Declaración oficial de accesibilidad y tests automatizados de grado industrial integrados en el pipeline de desarrollo.

## 🔧 Scripts Disponibles

```bash
npm run dev                  # Servidor de desarrollo
npm run build                # Build optimizado para Vercel
npm run test                 # Suite de tests unitarios y RAG coverage
npm run ensure-indexes       # Reparación automática de índices de base de datos
```

## 📝 Licencia & Propiedad

**ABD RAG Platform © 2026** - *Leading Engineering for the AI Evolution Era.*
