# 🎯 PLAN MAESTRO: 40 HORAS HACIA PRODUCTO COMPLETO

**Integración Total: Código + UI + Arquitectura + Producción**

29 Enero 2026, 02:55 CET

---

## 📊 RESUMEN EJECUTIVO

**Objetivo:** Pasar de "Fase 31 58% ready" a "Producto 85%+ ready"

**Tiempo:** 40 horas (5 días × 8h distribuidas entre Tú + Antigravity)

**Resultado:** 
- ✅ 8/8 hooks funcionando
- ✅ UI que refleja la potencia
- ✅ Arquitectura agnóstica completa
- ✅ Producción posible (aunque falta post-work)

---

## 🗓️ DESGLOSE POR SEMANA

### SEMANA 1: LUNES-VIERNES (20 horas)

#### **LUNES (8h)**

**TÚ (2h):**
- Revisar los 6 hooks actuales (1h)
  - ¿Son agnósticos realmente?
  - ¿Hay gaps?
  - ¿Documentación clara?
- Especificar useFormModal (1h)
  - Usar TEMPLATES_ARQUITECTO.md
  - Personalizar para tu caso
  - Enviar a Antigravity

**ANTIGRAVITY (6h):**
- useFormModal implementación (3h)
- Testing useFormModal (1h)
- useFormModal integración en archivos (2h)

---

#### **MARTES (8h)**

**TÚ (2h):**
- Revisar useFormModal implementado (1h)
  - ¿Cumple especificación?
  - ¿Hay edge cases?
  - Feedback
- Especificar useLocalStorage (1h)
  - Personalizar template
  - Enviar a Antigravity

**ANTIGRAVITY (6h):**
- useLocalStorage implementación (2h)
- Testing useLocalStorage (1h)
- Integración en 2-3 archivos (2h)
- Iniciar useFilterState mejora (1h)

---

#### **MIÉRCOLES (8h)**

**TÚ (2h):**
- Revisar useLocalStorage (1h)
  - ¿Sincroniza entre pestañas?
  - ¿SSR safe?
  - Feedback
- Especificar "Feedback visual de optimismo" (1h)
  - Detallar casos de uso
  - Dónde implementar
  - Enviar a Antigravity

**ANTIGRAVITY (6h):**
- Feedback visual de optimismo (2h)
- Indicadores de estado de red (2h)
- Testing feedback + indicadores (2h)

---

#### **JUEVES (8h)**

**TÚ (2h):**
- Revisar feedback visual (1h)
- Revisar indicadores de red (1h)
- Feedback y especificación de transiciones

**ANTIGRAVITY (6h):**
- Transiciones suaves (2h)
- Progress bars para uploads (1h)
- EntityEngine propagation start (2h)
- Testing (1h)

---

#### **VIERNES (8h)**

**TÚ (3h):**
- Revisar transiciones (1h)
- Testing E2E funcional (tú como usuario) (1h)
- Especificar últimos detalles (1h)

**ANTIGRAVITY (5h):**
- EntityEngine completo (2h)
- Mobile optimization (1h)
- Final testing (1h)
- Documentación (1h)

---

### SEMANA 2: LUNES-MIÉRCOLES (20 horas)

#### **LUNES S2 (8h)**

**TÚ (2h):**
- Testing E2E completo
  - Crear documento → mostrar → editar → eliminar
  - Crear usuario → login → cambiar rol
  - Crear pedido → analizar → ver resultado
- Documentar: "¿Qué funcionó? ¿Qué falta?"

**ANTIGRAVITY (6h):**
- Security review (1h)
- Performance audit (1h)
- Code documentation (2h)
- Fixes menores (2h)

---

#### **MARTES S2 (4h)**

**TÚ (2h):**
- Revisión final (2h)
  - ¿Listo para producción?
  - Qué necesita más trabajo
  - Prioridades

**ANTIGRAVITY (2h):**
- Últimos ajustes
- Documentación final

---

#### **MIÉRCOLES S2 (2h)**

**TÚ (1h):**
- Aprobación final

**ANTIGRAVITY (1h):**
- Preparación para deploy

---

## 📊 DISTRIBUCIÓN DE HORAS

| Actividad | Tú | Antigravity | Total |
|-----------|-----|------------|--------|
| **Especificación** | 8h | - | 8h |
| **Revisión** | 6h | - | 6h |
| **Testing funcional** | 3h | - | 3h |
| **Implementación** | - | 25h | 25h |
| **Testing técnico** | - | 5h | 5h |
| **Documentación** | - | 3h | 3h |
| **TOTAL** | **17h** | **33h** | **40h** |

---

## 🎯 DETALLES TÉCNICOS POR TAREA

### TAREA 1: useFormModal (3h Antigravity)

```typescript
// hooks/useFormModal.ts
interface FormModalState {
  isOpen: boolean
  mode: 'create' | 'edit'
  data: any
  errors: Record<string, string>
}

export function useFormModal() {
  const [state, setState] = useState<FormModalState>({
    isOpen: false,
    mode: 'create',
    data: null,
    errors: {}
  })

  const open = useCallback((data?: any) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      mode: data ? 'edit' : 'create',
      data: data || null
    }))
  }, [])

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      data: null,
      errors: {}
    }))
  }, [])

  const setErrors = useCallback((errors: Record<string, string>) => {
    setState(prev => ({...prev, errors}))
  }, [])

  const reset = useCallback(() => {
    setState({
      isOpen: false,
      mode: 'create',
      data: null,
      errors: {}
    })
  }, [])

  return { ...state, open, close, setErrors, reset }
}
```

**Tests:**
```typescript
describe('useFormModal', () => {
  it('should open with create mode by default', () => {})
  it('should open with edit mode when data provided', () => {})
  it('should clear errors on close', () => {})
  it('should reset to initial state', () => {})
})
```

---

### TAREA 2: useLocalStorage (2h Antigravity)

```typescript
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  // SSR safe: check if window exists
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
        // Dispatch event para sync entre tabs
        window.dispatchEvent(
          new CustomEvent('local-storage', {
            detail: { key, value: valueToStore }
          })
        )
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Sync entre tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue] as const
}
```

---

### TAREA 3: Feedback Visual de Optimismo (2h Antigravity)

```typescript
// components/OptimisticDelete.tsx
export function OptimisticDelete({ 
  itemId, 
  onDelete, 
  className 
}: {
  itemId: string
  onDelete: (id: string) => Promise<void>
  className?: string
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const undoTimeoutRef = useRef<NodeJS.Timeout>()

  const handleDelete = async () => {
    setIsDeleting(true)
    setShowUndo(true)

    undoTimeoutRef.current = setTimeout(() => {
      setShowUndo(false)
    }, 3000)

    try {
      await onDelete(itemId)
      toast.success('Eliminado')
      setIsDeleting(false)
    } catch (error) {
      setIsDeleting(false)
      setShowUndo(false)
      toast.error('Error al eliminar')
    }
  }

  if (showUndo) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg"
      >
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <span className="text-sm text-amber-700">Eliminando...</span>
        <button
          onClick={() => clearTimeout(undoTimeoutRef.current)}
          className="text-xs font-bold text-amber-600 hover:text-amber-700 underline"
        >
          Deshacer
        </button>
      </motion.div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className={className}
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  )
}
```

---

### TAREA 4: Indicadores de Red (1h Antigravity)

```typescript
// components/DataStateIndicator.tsx
export function DataStateIndicator({
  isLoading,
  isFetching,
  isError,
  isCached
}: {
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  isCached: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {isLoading && (
        <div className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
          <span className="text-slate-500">Cargando...</span>
        </div>
      )}
      
      {isFetching && !isLoading && (
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-amber-500 animate-pulse" />
          <span className="text-amber-600">Sincronizando...</span>
        </div>
      )}
      
      {isError && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          <span className="text-red-600">Error, reintentando...</span>
        </div>
      )}
      
      {!isLoading && !isFetching && !isError && isCached && (
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          <span className="text-emerald-600">En caché</span>
        </div>
      )}
    </div>
  )
}
```

---

### TAREA 5: Transiciones (2h Antigravity)

```typescript
// components/ModalWithTransition.tsx
export function ModalWithTransition({
  isOpen,
  onClose,
  title,
  children
}: {
  isOpen: boolean
  onClose: void
  title: string
  children: ReactNode
}) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            <div className="space-y-4">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

### TAREA 6: EntityEngine Dinámico (2h Antigravity)

```typescript
// components/DataTable.tsx - ANTES (hardcoded)
<TableHead>Documento</TableHead>
<TableHead>Tipo Modelo</TableHead>
<TableHead>Versión</TableHead>

// DESPUÉS (dinámico)
const entity = EntityEngine.getInstance().getEntity('documento')
const columns = entity.columns.map(col => (
  <TableHead key={col.key} className={col.className}>
    {col.label}
  </TableHead>
))

<TableHeader>
  <TableRow>
    {columns}
    <TableHead>Acciones</TableHead>
  </TableRow>
</TableHeader>
```

---

## 📈 PROGRESS TRACKING

**Semana 1:**
```
Lunes:    [████░░░░░░░░░░░░░░] 20% (Hooks basics)
Martes:   [████████░░░░░░░░░░] 40% (Hooks complete)
Miércoles:[████████████░░░░░░] 65% (UI visible)
Jueves:   [████████████████░░░] 80% (Transiciones)
Viernes:  [██████████████████] 100% (Listo)
```

---

## ✅ CHECKLIST MAESTRO

### CÓDIGO (Camino A) - Viernes S1
- [x] 8/8 hooks implementados y testeados
- [x] JSDoc completo
- [x] Zero console.errors

### UI (Camino B) - Viernes S1
- [x] Feedback visual en deletes/updates
- [x] Indicadores de estado de red
- [x] Transiciones suaves
- [x] Progress bars funcionales

### ARQUITECTURA (Camino C) - Viernes S1
- [x] EntityEngine usado en todos los CRUD
- [x] Columnas dinámicas funcionales
- [x] Mobile responsive 95%+

### PRODUCCIÓN (Camino D) - Miércoles S2
- [x] E2E testing completo
- [x] Documentación profesional
- [x] Security review
- [x] Performance audit
- [x] Deployment ready

---

## 🎯 MÉTRICA DE ÉXITO

**Después de 40 horas:**

| Métrica | Objetivo | Esperado |
|---------|----------|----------|
| Hooks funcionales | 8/8 | ✅ 100% |
| Tests | 80%+ | ✅ 85%+ |
| UI feedback | 100% visible | ✅ Sí |
| Mobile responsive | 100% | ✅ 95%+ |
| Performance | LCP <2.5s | ✅ <2.0s |
| Code coverage | 75%+ | ✅ 80%+ |
| Documentación | Completa | ✅ Sí |

**Resultado:** Producto ready para producción.

---

## 💡 REGLA DE ORO

**Cada día, al final:**
```
✅ Commit con mensaje descriptivo
✅ Síntesis: "¿Qué aprendí hoy?"
✅ Actualizar este plan si hay cambios
✅ Dormir 6+ horas (importante)
```

---

**Mañana al despertar: Comenzamos Lunes 8h con especificación de useFormModal.**

**¿Listo?**
