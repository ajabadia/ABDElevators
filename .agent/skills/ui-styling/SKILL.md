---
name: ui-styling
description: Audita y estandariza la interfaz de usuario basándose en componentes de sistema (Shadcn + Custom Primitives) y gestión de estado con Zustand.
---

# UI Styling & Standardization Skill (v11.0 — ERA 11)


## Cuándo usar este skill
- Cuando el usuario pida "arreglar el estilo" o "mejorar la UX" de una página.
- Cuando se detecten inconsistencias visuales o estilos inline redundantes.
- En procesos de refactorización para migrar estados complejos (`useState`) a Zustand.
- Al crear nuevas funcionalidades administrativas o técnicas de alta complejidad.

## Uncodixify Standards (Anti-AI Patterns)

Para evitar el "Default AI Look" (bordes sobredimensionados, sombras dramáticas, paneles flotantes, degradados corporativos), aplicamos las reglas de **Uncodixify**:

- **Radios Estrictos**: Máximo `8px` (`rounded-lg`) para botones y `16px` (`rounded-2xl`) para tarjetas.
- **Uncodixify 3.0 (Zero-Waterfall)**: NUNCA hagas fetches secuenciales en componentes. Usa `Promise.all` o Server Components para carga paralela.
- **Plataforma Unificada (Regla CORE)**: NUNCA hardcodees estilos de tarjetas o títulos por componente. Usa las clases de utilidad de plataforma en `globals.css`.
- **Jerarquía Real**: Usa tipografía estándar centrada en el peso `font-black` para títulos y `font-bold` para secundarios.
- **Sombras Sutiles**: Uso obligatorio de `shadow-sm`. Evita efectos de "elevación" exagerados.
- **Layouts "Normales"**: Sidebars sólidos, headers limpios, formularios alineados a la izquierda.
- **Degradados**: NUNCA uses degradados corporativos para "parecer premium". Usa colores sólidos o el color `primary` definido en el tema.

## Workflow

### 1. Auditoría de Estado (Zustand First)
Antes de tocar el UI, analiza la complejidad del estado:
- **Regla de Oro**: Si un componente tiene más de 3 estados relacionados, prop-drilling de >2 niveles, o lógica de negocio que "ensucie" el renderizado → **Usa Zustand**.
- **Acción**: Crea un store en `src/store/[feature]-store.ts` y centraliza la lógica.

### 2. Estructura de UI (System Components)
Reemplaza layouts manuales por **Componentes Primitivos**:
- `<PageContainer>`: Envuelve toda la página (márgenes, animaciones fade-in).
- `<PageHeader>`: Títulos, subtítulos y botones de acción.
- `<ContentCard>`: Contenedores con estilo consistente para formularios, tablas o listados.
- **Adaptive Navigation (Era 16)**: Al definir nuevas rutas en `navigation-config.ts`, añadir `complexity: 'expert'` si el módulo no es para uso operativo diario (técnicos).

### 3. Limpieza de Estilos y Tematización (Branding First)
- **Acción**: Usa siempre variables semánticas: `bg-background`, `bg-card`, `border-border`, `text-foreground`.
- **DRY Design Tokens**: Usa las clases de plataforma centralizadas:
    - `.platform-card`: Para todas las tarjetas y superficies elevadas.
    - `.platform-title`: Para títulos principales (`font-black tracking-tight`).
    - `.platform-subtitle`: Para subtítulos y texto secundario (`font-bold`).
- **Primary Color**: Para el color principal de la marca, usa `text-primary`, `bg-primary`, `border-primary`. NUNCA uses `teal-XXX` para diseño estructural.
- **Auditoría**: Si ves `teal-XXX` o `slate-XXX` hardcodeado en un componente, REEMPLÁZALO por su equivalente semántico o token de plataforma.

## Guía de Implementación

### Layout Estándar
❌ Manual:
```tsx
<div className="p-6 space-y-4">
  <h1 className="text-2xl font-bold">Título</h1>
  <div className="bg-slate-950 p-4 border border-slate-800 rounded-lg">...</div>
</div>
```

✅ Estandarizado (Theme-aware):
```tsx
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

<PageContainer>
  <PageHeader title="Título" subtitle="Descripción corta" actions={<AddButton />} />
  <ContentCard className="bg-card/50 backdrop-blur-sm border-border">
    {/* Tu contenido aquí */}
  </ContentCard>
</PageContainer>
```

### 4. Tablas de Datos (DataTable)
Las tablas deben ser legibles y profesionales en ambos temas.

❌ Hardcoded Dark:
```tsx
<div className="bg-slate-950 border-slate-800">
  <TableHeader className="bg-slate-900">
     <TableCell className="text-slate-300">...</TableCell>
  </TableHeader>
</div>
```

✅ Theme-Aware Table (Shadcn compliant):
```tsx
<div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
  <Table>
    <TableHeader className="bg-muted/50 text-foreground">
      <TableRow className="border-border">
         <TableHead className="text-foreground font-semibold">Columna</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="border-border/50 hover:bg-primary/5">
        <TableCell className="text-foreground/90">Dato</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### 5. Gestión de Estado
❌ Prop-Drilling:
```tsx
const [data, setData] = useState([]);
/* ... */
<SubComponent data={data} onUpdate={setData} />
```

✅ Zustand Store:
### 6. Grid System para Dashboards
❌ Layouts rígidos o Flexbox anidados:
```tsx
<div className="flex flex-col gap-4">
  <div className="flex gap-4">
    <Card className="w-1/3" />
    <Card className="w-1/3" />
    <Card className="w-1/3" />
  </div>
</div>
```

✅ CSS Grid Layout:
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <MetricCard title="Total" value="120" />
  <MetricCard title="Active" value="98" />
  <MetricCard title="Pending" value="12" />
  <MetricCard title="Failed" value="10" />
</div>
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
  <ContentCard className="col-span-4">
    {/* Main Chart */}
  </ContentCard>
  <ContentCard className="col-span-3">
    {/* Recent Activity */}
  </ContentCard>
</div>
```

### 7. Tokens de Diseño (Sidebar & Navigation)
Usa las variables CSS globales para componentes de navegación (`globals.css`):
- `bg-sidebar`: Fondo del sidebar.
- `text-sidebar-foreground`: Texto principal.
- `bg-sidebar-accent`: Elemento activo o hover.
- `text-sidebar-primary`: Color de acento (branding).
- `border-sidebar-border`: Bordes internos.

```tsx
<aside className="bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
  <NavLink className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
</aside>
```

### 8. Sistema de Pestañas (Tabs Navigation)
Usa este patrón para navegación interna de dashboards (`Tabs` de shadcn/ui):

```tsx
<Tabs defaultValue="overview" className="space-y-6">
  <TabsList className="bg-muted p-1 rounded-2xl border border-border w-full flex justify-start overflow-x-auto">
    <TabsTrigger value="overview" className="rounded-xl px-6">Vista General</TabsTrigger>
    <TabsTrigger value="settings" className="rounded-xl px-6 gap-2">
      <Settings size={16} /> Configuración
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="overview" className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
     {/* Contenido */}
  </TabsContent>
</Tabs>
```

### 9. Tarjetas de Métricas (KPIs)
Para mostrar números grandes o estados, usa `<MetricCard />`:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <MetricCard
    title="Total Usuarios"
    value="1,234"
    icon={<Users />}
    trend="+12%"
    trendDirection="up"
  />
</div>
```

### 10. React 19 Patterns (Obligatorio)
- **NO ForwardRef**: Pasa `ref` como una prop normal.
- **use(Context)**: Usar `use()` para lectura condicional de contextos.
- **Transitions**: Usar `startTransition` para actualizaciones de estado no urgentes.

### 11. Animaciones y Transiciones
Aplica siempre clases de entrada para suavizar la carga:
- Páginas enteras: `<PageContainer className="animate-in fade-in duration-300">`
- Elementos internos: `animate-in fade-in duration-300` (Evita animaciones `slide-in` o `bounce` innecesarias).

### 11. Breadcrumbs Dinámicos
Usa siempre `<DynamicBreadcrumb />` en el `<Header />` para navegación automática basada en rutas.

### 12. Compatibilidad con Modos (Light/Dark)
Toda interfaz debe ser funcional y estética en ambos temas:
- **Contraste**: Verifica que el texto sea legible (WCAG AA mínimo: 4.5:1 para texto normal, 3:1 para grande).
- **Semántica de Colores**: Usa variables CSS como `text-foreground` y `bg-background` en lugar de clases rígidas como `text-slate-900`.
- **Ajuste de Sombras**: En modo oscuro, las sombras deben ser más sutiles o reemplazarse por bordes (`border-border`).
- **Imágenes y Logos**: Asegura que el logo tenga variantes o sea visible sobre fondos claros y oscuros.
- **Transiciones**: Añade transiciones suaves al cambiar de tema para evitar destellos (`transition-colors duration-300`).
- **DataTable Fix**: Asegura que el header use `bg-muted` y las filas tengan bordes `border-border/50` para evitar el efecto de "mancha gris" en modo claro.

### 13. ERA 11: Auditoría Visual Masiva
Cuando se aplique este skill a escala (FASE 290+), usar el siguiente flujo:

**Paso 1: Detectar archivos afectados**
```bash
grep -rl --include="*.tsx" -E "bg-(teal|orange|emerald|purple|red|green|blue|amber|cyan|violet|indigo|fuchsia|pink|rose|yellow|lime|sky)-[0-9]" src/
```

**Paso 2: Para cada archivo, aplicar conversión:**
- Colores de branding (`teal`, `purple`, `orange`, `blue`, `indigo`) → `primary`, `secondary`, `accent`
- Colores de estado (`red` para error, `amber` para warning, `green` para success) → `destructive`, se permite `amber-500` y `green-500` como estándares UX universales (no son branding)
- Grises hardcodeados (`slate-950`, `slate-800`) → `background`, `card`, `muted`, `border`

**Paso 3: Verificar dark mode** tras cada cambio.

**Referencia detallada:** [ERA11_ARCHITECTURE.md](file:///d:/desarrollos/ABDElevators/ERA_11_ARCHITECTURE.md)

## Output (formateo exacto)
- **Estado**: "Migrada lógica de estado a Zustand Store ([store-name])".
- **UI**: "Estandarizados componentes visuales ([PageContainer/Header/Card])".
- **Limpieza**: "Eliminados estilos hardcodeados (slate-X) y aplicadas variables semánticas (bg-card/border-border)".
- **Modos**: "Verificada legibilidad y contraste en Modo Claro y Oscuro".
- **ERA 11**: "Uso obligatorio de `HubPage` y `MetricCard`. `sonner` implementado como única vía de feedback visual."
- **Uncodixify**: "Aplicados estándares Anti-AI (radios 8-12px, sin degradados corporativos, jerarquía tipográfica real)."
