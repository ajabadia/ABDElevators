# ESPECIFICACIÓN TÉCNICA PROFESIONAL
## Sistema RAG de Documentación Técnica para Pedidos de Ascensores
### Versión Final: Producto Enterprise-Ready

**Versión:** 2.0 (Profesional)  
**Fecha:** 21 de enero de 2026  
**Nivel de Madurez:** MVP → Producto Escalable  
**Elaborado por:** Consultoría Senior en Ingeniería de Software & IA

---

## PREFACIO EJECUTIVO

Este documento especifica un sistema integral de análisis de especificaciones técnicas de pedidos de ascensores mediante Retrieval-Augmented Generation (RAG), diseñado como un **asistente operacional** para técnicos de taller que necesitan consultar protocolos vigentes, mitigar riesgos de calidad y reducir tiempos de operación.

**Diferenciadores clave:**
- Trazabilidad completa (auditoría de prompts, respuestas, versiones de documentación).
- Checklists operativas integradas con captura de responsabilidad.
- Gestión de versiones de documentación con ciclo de vida claro (vigente → obsoleto → archivado).
- Observabilidad y métricas para mejorar procesos.
- Arquitectura lista para integración con sistemas ERP/MES existentes.

---

## 1. VISIÓN Y OBJETIVOS

### 1.1 Propósito
Desarrollar un **prototipo funcional escalable** que demuestre y valide cómo la IA (RAG + LLM) mejora:
- **Calidad:** técnico accede a protocolos vigentes sin ambigüedad.
- **Velocidad:** reducción de 30–50% en tiempo de consulta de documentación.
- **Trazabilidad:** 100% de decisiones técnicas quedan registradas y auditables.
- **Reducción de desperdicios:** menos retrabajos, scrap, errores de conexionado.

### 1.2 Audiencia Objetivo
- **Primaria:** Técnico de taller (montaje/especificaciones).
- **Secundaria:** Supervisor/Jefe taller (control de calidad, incidencias).
- **Terciaria:** Ingeniería/Calidad (mejora continua, análisis de datos).

### 1.3 Criterios de Éxito (Demo)
- Upload y análisis de pedido en <2s.
- Informe generado en <500ms.
- Exportación a PDF en <1s.
- Cero errores de conectividad en ambiente de demostración.
- Interfaz clara y usable por técnico sin entrenamiento previo.

---

## 2. ARQUITECTURA TÉCNICA EMPRESARIAL

### 2.1 Principios de Diseño

#### 2.1.1 Separación de Capas
- **Capa de Ingesta:** procesamiento offline de documentación (batch).
- **Capa de Análisis:** detección de componentes (LLM).
- **Capa de Recuperación:** búsqueda semántica (RAG + Vector Search).
- **Capa de Operación:** checklists, incidencias, responsabilidades.
- **Capa de Auditoría:** trazas completas de cada operación.
- **Capa de Presentación:** UX optimizada para taller (no para admin).

#### 2.1.2 Principios de Observabilidad
- **Trazabilidad:** cada acción genera un log correlacionado (uuid único por flujo).
- **Auditoría:** prompts exactos, versiones, respuestas se guardan íntegras.
- **Métricas:** tiempos, errores, uso, tasas de coincidencia.
- **Alertas:** desviaciones detectadas automáticamente (ej. "embeddings menos relevantes").

#### 2.1.3 Principios de Calidad y Seguridad
- **No eliminación física de datos:** marcar como archivado/obsoleto, nunca borrar (auditoría histórica).
- **Validación en capas:** inputs se validan en cliente y servidor.
- **Rate limiting:** protección contra abuso de API.
- **Pseudonimización:** datos sensibles de cliente no en logs (privacidad).

### 2.2 Stack Tecnológico (Producción-Ready)

| Componente | Tecnología | Alternativa | Razón |
|-----------|-----------|-----------|-------|
| **Frontend** | Next.js 15 (App Router) + React 19 + TypeScript | Remix | Full-stack integrado, deploy serverless, DX excelente |
| **Backend** | Next.js API Routes + Server Actions | Node.js + Express | Mismo lenguaje, menos complejidad operacional |
| **BD Principal** | MongoDB Atlas (M10+ producción) | PostgreSQL + pgvector | Flexibilidad documento, vector search nativo |
| **Vector Store** | MongoDB Atlas Vector Search | Pinecone, Weaviate | Colocado con datos, sin costo extra |
| **Embeddings** | Gemini API (embedding-001) | OpenAI, Cohere | Gratuito, buen trade-off calidad/velocidad |
| **LLM** | Gemini 2.0 Flash | Claude 3.5, GPT-4 | Velocidad, costo, precisión balanceada |
| **RAG Framework** | LangChain.js + MongoDB Adapter | LlamaIndex | Madurez, integraciones, comunidad activa |
| **PDF Processing** | pdf-parse (Node) + pdfjs-dist (Browser) | pdfkit, Puppeteer | Ambos lados (servidor/cliente), estable |
| **PDF Export** | jsPDF + html2canvas | Puppeteer backend | Cliente-side = sin overhead servidor |
| **UI Components** | Shadcn/ui + Tailwind CSS | Material UI, Ant Design | Headless, customizable, production-grade |
| **State Mgmt** | React Context (simple) | Redux, Zustand | Suficiente para demo, escala a Zustand si crece |
| **Autenticación** | NextAuth.js v5 (Fase 2) | Auth0, Clerk | Integración nativa Next.js, control total |
| **Hosting** | Vercel (Frontend) + MongoDB Atlas (BD) | AWS, GCP | Pricing transparente, auto-scaling, CDN global |
| **Observability** | Axiom / Datadog (logs) + Sentry (errores) | LogRocket, New Relic | Ingesta centralizada, alertas, análisis |
| **Testing** | Vitest (unit) + Playwright (e2e) | Jest, Cypress | Velocidad, API moderna, comunidad creciente |
| **CI/CD** | GitHub Actions | GitLab CI, CircleCI | Nativo en GitHub, sem costo para repos públicos |

### 2.3 Flujo de Datos Completo (Mejorado)

```
INGESTA DOCUMENTACIÓN (BATCH)
  ┌─────────────────────────────────────────────┐
  │ 1. Admin sube PDF en /admin/documentos      │
  │ 2. Registro en colección documentos_tecnicos│
  │    (estado: "borrador", version)            │
  │ 3. Botón "Procesar e indexar"               │
  │    → Log INFO de inicio                     │
  │ 4. Pipeline:                                │
  │    a) PDF → texto (pdf-parse)               │
  │    b) Detección tipo/modelo (Gemini)        │
  │    c) Chunking (500-800 chars, overlap)     │
  │    d) Embeddings (Gemini embedding-001)     │
  │    e) Guardado en document_chunks           │
  │    f) Actualización de num_chunks           │
  │ 5. Log INFO de éxito (tiempo_ms, chunks)    │
  │    Actualizar estado a "vigente"            │
  └─────────────────────────────────────────────┘
            ↓ (índice vectorial actualizado)
ANÁLISIS DE PEDIDO (REQUEST-RESPONSE)
  ┌─────────────────────────────────────────────┐
  │ 1. Técnico sube PDF o pega texto            │
  │    Correlacion_ID asignado                  │
  │ 2. POST /api/pedidos/analyze                │
  │    a) Parseo PDF → texto                    │
  │    b) Log DEBUG (tamaño texto)              │
  │    c) Gemini: extracción modelos            │
  │       → Log auditoría_rag (prompt, respuesta)│
  │    d) Guardado en pedidos (estado: analizado)
  │    e) Log INFO (modelos detectados)         │
  │ 3. Response JSON + redirect                 │
  └─────────────────────────────────────────────┘
            ↓
GENERACIÓN INFORME
  ┌─────────────────────────────────────────────┐
  │ 1. GET /api/pedidos/[id]/informe            │
  │ 2. Para cada modelo detectado:              │
  │    a) Vector Search (filtro tipo+modelo,    │
  │       estado_doc = 'vigente')               │
  │    b) Top-5 chunks + relevancia             │
  │    c) Log auditoría_rag (chunks usados)     │
  │ 3. Agrupación por documento + metadatos     │
  │ 4. Log INFO (tiempos, nº docs, modelos)     │
  │ 5. Response estructurado                    │
  └─────────────────────────────────────────────┘
            ↓
PRESENTACIÓN AL TÉCNICO
  ┌─────────────────────────────────────────────┐
  │ 1. Frontend renderiza informe               │
  │    Señales visuales:                        │
  │    - Documento vigente: normal              │
  │    - Doc obsoleto en histórico: gris        │
  │    - Doc <6 meses: badge "NUEVO"            │
  │    - Doc >12 meses: badge "REVISAR"         │
  │ 2. Checklist integrada por componente       │
  │    (cargada desde checklists_templates)     │
  │ 3. Botón "Reportar incidencia" por          │
  │    componente                               │
  │ 4. Botón "Exportar PDF" (jsPDF + html2canvas)
  │ 5. Log INFO (pedido visualizado, técnico)   │
  └─────────────────────────────────────────────┘
            ↓ (datos en paralelo)
ADMIN / CONTROL
  ┌─────────────────────────────────────────────┐
  │ Logs, auditoría, uso, incidencias           │
  │ en dashboards de consulta (read-only)       │
  └─────────────────────────────────────────────┘
```

---

## 3. MODELO DE DATOS (SCHEMA MongoDB)

### 3.1 Colección: `documentos_tecnicos` (Maestro)

Ciclo de vida: `borrador` → `en_revision` → `vigente` → `obsoleto` → `archivado`

```json
{
  "_id": ObjectId,
  "tipo_componente": "botonera" | "motor" | "cuadro" | "puerta" | "sensor" | "cable" | "polea" | ...,
  "titulo": "Manual de Botoneras Estándar",
  "nombre_fichero": "Manual_Botoneras_v2.1_2025.pdf",
  "version": "2.1",
  "estado": "vigente" | "obsoleto" | "borrador" | "en_revision" | "archivado",
  "fecha_revision": ISODate("2025-01-10"),
  "fecha_alta": ISODate("2025-01-01"),
  "motivo_cambio": "Actualización normativa EN81-20, incorporación de sensor de rotura de cable",
  "comentarios": "Solo aplicable a botoneras inox de 4 paradas en adelante. Reemplaza v2.0 completamente.",
  "num_chunks": 134,
  "tamanio_bytes": 2456789,
  "ultimo_ingestado": ISODate("2025-01-11T10:30:00Z"),
  "ingestado": true,
  "deprecado_por": ObjectId("doc_2.2"),      // documento que lo sustituye (si obsoleto)
  "reemplaza_a": ObjectId("doc_2.0"),        // documento anterior (si nuevo)
  "responsable_alta": "ingenieria@empresa.com",
  "responsable_cambio": "calidad@empresa.com",
  "tags": ["normativa", "2025", "seguridad"],
  "url_repositorio": "https://repo.empresa.com/docs/botoneras/v2.1",  // para futuro
  "creado": ISODate,
  "actualizado": ISODate
}
```

**Índices:** `{ tipo_componente: 1 }`, `{ estado: 1 }`, `{ version: -1 }`, `{ fecha_revision: -1 }`, `{ creado: -1 }`.

---

### 3.2 Colección: `document_chunks` (Corpus RAG)

```json
{
  "_id": ObjectId,
  "documento_id": ObjectId,          // referencia a documentos_tecnicos
  "tipo_componente": "botonera",
  "modelo": "BTN-1234",
  "origen_doc": "Manual_Botoneras_v2.1_2025.pdf",
  "version_doc": "2.1",
  "fecha_revision_doc": ISODate,
  "estado_doc": "vigente",           // inherit from documento para filtrado rápido
  "pagina_aproximada": 5,
  "num_seccion": 3,                  // para referenciar sección en doc
  "texto_chunk": "La botonera está disponible en acero inoxidable o aluminio anodizado. Los botones cumplen con normativa EN81-20...",
  "texto_antes": "Especificaciones de materiales:",
  "texto_despues": "Las medidas de seguridad incluyen...",
  "embedding": [0.123, -0.456, ...],  // vector 768-dim (Gemini embedding-001)
  "embedding_model": "embedding-001",
  "embedding_timestamp": ISODate,     // para versioning si cambio modelo
  "keywords": ["inox", "seguridad", "normativa"],
  "hash_contenido": "sha256:abc123",  // para detectar duplicados
  "relevancia_base": 0.85,            // score inicial (puede cambiar con feedback)
  "creado": ISODate,
  "fuente_procesada": ISODate
}
```

**Índices:** `{ documento_id: 1 }`, `{ tipo_componente: 1, estado_doc: 1 }`, `{ modelo: 1 }`, `{ embedding: "cosmosSearch" }` (Atlas Vector Search).

**Índice Vector Search (MongoDB Atlas):**
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "similarity": "cosine",
      "dimensions": 768
    },
    { "type": "filter", "path": "tipo_componente" },
    { "type": "filter", "path": "modelo" },
    { "type": "filter", "path": "estado_doc" }
  ]
}
```

---

### 3.3 Colección: `pedidos`

```json
{
  "_id": ObjectId,
  "numero_pedido": "PED-2025-00127",     // ID interno, debe ser único
  "numero_externo": "CLI-XYZ-2025-001",  // referencia cliente (opcional)
  "nombre_archivo": "Especificaciones_Ascensor_3plantas_XYZ.pdf",
  "texto_original": "...",               // texto completo del pedido
  "tamanio_bytes": 123456,
  "hash_contenido": "sha256:xyz",        // para detectar duplicados/cambios
  "modelos_detectados": [
    {
      "tipo": "botonera",
      "modelo": "BTN-1234",
      "confianza": 0.95,                 // score de la extracción (Gemini)
      "mencionado_veces": 3
    },
    {
      "tipo": "motor",
      "modelo": "MTR-5678",
      "confianza": 0.87,
      "mencionado_veces": 2
    }
  ],
  "fecha_analisis": ISODate,
  "estado": "analizado" | "procesando" | "error",
  "error_mensaje": null,
  "tiempo_analisis_ms": 420,
  "cliente": "empresa_xyz",               // para contexto (opcional)
  "proyecto": "Proyecto Edificio 3P",     // para contexto
  "responsable_tecnico": "tecnico@empresa.com",
  "informe_consultado": true,
  "informe_consultado_fecha": ISODate,
  "informe_consultado_por": "tecnico@empresa.com",
  "exportado_pdf": true,
  "exportado_fecha": ISODate,
  "creado": ISODate
}
```

**Índices:** `{ numero_pedido: 1 }` (único), `{ numero_externo: 1 }`, `{ fecha_analisis: -1 }`, `{ estado: 1 }`.

---

### 3.4 Colección: `checklists_templates` (Plantillas)

```json
{
  "_id": ObjectId,
  "tipo_componente": "botonera",
  "nombre": "Checklist Montaje Botonera Estándar",
  "descripcion": "Verificaciones obligatorias para el montaje de botoneras inox",
  "version": 1,
  "vigente": true,
  "secciones": [
    {
      "id": "sec_1",
      "nombre": "Preparación del Material",
      "descripcion": "Pre-montaje y verificaciones iniciales",
      "items": [
        {
          "id": "prep_1",
          "orden": 1,
          "descripcion": "Verificar que el material recibido coincide con especificación",
          "tipo": "checkbox",
          "obligatorio": true,
          "criticidad": "normal" | "critico",
          "referencia_doc": ObjectId,  // si aplica a un documento específico
          "referencia_pagina": 5,
          "ayuda": "Comparar con albarán de recepción"
        },
        {
          "id": "prep_2",
          "orden": 2,
          "descripcion": "Tensión de prueba (medir con multímetro)",
          "tipo": "numero",
          "obligatorio": true,
          "criticidad": "critico",
          "unidad": "V",
          "rango_esperado": { "min": 23.8, "max": 24.2 },
          "ayuda": "Rango permitido: 24V ±0.8%"
        }
      ]
    }
  ],
  "responsable": "ingenieria@empresa.com",
  "creado": ISODate,
  "actualizado": ISODate
}
```

---

### 3.5 Colección: `checklists_pedido` (Ejecuciones)

```json
{
  "_id": ObjectId,
  "pedido_id": ObjectId,
  "componente": {
    "tipo": "botonera",
    "modelo": "BTN-1234"
  },
  "template_id": ObjectId,
  "secciones": [
    {
      "id": "sec_1",
      "nombre": "Preparación del Material",
      "items": [
        {
          "id": "prep_1",
          "descripcion": "Verificar que el material...",
          "completado": true,
          "completado_valor": true,
          "completado_por": "tecnico@empresa.com",
          "completado_fecha": ISODate,
          "observaciones": "Material recibido correcto"
        },
        {
          "id": "prep_2",
          "descripcion": "Tensión de prueba (medir...)",
          "completado": true,
          "completado_valor": 24.1,
          "completado_por": "tecnico@empresa.com",
          "completado_fecha": ISODate,
          "observaciones": "Medición OK, dentro de rango"
        }
      ]
    }
  ],
  "estado": "en_progreso" | "completada" | "completada_con_observaciones" | "cancelada",
  "completada_por": "tecnico@empresa.com",
  "completada_fecha": ISODate,
  "items_criticos_pendientes": 0,
  "creado": ISODate
}
```

---

### 3.6 Colección: `logs_aplicacion`

```json
{
  "_id": ObjectId,
  "timestamp": ISODate,
  "nivel": "DEBUG" | "INFO" | "WARN" | "ERROR",
  "origen": "API_PEDIDOS" | "API_ADMIN" | "INGESTA" | "RAG" | "PDF" | "UI" | "WORKER",
  "accion": "ANALIZAR_PEDIDO" | "GENERAR_INFORME" | "INGESTAR_DOCUMENTO" | "CAMBIAR_ESTADO_DOC" | "...",
  "entidad_tipo": "pedido" | "documento" | "usuario" | "chunk" | null,
  "entidad_id": ObjectId,
  "mensaje": "Análisis de pedido PED-2025-001 completado en 420ms",
  "detalles": {
    "num_modelos": 3,
    "tiempo_ms": 420,
    "tamanio_bytes": 123456,
    "stack": "...",  // solo en ERROR
    "modelo": "BTN-1234"  // si aplica
  },
  "version": 1,
  "correlacion_id": "uuid-12345",  // mismo para todos los logs de un flujo
  "usuario": "tecnico@empresa.com",
  "ambiente": "produccion" | "staging" | "development",
  "creado": ISODate
}
```

**Índices:** `{ timestamp: -1 }`, `{ nivel: 1, timestamp: -1 }`, `{ accion: 1, timestamp: -1 }`, `{ correlacion_id: 1 }`.

---

### 3.7 Colección: `auditoria_rag`

Trazas completas de ejecuciones de RAG (prompts, respuestas, chunks).

```json
{
  "_id": ObjectId,
  "timestamp": ISODate,
  "fase": "extraccion_modelos" | "recuperacion_chunks",
  "pedido_id": ObjectId,
  "modelo": { "tipo": "botonera", "codigo": "BTN-1234" },
  "prompt_usado": "versión exacta del prompt enviado a Gemini",
  "prompt_version": "extract_models_v2.1",
  "respuesta_gemini": "{\"tipo\": \"botonera\", \"modelos\": [\"BTN-1234\"]}",
  "tiempo_respuesta_ms": 420,
  "chunks_recuperados": [
    {
      "chunk_id": ObjectId,
      "documento_id": ObjectId,
      "relevancia": 0.92,
      "posicion_ranking": 1
    }
  ],
  "parametros_busqueda": {
    "top_k": 5,
    "filtro_estado_doc": "vigente"
  },
  "correlacion_id": "uuid-12345",
  "usuario": "tecnico@empresa.com",
  "creado": ISODate
}
```

**Índices:** `{ pedido_id: 1 }`, `{ timestamp: -1 }`, `{ correlacion_id: 1 }`.

---

### 3.8 Colección: `incidencias_taller`

```json
{
  "_id": ObjectId,
  "numero_incidencia": "INC-2025-00042",
  "pedido_id": ObjectId,
  "componente": {
    "tipo": "botonera",
    "modelo": "BTN-1234"
  },
  "tipo_problema": "montaje_dificil" | "seguridad" | "doc_ambigua" | "falta_material" | "tiempos_excesivos" | "error_documento" | "otro",
  "descripcion": "Conexionado de botonera muy confuso en manual, 30min más de lo esperado",
  "impacto": "retraso" | "retrabajo" | "scrap" | "seguridad_riesgo" | "cliente_queja" | "ninguno",
  "tiempo_perdido_min": 30,
  "reportado_por": "tecnico@empresa.com",
  "reportado_fecha": ISODate,
  "estado": "abierta" | "en_revision" | "asignada" | "resuelta" | "descartada",
  "responsable_resolucion": "ingenieria@empresa.com",
  "resolucion": "Se aclarará diagrama en v2.2 del manual",
  "resuelta_fecha": ISODate,
  "documento_afectado": ObjectId,  // si es doc ambigua
  "creado": ISODate
}
```

---

### 3.9 Colección: `estadisticas_diarias` (Pre-agregadas)

```json
{
  "_id": { "fecha": ISODate("2026-01-21") },
  "total_pedidos_analizados": 34,
  "total_informes_generados": 33,
  "total_checklists_completadas": 45,
  "tiempo_medio_analisis_ms": 420,
  "tiempo_medio_informe_ms": 380,
  "componentes_totales_consultados": 127,
  "componentes_unicos_consultados": 28,
  "componentes_sin_doc": 0,
  "documentos_consultados_top_5": [
    { "titulo": "Manual_Botoneras_v2.1", "consultas": 45 }
  ],
  "incidencias_reportadas": 2,
  "incidencias_por_tipo": {
    "doc_ambigua": 1,
    "tiempos_excesivos": 1
  },
  "tasa_error": 0.02,  // 2% de análisis fallaron
  "actualizado": ISODate
}
```

---

## 4. ARQUITECTURA DE COMPONENTES (Next.js)

### 4.1 Estructura de Carpetas (Production-Grade)

```
proyecto-rag-ascensores/
├── .github/
│   └── workflows/
│       ├── ci.yaml              # Tests + linting en cada push
│       └── deploy.yaml          # Deploy automático a Vercel
├── app/
│   ├── layout.tsx               # Layout raíz (navbar, tema)
│   ├── page.tsx                 # Dashboard inicio
│   ├── globals.css              # Estilos globales + design system
│   ├── (tecnico)/               # Layout para vistas técnico
│   │   ├── layout.tsx           # Con barra lateral simplificada
│   │   ├── pedidos/
│   │   │   ├── nuevo/
│   │   │   │   └── page.tsx     # Subida de pedido
│   │   │   └── [id]/
│   │   │       ├── page.tsx     # Informe del pedido
│   │   │       ├── checklist/
│   │   │       │   └── page.tsx # Checklists del pedido
│   │   │       └── incidencias/
│   │   │           └── page.tsx # Reportar incidencias
│   │   └── historial/
│   │       └── page.tsx         # Historial de pedidos analizados
│   ├── (admin)/                 # Layout para vistas admin
│   │   ├── layout.tsx           # Con barra lateral admin
│   │   ├── admin/
│   │   │   ├── page.tsx         # Dashboard admin
│   │   │   ├── documentos/
│   │   │   │   ├── page.tsx     # Listado corpus RAG
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx # Detalle documento
│   │   │   │   └── nuevo/
│   │   │   │       └── page.tsx # Upload nuevo documento
│   │   │   ├── logs/
│   │   │   │   └── page.tsx     # Listado logs aplicación
│   │   │   ├── auditoria/
│   │   │   │   └── page.tsx     # Auditoría de RAG
│   │   │   ├── uso/
│   │   │   │   └── page.tsx     # Estadísticas de uso
│   │   │   └── incidencias/
│   │   │       └── page.tsx     # Incidencias reportadas
│   │   └── error.tsx            # Error page admin
│   ├── api/
│   │   ├── pedidos/
│   │   │   ├── analyze/
│   │   │   │   └── route.ts     # POST: análisis pedido
│   │   │   ├── [id]/
│   │   │   │   ├── informe/
│   │   │   │   │   └── route.ts # GET: genera informe
│   │   │   │   ├── checklist/
│   │   │   │   │   └── route.ts # GET/POST: checklist
│   │   │   │   └── incidencia/
│   │   │   │       └── route.ts # POST: reportar incidencia
│   │   │   └── historial/
│   │   │       └── route.ts     # GET: listado pedidos
│   │   ├── admin/
│   │   │   ├── documentos/
│   │   │   │   ├── route.ts     # GET/POST: listar/subir docs
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts # GET/PUT/DELETE: detalle doc
│   │   │   │   └── ingest/
│   │   │   │       └── route.ts # POST: procesar documento
│   │   │   ├── logs/
│   │   │   │   └── route.ts     # GET: listado logs
│   │   │   ├── auditoria/
│   │   │   │   └── route.ts     # GET: auditoría RAG
│   │   │   ├── uso/
│   │   │   │   └── route.ts     # GET: estadísticas
│   │   │   └── health/
│   │   │       └── route.ts     # GET: status sistema
│   │   └── webhook/
│   │       └── route.ts         # Webhooks futuro (ERP)
│   ├── error.tsx                # Error boundary global
│   └── not-found.tsx            # 404 page
├── lib/
│   ├── db.ts                    # Conexión MongoDB con caché
│   ├── db-schemas.ts            # Schemas Zod (validación)
│   ├── llm.ts                   # Integración Gemini
│   ├── llm-prompts.ts           # Prompts versionados
│   ├── rag.ts                   # Orquestación RAG (LangChain)
│   ├── pdf-utils.ts             # Extracción/exportación PDF
│   ├── chunk-utils.ts           # Troceado y chunking
│   ├── audit.ts                 # Funciones auditoría
│   ├── logger.ts                # Logger centralizado
│   ├── metrics.ts               # Colección de métricas
│   ├── errors.ts                # Tipos de error custom
│   └── utils.ts                 # Utilidades generales
├── components/
│   ├── tecnico/
│   │   ├── PedidoUpload.tsx      # Upload drag-drop
│   │   ├── PedidoInforme.tsx     # Renderización informe
│   │   ├── ComponentBlock.tsx    # Bloque de componente
│   │   ├── DocumentFragment.tsx  # Fragmento documento con contexto
│   │   ├── ChecklistSection.tsx  # Sección checklist
│   │   ├── ReportIncident.tsx    # Form de incidencia
│   │   └── ExportPdf.tsx         # Exportación a PDF
│   ├── admin/
│   │   ├── DocumentList.tsx      # Listado documentos corpus
│   │   ├── DocumentUpload.tsx    # Upload documento
│   │   ├── DocumentDetail.tsx    # Detalle documento
│   │   ├── LogViewer.tsx         # Visor logs
│   │   ├── AuditTrail.tsx        # Auditoría RAG
│   │   ├── UsageStats.tsx        # Estadísticas uso
│   │   └── IncidentList.tsx      # Listado incidencias
│   ├── ui/
│   │   ├── Button.tsx            # Button components (Shadcn)
│   │   ├── Input.tsx             # Input field
│   │   ├── Select.tsx            # Select dropdown
│   │   ├── Card.tsx              # Card container
│   │   ├── Modal.tsx             # Modal dialog
│   │   ├── Table.tsx             # Table component
│   │   ├── Tabs.tsx              # Tab navigation
│   │   ├── Badge.tsx             # Badge labels
│   │   ├── Alert.tsx             # Alert messages
│   │   ├── Spinner.tsx           # Loading spinner
│   │   ├── Toast.tsx             # Toast notifications
│   │   └── Pagination.tsx        # Pagination
│   ├── layout/
│   │   ├── Header.tsx            # Header con logo/usuario
│   │   ├── Sidebar.tsx           # Sidebar navegación
│   │   ├── Footer.tsx            # Footer simple
│   │   └── ThemeToggle.tsx       # Dark mode switch
│   └── hooks/
│       ├── useAsync.ts           # Hook para llamadas async
│       ├── usePagination.ts      # Hook paginación
│       └── useDebounce.ts        # Hook debounce búsqueda
├── public/
│   ├── docs/                    # Documentación técnica PDFs
│   ├── icons/                   # SVG icons
│   └── logo.svg                 # Logo empresa
├── scripts/
│   ├── ingest-documents.ts      # Script ingesta offline
│   ├── migrate-db.ts            # Migraciones MongoDB
│   ├── seed-data.ts             # Datos iniciales (demo)
│   └── backup.ts                # Backup MongoDB (futuro)
├── tests/
│   ├── unit/
│   │   ├── llm.test.ts          # Tests extracción modelos
│   │   ├── rag.test.ts          # Tests búsqueda RAG
│   │   └── chunk.test.ts        # Tests chunking
│   ├── integration/
│   │   ├── api.test.ts          # Tests endpoints
│   │   └── db.test.ts           # Tests acceso BD
│   ├── e2e/
│   │   ├── flujo-tecnico.spec.ts    # Flujo técnico completo
│   │   └── admin-corpus.spec.ts     # Gestión corpus
│   └── fixtures/                # Datos mock
├── middleware.ts                # Next.js middleware (auth, logs)
├── .env.example                 # Template variables entorno
├── .env.local                   # Variables (NO COMMITEAR)
├── .env.production              # Variables producción
├── .gitignore                   # Archivos excluidos
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── next.config.js               # Next.js config
├── tailwind.config.js           # Tailwind config
├── vitest.config.ts             # Vitest config
├── playwright.config.ts         # Playwright config
├── README.md                    # Documentación proyecto
└── DEPLOYMENT.md                # Guía deployment producción
```

---

## 5. GUÍA DE DESARROLLO PROFESIONAL

### 5.1 Estándares de Código

#### TypeScript Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```

#### Validación de Inputs (Zod)
```typescript
// Ejemplo: siempre validar inputs
const AnalyzePedidoSchema = z.object({
  file: z.instanceof(File).optional(),
  texto: z.string().min(10).max(100000).optional()
}).refine(
  data => data.file || data.texto,
  "File or text is required"
);

// En API route:
const validated = AnalyzePedidoSchema.parse(formData);
```

#### Error Handling (Custom Errors)
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', 400, message);
  }
}
```

#### Logging Estructurado
```typescript
// lib/logger.ts
export async function logEvento(data: {
  nivel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  origen: string;
  accion: string;
  mensaje: string;
  detalles?: Record<string, any>;
  correlacion_id?: string;
  usuario?: string;
}) {
  const log = {
    ...data,
    timestamp: new Date(),
    ambiente: process.env.NODE_ENV,
    version: 1,
    correlacion_id: data.correlacion_id || generateUUID()
  };

  // Guardar en BD
  const db = await connectDB();
  await db.collection('logs_aplicacion').insertOne(log);

  // También a stdout (Vercel/logging externo puede captarlo)
  if (data.nivel === 'ERROR') console.error(log);
  else console.log(log);
}
```

#### Observabilidad en Endpoints
```typescript
// Patrón para todos los endpoints
export async function POST(req: NextRequest) {
  const correlacion_id = generateUUID();
  const inicio = Date.now();
  
  try {
    await logEvento({
      nivel: 'INFO',
      origen: 'API_PEDIDOS',
      accion: 'ANALIZAR_PEDIDO',
      mensaje: 'Iniciando análisis de pedido',
      correlacion_id
    });

    // ... lógica del endpoint

    const tiempo_ms = Date.now() - inicio;
    await logEvento({
      nivel: 'INFO',
      origen: 'API_PEDIDOS',
      accion: 'ANALIZAR_PEDIDO',
      mensaje: 'Análisis completado',
      detalles: { tiempo_ms, modelos: 3 },
      correlacion_id
    });

    return NextResponse.json({ success: true, ... });
  } catch (error) {
    await logEvento({
      nivel: 'ERROR',
      origen: 'API_PEDIDOS',
      accion: 'ANALIZAR_PEDIDO',
      mensaje: error instanceof Error ? error.message : 'Unknown error',
      detalles: { stack: error instanceof Error ? error.stack : undefined },
      correlacion_id
    });
    return NextResponse.json({ success: false, ... }, { status: 500 });
  }
}
```

### 5.2 Testing Strategy

#### Unit Tests (Vitest)
```typescript
// tests/unit/llm.test.ts
import { describe, it, expect, vi } from 'vitest';
import { extractModelsWithGemini } from '@/lib/llm';

describe('extractModelsWithGemini', () => {
  it('debe extraer modelos correctamente', async () => {
    const texto = 'Mod.Botonera BTN-1234, Mod.Motor MTR-5678';
    const resultado = await extractModelsWithGemini(texto);
    
    expect(resultado).toHaveLength(2);
    expect(resultado[0]).toEqual({ tipo: 'botonera', modelo: 'BTN-1234' });
  });

  it('debe devolver array vacío si no hay modelos', async () => {
    const texto = 'Lorem ipsum dolor sit amet';
    const resultado = await extractModelsWithGemini(texto);
    expect(resultado).toEqual([]);
  });
});
```

#### E2E Tests (Playwright)
```typescript
// tests/e2e/flujo-tecnico.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Flujo técnico completo', () => {
  test('debe analizar pedido y mostrar informe', async ({ page }) => {
    await page.goto('/pedidos/nuevo');
    
    // Upload de archivo
    await page.locator('input[type="file"]').setInputFiles('./fixtures/pedido.pdf');
    await page.click('button:has-text("Analizar pedido")');
    
    // Verificar redirección a informe
    await expect(page).toHaveURL(/\/pedidos\/[a-f0-9]{24}/);
    
    // Verificar componentes mostrados
    await expect(page.locator('h2')).toContainText('BOTONERA BTN-1234');
    
    // Exportar PDF
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Exportar a PDF")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('Informe_PED');
  });
});
```

### 5.3 Performance y Escalabilidad

#### Caching Strategy
```typescript
// lib/cache.ts
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 300000; // 5 min

export function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item || Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

export function setCached<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Uso en RAG:
export async function queryVectorSearchCached(
  tipoComponente: string,
  modelo: string
) {
  const cacheKey = `rag:${tipoComponente}:${modelo}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const result = await queryVectorSearchDirect(...);
  setCached(cacheKey, result);
  return result;
}
```

#### Rate Limiting (Vercel Functions)
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h')  // 100 requests/hour
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/pedidos/analyze')) {
    const { success } = await ratelimit.limit(
      request.headers.get('x-forwarded-for') || 'anonymous'
    );
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
  }
}
```

#### Monitoring de Métricas
```typescript
// lib/metrics.ts
export async function recordMetric(name: string, value: number, tags?: Record<string, string>) {
  // Enviar a Datadog / Axiom
  await fetch('https://api.axiom.co/v1/datasets/rag-metrics/ingest', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.AXIOM_TOKEN}` },
    body: JSON.stringify({
      name,
      value,
      timestamp: new Date(),
      tags,
      ambiente: process.env.NODE_ENV
    })
  });
}

// En endpoints:
await recordMetric('pedido.analisis.tiempo_ms', tiempo_ms, {
  num_modelos: String(modelos.length),
  resultado: resultado.success ? 'ok' : 'error'
});
```

---

## 6. INTEGRACIÓN CON SISTEMAS EXTERNOS

### 6.1 API REST para Terceros

Exponer endpoints para integración con ERP/MES:

```
GET /api/v1/documentos                    # Listar docs vigentes
GET /api/v1/documentos/{id}               # Detalle documento
GET /api/v1/componentes                   # Listar catálogo componentes
GET /api/v1/componentes/{tipo}/{modelo}   # Detalle componente + docs
POST /api/v1/pedidos/analizar             # Análisis externo
GET /api/v1/pedidos/{id}/informe          # Informe como JSON
POST /api/v1/webhooks/documento-actualizado  # Notificación cambios
```

**Authentication:** API Key + Rate limiting.

### 6.2 Webhooks (Outbound)

Notificar a sistemas externos cuando:
- Documento cambia de estado (obsoleto, vigente).
- Se reporta incidencia crítica.
- Documento cumple 12 meses (revisión recomendada).

```typescript
// lib/webhooks.ts
export async function dispatchWebhook(
  evento: 'documento.actualizado' | 'incidencia.critica' | 'documento.revisar',
  payload: any
) {
  const webhooks = await db.collection('webhook_subscriptions')
    .find({ eventos: evento }).toArray();

  for (const webhook of webhooks) {
    try {
      await fetch(webhook.url, {
        method: 'POST',
        headers: { 'X-Signature': generateSignature(payload) },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      await logEvento({
        nivel: 'WARN',
        origen: 'WEBHOOK',
        accion: 'DISPATCH_FAILED',
        mensaje: `Webhook ${webhook.url} falló`
      });
    }
  }
}
```

---

## 7. SEGURIDAD Y CONFORMIDAD

### 7.1 Checklist de Seguridad

- ✅ **Inputs:** Validación en cliente + servidor (Zod).
- ✅ **Secrets:** Variables de entorno, nunca en código (dotenv-cli).
- ✅ **CORS:** Whitelist explícita de orígenes permitidos.
- ✅ **Rate Limiting:** Protección contra abuse en `/api/pedidos/analyze`.
- ✅ **HTTPS:** Obligatorio en producción (Vercel enforza).
- ✅ **PDFs:** Validación de tamaño (<50MB), tipo MIME.
- ✅ **Data Retention:** Política de retención de logs (2 años).
- ✅ **Pseudonimización:** Datos cliente no aparecen en logs públicos.
- ✅ **Auditoría:** Toda acción admin registrada con usuario + timestamp.

### 7.2 GDPR / Privacidad

- Técnico es empleado de la empresa → GDPR aplica con consentimiento.
- Datos de cliente (nombre empresa) → no guardar en logs sin motivo.
- Derecho al olvido → script para anonimizar pedidos históricos.

---

## 8. UX/UI PROFESIONAL

### 8.1 Diseño del Flujo Técnico

**Pantalla `/pedidos/nuevo` (Upload):**
- Drop zone grande, visible, con instrucciones claras.
- Textarea oculta bajo acordeón "Pegar texto" (minimizar confusión).
- Preview de archivo subido (nombre, tamaño).
- Botón "Analizar" deshabilitado hasta que hay contenido.
- Estados: `idle` → `analyzing` → `redirect` o `error`.

**Pantalla `/pedidos/[id]` (Informe):**
- Header con resumen: nº pedido, fecha, nº componentes.
- Tabs o acordeón por componente (no desplazamiento infinito).
- Por cada componente:
  - Código modelo, tipo, estado.
  - Tabla de documentos con señales visuales:
    - Vigente: normal.
    - Obsoleto: gris, bajo acordeón "Ver histórico".
    - <6 meses: badge verde "NUEVO".
    - >12 meses: badge ámbar "REVISAR".
  - Fragmentos de texto con contexto + barrita de relevancia.
- Checklist integrada (no en otra pantalla).
- Botones flotantes: "Exportar PDF", "Reportar incidencia", "Volver".

### 8.2 Modo "Taller" vs Admin

**Técnico:** fuente grande (16px mínimo), alto contraste, pocos elementos.
**Admin:** fuente normal, denso, mucho data.

```typescript
// components/layout/ResponsiveLayout.tsx
export function ResponsiveLayout({ isTaller = false, children }) {
  return (
    <div className={cn(
      "p-4",
      isTaller && "p-6 text-base",  // Fuente mayor en taller
      !isTaller && "p-3 text-sm"    // Compacto en admin
    )}>
      {children}
    </div>
  );
}
```

### 8.3 Señales Visuales y Avisos

- **Color:** azul (acción), verde (éxito), ámbar (atención), rojo (crítico).
- **Iconos:** ✓ (completado), ⚠️ (alerta), ❌ (error), ℹ️ (info).
- **Tooltips:** explicar qué significa "relevancia 0.92", "estado obsoleto", etc.
- **Animaciones suaves:** transiciones 200ms, no parpadeante.

---

## 9. ROADMAP PROFESIONAL A 18 MESES

### Sprint 0 (Actual - 4 semanas)
**Entregar:** MVP funcional, demo en Vercel.
- ✅ Core: análisis pedido, RAG, informe PDF.
- ✅ Admin básico: corpus, logs, auditoría.
- ⚠️ Checklists: estructura, validación básica.

### Sprint 1-2 (Semanas 5-10)
**Enfoque:** Robustez + UX técnico.
- Autenticación NextAuth + roles.
- Checklists con UI completa + críticos obligatorios.
- Incidencias: reporte desde informe.
- Testing: 70%+ cobertura.

### Sprint 3-4 (Semanas 11-16)
**Enfoque:** Integraciones + Observabilidad.
- API REST v1 para terceros.
- Webhooks (documento actualizado, incidencia).
- Logging centralizado (Axiom / Datadog).
- Alertas de deriva en RAG.

### Sprint 5-6 (Semanas 17-24)
**Enfoque:** Escalabilidad + Performance.
- Redis para caché de embeddings.
- Búsqueda local en Vercel Edge (copia de índice).
- Fine-tuning de modelo Gemini con data interna.
- Dashboard ejecutivo (C-level).

### Sprint 7+ (Iteración continua)
- Multi-idioma.
- Exportación Excel/Word.
- Mobile app (React Native).
- Computer vision para OCR de PDFs scaneados.

---

## 10. DEPLOYMENT Y OPERACIÓN

### 10.1 Ambiente Local (Desarrollo)

```bash
# Setup
git clone ...
npm install
cp .env.example .env.local
# Rellenar: MONGODB_URI, GEMINI_API_KEY

# Desarrollo
npm run dev        # http://localhost:3000

# Testing
npm run test       # Unit tests
npm run test:e2e   # E2E con Playwright
npm run test:coverage

# Linting
npm run lint       # ESLint
npm run type-check # TypeScript strict
```

### 10.2 Staging (Pre-Producción)

- Branch `staging` en GitHub.
- Auto-deploy a Vercel (staging.app.com).
- MongoDB Atlas staging cluster (M10, backups diarios).
- Gemini API key staging (quota baja).

### 10.3 Producción

- Branch `main` → auto-deploy a Vercel (app.com).
- MongoDB Atlas producción (M20+, replicaSet, backups cada 6h).
- Rate limiting activado.
- Logging centralizado (Axiom / Datadog).
- Alertas: error rate >1%, latencia >2s, rate limit hits.
- On-call rotation si incidentes críticos.

### 10.4 Backup y Disaster Recovery

```bash
# Backup MongoDB diario (cron)
mongodump --uri $MONGODB_URI --out ./backup-$(date +%Y%m%d)
aws s3 sync ./backup s3://backups-rag-ascensores/

# Restore si es necesario
mongorestore --uri $MONGODB_URI ./backup-20260121
```

---

## 11. MÉTRICAS DE ÉXITO Y KPIs

### Técnicas
- **Disponibilidad:** >99.5% uptime.
- **Latencia:** P95 <500ms (análisis), P95 <300ms (informe).
- **Error Rate:** <0.1% errores 5xx.
- **Cobertura Tests:** >80% código crítico.

### Operacionales
- **Adopción:** 80%+ de pedidos analizados con herramienta en 3 meses.
- **Reducción Tiempo:** 30–50% menos tiempo de consulta documentación.
- **Incidencias:** 20%+ reducción de errores relacionados con documentación.
- **Calidad Informe:** >95% de informes generados sin errores.

### Económicas
- **ROI:** payback en 6 meses si reduce 2 horas/semana por técnico.
- **Costo Total Propiedad:** <$500/mes (Vercel + Atlas M10 + APIs).

---

## CONCLUSIÓN

Este sistema está diseñado **para ser escalado a producción sin reescrituras** de arquitectura. Cada decisión se ha tomado pensando en:

1. **Simplicity:** no overengineering, pero bases sólidas.
2. **Observability:** saber qué está pasando en tiempo real.
3. **Trazabilidad:** cada decisión técnica es auditada.
4. **Escalabilidad:** de 10 a 10k pedidos/mes sin cambios arquitectónicos.
5. **Profesionalismo:** listo para mostrar a inversores, clientes, stakeholders.

La implementación debe seguir **los estándares de código, testing y deployment aquí descritos** para asegurar que lo que sale es un **producto profesional, no un prototipo**.

---

**Documento Final: Especificación para Producción**  
**Próximo Paso:** Asignación de sprints a equipos y comienco de desarrollo con Cursor/Antigrávity.
