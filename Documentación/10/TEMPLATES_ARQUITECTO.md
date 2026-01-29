# 📋 TEMPLATES PARA TU TRABAJO COMO ARQUITECTO

**Herramientas para especificar y revisar código**

29 Enero 2026, 03:00 CET

---

## 📝 TEMPLATE 1: ESPECIFICACIÓN TÉCNICA

**Usa este template para darle tareas claras a Antigravity**

---

### ESPECIFICACIÓN: useFormModal

```markdown
# ESPECIFICACIÓN: useFormModal Hook

## OBJETIVO
Crear un hook reutilizable que maneje el estado completo de un modal de formulario.
El hook debe ser agnóstico de formulario específico y funcionar en:
- Crear usuario
- Editar usuario
- Crear documento
- Editar documento
- Crear pedido
- Editar pedido
- Crear tenant
- Editar tenant

## COMPORTAMIENTO ESPERADO

### Estado del Hook
El hook debe mantener:
1. `isOpen: boolean` - Si el modal está abierto
2. `mode: 'create' | 'edit'` - Qué operación se está haciendo
3. `data: any` - Los datos del objeto siendo editado (null si es crear)
4. `errors: Record<string, string>` - Errores de validación por campo

### Métodos Exportados

#### `open(data?: any)`
- Si `data` es null/undefined → abre en modo CREATE
- Si `data` tiene contenido → abre en modo EDIT con esos datos
- Limpia errores previos

#### `close()`
- Cierra el modal
- NO limpia datos (por si usuario cancela y vuelve a abrir)

#### `reset()`
- Cierra el modal
- Limpia TODO (datos, errores, estado)

#### `setErrors(errors: Record<string, string>)`
- Actualiza errores de validación
- Cada clave es el nombre del campo
- Cada valor es el mensaje de error

### Casos de Uso

**Caso 1: Crear documento**
```typescript
const modal = useFormModal()

// Usuario hace click en "Nuevo documento"
<Button onClick={() => modal.open()}>Nuevo</Button>

// Modal se abre en modo CREATE
// FormModal renderiza con campos vacíos
```

**Caso 2: Editar documento**
```typescript
const modal = useFormModal()

// Usuario hace click en editar sobre item con id=123
<Button onClick={() => modal.open(documento)}>Editar</Button>

// Modal se abre en modo EDIT
// FormModal pre-llena con datos del documento
```

**Caso 3: Validación falla**
```typescript
try {
  await api.save(formData)
  modal.close() // Éxito, cierra
} catch (error) {
  modal.setErrors(error.fieldErrors) // Muestra errores
}
```

**Caso 4: Usuario cancela**
```typescript
// Usuario hace click en "Cancelar"
<Button onClick={() => modal.close()}>Cancelar</Button>

// Modal cierra pero datos permanecen
// Si abre de nuevo, verá los mismos datos
```

**Caso 5: Nueva operación limpia anterior**
```typescript
// Estaba editando documento A
modal.open(documentoA)

// Ahora quiere crear uno nuevo
modal.reset() // Limpia todo
modal.open() // Abre limpio para CREATE
```

### Requisitos No Funcionales

- **Performance:** Estado debe actualizarse <5ms (useCallback)
- **SSR Safe:** Funciona en Next.js (no usa DOM APIs)
- **TypeScript:** Completamente tipado con genéricos si es posible
- **Testing:** Debe ser fácil testear sin React Testing Library

### Criterios de Aceptación

- [ ] Hook creado en `hooks/useFormModal.ts`
- [ ] Exports: `useFormModal`
- [ ] Funciona en `admin-usuarios.tsx` (crear/editar usuario)
- [ ] Funciona en `admin-documentos.tsx` (crear/editar documento)
- [ ] Funciona en `admin-pedidos.tsx` (crear/editar pedido)
- [ ] Tests unitarios: 100% coverage
- [ ] JSDoc completo
- [ ] Sin console.errors
- [ ] Tipo exportado: `FormModalState`

### Riesgos / Edge Cases

**¿Qué pasa si...?**
- Usuario abre modal, hace click fuera (onBackdropClick) → Should call close()
- Usuario intenta guardar, falla → Errores se muestran, modal permanece abierto
- Usuario cambia data mientras modal está abierto → Hook debe ser agnóstico
- Usuario abre modal Create, luego click Editar otro item → reset() automático o manual?

**Decisión requerida:** ¿El hook debe auto-reset al abrir con nuevo data, o es responsabilidad del componente?

### Notas de Implementación

- Inspirarse en el patrón de `useApiMutation`
- NO debe hacer calls API (solo state management)
- Reutilizable en DynamicFormModal (que sí hace API calls)
- Compatible con Zod/Yup para validación

---

### ESPECIFICACIÓN: useLocalStorage

```markdown
# ESPECIFICACIÓN: useLocalStorage Hook

## OBJETIVO
Crear un hook que sincronice estado con localStorage.
Debe ser SSR-safe y sincronizar automáticamente entre pestañas del mismo navegador.

## COMPORTAMIENTO ESPERADO

### API
```typescript
const [value, setValue] = useLocalStorage<T>(key: string, initialValue: T)
```

Idéntico al API de `useState`, pero persistente.

### Comportamiento de Persistencia

1. **Primer render:** Lee desde localStorage
   - Si existe `localStorage[key]` → usa ese valor
   - Si NO existe → usa `initialValue`

2. **Cambios:** Escribe automáticamente a localStorage
   - Cuando llamas `setValue(newValue)` → se guarda a localStorage
   - Si localStorage está lleno → debe haber error handling

3. **Entre pestañas:** Sincroniza automáticamente
   - Si user abre pestaña A y B del mismo site
   - Cambia storage en A → B se actualiza automáticamente
   - Usa `storage` event listener

### Casos de Uso

**Caso 1: Guardar preferencias del usuario**
```typescript
const [theme, setTheme] = useLocalStorage('theme', 'light')

// Cuando user cambia tema:
setTheme('dark') // → Se guarda a localStorage automáticamente
```

**Caso 2: Persistir filtros de búsqueda**
```typescript
const [searchFilters, setSearchFilters] = useLocalStorage('pedidos-filters', {
  estado: 'pendiente',
  fecha: null
})

// Usuario cambia filtro:
setSearchFilters({...searchFilters, estado: 'completado'})
// → Se guarda, si refresca página, filtra sigue ahí
```

**Caso 3: Sincronizar entre pestañas**
```typescript
// Pestaña A:
const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebar-open', false)
<Button onClick={() => setSidebarCollapsed(true)}>Expand</Button>

// Pestaña B:
const [sidebarCollapsed] = useLocalStorage('sidebar-open', false)
// → Automáticamente se actualiza si cambio en Pestaña A
```

### Requisitos No Funcionales

- **SSR Safe:** En servidor, devuelve initialValue
- **Type Safe:** Genéricos <T> para cualquier tipo JSON
- **Storage Error:** Si localStorage está lleno, debe loguear (no fallar)
- **JSON Safe:** Solo tipos serializables (no Functions, Dates directas)

### Criterios de Aceptación

- [ ] Hook en `hooks/useLocalStorage.ts`
- [ ] API idéntico a useState
- [ ] Sincroniza entre pestañas automáticamente
- [ ] SSR safe (no error en servidor)
- [ ] Maneja localStorage full gracefully
- [ ] Tests: localStorage read, write, sync, SSR
- [ ] JSDoc claro
- [ ] Sin console.errors
- [ ] Usado en: admin-tenants.tsx (branding preview), pedidos.tsx (filtros)

### Riesgos / Edge Cases

- "¿Qué pasa si value es un objeto y user lo muta directamente?"
  → Debería hacer shallow copy o documentar que no hacer mutations
  
- "¿Qué pasa si localStorage excede cuota?"
  → Debe loguear error pero no quebrar la app
  
- "¿Qué pasa si JSON.parse falla?"
  → Usar try/catch, fallback a initialValue
  
- "¿Qué pasa si user abre 10 pestañas?"
  → Debería sincronizar en todas automáticamente (storage event)

### Notas de Implementación

- Usar `storage` event para sync entre pestañas
- CustomEvent para sync en misma pestaña
- Considerar debounce si value cambia muy frecuentemente
- No serializar Dates directamente (usar strings ISO)

---

## 📋 TEMPLATE 2: ESPECIFICACIÓN DE COMPONENTE

### ESPECIFICACIÓN: Feedback Visual de Optimismo

```markdown
# ESPECIFICACIÓN: Feedback Visual en Deletes/Updates

## OBJETIVO
Cuando usuario elimina o actualiza un item, debe SENTIR que fue rápido.
Hoy: Spinner, luego desaparece.
Necesario: Visual feedback que inspira confianza.

## COMPORTAMIENTO ESPERADO

### Delete con Optimismo

**Antes:**
1. User hace click en botón delete
2. Spinner aparece
3. [Esperar respuesta API]
4. Item desaparece

**Después:**
1. User hace click en botón delete
2. Item se grisa/desvanece **al instante**
3. Aparece toast: "Eliminando... [undo button]" por 3 segundos
4. Si falla → Item se restaura con animación

### Update con Optimismo

**Antes:**
1. User guarda formulario
2. Spinner
3. [Esperar respuesta API]
4. Modal cierra

**Después:**
1. User guarda formulario
2. Modal cierra **al instante** (optimista)
3. Toast: "Guardando..." con spinner
4. Si falla → Modal reabre con errores

## DONDE IMPLEMENTAR

- `admin-documentos.tsx` → Delete documento
- `admin-usuarios.tsx` → Delete usuario, Update rol
- `admin-pedidos.tsx` → Update estado pedido
- `admin-tenants.tsx` → Update configuración

## VISUAL STYLE

- **Delete**: Fade out + rojo tenue 50ms
- **Undo**: "Eliminando... [Deshacer]" en amber-100 background
- **Success toast**: Checkmark verde, 2s
- **Error**: Roll back con animación, error toast

## CRITERIOS DE ACEPTACIÓN

- [ ] Delete items se grisan al instante
- [ ] Undo funciona (restaura item)
- [ ] Update cierra modal al instante
- [ ] Animaciones suaves (no jarring)
- [ ] Funciona en mobile
- [ ] Tests: optimism + failure + undo

---

### ESPECIFICACIÓN: Indicadores de Estado de Red

```markdown
# ESPECIFICACIÓN: DataStateIndicator Component

## OBJETIVO
User siempre debe saber QUÉ está pasando con los datos.

## ESTADOS A MOSTRAR

| Estado | Icono | Color | Texto | Cuándo |
|--------|-------|-------|-------|--------|
| Loading | Spinner | Gray | "Cargando..." | Primer fetch |
| Fetching | Zap | Amber | "Sincronizando..." | Re-fetch sin loading |
| Error | Alert | Red | "Error, reintentando..." | Falla en fetch |
| Cached | Checkmark | Green | "En caché local" | Data está en memoria |
| Ready | - | - | (nada) | Data lista, no cargando |

## DONDE MOSTRAR

- Top de tablas (junto a refresh button)
- Top de modales (junto a título)
- Sidebar (estado global)

## STYLING

- Pequeño (12px text)
- Discreto pero visible
- Anime el icono (spinner gira, zap pulsa)

## CRITERIOS DE ACEPTACIÓN

- [ ] Componente `DataStateIndicator`
- [ ] Usado en: admin-documentos, admin-usuarios, admin-pedidos
- [ ] Recibe: isLoading, isFetching, isError, isCached
- [ ] Anima iconos apropiadamente
- [ ] Tests

---

### ESPECIFICACIÓN: EntityEngine Dinámico

```markdown
# ESPECIFICACIÓN: Propagar EntityEngine a UI

## OBJETIVO
Hoy: EntityEngine existe pero admin-documentos.tsx tiene <TableHead> hardcodeados.
Necesario: Las columnas se generen dinámicamente desde entity.columns.

## DONDE CAMBIAR

### admin-documentos.tsx
**ANTES:**
```tsx
<TableHead>Documento</TableHead>
<TableHead>Tipo Modelo</TableHead>
<TableHead>Versión</TableHead>
<TableHead>Estado</TableHead>
<TableHead>Fragmentos</TableHead>
<TableHead>Acciones</TableHead>
```

**DESPUÉS:**
```tsx
const entity = EntityEngine.getInstance().getEntity('documento')
{entity.columns.map(col => (
  <TableHead key={col.key}>{col.label}</TableHead>
))}
<TableHead>Acciones</TableHead>
```

### admin-usuarios.tsx
Similar a documentos

### admin-pedidos.tsx
Similar a documentos

### DynamicFormModal
Usar entity.fields para generar campos automáticamente (si no está ya)

## BENEFICIOS

- Agnosis REAL: Agregar campo a Documento = cambio automático en tabla
- Mantenimiento: Un lugar para definir estructura (EntityEngine)
- Mobile: Fácil esconder columnas según viewport

## CRITERIOS DE ACEPTACIÓN

- [ ] admin-documentos: Columnas dinámicas
- [ ] admin-usuarios: Columnas dinámicas  
- [ ] admin-pedidos: Columnas dinámicas
- [ ] DynamicFormModal: Campos dinámicos (si aplica)
- [ ] Mobile: Columnas se esconden en <768px
- [ ] Tests: Cambiar EntityEngine → tabla actualiza

---

## 🎯 CÓMO USAR ESTOS TEMPLATES

### Paso 1: Personalizar
Copia el template relevante y adapta a tu situación:
- Cambia "documento" por tu entidad
- Agrega casos de uso específicos
- Especifica riesgos que ves

### Paso 2: Enviar a Antigravity
Envía la especificación completa.
Antigravity sabrá exactamente qué hacer.

### Paso 3: Revisar cuando termine
Usa el template de REVISIÓN para validar que cumple.

---

## ✅ LISTO PARA USAR

Copia, pega, personaliza, envía.

Antigravity sabrá qué hacer exactamente.

