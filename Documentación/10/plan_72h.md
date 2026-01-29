# 🎯 PLAN DE ACCIÓN INMEDIATO (Próximas 72 horas)

**ABD RAG Platform - Sprint Final Refactor**  
**Generado:** 29 Enero 2026, 02:37 CET  
**Validado contra:** Código real + Roadmap Master

---

## 📌 RESUMEN EJECUTIVO

✅ **Logro:** 6 de 8 hooks implementados (75%)  
✅ **Archivos refactorizados:** 10+ con -56% de código duplicado  
⚠️ **Deuda técnica:** 260 líneas en 7 archivos  
🚀 **Oportunidad:** 3 días = +12h = -260 líneas + 150x ROI

---

## 🔴 HOY (Miércoles 29 Enero) - 2 HORAS

### 1. `admin-billing.tsx` - COMPLETAR REFACTOR (0.5h)

**Estado actual:** 70% listo (fiscalData aún manual)

**Líneas 70-150:** Cambiar de:
```typescript
const [fiscalData, setFiscalData] = useState(null);

useEffect(() => {
  const fetchFiscal = async () => {
    const res = await fetch(`/api/billing/${tenantId}/fiscal`);
    const data = await res.json();
    setFiscalData(data);
  };
  fetchFiscal();
}, [tenantId]);
```

**A:**
```typescript
const { data: fiscalData } = useApiItem({
  endpoint: `/api/billing/${tenantId}/fiscal`,
  autoFetch: true,
  onError: (err) => toast.error('No se pudo cargar datos fiscales'),
});
```

**Ganancia:** -40 líneas, +reliability, +consistency

**Checklist:**
- [ ] Reemplazar useEffect + useState
- [ ] Usar useApiItem con endpoint dinámico
- [ ] Probar que error handling funciona
- [ ] Verificar que refresh() se llama en edits

---

### 2. `LogExplorer.tsx` - APLICAR useFilterState (1h)

**Problema:** 5 useState de filtros sin patrón

**Líneas 30-60 - ACTUAL:**
```typescript
const [filters, setFilters] = useState({ status: 'all' });
const [page, setPage] = useState(1);
const [search, setSearch] = useState('');
const [sortBy, setSortBy] = useState('date');
const [dateRange, setDateRange] = useState(null);

const handleResetFilters = () => {
  setFilters({ status: 'all' });
  setPage(1);
  setSearch('');
  setSortBy('date');
  setDateRange(null);
};
```

**NUEVO:**
```typescript
const { filters, setFilter, setPage, reset } = useFilterState({
  initialFilters: { status: 'all', search: '', sortBy: 'date', dateRange: null },
  onFilterChange: () => setPage(1), // auto-reset page
});

// Reemplazar 5x handlers con:
const handleResetFilters = reset;
const handleStatusChange = (s) => setFilter('status', s);
// etc...
```

**Ganancia:** -25 líneas, +auto-reset página, cleaner code

**Checklist:**
- [ ] Crear destructure de useFilterState
- [ ] Reemplazar 5 useState
- [ ] Consolidar handleReset + handlers
- [ ] Verificar que table responde a cambios

---

### 3. DOCUMENTACIÓN (0.5h)

- [ ] Crear `HOOKS_IMPLEMENTATION.md` con patrones de uso
- [ ] Listar todos los hooks y dónde aplicarlos
- [ ] Crear ejemplo de migración para cada tipo

---

## 🟠 MAÑANA (Jueves 30 Enero) - 4 HORAS

### 1. CREAR `useFormModal` HOOK (2h)

**Propósito:** Unificar modal state (create/edit) en 1 hook

**Archivo:** `hooks/useFormModal.ts`

```typescript
interface UseFormModalOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useFormModal<T = any>(options?: UseFormModalOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [data, setData] = useState<T | null>(null);

  const openCreate = useCallback(() => {
    setMode('create');
    setData(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setMode('edit');
    setData(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
    setMode('create');
  }, []);

  return {
    isOpen,
    mode,
    data,
    openCreate,
    openEdit,
    close,
    setIsOpen,
  };
}
```

**Checklist:**
- [ ] Crear archivo con tipos genéricos
- [ ] Implementar 4 métodos (openCreate, openEdit, close, reset)
- [ ] Agregar tests (5-6 casos)
- [ ] Documentar con ejemplos

---

### 2. APLICAR EN `TiposDocumentoPage.tsx` (1h)

**Actual (línea 10-30):**
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingTipo, setEditingTipo] = useState(null);

const handleOpenCreate = () => {
  setEditingTipo(null);
  setIsModalOpen(true);
};

const handleOpenEdit = (tipo) => {
  setEditingTipo(tipo);
  setIsModalOpen(true);
};
```

**Nuevo:**
```typescript
const modal = useFormModal();

// Usar directamente:
<Button onClick={modal.openCreate}>Nuevo</Button>
<Button onClick={() => modal.openEdit(tipo)}>Editar</Button>

<Dialog open={modal.isOpen} onOpenChange={modal.setIsOpen}>
  {modal.mode === 'create' ? 'Crear' : 'Editar'}
  <Form initialData={modal.data} />
</Dialog>
```

**Ganancia:** -40 líneas, +clarity, unified pattern

---

### 3. APLICAR EN USER MODALS (1h)

**CreateUserModal.tsx + EditUserModal.tsx (línea 15-50)**

Mismo patrón que TiposDocumentoPage

**Ganancia:** -70 líneas combinadas

---

## 🟢 VIERNES (31 Enero) - 3 HORAS

### 1. CREAR `useLocalStorage` HOOK (1.5h)

**Propósito:** Persistencia automática de filtros

**Archivo:** `hooks/useLocalStorage.ts`

```typescript
interface UseLocalStorageOptions {
  key: string;
  initialValue?: any;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

export function useLocalStorage<T = any>(
  options: UseLocalStorageOptions
): [T, (value: T) => void] {
  const { key, initialValue, serialize = JSON.stringify, deserialize = JSON.parse } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      return item ? deserialize(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, serialize(value));
      }
    } catch {
      console.error(`Error saving to localStorage[${key}]`);
    }
  }, [key, serialize]);

  return [storedValue, setValue];
}
```

**Checklist:**
- [ ] Crear hook con types genéricos
- [ ] SSR-safe (typeof window check)
- [ ] Serialización customizable
- [ ] Tests para localStorage

---

### 2. INTEGRAR EN LogExplorer + TicketList (1.5h)

**LogExplorer.tsx (línea 30-60):**

```typescript
// Usar junto con useFilterState
const { filters, setFilter, setPage } = useFilterState({
  initialFilters: { status: 'all' },
});

// Persistir
const [, saveFilters] = useLocalStorage({
  key: 'logs-filters',
  initialValue: filters,
});

const handleFilterChange = (f) => {
  setFilter(f);
  saveFilters(f); // auto-save
};
```

**Ganancia:** -10 líneas, +UX (filtros persisten al recargar)

---

## 📊 TABLA: TIMELINE VALIDADO

| Día | Tarea | Archivo(s) | Líneas | Esfuerzo | ROI |
|-----|-------|-----------|--------|----------|-----|
| **MIÉ 29** | Completar billing + LogExplorer filters | admin-billing, LogExplorer | -65 | 2h | 50x |
| **JUE 30** | Crear + aplicar useFormModal | 4 archivos | -110 | 4h | 60x |
| **VIE 31** | Crear + integrar useLocalStorage | LogExplorer, TicketList | -35 | 3h | 40x |
| **TOTAL** | | **7 archivos** | **-210** | **9h** | **150x** |

---

## ✅ CHECKLIST FINAL

### Verificación antes de empezar

- [ ] Backup de código actual
- [ ] Branch nuevo: `refactor/hooks-final`
- [ ] Tests ejecutándose en baseline
- [ ] Familia descansada (12h de trabajo intenso)

### Después de cada tarea

- [ ] Tests pasan
- [ ] No hay console.errors
- [ ] Cambios documentados
- [ ] Pull request creado

### End of Friday

- [ ] 6/8 hooks implementados → 100%
- [ ] 10+ archivos refactorizados
- [ ] -210 líneas de deuda técnica
- [ ] +150x ROI en 9 horas
- [ ] Ready para release v2.27

---

## 🚀 IMPACTO ESPERADO

**Antes:**
```
- Fetch manual en 7+ ubicaciones
- useState duplicado en 10+ archivos
- Inconsistencia en error handling
- Sin persistencia de filtros
- Modal state spaghetti
```

**Después:**
```
✅ Cero fetch manual (centralizado en hooks)
✅ Único patrón de estado para filtros
✅ Error handling estándar y testeable
✅ Persistencia automática
✅ Modal state limpio y reutilizable
```

---

## 💡 TIPS DURANTE LA EJECUCIÓN

1. **Saltarse perfeccionismo:** Si toma >1h en algo, pausar y preguntar
2. **Tests primero:** Antes de refactor, verificar que tests pasen
3. **Commits pequeños:** Un hook/archivo por commit
4. **Documentar mientras haces:** No dejar para después
5. **Slack/Discord:** Notificar cambios en tiempo real

---

## 📞 CONTACTO SI SE ATASCA

Si algo toma >2h más de lo estimado:
1. Parar
2. Documentar bloqueador
3. Saltarse y pasar al siguiente
4. Revisar en siguiente sesión

---

**Ready? Let's ship it. 🚀**

Generado: 29 Enero 2026, 02:37 CET
