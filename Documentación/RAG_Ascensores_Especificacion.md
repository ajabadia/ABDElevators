# Especificación Técnica: Sistema RAG de Documentación Técnica para Pedidos de Ascensores

**Versión:** 1.0  
**Fecha:** 21 de enero de 2026  
**Objetivo:** Prototipo funcional de un sistema que analiza pedidos de ascensores, detecta componentes (botoneras, motores, etc.) y recupera documentación técnica relevante de una base de datos centralizada mediante RAG (Retrieval-Augmented Generation).

---

## 1. Descripción General del Proyecto

### 1.1 Propósito
Desarrollar un prototipo web que demuestre cómo la IA puede mejorar la calidad y reducir tiempos en el departamento técnico de una fábrica de ascensores. El sistema analiza especificaciones técnicas de pedidos (PDFs), extrae automáticamente componentes mencionados (botoneras, motores, circuitos, etc.), busca documentación técnica relevante en una base de conocimiento corporativa y genera un informe ejecutivo para el técnico.

### 1.2 Casos de Uso
- **Usuario primario:** Técnico del departamento de especificaciones.
- **Flujo principal:**
  1. Técnico sube un PDF de pedido o pega el texto.
  2. Sistema extrae componentes mencionados (código de modelo, tipo).
  3. Sistema busca documentación técnica relacionada (voltajes, medidas de seguridad, instalación, especificaciones).
  4. Se muestra un informe con lista de documentos + contexto (fragmentos de texto antes/después).
  5. Técnico exporta el informe a PDF.

### 1.3 Alcance Primera Iteración
- **Soportar múltiples tipos de componentes** (no solo botoneras, sino también motores, cuadros, puertas, etc.) desde el inicio.
- **Ingesta de documentación técnica:** manuales PDF con especificaciones agrupadas por tipo de componente.
- **Análisis de pedidos:** upload de PDF o texto; extracción de modelos mediante Gemini API.
- **RAG:** búsqueda vectorial sobre documentos técnicos usando MongoDB Atlas Vector Search.
- **Informe:** vista en pantalla + exportación a PDF.
- **Demo:** implementable en Vercel y GitHub sin autenticación inicial.

---

## 2. Arquitectura Técnica

### 2.1 Stack Tecnológico

| Componente | Tecnología | Justificación |
|-----------|-----------|--------------|
| **Frontend** | Next.js 15 (App Router) + React | Fullstack integrado, deploy en Vercel, server/client componentes |
| **Backend** | Next.js API Routes (Server Actions) | Integrado con frontend, sin servidor separado |
| **Base de datos** | MongoDB Atlas (nube gratuita) | Almacenamiento de pedidos, componentes, chunks de documentos, vector search nativo |
| **Vector Search** | MongoDB Atlas Vector Search | Búsqueda semántica nativa, no requiere servicio externo |
| **Embeddings** | Gemini API (embedding-001) | Gratuito con tu token API, suficiente para demo |
| **LLM** | Gemini API (gemini-2.0-flash) | Extracción de modelos, generación de contexto |
| **RAG Framework** | LangChain.js | Orquestación de retrieval, chains, integraciones listas |
| **PDF Parsing** | pdf-parse / pdfjs-dist | Extracción de texto desde PDFs |
| **PDF Export** | jsPDF + html2canvas (cliente) | Exportación de informe a PDF desde navegador |
| **Hosting** | Vercel + GitHub | Deploy automático, serverless, gratuito |
| **Lenguaje** | TypeScript | Type-safety, mejor experiencia de desarrollo |

### 2.2 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                   INGESTA DE DOCUMENTACIÓN                   │
├─────────────────────────────────────────────────────────────┤
│  1. Cargar PDFs técnicos en carpeta /docs/technical         │
│  2. Script ingesta:                                         │
│     - Extrae texto de cada PDF                              │
│     - Trocea en chunks (500-800 chars con solapamiento)    │
│     - Detecta tipo_componente y modelo(s) (Gemini)         │
│     - Calcula embeddings (Gemini embedding-001)            │
│     - Guarda en colección "document_chunks" con metadatos  │
│  3. Crea índice vectorial en MongoDB Atlas Vector Search   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      ANÁLISIS DE PEDIDO                      │
├─────────────────────────────────────────────────────────────┤
│  1. Técnico sube PDF o pega texto en /pedidos/nuevo        │
│  2. POST /api/pedidos/analyze:                             │
│     - Extrae texto del PDF (pdf-parse)                    │
│     - Llama Gemini: "Extrae modelos de componentes"       │
│     - Genera JSON: [{ tipo, modelo }, ...]                │
│     - Guarda pedido en colección "pedidos"                │
│     - Devuelve id del pedido                              │
│  3. Redirige a /pedidos/[id] (informe)                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  GENERACIÓN DE INFORME                       │
├─────────────────────────────────────────────────────────────┤
│  1. GET /api/pedidos/[id]/informe:                         │
│     - Para cada modelo detectado:                          │
│       a) Query al Vector Search (filtro tipo+modelo)      │
│       b) Devuelve top-5 chunks más relevantes             │
│       c) Agrupa por documento fuente                       │
│     - Estructura resultado como array de modelos           │
│  2. Frontend renderiza en /pedidos/[id]:                  │
│     - Header: nº pedido, fecha, archivo origen            │
│     - Por cada modelo: código, tipo, documentos+contexto  │
│     - Botón "Exportar a PDF" (jsPDF en cliente)           │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Componentes Principales

#### 2.3.1 Ingesta (Backend)
- **Entrada:** Carpeta con PDFs de documentación técnica.
- **Proceso:** 
  - Lectura de PDFs.
  - Chunking con solapamiento.
  - Detección automática de tipo/modelo (Gemini).
  - Cálculo de embeddings (Gemini).
  - Inserción en MongoDB.
- **Salida:** Colección `document_chunks` poblada; índice vectorial activo.
- **Tipo:** Script Node.js (puede ser una ruta especial `/api/admin/ingest` o un script en `scripts/ingest.ts`).

#### 2.3.2 Análisis de Pedido (Backend - API Route)
- **Endpoint:** `POST /api/pedidos/analyze`
- **Entrada:** FormData con archivo PDF o texto en textarea.
- **Proceso:**
  - Extraer texto de PDF (si aplica).
  - Llamar a Gemini con prompt: _"Analiza este documento de pedido de ascensores y extrae una lista JSON con todos los modelos de componentes mencionados. Formato: `[{ tipo: 'botonera' | 'motor' | 'cuadro' | 'puerta' | ..., modelo: 'CÓDIGO' }]`. Solo devuelve el JSON, sin explicaciones."_
  - Validar respuesta JSON.
  - Guardar en `db.pedidos`: `{ id, nombre_archivo, texto_original, modelos_detectados, fecha_analisis, estado: 'analizado' }`.
  - Devolver `{ pedido_id, modelos_detectados }`.

#### 2.3.3 Generación de Informe (Backend - API Route)
- **Endpoint:** `GET /api/pedidos/[id]/informe`
- **Entrada:** ID del pedido.
- **Proceso:**
  - Obtener pedido desde `db.pedidos`.
  - Para cada modelo en `modelos_detectados`:
    - Query al Vector Search filtrando por `tipo_componente === tipo` y `modelo === modelo`.
    - Obtener top-5 chunks (ordenados por relevancia).
    - Agrupar por `origen_doc` (nombre del documento fuente).
  - Retornar estructura: 
    ```json
    {
      "pedido": { "id", "nombre_archivo", "fecha_analisis" },
      "modelos": [
        {
          "tipo": "botonera",
          "modelo": "BTN-1234",
          "documentos": [
            {
              "origen_doc": "Manual_Botoneras_2025.pdf",
              "version": "2.1",
              "fecha_revision": "2025-01-10",
              "chunks": [
                {
                  "texto": "...",
                  "pagina_aproximada": 5,
                  "relevancia": 0.92
                }
              ]
            }
          ]
        },
        ...
      ]
    }
    ```

#### 2.3.4 Frontend - Pantalla de Análisis (`/pedidos/nuevo`)
- **Componente:** `PedidoUpload`
- **Funcionalidad:**
  - Upload de archivo PDF (drag-drop + file input).
  - Textarea para pegar texto directamente.
  - Botón "Analizar".
  - Loading state durante análisis.
  - Redirect automático a `/pedidos/[id]` tras éxito.

#### 2.3.5 Frontend - Pantalla de Informe (`/pedidos/[id]`)
- **Componente:** `PedidoInforme`
- **Funcionalidad:**
  - Header con datos del pedido (nombre, fecha, número de modelos encontrados).
  - Sección por cada modelo:
    - Título: "Botonera BTN-1234"
    - Subtítulo con tipo de componente.
    - Tabla o lista de documentos:
      - Documento fuente + versión.
      - Fragmentos de texto con contexto (antes y después).
      - Información de página/relevancia.
  - Botón "Exportar a PDF" (genera PDF del contenido actual).
  - Botón "Volver" o "Nuevo análisis".

### 2.4 Bases de Datos - Esquema MongoDB

#### Colección: `componentes`
Catálogo maestro de componentes (referencia y validación).

```json
{
  "_id": ObjectId,
  "tipo": "botonera" | "motor" | "cuadro" | "puerta" | ...,
  "modelo": "BTN-1234",
  "nombre_comercial": "Botonera Estándar Inox 4 Paradas",
  "descripcion": "Botonera de acero inoxidable para 4 paradas...",
  "tags": ["inox", "4-paradas", "industrial"],
  "creado": ISODate,
  "actualizado": ISODate
}
```

**Índices:**
- `{ tipo: 1, modelo: 1 }` (único)
- `{ tags: 1 }`

---

#### Colección: `document_chunks`
Fragmentos de documentación técnica (corpus RAG).

```json
{
  "_id": ObjectId,
  "tipo_componente": "botonera" | "motor" | ...,
  "modelo": "BTN-1234",
  "origen_doc": "Manual_Botoneras_2025.pdf",
  "version_doc": "2.1",
  "fecha_revision": ISODate("2025-01-10"),
  "pagina_aproximada": 5,
  "texto_chunk": "La botonera está disponible en inox...",
  "texto_antes": "Para especificaciones...",
  "texto_despues": "Conectar según esquema...",
  "embedding": [...],  // vector de 768 dimensiones (Gemini embedding-001)
  "relevancia_score": 0.92,
  "creado": ISODate,
  "fuente_procesada": ISODate
}
```

**Índices:**
- `{ tipo_componente: 1, modelo: 1 }` (búsqueda por tipo+modelo)
- `{ origen_doc: 1 }` (agrupación por documento)
- `{ embedding: "cosmosSearch" }` o `{ embedding: 1 }` (Atlas Vector Search)

**Índice Atlas Vector Search (configuración):**
```json
{
  "cosmosSearchOptions": {
    "kind": "vector",
    "version": 3,
    "listenField": "embedding",
    "cosmosDBVectorDistanceMetric": "cosine"
  },
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "type": "vector",
        "dimensions": 768,
        "similarity": "cosine"
      },
      "tipo_componente": {
        "type": "string",
        "searchable": true,
        "retrievable": true
      },
      "modelo": {
        "type": "string",
        "searchable": true,
        "retrievable": true
      },
      "texto_chunk": {
        "type": "string",
        "searchable": true,
        "retrievable": true
      }
    }
  }
}
```

---

#### Colección: `pedidos`
Registro de análisis realizados.

```json
{
  "_id": ObjectId,
  "numero_pedido": "PED-2025-001",
  "nombre_archivo": "Especificaciones_Cliente_XYZ.pdf",
  "texto_original": "...",
  "modelos_detectados": [
    { "tipo": "botonera", "modelo": "BTN-1234" },
    { "tipo": "motor", "modelo": "MTR-5678" }
  ],
  "fecha_analisis": ISODate,
  "estado": "analizado" | "procesando" | "error",
  "error_mensaje": null,
  "tecnicos_acceso": ["tech1@empresa.com", "admin@empresa.com"],
  "creado": ISODate
}
```

**Índices:**
- `{ numero_pedido: 1 }` (único)
- `{ fecha_analisis: -1 }` (orden descendente)

---

#### Colección: `sesiones_usuario` (futuro)
Para cuando se implemente autenticación.

```json
{
  "_id": ObjectId,
  "usuario_id": "...",
  "pedidos_accedidos": [ObjectId],
  "fecha_ultima_actividad": ISODate,
  "rol": "tecnico" | "supervisor" | "admin"
}
```

---

## 3. Estructura de Carpetas y Archivos (Next.js App Router)

```
proyecto-rag-ascensores/
├── app/
│   ├── layout.tsx                    # Layout principal
│   ├── page.tsx                      # Home / dashboard
│   ├── pedidos/
│   │   ├── nuevo/
│   │   │   └── page.tsx              # Pantalla upload de pedido
│   │   └── [id]/
│   │       └── page.tsx              # Pantalla informe de pedido
│   └── api/
│       ├── pedidos/
│       │   ├── analyze/
│       │   │   └── route.ts          # POST: análisis de pedido (extrae modelos)
│       │   └── [id]/
│       │       └── informe/
│       │           └── route.ts      # GET: genera informe con documentación
│       └── admin/
│           └── ingest/
│               └── route.ts          # POST: ingesta de documentos técnicos
├── lib/
│   ├── db.ts                         # Conexión MongoDB
│   ├── llm.ts                        # Funciones Gemini (embeddings, extracción)
│   ├── rag.ts                        # Orquestación RAG (LangChain)
│   ├── pdf-utils.ts                  # Extracción texto PDF
│   ├── chunk-utils.ts                # Troceado de documentos
│   └── schemas.ts                    # TypeScript interfaces / Zod
├── components/
│   ├── PedidoUpload.tsx              # Componente upload
│   ├── PedidoInforme.tsx             # Componente informe
│   ├── ExportPdfButton.tsx           # Botón exportación
│   └── ui/                           # Componentes reutilizables
├── public/
│   └── docs/                         # Carpeta documentación técnica (PDFs)
│       ├── Manual_Botoneras_2025.pdf
│       ├── Manual_Motores_2024.pdf
│       └── ...
├── scripts/
│   └── ingest-documents.ts           # Script ingesta offline (alternativa)
├── .env.local                        # Variables de entorno (no commitear)
│   # MONGODB_URI=...
│   # GEMINI_API_KEY=...
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

---

## 4. Instrucciones de Instalación y Setup Inicial

### 4.1 Prerrequisitos
- Node.js 18+ y npm/yarn.
- Cuenta en MongoDB Atlas (free tier suficiente).
- API key de Gemini (gratuita).
- Cuenta en Vercel (opcional, para deploy).
- Conocimiento de TypeScript, Next.js y React.

### 4.2 Pasos de Setup

#### Paso 1: Clonar / Iniciar Proyecto
```bash
# Opción A: Desde plantilla Vercel (recomendado)
git clone https://github.com/mongodb-partners/MongoDB-RAG-Vercel.git
cd MongoDB-RAG-Vercel
npm install

# Opción B: Proyecto nuevo (si prefieres empezar limpio)
npx create-next-app@latest proyecto-rag-ascensores --typescript --tailwind
cd proyecto-rag-ascensores
npm install
```

#### Paso 2: Dependencias Necesarias
```bash
npm install \
  langchain \
  @langchain/mongodb \
  @langchain/google-vertexai \
  @langchain/community \
  mongodb \
  pdf-parse \
  pdfjs-dist \
  jspdf \
  html2canvas \
  zod \
  dotenv
```

Versiones mínimas recomendadas:
- `langchain`: ^0.1.20
- `mongodb`: ^6.3.0
- `pdf-parse`: ^1.1.1
- `jspdf`: ^2.5.1
- `@langchain/mongodb`: último stable

#### Paso 3: Configurar Variables de Entorno (`.env.local`)
```
# MongoDB Atlas
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/ascensores?retryWrites=true&w=majority

# Gemini API
GEMINI_API_KEY=tu_clave_api_gemini_aqui

# Opcional: Vercel deployment
VERCEL_URL=https://tu-app.vercel.app
```

#### Paso 4: Crear Índice Vector Search en MongoDB Atlas
1. Ir a **MongoDB Atlas → tu cluster → Atlas Search → Create Search Index**.
2. Seleccionar colección `document_chunks`.
3. Usar configuración JSON (ver sección 2.4).
4. Nombrar el índice: `vector_search_doc_chunks`.

#### Paso 5: Cargar Documentación Técnica Inicial
```bash
# Colocar PDFs en public/docs/
cp /ruta/a/tus/pdfs/*.pdf ./public/docs/

# Ejecutar script de ingesta
npm run ingest
# (Esto ejecutará scripts/ingest-documents.ts)
```

Ver sección 4.3 para detalles del script de ingesta.

#### Paso 6: Verificar Conexión
```bash
npm run dev
# Visitar http://localhost:3000
# Debería cargar sin errores de BD
```

### 4.3 Script de Ingesta de Documentos (`scripts/ingest-documents.ts`)

Este script procesa documentos técnicos en PDF y los carga en MongoDB con embeddings.

**Pseudocódigo:**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import { MongoClient } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new MongoClient(process.env.MONGODB_URI);
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function ingestDocuments() {
  try {
    await client.connect();
    const db = client.db('ascensores');
    const chunksCollection = db.collection('document_chunks');
    
    const docsPath = path.join(process.cwd(), 'public', 'docs');
    const files = fs.readdirSync(docsPath).filter(f => f.endsWith('.pdf'));
    
    for (const file of files) {
      console.log(`Procesando ${file}...`);
      
      // 1. Extraer texto del PDF
      const pdfBuffer = fs.readFileSync(path.join(docsPath, file));
      const pdfData = await pdfParse(pdfBuffer);
      const fullText = pdfData.text;
      
      // 2. Trocear documento (chunks de ~500-800 chars con solapamiento)
      const chunks = chunkText(fullText, 500, 100); // tamaño, solapamiento
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        
        // 3. Detectar tipo_componente y modelo(s) en el chunk (Gemini)
        const response = await genai.getGenerativeModel({ model: 'gemini-2.0-flash' })
          .generateContent(
            `Analiza este fragmento de documentación técnica de ascensores y ` +
            `devuelve un JSON con: { tipo_componente: string, modelos: string[] }. ` +
            `Si no hay componente claro, devuelve null.` +
            `\n\n${chunkText}`
          );
        
        const content = response.response.text();
        let metadata = null;
        try {
          metadata = JSON.parse(content);
        } catch (e) {
          console.warn(`No se pudo parsear metadata para chunk ${i}`);
          metadata = { tipo_componente: 'desconocido', modelos: [] };
        }
        
        // 4. Generar embeddings (Gemini embedding-001)
        const embeddingResponse = await genai
          .getGenerativeModel({ model: 'embedding-001' })
          .embedContent(chunkText);
        const embedding = embeddingResponse.embedding.values;
        
        // 5. Insertar en MongoDB
        for (const modelo of metadata.modelos) {
          await chunksCollection.insertOne({
            tipo_componente: metadata.tipo_componente,
            modelo: modelo,
            origen_doc: file,
            version_doc: extractVersion(file), // Parsear versión del nombre si existe
            fecha_revision: new Date(),
            pagina_aproximada: Math.floor(i / 5), // Aproximación
            texto_chunk: chunkText,
            texto_antes: chunks[i - 1] || '',
            texto_despues: chunks[i + 1] || '',
            embedding: embedding,
            creado: new Date(),
            fuente_procesada: new Date()
          });
        }
      }
    }
    
    console.log('Ingesta completada.');
  } finally {
    await client.close();
  }
}

function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

function extractVersion(filename: string): string {
  const match = filename.match(/(\d+\.\d+)/);
  return match ? match[1] : '1.0';
}

ingestDocuments().catch(console.error);
```

**Ejecución:**
```bash
# Agregar a package.json scripts:
"scripts": {
  "ingest": "ts-node scripts/ingest-documents.ts"
}

npm run ingest
```

---

## 5. Endpoints API Detallados

### 5.1 `POST /api/pedidos/analyze`

**Descripción:** Sube un PDF de pedido o texto, extrae componentes y guarda en BD.

**Request:**
```http
POST /api/pedidos/analyze
Content-Type: multipart/form-data

{
  "file": <PDF file>,
  OR
  "texto": "Especificaciones: Mod.Botonera BTN-1234, Mod.Motor MTR-5678..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "pedido_id": "507f1f77bcf86cd799439011",
  "numero_pedido": "PED-2025-001",
  "modelos_detectados": [
    { "tipo": "botonera", "modelo": "BTN-1234" },
    { "tipo": "motor", "modelo": "MTR-5678" }
  ],
  "redirect_url": "/pedidos/507f1f77bcf86cd799439011"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "No file or text provided"
}
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Error analyzing document: ...",
  "details": "..."
}
```

**Implementación pseudocódigo (Next.js Route Handler):**
```typescript
// app/api/pedidos/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { extractTextFromPDF } from '@/lib/pdf-utils';
import { extractModelsWithGemini } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const texto = formData.get('texto') as string;
    
    if (!file && !texto) {
      return NextResponse.json(
        { success: false, error: 'No file or text provided' },
        { status: 400 }
      );
    }
    
    // Extraer texto
    let fullText = '';
    if (file) {
      const buffer = await file.arrayBuffer();
      fullText = await extractTextFromPDF(Buffer.from(buffer));
    } else {
      fullText = texto;
    }
    
    // Extraer modelos con Gemini
    const modelos = await extractModelsWithGemini(fullText);
    
    // Guardar en BD
    const db = await connectDB();
    const resultado = await db.collection('pedidos').insertOne({
      numero_pedido: `PED-${Date.now()}`,
      nombre_archivo: file?.name || 'texto_directo',
      texto_original: fullText,
      modelos_detectados: modelos,
      fecha_analisis: new Date(),
      estado: 'analizado',
      error_mensaje: null,
      creado: new Date()
    });
    
    return NextResponse.json({
      success: true,
      pedido_id: resultado.insertedId,
      numero_pedido: `PED-${Date.now()}`,
      modelos_detectados: modelos,
      redirect_url: `/pedidos/${resultado.insertedId}`
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error analyzing document',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
```

---

### 5.2 `GET /api/pedidos/[id]/informe`

**Descripción:** Genera informe con documentación técnica para un pedido analizado.

**Request:**
```http
GET /api/pedidos/507f1f77bcf86cd799439011/informe
```

**Response (200 OK):**
```json
{
  "success": true,
  "pedido": {
    "id": "507f1f77bcf86cd799439011",
    "numero_pedido": "PED-2025-001",
    "nombre_archivo": "Especificaciones_XYZ.pdf",
    "fecha_analisis": "2025-01-21T12:30:00Z"
  },
  "modelos": [
    {
      "tipo": "botonera",
      "modelo": "BTN-1234",
      "documentos": [
        {
          "origen_doc": "Manual_Botoneras_2025.pdf",
          "version": "2.1",
          "fecha_revision": "2025-01-10T00:00:00Z",
          "chunks": [
            {
              "texto": "La botonera BTN-1234 está disponible en acero inoxidable...",
              "texto_antes": "Para especificaciones completas...",
              "texto_despues": "Consultar esquema de conexión en página 12.",
              "pagina_aproximada": 5,
              "relevancia": 0.95
            },
            {
              "texto": "Voltaje de operación: 24V DC o 230V AC...",
              "pagina_aproximada": 8,
              "relevancia": 0.87
            }
          ]
        }
      ]
    },
    {
      "tipo": "motor",
      "modelo": "MTR-5678",
      "documentos": [
        {
          "origen_doc": "Manual_Motores_2024.pdf",
          "version": "1.5",
          "chunks": [
            {
              "texto": "Motor de tracción MTR-5678 para ascensores de carga media...",
              "pagina_aproximada": 3,
              "relevancia": 0.92
            }
          ]
        }
      ]
    }
  ]
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Pedido no encontrado"
}
```

**Implementación pseudocódigo:**
```typescript
// app/api/pedidos/[id]/informe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/db';
import { queryVectorSearch } from '@/lib/rag';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectDB();
    
    // Obtener pedido
    const pedido = await db.collection('pedidos')
      .findOne({ _id: new ObjectId(params.id) });
    
    if (!pedido) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // Generar informe
    const modelos_info = [];
    for (const modelo of pedido.modelos_detectados) {
      const chunks = await queryVectorSearch(
        db,
        modelo.tipo,
        modelo.modelo,
        5 // top-k
      );
      
      modelos_info.push({
        tipo: modelo.tipo,
        modelo: modelo.modelo,
        documentos: agruparPorDocumento(chunks)
      });
    }
    
    return NextResponse.json({
      success: true,
      pedido: {
        id: pedido._id,
        numero_pedido: pedido.numero_pedido,
        nombre_archivo: pedido.nombre_archivo,
        fecha_analisis: pedido.fecha_analisis
      },
      modelos: modelos_info
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function agruparPorDocumento(chunks: any[]) {
  const grouped: Record<string, any> = {};
  for (const chunk of chunks) {
    const key = chunk.origen_doc;
    if (!grouped[key]) {
      grouped[key] = {
        origen_doc: chunk.origen_doc,
        version: chunk.version_doc,
        fecha_revision: chunk.fecha_revision,
        chunks: []
      };
    }
    grouped[key].chunks.push({
      texto: chunk.texto_chunk,
      texto_antes: chunk.texto_antes,
      texto_despues: chunk.texto_despues,
      pagina_aproximada: chunk.pagina_aproximada,
      relevancia: chunk.relevancia_score
    });
  }
  return Object.values(grouped);
}
```

---

### 5.3 `POST /api/admin/ingest` (Alternativa: Ruta de Ingesta)

**Descripción:** Endpoint para cargar documentación técnica (alternativa al script offline).

**Request:**
```http
POST /api/admin/ingest
Content-Type: multipart/form-data
Authorization: Bearer admin_token

{
  "files": [<PDF file 1>, <PDF file 2>, ...]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "archivos_procesados": 3,
  "chunks_creados": 127,
  "tiempo_procesamiento_ms": 4520
}
```

---

## 6. Componentes React y UI

### 6.1 `PedidoUpload` Component
**Archivo:** `components/PedidoUpload.tsx`

**Funcionalidad:**
- Upload de PDF o textarea con texto.
- Validación básica (archivo no vacío).
- Loading state con spinner.
- Manejo de errores.
- Redirect automático a informe tras éxito.

**Props:**
```typescript
interface PedidoUploadProps {
  onSuccess?: (pedidoId: string) => void;
  onError?: (error: string) => void;
}
```

**Pseudocódigo:**
```typescript
export default function PedidoUpload({ onSuccess, onError }: PedidoUploadProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [texto, setTexto] = useState('');
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (texto) formData.append('texto', texto);
    
    try {
      const res = await fetch('/api/pedidos/analyze', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      onSuccess?.(data.pedido_id);
      router.push(data.redirect_url);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-2 border-dashed p-6 rounded">
        <input
          type="file"
          accept=".pdf"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
        <p className="text-gray-500 mt-2">o</p>
      </div>
      <textarea
        value={texto}
        onChange={e => setTexto(e.target.value)}
        placeholder="Pega el texto del pedido aquí..."
        rows={8}
        className="w-full border rounded p-2"
      />
      <button
        type="submit"
        disabled={loading || (!file && !texto)}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Analizando...' : 'Analizar Pedido'}
      </button>
    </form>
  );
}
```

---

### 6.2 `PedidoInforme` Component
**Archivo:** `components/PedidoInforme.tsx`

**Funcionalidad:**
- Mostrar informe del pedido.
- Lista de documentos por modelo.
- Fragmentos de texto con contexto.
- Botón exportar a PDF.

**Props:**
```typescript
interface PedidoInformeProps {
  pedidoId: string;
}
```

**Estructura:**
```typescript
export default function PedidoInforme({ pedidoId }: PedidoInformeProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/pedidos/${pedidoId}/informe`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [pedidoId]);
  
  if (loading) return <div>Cargando informe...</div>;
  if (!data?.success) return <div>Error: {data?.error}</div>;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-50 p-4 rounded">
        <h1>Informe Técnico</h1>
        <p>Pedido: {data.pedido.numero_pedido}</p>
        <p>Fecha: {new Date(data.pedido.fecha_analisis).toLocaleDateString()}</p>
      </div>
      
      {/* Por cada modelo */}
      {data.modelos.map((modelo: any) => (
        <div key={`${modelo.tipo}-${modelo.modelo}`} className="border rounded p-4">
          <h2>{modelo.tipo.toUpperCase()}: {modelo.modelo}</h2>
          
          {/* Por cada documento */}
          {modelo.documentos.map((doc: any) => (
            <div key={doc.origen_doc} className="ml-4 mt-3">
              <h3>{doc.origen_doc} (v{doc.version})</h3>
              
              {/* Chunks del documento */}
              {doc.chunks.map((chunk: any, i: number) => (
                <div key={i} className="bg-white border-l-4 p-3 mt-2 text-sm">
                  <p className="text-gray-600 italic">"{chunk.texto_antes}..."</p>
                  <p className="font-semibold my-2">{chunk.texto}</p>
                  <p className="text-gray-600 italic">"...{chunk.texto_despues}"</p>
                  <p className="text-gray-400 text-xs">
                    Página aprox: {chunk.pagina_aproximada} | Relevancia: {chunk.relevancia.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
      
      {/* Botón exportar */}
      <ExportPdfButton content={data} />
    </div>
  );
}
```

---

### 6.3 `ExportPdfButton` Component
**Archivo:** `components/ExportPdfButton.tsx`

**Funcionalidad:**
- Botón que exporta el informe actual a PDF.
- Usa `jsPDF` + `html2canvas` para capturar la pantalla.

**Pseudocódigo:**
```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ExportPdfButton({ content }: { content: any }) {
  const handleExport = async () => {
    const element = document.getElementById('informe-content');
    if (!element) return;
    
    const canvas = await html2canvas(element, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 277);
    pdf.save(`Informe_${content.pedido.numero_pedido}.pdf`);
  };
  
  return (
    <button
      onClick={handleExport}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Exportar a PDF
    </button>
  );
}
```

---

## 7. Funciones Utilidad

### 7.1 `lib/pdf-utils.ts`
Extracción de texto desde PDFs.

```typescript
import pdfParse from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdf = await pdfParse(buffer);
  return pdf.text;
}
```

### 7.2 `lib/llm.ts`
Integración con Gemini para extracción de modelos y embeddings.

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function extractModelsWithGemini(text: string) {
  const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `
    Analiza este documento de pedido de ascensores y extrae una lista JSON con 
    todos los modelos de componentes mencionados.
    
    Formato esperado:
    [
      { "tipo": "botonera", "modelo": "BTN-1234" },
      { "tipo": "motor", "modelo": "MTR-5678" }
    ]
    
    Tipos de componentes conocidos: botonera, motor, cuadro, puerta, cable, polea, sensor, etc.
    
    Devuelve SOLO el JSON, sin explicaciones.
    
    Texto del documento:
    ${text.substring(0, 2000)}
  `;
  
  const response = await model.generateContent(prompt);
  const content = response.response.text();
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('No se pudo parsear respuesta de Gemini:', content);
    return [];
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genai.getGenerativeModel({ model: 'embedding-001' });
  const response = await model.embedContent(text);
  return response.embedding.values;
}
```

### 7.3 `lib/rag.ts`
Orquestación del RAG con LangChain y MongoDB.

```typescript
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { Db } from 'mongodb';

export async function queryVectorSearch(
  db: Db,
  tipoComponente: string,
  modelo: string,
  topK: number = 5
) {
  const collection = db.collection('document_chunks');
  
  // Construir query con filter por tipo y modelo
  const pipeline = [
    {
      '$search': {
        'cosmosSearch': {
          'vector': await generateEmbedding(modelo),
          'k': topK
        },
        'returnDocument': 'always'
      }
    },
    {
      '$match': {
        'tipo_componente': tipoComponente,
        'modelo': modelo
      }
    },
    {
      '$project': {
        'similarityScore': { '$meta': 'searchScore' },
        'document': '$$ROOT'
      }
    }
  ];
  
  const results = await collection.aggregate(pipeline).toArray();
  return results.map(r => ({
    ...r.document,
    relevancia_score: r.similarityScore
  }));
}
```

### 7.4 `lib/db.ts`
Conexión a MongoDB.

```typescript
import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (cachedDb) return cachedDb;
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI no está definido');
  }
  
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  cachedClient = client;
  cachedDb = client.db('ascensores');
  
  return cachedDb;
}

export async function closeDB() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}
```

---

## 8. Testing y Validación

### 8.1 Casos de Test
1. **Upload de PDF válido:**
   - Subir manual de botoneras.
   - Verificar que extrae modelos correctamente.
   - Verificar que crea documento en colección `pedidos`.

2. **Análisis de texto:**
   - Pegar especificaciones en textarea.
   - Verificar que detecta múltiples tipos de componentes.

3. **Generación de informe:**
   - Acceder a `/pedidos/[id]`.
   - Verificar que muestra documentos relevantes.
   - Verificar que el contexto (antes/después) es coherente.

4. **Exportación a PDF:**
   - Hacer clic en "Exportar a PDF".
   - Verificar que descarga un archivo válido.

5. **Edge cases:**
   - PDF corrupto → debe mostrar error.
   - Pedido con modelos no encontrados → informe vacío pero sin error.
   - Solicitud sin archivo ni texto → error 400.

### 8.2 Script de Testing Manual
```bash
# Crear pedido de prueba
curl -X POST http://localhost:3000/api/pedidos/analyze \
  -F "texto=Mod.Botonera BTN-1234, Mod.Motor MTR-5678"

# Obtener informe (sustituir {id})
curl http://localhost:3000/api/pedidos/{id}/informe

# Ingestar documentos
curl -X POST http://localhost:3000/api/admin/ingest \
  -F "files=@public/docs/Manual_Botoneras_2025.pdf"
```

---

## 9. Roadmap y Fases Futuras

### Fase 1 (Actual - Demo Base)
- ✅ Soporte múltiples tipos de componentes (genérico desde inicio).
- ✅ Upload PDF / textarea.
- ✅ Análisis con Gemini.
- ✅ RAG sobre documentación.
- ✅ Informe en pantalla + PDF.
- ✅ Deploy en Vercel.

### Fase 2 (Próximas semanas)
- [ ] Autenticación de usuario (NextAuth v5 + MongoDB).
- [ ] Roles (técnico, supervisor, admin).
- [ ] Histórico de pedidos (listado, búsqueda, filtrado).
- [ ] Validación de modelos contra catálogo maestro.
- [ ] Alertas (modelo descatalogado, documentación antigua, etc.).

### Fase 3 (Iteración)
- [ ] API para integración con sistema ERP de la empresa.
- [ ] Webhook para notificar cambios en documentación.
- [ ] Editor de "respuestas" técnicas: anotaciones, links adicionales.
- [ ] Estadísticas de uso (modelos más consultados, tiempos, etc.).
- [ ] Soporte multiidioma (documentación en ES, EN, FR, etc.).

### Fase 4 (Optimización)
- [ ] Búsqueda local en Vercel Edge (replicado vector store).
- [ ] Fine-tuning de modelo Gemini con datos internos.
- [ ] Exportación a formatos adicionales (Word, HTML interactivo).

---

## 10. Instrucciones para el Desarrollador

### 10.1 Puntos de Entrada
1. **Empezar por:** Clonar plantilla MongoDB-RAG-Vercel y familiarizarse con la estructura.
2. **Segundo:** Implementar esquema de MongoDB (colecciones y índices) según sección 2.4.
3. **Tercero:** Crear endpoints `/api/pedidos/analyze` e `/api/pedidos/[id]/informe`.
4. **Cuarto:** Implementar componentes React `PedidoUpload` e `PedidoInforme`.
5. **Quinto:** Crear script de ingesta y cargar documentación de prueba.
6. **Sexto:** Testing end-to-end.
7. **Séptimo:** Deploy en Vercel.

### 10.2 Deuda Técnica Aceptable para Demo
- No reintentos en caso de fallos de API (Gemini, MongoDB).
- Sin cache de embeddings.
- Sin rate limiting (agregar en Fase 2).
- Errores genéricos en frontend (no loggers estructura; OK para demo).

### 10.3 Decisiones a Tomar
1. **¿Usar LangChain completo o llamadas directas a MongoDB?**  
   - Recomendación: Usar LangChain para claridad arquitectónica, aunque directas a Mongo también funcionan.

2. **¿Pasar embeddings como array o como string codificado?**  
   - MongoDB Atlas Vector Search espera array de números. Verificar documentación de tu versión de Atlas.

3. **¿Versionar documentos técnicos?**  
   - Sí; guardar hash o versión en `version_doc` para trazabilidad.

---

## 11. Verificación Previa a Deploy

- [ ] Todas las variables de entorno definidas en `.env.local`.
- [ ] MongoDB Atlas cluster activo y accesible.
- [ ] Índice Vector Search creado en colección `document_chunks`.
- [ ] API key de Gemini válida.
- [ ] PDFs de prueba cargados y procesados.
- [ ] Endpoints responden sin errores.
- [ ] UI renderiza correctamente.
- [ ] Exportación a PDF funciona.
- [ ] Conexión a Vercel configurada (si se va a usar).

---

## 12. Deployment en Vercel

```bash
# 1. Commitear código en GitHub
git add .
git commit -m "Initial RAG app for elevator orders"
git push origin main

# 2. Conectar repo en Vercel dashboard
# https://vercel.com/new
# → Seleccionar repo
# → Configurar variables de entorno (MONGODB_URI, GEMINI_API_KEY)
# → Deploy

# 3. Verificar en https://tu-proyecto.vercel.app
```

---

## 13. Preguntas Frecuentes (para el Desarrollador)

**P: ¿Qué hace si Gemini no devuelve JSON válido en `extractModelsWithGemini`?**  
R: Capturar la excepción y devolver array vacío; loguear el error. El informe simplemente estaría vacío.

**P: ¿Y si un modelo no tiene documentación?**  
R: La query al vector search devuelve 0 resultados. El informe mostrará el modelo pero sin documentos; es correcto.

**P: ¿MongoDB Atlas gratis soporta Vector Search?**  
R: Sí, desde hace poco. Verificar que el cluster esté actualizado a M10+.

**P: ¿Qué tal la latencia de embedding con Gemini en cada request?**  
R: ~200-500ms por embedding. Para ingesta es OK. Si en Fase 2 es un problema, cachar embeddings en Redis.

**P: ¿Cómo escalo a 100 usuarios simultáneos?**  
R: Vercel serverless escala automáticamente. MongoDB Atlas free tier puede estar limitado; upgrade a M10+.

---

**Fin de la especificación. El código está listo para que un desarrollador empiece a trabajar.**
