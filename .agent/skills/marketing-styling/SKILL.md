---
description: Guía de estilo y principios de diseño para las páginas públicas y de marketing de ABDElevators.
---

# 🎭 Marketing Styling Skill (Uncodixified Edition)

Esta skill define las reglas y principios para el desarrollo de interfaces públicas (Landing Page, Pricing, About, Blog).
A diferencia del Admin Panel, estas páginas priorizan **Impacto Visual y Narrativa**, pero bajo el estándar **Uncodixify** (evitando el aspecto genérico de "IA Dashboard").

## 🎨 Identidad Visual "Normal" (Uncodexy-UI)

### 1. Paleta de Colores & Honestidad Visual
- **Base**: `slate-950` (Fondo principal), `white` (Texto).
- **Colores Sólidos**: Prioriza el uso de colores sólidos sobre gradientes suaves.
- **No AI Gradients**: NUNCA uses gradientes corporativos suaves (`from-teal-500 to-blue-600`) para "parecer premium". Si usas gradientes, que sean de alto contraste o texturizados (grain/noise).
- **Dark Mode**: Evita el "premium dark" basado en azules/cianes. Usa negros reales (`#000`) o grises muy oscuros y neutros.

### 2. Tipografía & Jerarquía Real
- **Headings**: `Outfit` (Bold / Black). Tracking ajustado (`tracking-tight`).
- **No Eyebrows**: No uses "eyebrow labels" (labels en mayúsculas con espaciado encima del H1). La jerarquía debe ser natural: `h1`, `h2`, `p`.
- **Decorative Copy**: Evita frases vacías como "Operational clarity without the clutter". Si no añade valor narrativo, elimínalo.

### 3. Efectos Visuales (Honest Wow Factor)
- **Radios Estrictos**: Máximo `8px` (`rounded-lg`) para botones y `16px` (`rounded-2xl`) para tarjetas.
- **Unificación de Plataforma (Regla CORE / DRY)**: Aunque el marketing permite más libertad creativa, debe compartir el ADN visual del producto. Usa los tokens de plataforma para coherencia:
    - `.platform-card`: Para tarjetas de producto/features.
    - `.platform-title`: Para títulos de sección (`font-black tracking-tight`).
- **Glassmorphism**: Úsalo con moderación. `backdrop-blur-xl`, `bg-white/5`, `border-white/10`. No abuses de los paneles flotantes "despegados".
- **Sombras**: Máximo `shadow-sm` con opacidad baja. Evita efectos de elevación dramáticos.
- **Bordes**: 1px solid, colores sutiles (`border-white/10` o `border-border`).

## 🧱 Componentes & Estructura

### 1. Layout
- **Containers**: `max-w-7xl` o `container mx-auto`.
- **Spacing**: Espaciado generoso (`py-24`, `py-32`) pero consistente. No uses padding excesivo solo para "rellenar" espacio.
- **Secciones**: Cada sección debe tener un propósito narrativo claro. No inventes layouts asimétricos sin una razón de diseño sólida.

### 2. Animaciones (Simple Motion)
- **Entrance**: Prioriza `animate-in fade-in` simple. Evita `slide-in`, `bounce` o efectos `transform: translateX(2px)` en hovers.
- **Performance**: Usar CSS transforms nativos. Mantén las transiciones entre 100-200ms ease.

### 3. Anatomía de una Sección Uncodixified
```tsx
<section className="py-24 border-b border-white/5">
  <div className="container">
    <div className="max-w-3xl mb-16">
       <h2 className="text-5xl platform-title mb-4">Título de Impacto</h2>
       <p className="text-xl platform-subtitle">Subtítulo persuasivo y honesto.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
       {/* Cards usando .platform-card para coherencia de ADN */}
    </div>
  </div>
</section>
```

## 🚫 Restricciones (Hard No)
- **No pill shapes**: En botones o badges.
- **No floating detached panels**: El sidebar y los headers deben ser sólidos o integrados.
- **No hero blocks inside operational UI**: Solo en la Landing Page inicial.
- **No "Control Room" cosplay**: Evita visualizaciones de datos que solo sirven como decoración ("fake charts").
- **No bouncy animations**: Todo debe sentirse fluido y profesional.
