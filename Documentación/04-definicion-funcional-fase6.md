# DEFINICIÓN FUNCIONAL COMPLETA: RAG Pro + Checklists Dinámicos
**Proyecto ABDElevators - Fase 6**  
**Documento ejecutable para Cursor/Antigravity**

---

## 🎯 CONTEXTO DEL PROYECTO

### Stack Tecnológico Actual
- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript Strict
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas (con Vector Search)
- **AI/ML**: Gemini API (embeddings + LLM)
- **Framework RAG**: LangChain + @langchain/mongodb
- **Hosting**: Vercel

### Estado Actual (100% MVP Completado)
✅ Sistema RAG básico funcional  
✅ Upload → Analyze → Informe simple  
✅ Gestión usuarios enterprise  
✅ Sidebar colapsable optimizada  
✅ RAG con MMR para diversidad  
✅ Todas las Reglas de Oro implementadas  

### Objetivo Fase 6
Evolucionar a **sistema RAG profesional** con:
- **Vector Search como motor principal** (sin LLM en búsqueda → $0, 0.2s)
- **LLM como herramienta opcional** (solo para informe formal final)
- **Checklists 100% dinámicos y configurables** (N configs, N categorías, 0 hardcode)
- **Validación humana estructurada** con audit trail completo
- **Configurador visual** para personalización por empresa/tipo de proyecto

### 🎯 Filosofía Central: RAG ES EL MOTOR, LLM ES OPCIONAL

```
┌─────────────────────────────────────────────────┐
│ FLUJO PRINCIPAL (RAG-First, Sin LLM costoso)    │
├─────────────────────────────────────────────────┤
│ 1. Upload PDF                                   │
│ 2. VECTOR SEARCH → Top 15 docs ($0, 0.2s)      │
│ 3. Checklist Dinámica (LLM mini: $0.001, 0.5s) │
│ 4. Validación Humana Estructurada              │
│ 5. ✅ COMPLETO + Audit Trail                   │
│                                                 │
│ Coste: ~$0.001/pedido (95% menos que MVP)      │
│ Velocidad: <1s total (3x más rápido)           │
└─────────────────────────────────────────────────┘
                    ↓ (OPCIONAL - Usuario decide)
┌─────────────────────────────────────────────────┐
│ INFORME FORMAL LLM (Solo si se requiere)       │
├─────────────────────────────────────────────────┤
│ Botón: "Generar Informe Profesional"           │
│ LLM toma docs validados → PDF narrativo        │
│                                                 │
│ Coste: $0.01-0.05 (solo ~10% pedidos)          │
│ Velocidad: 3-5s                                 │
└─────────────────────────────────────────────────┘
```

**Ventajas del enfoque RAG-First:**
- ✅ **Reducción 95% coste LLM**: De $0.10 a $0.001 por pedido
- ✅ **3x más rápido**: 0.2s vs 3s por búsqueda
- ✅ **100% transparente**: Empleado ve scores matemáticos exactos
- ✅ **Escalable infinito**: Sin cuellos de botella LLM
- ✅ **Compliance superior**: Validación humana obligatoria documentada
- ✅ **Uso general**: Funciona para cualquier industria sin modificar código


---

## 🏗️ ARQUITECTURA FINAL REQUERIDA

```
┌─────────────────────────────────────────────────────────┐
│ INPUT: PEDIDO PDF                                       │
│ Técnico sube especificación                            │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ PASO 1: VECTOR SEARCH (MongoDB Atlas)                  │
│ • Sin LLM, solo matemáticas vectoriales                │
│ • Query embedding del pedido (Gemini embedding)        │
│ • Atlas Vector Search → Top 15 docs oficiales          │
│ • Tiempo: ~200ms | Coste: $0                           │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ PASO 2: RESULTADOS RAW                                  │
│ • Top 15 docs + scores + snippets                      │
│ • Mostrados al empleado para validación                │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ PASO 3: CHECKLIST DINÁMICA                             │
│ • LLM extrae checklist de Top 5 docs (mini-prompt)    │
│ • Auto-clasificación por keywords de config            │
│ • Ordenamiento: prioridad config + score doc           │
│ • Tiempo: ~500ms | Coste: $0.001                       │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ PASO 4: VALIDACIÓN HUMANA                              │
│ • Empleado marca: ✓ validados, ✗ faltantes            │
│ • Añade notas por ítem                                 │
│ • Drag-drop para recategorizar (si auto-class falla)  │
│ • Firma digital al completar                           │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ PASO 5: AUDIT TRAIL + STORAGE                         │
│ • Registro completo en validaciones_empleados          │
│ • Timestamp, empleado, docs, checklist, firma          │
│ • Exportable a PDF                                     │
└────────────────┬────────────────────────────────────────┘
                 ↓ (OPCIONAL - Solo si solicitado)
┌─────────────────────────────────────────────────────────┐
│ PASO 6: INFORME LLM FORMAL                            │
│ • Usa datos validados como contexto                   │
│ • Genera informe narrativo profesional                │
│ • Coste: $0.05 (solo cuando se pide)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 REQUISITOS FUNCIONALES DETALLADOS

### 1. Corpus Documentos Oficiales (Pre-cargado)

**Colección MongoDB**: `documentos_oficiales`

```typescript
interface DocumentoOficial {
  _id: ObjectId;
  tipo: 'oficial';                    // Distinguir de docs usuario
  titulo: string;                     // "BTN-1234 Manual Instalación"
  texto_completo: string;
  chunks: Array<{
    texto: string;
    embedding: number[];              // Vector 768D (Gemini text-embedding-004)
    pagina_aproximada: number;
  }>;
  metadata: {
    url_original: string;             // "docs/btn1234.pdf"
    cloudinary_url?: string;          // Si se sube a cloud
    version: string;                  // "v1.2"
    fabricante?: string;              // "Schindler", "Otis"
    fecha_publicacion?: Date;
  };
  estado: 'vigente' | 'obsoleto';
  creado: Date;
  procesado: Date;
}
```

**Índices requeridos**:
```javascript
db.documentos_oficiales.createIndex({ titulo: "text" });
db.documentos_oficiales.createIndex({ estado: 1 });
db.documentos_oficiales.createIndex({ "chunks.embedding": "cosmosSearch" }); // Atlas Vector Search
```

**Tarea**: Script `scripts/ingest-documentos-oficiales.ts` para indexar 50+ PDFs oficiales.

---

### 2. Vector Search Endpoint (Sin LLM)

**Endpoint**: `GET /api/pedidos/[id]/vector-search`

**Input**: 
- `pedido_id` (path param)

**Proceso**:
1. Recuperar pedido de MongoDB
2. Calcular embedding del `texto_original` del pedido (Gemini embedding)
3. Query Atlas Vector Search en `documentos_oficiales.chunks.embedding`
4. Retornar Top 15 docs ordenados por score

**Output**:
```typescript
{
  success: true,
  docs: [{
    id: string,
    titulo: string,
    snippet: string,          // Fragmento más relevante del chunk
    score: number,            // 0.0 - 1.0 (similaridad coseno)
    url: string,              // URL para descargar/ver PDF
    metadata: {
      fabricante: string,
      version: string,
      fecha_publicacion: Date
    }
  }],
  stats: {
    total: number,            // Total docs encontrados
    avg_score: number,        // Score promedio Top 15
    tiempo_ms: number
  }
}
```

**Performance Target**: P95 < 200ms  
**Coste**: $0 (solo embedding inicial del pedido, ya calculado antes)

**Implementación**:
```typescript
// app/api/pedidos/[id]/vector-search/route.ts
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
```

---

### 3. Configurador Checklists (Admin)

**Colección MongoDB**: `configs_checklist`

```typescript
interface ChecklistConfig {
  _id: ObjectId;
  nombre: string;                    // "Residencial", "Hospital", "Industrial"
  descripcion?: string;
  categorias: Array<{
    id: string;                       // "seguridad", "normativa"
    nombre: string;                   // "Seguridad Crítica"
    color: string;                    // "#ef4444" (Tailwind red-500)
    keywords: string[];               // ["ce", "certificado", "riesgo"]
    prioridad: number;                // 1 = más importante
    icono?: string;                   // "ShieldAlert" (lucide-react)
  }>;
  workflow_orden: string[];           // ['seguridad', 'electrico', 'normativa']
  activo: boolean;
  creado: Date;
  actualizado: Date;
  creado_por: string;                 // email usuario admin
}
```

**Endpoints Admin**:

```typescript
// GET /api/admin/configs-checklist
// Listar todas las configuraciones
Response: ChecklistConfig[]

// POST /api/admin/configs-checklist
// Crear nueva configuración
Body: Omit<ChecklistConfig, '_id' | 'creado' | 'actualizado'>
Response: { success: true, config_id: string }

// PUT /api/admin/configs-checklist/[id]
// Actualizar configuración existente
Body: Partial<ChecklistConfig>
Response: { success: true }

// DELETE /api/admin/configs-checklist/[id]
// Eliminar (soft delete: activo = false)
Response: { success: true }
```

**Validación Zod**:
```typescript
// lib/schemas.ts
export const ChecklistConfigSchema = z.object({
  nombre: z.string().min(3).max(100),
  descripcion: z.string().optional(),
  categorias: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
    keywords: z.array(z.string()),
    prioridad: z.number().int().positive(),
    icono: z.string().optional()
  })),
  workflow_orden: z.array(z.string()),
  activo: z.boolean().default(true)
});
```

---

### 4. Checklist Dinámica Endpoint

**Endpoint**: `GET /api/pedidos/[id]/checklist?config_id=xxx`

**Proceso**:
1. Vector search → Top 15 docs
2. Tomar Top 5 docs más relevantes
3. LLM (Gemini) extrae checklist items con mini-prompt:
   ```
   Prompt: "Analiza estos 5 fragmentos de documentación técnica y extrae 
   una lista de ítems de checklist para validación. Formato JSON:
   [{ texto: string, categoria_sugerida?: string }]"
   ```
4. Auto-clasificar cada ítem por keywords de la config
5. Ordenar: primero por prioridad de categoría, luego por score del doc fuente

**Output**:
```typescript
{
  success: true,
  items: [{
    id: string,                       // UUID
    texto: string,                    // "CE certificado obligatorio"
    categoria_id: string,             // "seguridad"
    categoria_nombre: string,         // "Seguridad Crítica"
    categoria_color: string,          // "#ef4444"
    score_doc: number,                // Score del doc del que se extrajo
    auto_clasificado: boolean,        // true si fue por keywords
    fuente_doc_id: string,            // ObjectId del doc oficial
    fuente_titulo: string             // "BTN-1234 Manual"
  }],
  categorias: ChecklistConfig['categorias'],  // Para renderizar UI
  config_usada: {
    id: string,
    nombre: string
  }
}
```

**Auto-clasificación**:
```typescript
// lib/checklist-auto-classifier.ts
function autoClassify(
  item: { texto: string },
  config: ChecklistConfig
): string | null {
  const textoLower = item.texto.toLowerCase();
  
  for (const categoria of config.categorias) {
    for (const keyword of categoria.keywords) {
      if (textoLower.includes(keyword.toLowerCase())) {
        return categoria.id;
      }
    }
  }
  
  return null; // No se pudo clasificar
}
```

---

### 5. Validación Empleado

**Colección MongoDB**: `validaciones_empleados`

```typescript
interface ValidacionEmpleado {
  _id: ObjectId;
  pedido_id: ObjectId;
  empleado_id: string;                // email o user._id
  config_id: ObjectId;                // ChecklistConfig usado
  
  // Resultados Vector Search
  docs_encontrados: Array<{
    doc_id: ObjectId;
    titulo: string;
    score: number;
    validado: boolean;                // ✓ o ✗ marcado por empleado
    notas?: string;
  }>;
  
  // Checklist Items
  checklist_items: Array<{
    id: string;
    texto: string;
    categoria_id: string;
    estado: 'pendiente' | 'completado' | 'no_aplica';
    notas?: string;
    auto_clasificado: boolean;
    reclasificado_a?: string;         // Si empleado arrastró a otra categoría
  }>;
  
  docs_faltantes: string[];           // Reportados por empleado (texto libre)
  validacion_completa: boolean;
  firma_digital?: string;             // Hash SHA-256 o token
  
  tiempo_inicio: Date;
  tiempo_fin?: Date;
  duracion_segundos?: number;
  
  creado: Date;
}
```

**Endpoint**: `POST /api/pedidos/[id]/validate`

**Input**:
```typescript
{
  config_id: string,
  docs_validados: string[],           // Array de doc_id marcados ✓
  docs_faltantes: string[],           // Textos libres de docs no encontrados
  checklist_items: Array<{
    id: string,
    estado: 'completado' | 'pendiente' | 'no_aplica',
    notas?: string,
    reclasificado_a?: string          // Si se cambió categoría
  }>,
  firma_digital: string
}
```

**Output**:
```typescript
{
  success: true,
  validacion_id: string,
  timestamp: Date
}
```

---

### 6. Firma Digital (Opcional)

**Endpoint**: `POST /api/pedidos/[id]/firma-digital`

**Input**:
```typescript
{
  validacion_id: string,
  firma: string                       // Hash SHA-256 del empleado + timestamp
}
```

**Output**:
```typescript
{
  success: true,
  firma_registrada: boolean
}
```

---

## 🖥️ UI/UX DETALLADA

### Pantalla 1: Validación Empleado (`/pedidos/[id]/validar`)

```
┌──────────────────────────────────────────────────────────────┐
│ PEDIDO #PED-2025-123                            [Exportar PDF]│
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ DOCUMENTOS ENCONTRADOS (15)                  [Config: ▼]     │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ [✓] 94% BTN-1234 Manual Instalación    [Ver PDF] [Info] ││
│ │ [✓] 91% MTR-5678 Especificaciones      [Ver PDF] [Info] ││
│ │ [ ] 88% Normativa CE EN 81-20          [Ver PDF] [Info] ││
│ │ [ ] 85% Cable UTP-100 Datasheet        [Ver PDF] [Info] ││
│ │ ...                                                       ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ CHECKLIST DINÁMICA                                            │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 🔴 SEGURIDAD (3 ítems) ─────────────────────────────────┐││
│ │   ☐ CE certificado obligatorio                          │││
│ │      Notas: [_________________________________]          │││
│ │   ☐ Pruebas funcionales OK                              │││
│ │   ☐ Instalación supervisada requerida                   │││
│ │                                                          │││
│ │ 🟡 NORMATIVA (1 ítem) ──────────────────────────────────┐││
│ │   ☑️ UE 2014/33 cumplida ✓                               │││
│ │      Notas: Verificado en manual página 12              │││
│ │                                                          │││
│ │ 🔵 ELÉCTRICO (2 ítems) ─────────────────────────────────┐││
│ │   ☐ Voltaje 380V verificado                             │││
│ │   ☐ Conexión a tierra correcta                          │││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ DOCUMENTOS FALTANTES (Añadir si no encontrados)              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ [Manual de mantenimiento preventivo          ] [+ Añadir]││
│ │ • Esquema eléctrico completo                 [Eliminar] ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│                [Cancelar]  [✅ VALIDAR Y FIRMAR DIGITALMENTE]│
└──────────────────────────────────────────────────────────────┘
```

**Componentes**:
1. `VectorResultsTable.tsx` → Lista Top 15 docs con checkboxes
2. `DynamicChecklist.tsx` → Checklist categorizado con drag-drop
3. `MissingDocsInput.tsx` → Input para reportar docs faltantes
4. `ValidationActions.tsx` → Botones de acción

---

### Pantalla 2: Configurador Admin (`/admin/configs-checklist`)

```
┌──────────────────────────────────────────────────────────────┐
│ CONFIGURACIONES DE CHECKLIST            [+ Nueva Configuración]│
├──────────────────────────────────────────────────────────────┤
│ SIDEBAR                   │ EDITOR                            │
│ ┌──────────────────────┐  │                                   │
│ │ [Residencial]   ✏️ ✓ │  │ EDITANDO: Residencial             │
│ │ [Hospitalaria]       │  │ Nombre: [Residencial___________] │
│ │ [Industrial]         │  │ Descripción:                      │
│ │                      │  │ [Para proyectos residenciales    │
│ │ [+ Nueva]            │  │  estándar___________________]     │
│ └──────────────────────┘  │                                   │
│                           │ CATEGORÍAS (Arrastra para ordenar)│
│                           │ ┌───────────────────────────────┐│
│                           │ │ 🔴 [↑↓] Seguridad Crítica     ││
│                           │ │ Nombre: [Seguridad Crítica__] ││
│                           │ │ Color: [🎨 #ef4444]           ││
│                           │ │ Keywords: [ce, certificado,   ││
│                           │ │            riesgo, peligro]   ││
│                           │ │ Prioridad: [1]                ││
│                           │ │ Icono: [ShieldAlert ▼]        ││
│                           │ │                        [Editar]││
│                           │ ├───────────────────────────────┤│
│                           │ │ 🟡 [↑↓] Normativa             ││
│                           │ │ ...                           ││
│                           │ ├───────────────────────────────┤│
│                           │ │ 🔵 [↑↓] Eléctrico             ││
│                           │ │ ...                           ││
│                           │ └───────────────────────────────┘│
│                           │                                   │
│                           │ [+ Añadir Categoría]              │
│                           │                                   │
│                           │         [Cancelar]  [💾 Guardar] │
└──────────────────────────────────────────────────────────────┘
```

**Componentes**:
1. `ConfiguratorFull.tsx` → Contenedor principal
2. `ConfigSidebar.tsx` → Lista de configs
3. `CategoriaEditor.tsx` → Editor de cada categoría
4. `DraggableItem.tsx` → Item arrastrable (@dnd-kit)

---

## 🎨 COMPONENTES REACT REQUERIDOS

### 1. `VectorResultsTable.tsx`

```typescript
// src/components/validation/VectorResultsTable.tsx
interface VectorResultsTableProps {
  docs: Array<{
    id: string;
    titulo: string;
    score: number;
    snippet: string;
    url: string;
    metadata: {
      fabricante?: string;
      version: string;
    };
  }>;
  validatedDocs: Set<string>;
  onValidateDoc: (docId: string, validado: boolean) => void;
}

export function VectorResultsTable({ docs, validatedDocs, onValidateDoc }: VectorResultsTableProps) {
  // Implementación: Tabla con checkboxes, botones "Ver PDF", modales info
}
```

---

### 2. `DynamicChecklist.tsx`

```typescript
// src/components/validation/DynamicChecklist.tsx
interface DynamicChecklistProps {
  items: Array<{
    id: string;
    texto: string;
    categoria_id: string;
    auto_clasificado: boolean;
  }>;
  categorias: Array<{
    id: string;
    nombre: string;
    color: string;
    icono?: string;
  }>;
  onItemUpdate: (itemId: string, updates: {
    estado?: 'pendiente' | 'completado' | 'no_aplica';
    notas?: string;
  }) => void;
  onItemDrag: (itemId: string, newCategoryId: string) => void;
}

export function DynamicChecklist({ items, categorias, onItemUpdate, onItemDrag }: DynamicChecklistProps) {
  // Implementación: Acordeones por categoría, drag-drop entre categorías
}
```

---

### 3. `ConfiguratorFull.tsx`

```typescript
// src/components/admin/ConfiguratorFull.tsx
interface ConfiguratorFullProps {
  configs: ChecklistConfig[];
  onSaveConfig: (config: ChecklistConfig) => Promise<void>;
  onDeleteConfig: (configId: string) => Promise<void>;
}

export function ConfiguratorFull({ configs, onSaveConfig, onDeleteConfig }: ConfiguratorFullProps) {
  // Implementación: Sidebar + Editor con drag-drop categorías
}
```

---

### 4. `CategoriaEditor.tsx`

```typescript
// src/components/admin/CategoriaEditor.tsx
interface CategoriaEditorProps {
  categoria: ChecklistConfig['categorias'][0];
  onChange: (updates: Partial<ChecklistConfig['categorias'][0]>) => void;
}

export function CategoriaEditor({ categoria, onChange }: CategoriaEditorProps) {
  // Implementación: Form para editar nombre, color, keywords, prioridad, icono
}
```

---

### 5. `DraggableItem.tsx`

```typescript
// src/components/common/DraggableItem.tsx
import { useSortable } from '@dnd-kit/sortable';

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
}

export function DraggableItem({ id, children }: DraggableItemProps) {
  // Implementación genérica con @dnd-kit/sortable
}
```

---

### 6. `ValidationWorkflow.tsx`

```typescript
// src/components/validation/ValidationWorkflow.tsx
export function ValidationWorkflow({ pedidoId }: { pedidoId: string }) {
  // Orquestador: integra VectorResultsTable + DynamicChecklist + acciones
}
```

---

### 7. `AuditTrailViewer.tsx`

```typescript
// src/components/admin/AuditTrailViewer.tsx
interface AuditTrailViewerProps {
  validacionId: string;
}

export function AuditTrailViewer({ validacionId }: AuditTrailViewerProps) {
  // Muestra: empleado, timestamp, docs validados, checklist, firma
}
```

---

## 🧪 TESTING STRATEGY

### Tests Unitarios

**1. `checklist-extractor.test.ts`**
```typescript
// tests/unit/checklist-extractor.test.ts
import { extractChecklist, autoClassify } from '@/lib/checklist-extractor';

describe('Checklist Extractor', () => {
  it('should extract items from Top 5 docs', async () => {
    const docs = mockTop5Docs();
    const items = await extractChecklist(docs);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty('texto');
  });

  it('should auto-classify by keywords', () => {
    const item = { texto: 'CE certificado obligatorio' };
    const config = mockConfig();
    const classified = autoClassify(item, config);
    expect(classified).toBe('seguridad');
  });
});
```

---

### Tests Integración

**2. `vector-search.test.ts`**
```typescript
// tests/integration/vector-search.test.ts
describe('GET /api/pedidos/[id]/vector-search', () => {
  it('should return Top 15 docs without LLM', async () => {
    const pedidoId = 'test-pedido-123';
    const res = await fetch(`/api/pedidos/${pedidoId}/vector-search`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.docs).toHaveLength(15);
    expect(data.stats.avg_score).toBeGreaterThan(0.5);
  });
});
```

**3. `config-save.test.ts`**
```typescript
// tests/integration/config-save.test.ts
describe('POST /api/admin/configs-checklist', () => {
  it('should create new config', async () => {
    const config = mockChecklistConfig();
    const res = await fetch('/api/admin/configs-checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.config_id).toBeDefined();
  });
});
```

---

### Tests E2E (Playwright)

**4. `validation-workflow.spec.ts`**
```typescript
// tests/e2e/validation-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('Complete validation workflow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'tecnico@empresa.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.goto('/pedidos/test-pedido-123/validar');
  
  // Verificar docs cargados
  await expect(page.locator('text=94%')).toBeVisible();
  
  // Marcar docs validados
  await page.check('[data-doc-id="doc-1"]');
  await page.check('[data-doc-id="doc-2"]');
  
  // Completar checklist
  await page.check('[data-item-id="item-seguridad-1"]');
  await page.fill('[data-notas="item-seguridad-1"]', 'Verificado correctamente');
  
  // Firmar
  await page.click('button:has-text("Validar y Firmar")');
  await expect(page.locator('text=Validación guardada')).toBeVisible();
});
```

**5. `configurator.spec.ts`**
```typescript
// tests/e2e/configurator.spec.ts
test('Admin creates checklist config with drag-drop', async ({ page }) => {
  await page.goto('/admin/configs-checklist');
  await page.click('button:has-text("Nueva Configuración")');
  
  await page.fill('[name="nombre"]', 'Hospitalaria');
  await page.fill('[name="descripcion"]', 'Para proyectos hospitalarios');
  
  // Añadir categoría
  await page.click('button:has-text("Añadir Categoría")');
  await page.fill('[name="categoria-nombre"]', 'Higiene');
  await page.fill('[name="categoria-keywords"]', 'limpio, aséptico, estéril');
  
  // Guardar
  await page.click('button:has-text("Guardar")');
  await expect(page.locator('text=Configuración guardada')).toBeVisible();
});
```

**Coverage Target**: 80%+

---

## 📦 DEPENDENCIAS NUEVAS

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Uso**: Drag & drop de categorías y checklist items

**Versiones recomendadas**:
- `@dnd-kit/core`: ^6.1.0
- `@dnd-kit/sortable`: ^8.0.0

---

## ⚙️ CONFIGURACIÓN DEFAULT (Fallback)

```typescript
// lib/default-checklist-config.ts
import type { ChecklistConfig } from './schemas';

export const DEFAULT_CHECKLIST_CONFIG: Omit<ChecklistConfig, '_id' | 'creado' | 'actualizado'> = {
  nombre: "General",
  descripcion: "Configuración predeterminada para todos los tipos de proyecto",
  categorias: [
    {
      id: "seguridad",
      nombre: "Seguridad Crítica",
      color: "#ef4444",        // Tailwind red-500
      keywords: ["ce", "seguridad", "certificado", "riesgo", "peligro", "emergencia"],
      prioridad: 1,
      icono: "ShieldAlert"
    },
    {
      id: "normativa",
      nombre: "Normativa y Compliance",
      color: "#f59e0b",        // Tailwind amber-500
      keywords: ["ue", "normativa", "directiva", "en", "iso", "ansi", "astm"],
      prioridad: 2,
      icono: "FileCheck"
    },
    {
      id: "electrico",
      nombre: "Eléctrico",
      color: "#3b82f6",        // Tailwind blue-500
      keywords: ["voltaje", "cable", "conexión", "electricidad", "v", "a", "potencia"],
      prioridad: 3,
      icono: "Zap"
    },
    {
      id: "mecanico",
      nombre: "Mecánico",
      color: "#8b5cf6",        // Tailwind violet-500
      keywords: ["motor", "engranaje", "tracción", "freno", "polea", "eje"],
      prioridad: 4,
      icono: "Cog"
    }
  ],
  workflow_orden: ["seguridad", "normativa", "electrico", "mecanico"],
  activo: true,
  creado_por: "system"
};
```

**Uso**: Si no existe ninguna config creada por usuario, usar esta por defecto.

---

## 🚀 ORDEN DE IMPLEMENTACIÓN (10 DÍAS)

### **DÍA 1: DB Schema + Vector Search Endpoint**
1. ✅ Crear colecciones MongoDB:
   - `configs_checklist`
   - Extender `documentos_oficiales` (si no existe)
   - `validaciones_empleados`

2. ✅ Crear índice Atlas Vector Search:
   ```javascript
   db.documentos_oficiales.createIndex({
     "chunks.embedding": "cosmosSearch"
   });
   ```

3. ✅ Implementar `GET /api/pedidos/[id]/vector-search`
   - Usar `MongoDBAtlasVectorSearch` de LangChain
   - Sin LLM, solo embedding + vector search
   - Retornar Top 15 docs + scores

4. ✅ Test unitario: `vector-search.test.ts`

**Entregable**: Vector search funcional sin LLM

---

### **DÍA 2: Checklist Extractor + Auto-clasificación**
1. ✅ Crear `lib/checklist-extractor.ts`:
   ```typescript
   export async function extractChecklist(docs: Document[]): Promise<ChecklistItem[]>
   export function autoClassify(item: ChecklistItem, config: ChecklistConfig): string | null
   ```

2. ✅ Implementar `GET /api/pedidos/[id]/checklist?config_id=xxx`

3. ✅ Tests:
   - `checklist-extractor.test.ts`

**Entregable**: Checklist dinámica generada y auto-clasificada

---

### **DÍA 3: Configurador CRUD Básico (Admin)**
1. ✅ Implementar APIs:
   - `GET /api/admin/configs-checklist`
   - `POST /api/admin/configs-checklist`
   - `PUT /api/admin/configs-checklist/[id]`
   - `DELETE /api/admin/configs-checklist/[id]`

2. ✅ Crear página `/admin/configs-checklist/page.tsx`

3. ✅ Componente básico `ConfiguratorFull.tsx` (sin drag-drop)

4. ✅ Seed default config en DB

**Entregable**: Admin puede crear/editar configs básicas

---

### **DÍA 4: Drag-Drop + UI Polish**
1. ✅ Integrar `@dnd-kit` en `ConfiguratorFull.tsx`

2. ✅ Componentes:
   - `DraggableItem.tsx`
   - `CategoriaEditor.tsx`

3. ✅ UI premium:
   - Color pickers
   - Icon pickers (lucide-react)
   - Validación Zod frontend

**Entregable**: Configurador interactivo completo

---

### **DÍA 5: Validación Empleado + Audit Trail**
1. ✅ Implementar `POST /api/pedidos/[id]/validate`

2. ✅ Crear `ValidationWorkflow.tsx`:
   - Integra `VectorResultsTable`
   - Integra `DynamicChecklist`
   - Botón "Validar y Firmar Digital"

3. ✅ Implementar `POST /api/pedidos/[id]/firma-digital`

4. ✅ Crear `AuditTrailViewer.tsx`

**Entregable**: Flujo completo validación funcional

---

### **DÍA 6-7: Testing Completo**
1. ✅ Tests integración
2. ✅ Tests E2E (Playwright)
3. ✅ Coverage report → 80%+

**Entregable**: Suite de tests completa

---

### **DÍA 8: Optimización + Performance**
1. ✅ Benchmark vector search (< 200ms)
2. ✅ Benchmark checklist extraction (< 500ms)
3. ✅ Optimizar queries MongoDB
4. ✅ Cache configs en memoria

**Entregable**: Performance optimizado

---

### **DÍA 9: Documentación**
1. ✅ Actualizar `README.md`
2. ✅ Documentar APIs
3. ✅ Guía usuario configurador

**Entregable**: Docs actualizadas

---

### **DÍA 10: Deploy + Monitoring**
1. ✅ Deploy staging (Vercel)
2. ✅ Smoke tests
3. ✅ Deploy producción
4. ✅ Monitoring dashboards

**Entregable**: Producción live ✅

---

## 🎯 REGLAS DE ORO - COMPLIANCE CHECKLIST

Antes de **CADA commit**, verificar:

- [ ] **TypeScript Strict**: 0 `any`, tipos explícitos en todas las funciones
- [ ] **Zod First**: Todos inputs validados con Zod ANTES de procesar
- [ ] **AppError**: No usar `Error()` genérico, solo `AppError` y subclases
- [ ] **Logging**: `logEvento` con `correlacion_id` en todas las operaciones
- [ ] **No Browser Storage**: No usar localStorage/sessionStorage/cookies directos
- [ ] **Client + Server Validation**: Validación doble (Zod en cliente Y servidor)
- [ ] **DB Transactions**: Operaciones múltiples DB dentro de `session.withTransaction()`
- [ ] **Performance**: Medir tiempos, loguear si excede SLA
- [ ] **Security Headers**: CORS, rate limiting, X-Content-Type-Options
- [ ] **No Secrets**: Variables de entorno, NUNCA hardcodeadas

---

## 📊 MÉTRICAS DE ÉXITO

### Técnicas
- ✅ Vector search P95 < 200ms
- ✅ Checklist extraction P95 < 500ms
- ✅ 0 errores críticos (primera semana producción)
- ✅ 80%+ test coverage

### Operacionales
- ✅ Reducción coste LLM: 95% ($0.10 → $0.001/pedido)
- ✅ Velocidad: 3x más rápido vs MVP actual
- ✅ N configuraciones creadas (meta: 5+ en primer mes)

### Negocio
- ✅ 100% validaciones con audit trail
- ✅ Compliance: todas firmas digitales registradas
- ✅ Satisfacción empleados: encuesta > 8/10

---

## ✅ CRITERIOS DE ACEPTACIÓN FINAL

- [ ] Admin puede crear N configs diferentes
- [ ] Empleado ve 15 docs + checklist dinámica correctamente
- [ ] Auto-clasificación funciona con 70%+ precisión
- [ ] Drag-drop recategorización fluido (< 100ms lag)
- [ ] Firma digital registrada en `validaciones_empleados`
- [ ] Audit trail completo exportable a PDF
- [ ] Vector search < 200ms P95
- [ ] Checklist extraction < 500ms P95
- [ ] 80%+ test coverage
- [ ] 0 RED FLAGS en código (no `any`, no secrets, etc)
- [ ] Producción desplegada sin errores
- [ ] Documentación actualizada y completa

---

## 🚨 IMPORTANTE: REGLAS DE IMPLEMENTACIÓN

1. **Seguir SIEMPRE** las Reglas de Oro en `Documentación/02/instrucciones-cursor-antigrávity`
2. **Zod primero**: Validar inputs antes de procesarlos
3. **TypeScript strict**: No usar `any`, tipos explícitos siempre
4. **Logging estructurado**: `logEvento` con `correlacion_id` en todas las operaciones
5. **AppError**: Nunca `throw Error()`, usar `AppError` y subclases
6. **Performance**: Medir y loguear si excede SLAs
7. **Tests**: Escribir tests antes de marcar como "completo"

---

**ESTE DOCUMENTO ES LA ESPECIFICACIÓN COMPLETA.**  
**Copiar/pegar a Cursor/Antigravity para generar código.**  
**Inicio estimado: Semana 5**  
**Entrega esperada: Fin Semana 6**
