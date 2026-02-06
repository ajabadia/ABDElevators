---
name: lazy-loading-list-auditor
description: Audita listas que cargan datos de base de datos para asegurar que implementan lazy loading con filtros, optimizando transferencia de datos y UX.
---

# Lazy Loading List Auditor

## Cuándo usar este skill

- Cuando una página muestra una lista de datos cargados desde base de datos (API)
- Cuando se detecta que una lista carga todos los datos en el montaje inicial
- Cuando se quiere optimizar el rendimiento de páginas con listas grandes
- Cuando se necesita aplicar el patrón de lazy loading con filtros

## Inputs necesarios

- **Ruta de la página**: Path absoluto del componente que contiene la lista (e.g., `src/app/(admin)/admin/prompts/page.tsx`)
- **Endpoint API**: Ruta del endpoint que provee los datos (e.g., `/api/admin/prompts`)
- **Tipo de datos**: Qué tipo de entidad se lista (prompts, traducciones, usuarios, etc.)

## Patrón de Referencia

Este skill se basa en el patrón implementado exitosamente en:
- `/admin/prompts` - Lazy loading con filtros de categoría
- `/admin/settings/i18n` - Lazy loading con filtros de namespace

### Características del Patrón

1. **Estado Vacío Inicial**: No cargar datos en el montaje
2. **Filtros Visibles**: Botones de filtro con contadores
3. **Mensaje Guía**: Texto claro indicando cómo cargar datos
4. **Carga Condicional**: `autoFetch` solo cuando hay filtros activos
5. **API con Filtros**: Backend soporta query params para filtrar

## Workflow

### Fase 1: Análisis

1. **Identificar el componente de lista**
   - Buscar `useApiList` o `useApiItem` con `autoFetch: true`
   - Verificar si carga datos sin filtros activos
   - Identificar el tamaño típico del dataset

2. **Analizar el endpoint API**
   - Verificar si soporta query parameters de filtrado
   - Identificar campos filtrables (categoría, namespace, tipo, etc.)
   - Comprobar si retorna contadores/stats

3. **Evaluar necesidad**
   - ✅ **SÍ aplicar** si:
     - Dataset > 50 items
     - Carga inicial sin filtros
     - Usuarios típicamente buscan/filtran
   - ❌ **NO aplicar** si:
     - Dataset < 20 items
     - Lista estática o de configuración
     - No hay campos filtrables lógicos

### Fase 2: Diseño

4. **Definir filtros apropiados**
   - Identificar dimensiones de filtrado (categoría, estado, tipo, etc.)
   - Crear endpoint `/stats` si es necesario para contadores
   - Diseñar UI de filtros siguiendo patrón existente

5. **Planificar cambios**
   - Backend: Agregar soporte de filtros al endpoint
   - Frontend: Estado de filtros + UI + lazy loading
   - Componente tabla/lista: Empty state guidance

### Fase 3: Implementación

6. **Backend API**
   ```typescript
   // Agregar query params
   const filter = searchParams.get('filter') || '';
   const search = searchParams.get('search') || '';
   
   // Lazy loading: retornar vacío si no hay filtros
   const hasActiveFilters = Boolean(filter || search);
   if (!hasActiveFilters) {
       return NextResponse.json({
           success: true,
           data: [],
           info: 'No filters applied'
       });
   }
   
   // Aplicar filtros
   const filtered = await applyFilters(data, { filter, search });
   return NextResponse.json({ success: true, data: filtered });
   ```

7. **Stats Endpoint** (RECOMENDADO)
   ```typescript
   // GET /api/admin/[resource]/stats
   // Retorna contadores por categoría/filtro
   // IMPORTANTE: Este endpoint SIEMPRE carga (autoFetch: true)
   // Es ligero (solo contadores) y permite mostrar filtros sin cargar datos completos
   
   export async function GET(req: NextRequest) {
       // Cargar todos los datos
       const allData = await fetchAllData();
       
       // Calcular contadores por categoría
       const categoryCounts: Record<string, number> = {};
       for (const item of allData) {
           const category = item.category || 'GENERAL';
           categoryCounts[category] = (categoryCounts[category] || 0) + 1;
       }
       
       const total = allData.length;
       
       return NextResponse.json({
           success: true,
           total,
           categories: categoryCounts
       });
   }
   ```

8. **Frontend State**
   ```typescript
   const [activeFilter, setActiveFilter] = useState('');
   const [searchQuery, setSearchQuery] = useState('');
   
   // '' = Sin filtro (empty state inicial)
   // '__ALL__' = Cargar todos los registros
   // 'category_name' = Filtrar por categoría específica
   const hasActiveFilters = Boolean(activeFilter || searchQuery);
   
   // Cargar stats SIEMPRE (ligero, solo contadores)
   const { data: stats } = useApiItem({
       endpoint: '/api/admin/resource/stats',
       autoFetch: true // ✅ Siempre carga
   });
   
   const totalCount = stats?.total || 0;
   const categoryCounts = stats?.categories || {};
   const categories = Object.keys(categoryCounts).sort();
   
   // Preparar parámetros para API
   const actualCategory = activeFilter === '__ALL__' ? '' : activeFilter;
   const allParam = activeFilter === '__ALL__' ? '&all=true' : '';
   
   // Cargar datos SOLO con filtros activos (lazy loading)
   const { data, isLoading } = useApiList({
       endpoint: `/api/admin/resource?filter=${actualCategory}&search=${searchQuery}${allParam}`,
       autoFetch: hasActiveFilters // ✅ Solo cargar si hay filtros
   });
   ```

9. **Filter UI Layout** (IMPORTANTE: Separar en filas)
   ```tsx
   <ContentCard>
       <div className="flex flex-col gap-4">
           {/* Search Bar - Full Width Row */}
           <div className="relative w-full">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <Input
                   placeholder="Buscar..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-10 h-11 w-full ..."
               />
           </div>
           
           {/* Filters - Separate Row */}
           <div className="flex flex-wrap gap-2">
               <button
                   onClick={() => setActiveFilter('')}
                   className={`... ${activeFilter === '' // ⚠️ Comparación explícita
                       ? "bg-teal-600 text-white"
                       : "bg-white text-slate-500"
                   }`}
               >
                   TODOS ({totalCount})
               </button>
               {categories.map(cat => (
                   <button
                       key={cat}
                       onClick={() => setActiveFilter(cat)}
                       className={`... ${activeFilter === cat
                           ? "bg-teal-600 text-white"
                           : "bg-white text-slate-500"
                       }`}
                   >
                       {cat.toUpperCase()}
                       <span>{categoryCounts[cat] || 0}</span>
                   </button>
               ))}
           </div>
       </div>
   </ContentCard>
   ```
   
   **⚠️ ERRORES COMUNES A EVITAR**:
   - ❌ `!activeFilter` → Siempre true para `''` y `undefined`
   - ✅ `activeFilter === ''` → Comparación explícita
   - ❌ Search y filtros en misma fila → Search queda comprimido
   - ✅ Search en fila separada con `w-full`

10. **Empty State**
    ```tsx
    {!hasActiveFilters ? (
        <EmptyState
            icon={<Search />}
            title="Busca o filtra para comenzar"
            description="Usa los filtros para cargar datos"
        />
    ) : filteredData.length === 0 ? (
        <NoResults />
    ) : (
        <DataList data={filteredData} />
    )}
    ```

### Fase 4: Verificación

11. **Testing Manual**
    - ✅ Página carga sin datos iniciales
    - ✅ Mensaje de guía visible
    - ✅ Filtros muestran contadores correctos
    - ✅ Click en filtro carga datos
    - ✅ Búsqueda funciona correctamente
    - ✅ Limpiar filtros vuelve a estado vacío

12. **Performance Check**
    - Verificar en DevTools Network: 0 requests iniciales
    - Verificar tamaño de respuesta con filtros activos
    - Confirmar mejora vs carga completa

## Instrucciones Detalladas

### Regla #1: No Aplicar Indiscriminadamente

**NO auditar listas si:**
- Son listas de configuración pequeñas (< 20 items)
- Son selectores/dropdowns
- Son menús de navegación
- No hay lógica de filtrado natural

**SÍ auditar listas si:**
- Cargan > 50 items de base de datos
- Tienen `autoFetch: true` sin condiciones
- Usuarios típicamente buscan/filtran
- Hay campos categóricos claros (tipo, estado, categoría, etc.)

### Regla #2: Seguir Patrón Establecido

Usar como referencia:
- [prompts/page.tsx](file:///d:/desarrollos/ABDElevators/src/app/(authenticated)/(admin)/admin/prompts/page.tsx)
- [i18n/page.tsx](file:///d:/desarrollos/ABDElevators/src/app/(authenticated)/(admin)/admin/settings/i18n/page.tsx)

Mantener consistencia en:
- Nombres de estado (`activeFilter`, `hasActiveFilters`)
- Estructura de UI (filtros horizontales con contadores)
- Mensajes de empty state
- Estilos de botones (teal-600 activo, outline inactivo)

### Regla #3: Backend Primero

Siempre verificar/implementar soporte de filtros en backend ANTES de cambiar frontend:
1. Agregar query params al endpoint
2. Implementar lógica de filtrado
3. Retornar objeto vacío si no hay filtros
4. Crear endpoint `/stats` si se necesitan contadores

### Regla #4: Documentar Mejoras

Después de implementar, documentar:
- Reducción en transferencia de datos (antes/después)
- Número de queries evitadas
- Mejora en tiempo de carga inicial

## Output (formato exacto)

### Reporte de Auditoría

```markdown
# Auditoría: [Nombre de la Lista]

## Estado Actual
- **Endpoint**: /api/admin/[resource]
- **Items cargados inicialmente**: [número]
- **Tamaño de transferencia**: [KB]
- **Tiene filtros**: [Sí/No]
- **Lazy loading**: [Sí/No]

## Evaluación
- **Aplicar lazy loading**: [✅ Sí / ❌ No]
- **Razón**: [explicación breve]

## Cambios Propuestos (si aplica)

### Backend
- [ ] Agregar query params: `filter`, `search`
- [ ] Implementar lógica de filtrado
- [ ] Retornar vacío si no hay filtros
- [ ] Crear endpoint `/stats` (opcional)

### Frontend
- [ ] Agregar estado de filtros
- [ ] Implementar UI de filtros
- [ ] Configurar `autoFetch: hasActiveFilters`
- [ ] Agregar empty state guidance

### Beneficios Esperados
- Reducción de queries iniciales: [número] → 0
- Reducción de transferencia: [KB] → [KB]
- Mejora UX: Estado vacío con guía clara
```

## Manejo de Errores

- Si no hay campos filtrables claros → **Preguntar al usuario** qué dimensiones usar
- Si el dataset es pequeño (< 50 items) → **No aplicar**, reportar que no es necesario
- Si ya existe lazy loading → **Reportar** que cumple con el patrón
- Si hay dudas sobre la necesidad → **Pedir confirmación** antes de implementar

## Checklist de Calidad

Antes de marcar como completo:
- [ ] Backend soporta filtros y retorna vacío sin ellos
- [ ] Frontend tiene estado `hasActiveFilters`
- [ ] UI de filtros muestra contadores
- [ ] Empty state tiene mensaje guía claro
- [ ] Build pasa sin errores
- [ ] Testing manual confirma 0 queries iniciales
- [ ] Documentación actualizada (walkthrough)
