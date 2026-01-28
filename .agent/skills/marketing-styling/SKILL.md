---
description: Guía de estilo y principios de diseño para las páginas públicas y de marketing de ABDElevators.
---

# 🎭 Marketing Styling Skill

Esta skill define las reglas y principios para el desarrollo de interfaces públicas (Landing Page, Pricing, About, Blog).
A diferencia del Admin Panel (que prioriza consistencia y utilidad), estas páginas priorizan **Impacto Visual, Narrativa y Conversión**.

## 🎨 Identidad Visual Extendida

### 1. Paleta de Colores
- **Base**: `slate-950` (Fondo principal), `white` (Texto).
- **Primario**: `teal-500` / `teal-400` (Gradients, Glows).
- **Acento**: `emerald-500` (Seguridad), `blue-500` (Datos), `amber-500` (Premium/Enterprise).
- **Fondos**: Uso intensivo de gradientes sutiles y "noise" textures.

### 2. Tipografía
- **Headings**: `Outfit` (Bold / Black). Tracking ajustado (`tracking-tight`).
- **Body**: `Inter` o `Geist Sans` (Legibilidad). `text-slate-400` para secundarios.

### 3. Efectos Visuales (The "Wow" Factor)
- **Glassmorphism**: `backdrop-blur-xl`, `bg-white/5`, `border-white/10`.
- **Glows**: `shadow-[color]/20`, `blur-[100px]` backgrounds elements.
- **Micro-interacciones**: Hover states (`scale-105`, `translate-y`), active states.
- **Bordes**: Gradientes en bordes (`border-image`) o `ring` sutiles.

## 🧱 Componentes & Estructura

### 1. Layout
- **No** usar `PageContainer` del admin.
- Usar contenedores anchos (`max-w-7xl` o `container mx-auto`).
- Espaciado generoso (`py-24`, `py-32`).

### 2. Animaciones (Motion)
- **Entrance**: `animate-in fade-in slide-in-from-bottom` escalonado.
- **Scroll**: Reveal on scroll (opcional con Framer Motion).
- **Performance**: Usar CSS transforms (`transform`, `opacity`) para 60fps.

### 3. Anatomía de una Sección Marketing
```tsx
<section className="py-24 relative overflow-hidden">
  {/* Decoración de fondo */}
  <div className="absolute ... bg-teal-500/20 blur-3xl" />
  
  <div className="container relative z-10">
    <div className="text-center mb-16">
       <Badge>TAGLINE</Badge>
       <h2 className="text-5xl font-outfit font-bold">Título de Impacto</h2>
       <p className="text-xl text-slate-400">Subtítulo persuasivo</p>
    </div>
    
    <div className="grid ...">
       {/* Cards */}
    </div>
  </div>
</section>
```

## 🚫 Restricciones
- **No** usar componentes de `shadcn/ui` sin personalización pesada (ej: no usar el `Card` default plano).
- **No** mezclar estilos del Admin (ej: `PageHeader` simple) en la Landing.
- **No** comprometer la accesibilidad (contrast ratios) por la estética.
