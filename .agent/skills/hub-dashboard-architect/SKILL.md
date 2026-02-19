---
name: hub-dashboard-architect
description: Audita y refactoriza rutas de administración para implementar el patrón de Hub/Dashboard basado en fichas (Cards) con progressive disclosure, filtrado por rol y colores semánticos.
---

# Hub Dashboard Architect Skill (ERA 6 - UX-First)

Este skill guía la transformación de páginas de administración complejas o con múltiples sub-rutas en un "Hub" intuitivo basado en fichas (Cards), con progressive disclosure y filtrado por rol.

> **ERA 6: Regla fundamental**: Si un hub tiene más de 6 fichas visibles, DEBE agruparse en secciones con un bloque "Avanzado" colapsado por defecto.

## Cuándo usar este skill
- Cuando una ruta de administración tenga una navbar con más de 3-4 opciones.
- Cuando se quiera limpiar una página que muestra datos directamente sin un "punto de entrada" claro.
- Al consolidar sub-módulos dentro de una sección del menú lateral.
- **ERA 6**: Al refactorizar hubs para reducir la complejidad visible según el rol del usuario.

## Inputs necesarios
- **Ruta objetivo**: La página `page.tsx` a transformar.
- **Sub-rutas**: Lista de destinos, cada uno con su icono, título y descripción.
- **Diccionarios i18n**: Namespace de traducciones para las fichas.

## Workflow

### Fase 1: Análisis de Estructura y Roles
1. Identificar si la página actual tiene lógica de visualización que debería moverse a una sub-ruta "Detalle" o "Dashboard específico".
2. **Filtrar por rol** (ERA 6): Determinar qué fichas son visibles para cada rol (`USER`, `ADMIN`, `SUPERADMIN`). Usar `enforcePermission` o `activeModules` del guardian.
3. Listar las secciones que compondrán el Hub. Cada sección debe tener:
   - `title`: i18n key.
   - `description`: i18n key (máximo 120 caracteres).
   - `href`: Ruta de destino.
   - `icon`: Icono de `lucide-react`.
   - `borderColor`: Estilo de borde semántico (`border-l-primary`, `border-l-secondary`, `border-l-accent`, `border-l-destructive`).
   - `requiredRole`: Rol mínimo para ver esta ficha (opcional, default: visible para todos).
4. **Agrupar si > 6 fichas**: Si el hub tendría más de 6 fichas, dividir en secciones lógicas. La última sección debe ser "Avanzado" y estar colapsada por defecto.

### Fase 2: Implementación del Hub
1. Usar composiciones de `PageContainer` y `PageHeader`.
2. Implementar un grid responsivo: `grid gap-6 md:grid-cols-2 lg:grid-cols-3`.
3. Usar el componente `Card` de Shadcn UI con efectos hover y escalado: `hover:shadow-lg transition-all cursor-pointer border-l-4 group-hover:scale-[1.02]`.
4. **Bordes de categoría**: Usar SOLO variables semánticas (`border-l-primary`, `border-l-secondary`, `border-l-accent`, `border-l-destructive`). NUNCA `border-l-blue-500` ni colores por nombre.
5. **IMPORTANTE**: No incluya lógica de datos pesada en el Hub. Es un punto de despacho.

### Fase 2.5: Secciones Colapsables (ERA 6)
Si el hub tiene > 6 fichas, implementar agrupación:

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

{/* Secciones principales: visibles siempre */}
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {primaryCards.map(card => <HubCard key={card.href} {...card} />)}
</div>

{/* Sección avanzada: colapsada por defecto */}
<Collapsible defaultOpen={false} className="mt-8">
  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
    <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
    {t('advanced_section')}
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-4">
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {advancedCards.map(card => <HubCard key={card.href} {...card} />)}
    </div>
  </CollapsibleContent>
</Collapsible>
```

### Fase 3: Navegación y Retorno
1. Asegurar que cada página de destino tenga un botón o mecanismo de "Back" claro hacia el Hub.
2. Usar `Link` de Next.js para una navegación instantánea.

### Fase 4: Auditoría Cruzada (CRÍTICO)
1. **OBLIGATORIO**: Tras crear o modificar la ruta, ejecutar el skill `i18n-a11y-auditor`.
2. Verificar que no haya textos hardcodeados.
3. Asegurar que las fichas tengan `aria-label` descriptivo si es necesario, aunque el `CardTitle` suele ser suficiente.

## Instrucciones de Diseño
- **Iconografía**: Usar iconos de `lucide-react` consistentes con el dominio.
- **Colores de borde**: Solo variables semánticas: `border-l-primary`, `border-l-secondary`, `border-l-accent`, `border-l-destructive`. NUNCA colores por nombre (`blue-500`, `emerald-600`, etc.).
- **Colores de estado** (excepcionales): Solo para badges de status → `bg-amber-500/10 text-amber-600` (warning), `bg-destructive/10 text-destructive` (error). Estos son estándares UX universales, no branding.
- **Tipografía**: Mantener `text-xl tracking-tight` para títulos de ficha.
- **Progressive disclosure**: Máximo 6 fichas visibles sin scroll. El resto en sección colapsable.

## Output (formato exacto)
1. **Propuesta de Hub**: Tabla con Secciones, Iconos, Rutas y Rol requerido.
2. **Agrupación**: Si > 6 fichas, especificar cuáles van en "Avanzado".
3. **Nuevas Claves i18n**: Bloques JSON para `messages/[locale]/[namespace].json` (modular, NO monolítico).
4. **Código TSX**: Contenido para el nuevo `page.tsx` con filtrado por rol.
5. **Resultado de Auditoría**: Confirmación de ejecución de `i18n-a11y-auditor`.

## Manejo de Errores
- Si faltan iconos adecuados, pregunta al usuario por la intención del módulo.
- Si el Hub queda muy vacío (menos de 3 fichas), considera si el patrón de Tabs es más apropiado.
- Si el Hub tiene > 10 fichas tras filtrar por rol, recomienda fusionar sub-módulos antes de crear el Hub.
