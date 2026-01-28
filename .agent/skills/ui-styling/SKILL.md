---
name: ui-styling
description: Audita y estandariza la interfaz de usuario basándose en las reglas de identidad visual (Layout, Colores, Headers).
---

# UI Styling & Standardization Skill

## Cuándo usar este skill
- Cuando el usuario pida "arreglar el estilo" de una página.
- Cuando se detecten inconsistencias visuales (márgenes, colores hardcodeados).
- Cuando se cree una nueva página y deba cumplir el estándar "Enterprise".

## Inputs necesarios
- Ruta del archivo `.tsx` a auditar.
- (Opcional) Referencia a `STYLE_GUIDE.md` si hay dudas específicas.

## Workflow
1. **Lectura**: Lee el archivo y detecta si usa clases manuales (`div className="space-y-6"`, `bg-white dark:bg-slate-900`).
2. **Refactorización**: Reemplaza estructuras manuales por los **Componentes Primitivos**:
    - `<PageContainer>`
    - `<PageHeader>`
    - `<ContentCard>`
3. **Limpieza**: Elimina imports no usados y clases redundantes.

## Instrucciones y Reglas

### 1. Primitivos de UI (OBLIGATORIO)

#### Layout Global
❌ Manual:
```tsx
<div className="space-y-6 animate-in fade-in duration-500">
```
✅ Componente:
```tsx
import { PageContainer } from "@/components/ui/page-container";
/* ... */
<PageContainer>
  {/* contenido */}
</PageContainer>
```

#### Headers
❌ Manual:
```tsx
<div className="flex justify-between...">
    <h1 className="text-2xl..."><span className="bg-teal-600..." /> Título <span className="text-teal-600">Hightlight</span></h1>
</div>
```
✅ Componente:
```tsx
import { PageHeader } from "@/components/ui/page-header";
/* ... */
<PageHeader 
    title="Título" 
    highlight="Destacado" 
    subtitle="Descripción..."
    actions={<Button>Acción</Button>} 
/>
```

#### Contenedores (Cards)
❌ Manual:
```tsx
<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm...">
    <CardContent className="p-0">...</CardContent>
</Card>
```
✅ Componente:
```tsx
import { ContentCard } from "@/components/ui/content-card";
/* ... */
<ContentCard noPadding={true}>
    {/* Tabla o contenido */}
</ContentCard>
```

### 2. Colores y Branding
- **Primary**: Siempre `teal-600` para acciones principales.
- **Acciones Secundarias**: `variant="outline"` (Slate).
- **Dark Mode**: Los componentes primitivos ya lo manejan. Solo preocúpate de contenido específico (textos custom).

## Output (formato exacto)
- **Refactorización**: "Aplicados componentes de sistema (PageContainer, PageHeader) en [Archivo]".
- **Branding**: "Colores ajustados a Teal Identity".
