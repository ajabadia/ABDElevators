---
name: ui-styling
description: Audita y estandariza la interfaz de usuario basándose en componentes de sistema (Shadcn + Custom Primitives) y gestión de estado con Zustand.
---

# UI Styling & Standardization Skill (v2.0)

## Cuándo usar este skill
- Cuando el usuario pida "arreglar el estilo" o "mejorar la UX" de una página.
- Cuando se detecten inconsistencias visuales o estilos inline redundantes.
- En procesos de refactorización para migrar estados complejos (`useState`) a Zustand.
- Al crear nuevas funcionalidades administrativas o técnicas de alta complejidad.

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

### 3. Limpieza de Estilos
- Elimina clases de fondo y bordes hardcodeadas (`bg-white`, `border-slate-200`). Los primitivos ya manejan el **Dark Mode**.
- Usa `teal-600` solo para la acción principal (Primary).
- Usa `variant="outline"` para acciones secundarias.

## Guía de Implementación

### Layout Estándar
❌ Manual:
```tsx
<div className="p-6 space-y-4">
  <h1 className="text-2xl font-bold">Título</h1>
  <div className="bg-white p-4 border rounded-lg">...</div>
</div>
```

✅ Estandarizado:
```tsx
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

<PageContainer>
  <PageHeader title="Título" subtitle="Descripción corta" actions={<AddButton />} />
  <ContentCard>
    {/* Tu contenido aquí */}
  </ContentCard>
</PageContainer>
```

### Gestión de Estado
❌ Prop-Drilling:
```tsx
const [data, setData] = useState([]);
/* ... */
<SubComponent data={data} onUpdate={setData} />
```

✅ Zustand Store:
### 4. Grid System para Dashboards
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

### 5. Tokens de Diseño (Sidebar & Navigation)
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

### 6. Sistema de Pestañas (Tabs Navigation)
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

### 7. Tarjetas de Métricas (KPIs)
Para mostrar números grandes o estados, usa `<MetricCard />`:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <MetricCard
    title="Total Usuarios"
    value="1,234"
    icon={<Users />}
    trend="+12%"
    trendDirection="up"
    color="blue"
  />
</div>
```

### 8. Animaciones y Transiciones
Aplica siempre clases de entrada para suavizar la carga:
- Páginas enteras: `<PageContainer className="animate-in fade-in duration-500">`
- Elementos internos: `animate-in fade-in slide-in-from-bottom-4 duration-500`

### 9. Breadcrumbs Dinámicos
Usa siempre `<DynamicBreadcrumb />` en el `<Header />` para navegación automática basada en rutas.

## Output (formateo exacto)
- **Estado**: "Migrada lógica de estado a Zustand Store ([store-name])".
- **UI**: "Estandarizados componentes visuales ([PageContainer/Header/Card])".
- **Limpieza**: "Eliminados estilos inline y ajustado branding a Teal-Identity".
