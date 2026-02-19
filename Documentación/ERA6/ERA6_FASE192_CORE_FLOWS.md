# FASE 192: Core Flow Optimization (Simple vs Expert Mode)
## Guía de Ejecución Detallada

**Prioridad:** ALTA | **Estimación:** 3 semanas | **Depende de:** FASE 190 + 191

---

## 🎯 Objetivo

Los 3 flujos core deben funcionar sin fricción en modo "Simple" por defecto.
El "Modo Experto" (configuración técnica actual) se oculta bajo un toggle.

---

## 🔬 Diagnóstico del Flujo Actual

### Flujo "Analizar Documento" (actual):
```
1. Navegar a Knowledge Hub o My Docs → 2-3 clicks
2. Elegir Space (o crear uno) → 1 click + decisión técnica
3. Upload con configuración de chunking → 1 click + decisión técnica  
4. Esperar procesamiento → Variable
5. Ir a Search o Playground → 2 clicks
6. Elegir modelo, temperatura, prompt template → 3 decisiones técnicas
7. Escribir pregunta → 1 acción
8. Interpretar "faithfulness: 0.87" → ??? (abandono)
```
**Total: ~8-12 clicks + 3-6 decisiones técnicas. TTFV: ~5-10 minutos.**

### Flujo "Analizar Documento" (objetivo):
```
1. Click "Analizar Documento" → 1 click
2. Drag & drop PDF → 1 acción (auto-detección de tipo)
3. Escribir pregunta (o elegir sugerencia) → 1 acción
4. Ver respuesta + fuentes destacadas → 0 acciones
```
**Total: 3 acciones. TTFV: < 60 segundos.**

---

## 🏗️ Componentes a Crear/Modificar

### 1. `SimpleAnalyzeFlow` (NUEVO)

```
Ubicación: src/components/analyze/SimpleAnalyzeFlow.tsx
```

**Estados del flujo:**
- `upload` → DropZone con preview del PDF
- `question` → Panel de pregunta con sugerencias contextuales
- `result` → Respuesta con fuentes visuales y feedback widget

**Comportamiento clave:**
- Al subir archivo, auto-detectar tipo → pre-configurar chunk size, modelo, temperatura
- Sugerencias de pregunta basadas en tipo de documento detectado
- Resultados muestran "Confianza: Alta/Media/Baja" (no scores numéricos)
- Fuentes como miniaturas de página PDF con highlight

### 2. `useSmartConfig` Hook (NUEVO)

```
Ubicación: src/hooks/useSmartConfig.ts
```

**Lógica:**
```typescript
// Pseudocódigo de referencia
type DocType = 'normativa' | 'manual_tecnico' | 'pedido' | 'informe' | 'generico';

const DOC_CONFIGS: Record<DocType, SmartConfig> = {
  normativa: { chunkSize: 1000, model: 'gemini-pro', temp: 0.1 },
  manual_tecnico: { chunkSize: 800, model: 'gemini-flash', temp: 0.2 },
  pedido: { chunkSize: 500, model: 'gemini-flash', temp: 0.1 },
  informe: { chunkSize: 1200, model: 'gemini-pro', temp: 0.3 },
  generico: { chunkSize: 800, model: 'gemini-flash', temp: 0.3 },
};
```

### 3. Confidence Humanizer (NUEVO)

```
Ubicación: src/lib/confidence-humanizer.ts
```

**Mapeo:**
| Score | Label | Color | Icono |
|-------|-------|-------|-------|
| ≥ 0.85 | "Alta" | `text-primary` (green-ish) | ✓✓ |
| 0.60 - 0.84 | "Media" | `text-amber-500` | ✓ |
| < 0.60 | "Baja" | `text-destructive` | ⚠️ |

**Mensaje contextual:**
- Alta: "Respuesta respaldada por múltiples fuentes"
- Media: "Algunas fuentes lo confirman, verifica en el documento original"
- Baja: "Información limitada, consulta un especialista"

### 4. Expert Mode Toggle

No es un componente nuevo. Es un `<details>` o `Collapsible` envolviendo la UI técnica existente:

```tsx
// Envolver las opciones avanzadas existentes
<Collapsible defaultOpen={false}>
  <CollapsibleTrigger className="text-sm text-muted-foreground">
    <Settings2 size={14} /> Modo experto (chunking, modelos, temperatura...)
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* UI existente del Playground/RAG Config */}
  </CollapsibleContent>
</Collapsible>
```

---

## 📋 Flujo 2: Buscar en Base de Conocimiento

### Cambios sobre la Search actual:

1. **Input prominente**: La caja de búsqueda actual (`GlobalSemanticSearch`) debe ser el elemento más visible, no estar escondida en tabs.

2. **Selector de ámbito simplificado**:
   - "Mi empresa" (todo)
   - "Mi espacio" (space del usuario)
   - "Manuales" (solo docs técnicos)
   
   No: "Hybrid Search" / "Vector Search" / "Keyword Search" → eso va a "Modo experto".

3. **Resultados con contexto**:
   - Preview inline del fragmento relevante con highlight amarillo
   - Nombre del documento fuente + página
   - "Ver más contexto" → expande
   - Métricas RAG (faithfulness, relevance) → ocultas bajo "Ver detalle técnico"

### Archivos a modificar:
- `src/components/shared/GlobalSemanticSearch.tsx`
- `src/components/shared/ConversationalSearch.tsx`
- `src/components/technical/VectorResultsTable.tsx` → simplificar columnas visibles

---

## 📋 Flujo 3: Generar Informe

### Cambios sobre el Report Hub actual:

1. **Template visual**: Cards con preview del template (no una lista de texto).
2. **Pre-filled**: Si el usuario acaba de analizar un documento, pre-llenar el informe con esos datos.
3. **One-click export**: Botón "Generar PDF" o "Enviar por email" sin configuración adicional.

### Archivos a modificar:
- `src/app/(authenticated)/(admin)/admin/reports/page.tsx`
- Templates existentes en `src/lib/reports/`

---

## ✅ Criterio de "Done"

- [ ] `SimpleAnalyzeFlow` funciona end-to-end: upload → pregunta → respuesta en ≤ 3 acciones
- [ ] `useSmartConfig` auto-configura basado en tipo de archivo (PDF normativa vs manual)
- [ ] Scores numéricos reemplazados por "Alta/Media/Baja" en todos los resultados RAG
- [ ] Search simplificado: 1 input + 3 opciones de ámbito (no selector de tipo de búsqueda)
- [ ] Expert Mode toggle funciona y preserva toda la funcionalidad avanzada actual
- [ ] TTFV medido < 60 segundos en flujo "Analizar Documento"

---

## ⚠️ Riesgos

- **auto-detección de tipo**: Si la heurística falla, el usuario puede recibir configuración subóptima. Mitigación: siempre ofrecer "Ajustar configuración" (expert mode).
- **Fuentes como miniaturas de PDF**: Requiere generación de thumbnails. Evaluar si `pdf-parse` o un servicio externo puede proveer esto. Si es muy costoso, usar solo número de página + texto extracto.
- **Ingesta rápida**: Para que TTFV < 60s, la ingesta debe ser synchronous o muy rápida. Si la cola actual tarda minutos, considerar un "modo rápido" con chunk más grande y sin embedding.
