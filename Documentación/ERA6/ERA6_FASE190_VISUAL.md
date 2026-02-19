# FASE 190: Visual Consistency & Design Token Enforcement
## Guía de Ejecución Detallada

**Prioridad:** CRÍTICA | **Estimación:** 2 semanas | **Dependencias:** Ninguna (va primera)

---

## 🎯 Objetivo

Eliminar la fractura visual entre módulos. Un solo lenguaje de diseño en toda la plataforma.

---

## 📋 Inventario de Problemas (Verificado 2026-02-19)

### Archivos con colores hardcodeados

Comando para detectar:
```bash
grep -rn --include="*.tsx" -E "bg-(teal|orange|emerald|purple|red|green|blue|amber|cyan|violet|indigo|fuchsia|pink|rose|yellow|lime|sky)-[0-9]" src/
```

**Áreas afectadas conocidas (50+ archivos):**
- `src/verticals/elevators/components/` → Configurator, checklist-editor
- `src/components/workflow-editor/` → WorkflowToolbar, NodeLibrary, SimulationResultsPanel, CustomNodes/*
- `src/components/workflow/` → WorkflowStatusBar, WorkflowActions
- `src/components/ui/` → toast, timeline, slider, onboarding-overlay, metric-card, inline-help, help-tooltip, help-button, hero-card, filter-bar
- `src/components/technical/` → AgenticSupportSearch, DynamicChecklist, VectorResultsTable, RagReportView, CollaborationPanel
- `src/components/tickets/` → TicketList, TicketDetail, TicketBadges
- `src/components/shared/` → CommandMenu, ConversationalSearch, DynamicForm, EnvironmentSwitcher, CollaborationPresence, GlobalSemanticSearch
- `src/components/sandbox/` → SandboxChat
- `src/providers/` → BrandingProvider
- `src/verticals/real-estate/` → PropertyTwinViewer, CausalFlow

### Mapa de colores semánticos (variables de tema)

```css
/* Disponibles en globals.css via Shadcn theme */
--primary          → Acción principal, CTA, enlaces activos
--secondary        → Acción secundaria, tabs alternativas
--destructive      → Eliminar, errores, danger
--accent           → Highlight sutil, hover de fondo
--muted            → Texto deshabilitado, backgrounds sutiles
--foreground       → Texto principal
--muted-foreground → Texto secundario
--border           → Bordes y separadores
--ring             → Focus rings
--card             → Fondo de tarjetas
--popover          → Fondo de popovers
```

### Tabla de conversión (hardcoded → semántico)

| Hardcoded | Reemplazar por | Razón |
|-----------|---------------|-------|
| `bg-teal-600`, `bg-teal-500` | `bg-primary` | Color de acción principal |
| `text-teal-400`, `text-teal-500` | `text-primary` | Texto de enlace/acción |
| `hover:bg-teal-900/40` | `hover:bg-primary/10` | Hover sutil sobre fondo oscuro |
| `bg-purple-600`, `bg-purple-500` | `bg-secondary` | Acción secundaria |
| `text-purple-400` | `text-secondary` | Texto de acción alternativa |
| `bg-orange-600`, `bg-orange-500` | `bg-primary` o `bg-accent` | Depende del contexto |
| `text-red-500`, `bg-red-500` | `text-destructive`, `bg-destructive` | Acciones peligrosas |
| `hover:bg-red-900/20` | `hover:bg-destructive/10` | Hover destructivo |
| `bg-emerald-600` | `bg-primary` | En contexto de "success" |
| `text-green-500` | `text-primary` o custom `--success` | Indicador de éxito |
| `bg-blue-600` | `bg-primary` | Color genérico de acción |
| `border-teal-500` | `border-primary` | Focus/active borders |
| `shadow-teal-500/20` | `shadow-primary/20` | Sombras con tinte |

---

## 🔧 Procedimiento de Ejecución

### Paso 1: Auditoría masiva

```bash
# Contar archivos afectados
grep -rl --include="*.tsx" -E "bg-(teal|orange|emerald|purple|red|green|blue|amber|cyan|violet|indigo|fuchsia|pink|rose|yellow|lime|sky)-[0-9]" src/ | wc -l

# Listar archivos uno por uno
grep -rl --include="*.tsx" -E "(teal|orange|emerald|purple)-[0-9]" src/
```

### Paso 2: Reemplazo archivo por archivo

**NO hacer find & replace masivo.** Cada archivo requiere contexto:
- ¿El `teal-600` es un CTA? → `primary`
- ¿El `orange-500` es un warning? → `destructive` o `accent`
- ¿El `purple-600` es una tab alternativa? → `secondary`

**Usar la skill `ui-styling`** para cada componente para asegurar cumplimiento del sistema de diseño.

### Paso 3: Botones

Definir en `src/components/ui/button.tsx` exactamente 4 variantes:
- `default` → `bg-primary text-primary-foreground`
- `secondary` → `bg-secondary text-secondary-foreground`
- `ghost` → `bg-transparent hover:bg-accent`
- `destructive` → `bg-destructive text-destructive-foreground`
- `outline` → `border border-input bg-background`
- `link` → `text-primary underline`

Cualquier botón con clase ad-hoc fuera de estas variantes → convertir.

### Paso 4: Sombras y animaciones

**Sombras permitidas:**
- `shadow-sm` → Botones, inputs
- `shadow-md` → Cards
- `shadow-lg` → Modales, popovers
- `shadow-xl shadow-primary/20` → Solo para CTA principal (1 por página máximo)

**Animaciones permitidas:**
- `transition-all duration-200` → Hover effects
- `transition-colors` → Cambios de color
- `animate-spin` → Loading states
- `hover:scale-[1.02]` → Solo en cards interactivas
- Framer Motion: Solo para entradas/salidas de elementos, no para decoración

### Paso 5: Dark Mode

Verificar que cada componente que usa `bg-*` explícito tiene su contrapartida `dark:bg-*` o (mejor) usa variables de tema que se adaptan automáticamente.

---

## ✅ Criterio de "Done"

- [ ] `grep` del regex de colores hardcodeados devuelve 0 resultados
- [ ] Todos los botones usan variantes del sistema de diseño Shadcn
- [ ] Máximo 2 tipos de sombra por página
- [ ] Dark mode funciona en todas las páginas sin "flasheo" de colores
- [ ] Build de producción compila sin warnings de estilo

---

## 📁 Archivos clave a modificar (prioridad)

1. `src/components/workflow-editor/**` → ~15 archivos con colores dedicados
2. `src/components/technical/**` → ~6 archivos
3. `src/components/ui/**` → ~12 archivos (core del sistema de diseño)
4. `src/verticals/elevators/components/**` → ~6 archivos (parcialmente hecho en FASE 186)
5. `src/components/shared/**` → ~8 archivos
6. `src/components/tickets/**` → ~3 archivos
7. `src/app/(authenticated)/(admin)/admin/**` → Páginas individuales con estilos ad-hoc
