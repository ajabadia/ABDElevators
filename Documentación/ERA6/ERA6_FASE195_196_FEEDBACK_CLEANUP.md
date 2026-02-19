# FASE 195-196: Feedback Loop, Value Dashboard & Placeholder Cleanup
## Guía de Ejecución Combinada

**Prioridad:** MEDIA-ALTA | **Estimación:** 4 semanas (2+2) | **Depende de:** FASE 192 (para feedback widget)

---

## FASE 195: Feedback Loop & Value-Oriented Dashboard

### 195.1: Answer Feedback Widget

**Componente nuevo:** `src/components/shared/AnswerFeedback.tsx`

**UI States:**
```
Estado 1 (default):
  "¿Fue útil?"  [👍] [👎]

Estado 2 (thumbs up):  
  "✓ Gracias por tu feedback"

Estado 3 (thumbs down → expandido):
  "¿Qué falló en esta respuesta?"
  [Incorrecta] [Incompleta] [Irrelevante] [Fuente errónea]
  [¿Qué información esperabas? _______________]
```

**Almacenamiento:**
```typescript
// Colección: rag_feedback (SecureCollection para tenant isolation)
interface RagFeedback {
  _id: ObjectId;
  tenantId: string;
  answerId: string;
  userId: string;
  type: 'thumbs_up' | 'thumbs_down';
  categories?: ('incorrect' | 'incomplete' | 'irrelevant' | 'source_wrong')[];
  expectedAnswer?: string;
  question: string;       // Para contexto
  documentSource: string; // De dónde venía
  createdAt: Date;
}
```

**Integración:**
- Embeber debajo de cada respuesta en `SimpleAnalyzeFlow`
- Embeber en resultados de `GlobalSemanticSearch`
- Embeber en `ConversationalSearch`

### 195.2: Value-Oriented Dashboard

**Cambios sobre el dashboard existente (NO crear nuevo):**

| Actual | Nuevo |
|--------|-------|
| "Tenants: 12" | (Solo visible SUPERADMIN) |
| "Casos: 1,234" | "Casos esta semana: 12 (+3 vs semana pasada)" |
| "Precisión: 94%" | "Confianza de respuestas: Alta en 85% de consultas" |
| "Storage: 45 GB" | (Solo visible en section "Uso del sistema" admin) |

**Secciones nuevas del dashboard:**

```
┌─────────────────────────────────────────────────┐
│  📌 Requiere tu atención (2)                     │
│  ┌──────────────────────────────────────┐       │
│  │ 📄 3 documentos sin indexar          ~2min  │
│  │ 📋 1 informe pendiente de revisión   ~5min  │
│  └──────────────────────────────────────┘       │
├─────────────────────────────────────────────────┤
│  📊 Este mes                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐                  │
│  │  24  │  │ 12h  │  │ 85%  │                  │
│  │ docs │  │saved │  │trust │                  │
│  │analizd│  │estim │  │ratio │                  │
│  └──────┘  └──────┘  └──────┘                  │
├─────────────────────────────────────────────────┤
│  💡 Sugerencias                                  │
│  "3 pedidos similares → ¿Crear checklist?"      │
│  "Normativa EN 81-20 con 2 meses de antigüedad" │
└─────────────────────────────────────────────────┘
```

**Cálculo de "tiempo ahorrado":**
```
tiempo_ahorrado = documentos_analizados × 30min (promedio lectura manual)
```

---

## FASE 196: Placeholder Cleanup & Technical Debt Reduction

### Inventario de Placeholders (Verificado 2026-02-19)

| Ruta | Estado | Acción propuesta |
|------|--------|-----------------|
| `admin/ai/predictive/page.tsx` | "coming_soon" | **OCULTAR** de navegación |
| `admin/security/sessions/page.tsx` | "coming_soon" | **OCULTAR** de navegación |
| `admin/operations/maintenance/page.tsx` | Empty state permanente | **OCULTAR** de navegación |
| `spaces/page.tsx` | "coming_soon" | **OCULTAR** o implementar básico |
| `admin/ai/page.tsx` | "coming_soon" parcial | Evaluar qué sub-features están reales |

### Race Conditions Conocidas

**Patrón a buscar:**
```bash
grep -rn --include="*.tsx" "setIsSaving(true)" src/ 
# Verificar que cada uno tiene un finally { setIsSaving(false) }
```

**Caso conocido:** `admin/organizations/general/page.tsx` → `setIsSaving(true)` sin `finally`.

**Fix pattern:**
```typescript
const handleSave = async () => {
  setIsSaving(true);
  try {
    await saveConfig(config);
    toast.success(t('saved'));
  } catch (error) {
    toast.error(t('save_error'));
  } finally {
    setIsSaving(false); // ← SIEMPRE
  }
};
```

### Security: error.message Exposure

**Archivo:** `middleware.ts`

```typescript
// ACTUAL (inseguro):
return new NextResponse(JSON.stringify({
  success: false,
  message: 'Middleware Error',
  error: error.message,  // ← Puede contener info sensible
}), { status: 500 });

// CORREGIDO:
return new NextResponse(JSON.stringify({
  success: false,
  message: 'Internal Server Error',
  code: 'MIDDLEWARE_ERROR',
  // error.message NUNCA se expone en producción
}), { status: 500 });
```

### DOMMatrix Polyfill

**Archivo:** `instrumentation.ts`

```typescript
// ACTUAL:
if (typeof global.DOMMatrix === 'undefined') {
    global.DOMMatrix = class DOMMatrix {
        multiply() { return this; }  // ← No hace nada real
    }
}
```

**Acción:** Investigar si `pdf-parse` realmente necesita esto o si hay versión actualizada que no lo requiere. Si es necesario, documentar POR QUÉ con un comentario claro.

### Toast & Error Texts

**Objetivo:** Todas las notificaciones en lenguaje de negocio.

**Patrón a buscar:**
```bash
grep -rn --include="*.tsx" "EXTERNAL_SERVICE_ERROR\|INTERNAL_ERROR\|DATABASE_ERROR" src/
```

**Mapeo:**
| Error técnico | Mensaje para usuario |
|--------------|---------------------|
| `EXTERNAL_SERVICE_ERROR` | "El servicio de análisis no está disponible. Inténtalo en unos minutos." |
| `DATABASE_ERROR` | "Error al guardar. Por favor, inténtalo de nuevo." |
| `VALIDATION_ERROR` | (Mostrar detalle del campo que falla) |
| `NOT_FOUND_ERROR` | "No se ha encontrado el recurso solicitado." |
| `INTERNAL_ERROR` | "Ha ocurrido un error inesperado. Si persiste, contacta con soporte." |

---

## ✅ Criterio de "Done" (Ambas fases)

### FASE 195:
- [ ] AnswerFeedback widget visible en todas las respuestas RAG
- [ ] Colección `rag_feedback` creada con SecureCollection
- [ ] Dashboard muestra "Requiere tu atención" con items accionables
- [ ] Métricas de valor ("Tiempo ahorrado") calculadas y mostradas
- [ ] Sección de métricas técnicas movida a panel colapsable

### FASE 196:
- [ ] 0 páginas "coming_soon" visibles en navegación
- [ ] Todos los `setIsSaving(true)` tienen `finally { setIsSaving(false) }`
- [ ] `error.message` no se expone en producción (middleware)
- [ ] DOMMatrix polyfill documentado o eliminado
- [ ] Toasts/errores en lenguaje de negocio (0 códigos técnicos visibles al usuario)
- [ ] Todos los endpoints referenciados en frontend verificados como existentes
