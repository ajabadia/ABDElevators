# STYLE_GUIDE.md - ABD RAG Platform Master Identity (v1.0)

Este documento define las reglas **inmutables** de estilo y layout para todas las páginas de la aplicación.
El objetivo es mantener una consistencia visual de "Grado Enterprise" y evitar la fragmentación del diseño.

---

## 🏗️ 1. Estructura de Página (Layout)

### Regla Principal: Uso del Espacio
❌ **PROHIBIDO:** Usar contenedores con ancho fijo (`max-w-*` o `container`) dentro de las páginas (`page.tsx`).
✅ **CORRECTO:** Dejar que el layout principal (`AuthenticatedLayout` / `DashboardLayout`) controle los márgenes externos. El contenido debe intentar ocupar el 100% disponible.

**Ejemplo Correcto (`page.tsx`):**
```tsx
export default function Page() {
    return (
        <div className="space-y-6"> {/* Espaciado vertical estándar */}
            {/* Header */}
            {/* Contenido */}
        </div>
    );
}
```

---

## 🎩 2. Encabezados (Global Headers)

Todos los encabezados de página deben seguir *estrictamente* este patrón visual y estructural.

### Componentes:
1.  **Contenedor**: `flex justify-between items-center` (o `items-start` en mobile si es necesario).
2.  **Píldora Teal**: `bg-teal-600 w-1.5 h-8 rounded-full` (Indicador visual de marca).
3.  **H1**: `text-2xl font-bold flex items-center gap-2`.
4.  **Keyword**: Resaltar la palabra clave en teal (`<span className="text-teal-600">Keyword</span>`).
5.  **Subtítulo**: `text-slate-500 mt-1`.

**Snippet:**
```tsx
<div className="flex justify-between items-center">
    <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
            Título de <span className="text-teal-600">Página</span>
        </h1>
        <p className="text-slate-500 mt-1">Descripción corta y funcional.</p>
    </div>
    
    {/* Botones de Acción (Opcional) */}
    <div>
        <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Elemento
        </Button>
    </div>
</div>
```

---

## 📦 3. Contenedores de Contenido (Cards & Tables)

### Estilo de Tarjetas/Paneles
✅ **Borde y Fondo:** `bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800`.
✅ **Sombra (Depth):** Usar `shadow-sm` para una elevación sutil y elegante (estilo `/perfil`). Evitar sombras pesadas (`shadow-xl`) salvo en elementos flotantes.
✅ **Overflow:** `overflow-hidden` para mantener bordes redondeados en tablas.

**Snippet:**
```tsx
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
    {/* Contenido (Tabla, Gráfico, Formulario) */}
</div>
```

---

## 🎨 4. Paleta de Colores & Dark Mode

El sistema soporta nativamente modo claro y oscuro. Todos los componentes deben definir ambos estados.

### Modo Claro (Light)
*   **Fondo App:** `bg-slate-50`
*   **Fondo Panel:** `bg-white`
*   **Borde:** `border-slate-200`
*   **Texto Principal:** `text-slate-900`
*   **Texto Secundario:** `text-slate-500`

### Modo Oscuro (Dark)
*   **Fondo App:** `dark:bg-slate-950` (Profundidad total)
*   **Fondo Panel:** `dark:bg-slate-900` (Elevación nivel 1)
*   **Borde:** `dark:border-slate-800` (Contraste sutil)
*   **Texto Principal:** `dark:text-slate-100`
*   **Texto Secundario:** `dark:text-slate-400`

**Snippet Dark Mode:**
```tsx
<h2 className="text-slate-900 dark:text-white">Título</h2>
<p className="text-slate-500 dark:text-slate-400">Subtítulo</p>
<div className="border-slate-200 dark:border-slate-800">...</div>
```

---

## 🏢 5. Personalización de Tenants (Branding)

Aunque la UI base utiliza **Teal (`teal-600`)** como color corporativo "System", la plataforma está preparada para White-Label.

### Reglas de Aplicación de Color:
1.  **Elementos Estructurales (Admin):** Usan siempre la paleta **System (Teal)** para mantener consistencia operativa.
    *   *Ejemplo:* Sidebar de administración, botones de configuración global.
2.  **Elementos Facing-User (Tenant):** Pueden heredar el color primario del tenant si se requiere.
    *   *Mecanismo:* CSS Variables (`--primary-color`) inyectadas en el layout del tenant.
    *   *Componente:* `ConfigProvider` o `TenantWrapper`.

> **Nota:** Por defecto, usar clases Tailwind (`text-teal-600`) para la interfaz administrativa. Si un componente es "End-User Facing" (e.g., Portal de Cliente), usar variables CSS o clases dinámicas basadas en configuración.

---

## 🚫 6. Anti-Patrones Comunes (A Evitar)

1.  ❌ **Márgenes Laterales Manuales**: No usar `mx-auto` ni `px-4` en el root del componente `page.tsx`.
2.  ❌ **Títulos "Sueltos"**: H1 sin la píldora teal o sin subtítulo explicativo.
3.  ❌ **Sombras Negras Duras**: Evitar `shadow-black` directo. Usar las de Tailwind (`shadow-sm`, `shadow-md`) que ya están calibradas.
4.  ❌ **Fondos Negro Puro**: Evitar `bg-black` en modo oscuro. Usar `bg-slate-950`.

---

*Documento vivo. Si dudas, consulta `/admin/tipos-documento` como referencia canónica.*
