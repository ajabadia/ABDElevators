# AUDITORÍA UX & REDISEÑO - ABD RAG Platform

## Estado Actual: Análisis de Problemas

### Estructura Actual de la Aplicación Privada

```
Usuarios autenticados ven:
├── Información Personal (Profile)
├── Notificaciones (Preferences) 
├── Seguridad (Centro de Seguridad)
├── Soporte Técnico (Support Center)
└── Dashboard (limitado, sin contexto por rol)
```

### 🔴 PROBLEMAS CRÍTICOS

1. **Sin home personalizado por rol**
   - Admin, Tecnico, Ingenieria ven la misma interfaz al entrar
   - No hay "qué es urgente" visible inmediatamente
   - Necesidad de buscar en menú para encontrar tareas

2. **Información personal + Seguridad + Configuración mezcladas**
   - Todo bajo "Información Personal"
   - Sin jerarquía clara (qué es setup vs. qué es diario)
   - Notificaciones escondidas en settings

3. **Navegación confusa**
   - 5 secciones sin patrón claro
   - Sin breadcrumb de contexto
   - Sidebar no existe o está poco visible

4. **Soporte enterrado**
   - En tab separado, no visible desde otras páginas
   - Usuario no sabe si tiene tickets pendientes
   - Difícil acceso cuando está en otra sección

5. **Sin progressive disclosure**
   - Formularios abrumadores (muchos campos)
   - Sin validación visual progresiva
   - Modales interrumpiendo flujo

6. **Empty states sin guía**
   - "No hay documentos" sin saber qué hacer
   - Sin ejemplos o próximos pasos
   - Sin recomendaciones contextuales

---

## BENCHMARKING: Mejores Prácticas SaaS 2025

### Slack
✅ Sidebar colapsable con favoritos pinned  
✅ "Threads" para agrupar conversaciones  
✅ Status visual clara (online, away)  
✅ Search global + comandos (Cmd+K)  

**Aplicable:** Sidebar colapsable + global search

### Notion
✅ Sidebar con colecciones organizadas por tipo  
✅ Breadcrumb + side panel para contexto  
✅ Inline comments en lugar de modales  
✅ Templates para acelerar creación  

**Aplicable:** Sidebar jerárquico + templates para análisis

### Linear
✅ Dashboard con "Roadmap" visual  
✅ Cada elemento tiene prioridad visual  
✅ "Inbox" como punto central  
✅ Keyboard-first navigation  

**Aplicable:** Inbox centralizado + keyboard shortcuts

### Stripe
✅ Top nav compacto con logo + alerts  
✅ Left sidebar con jerarquía clara  
✅ Settings separado de main work  
✅ Mobile-first considerations  

**Aplicable:** Separación Settings vs. Main Work

### Figma
✅ Dos paneles (derecho = properties, izquierdo = tree)  
✅ Context menu (clic derecho) para acciones  
✅ Hover hints sin saturar  
✅ Real-time presence indicators  

**Aplicable:** Split view para documento + metadata

---

## NUEVA ARQUITECTURA PROPUESTA

### Estructura General

```
┌──────────────────────────────────────────────────────────┐
│    NAVBAR: Logo + Breadcrumb + Search + Help + Avatar    │
├──────────────────────────────────────────────────────────┤
│ ┌──────────┬──────────────────────────────────────────┐  │
│ │ SIDEBAR  │          MAIN CONTENT                    │  │
│ │ (100px   │       (Responsive)                       │  │
│ │ collapsed)│                                          │  │
│ │          │                                          │  │
│ │ Primary  │                                          │  │
│ │ Nav      │        PAGE CONTENT                      │  │
│ │          │                                          │  │
│ │          ├──────────────────────────────────────────┤  │
│ │          │   SIDE PANEL (Context-specific)          │  │
│ │          │   - Notificaciones                       │  │
│ │          │   - Detalles                             │  │
│ │          │   - Quick actions                        │  │
│ └──────────┴──────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Sidebar Reorganizado (Role-Aware)

**ADMIN:**
```
📊 Dashboard Operativo [HOME]
🔧 Administración
  ├─ Tenants
  ├─ Usuarios
  ├─ Configuración Global
  └─ Auditoría
📄 Documentos Técnicos
📦 Pedidos
🎯 Casos
⚙️  Ajustes
```

**TECNICO:**
```
📊 Mi Workspace [HOME]
📄 Documentos Disponibles
📦 Mis Pedidos
💬 Soporte
📝 Análisis Guardados
⚙️  Perfil
```

**INGENIERIA:**
```
📊 Engineering Dashboard [HOME]
🔬 RAG Configuration
📊 Evaluación de Calidad (RAGAs)
📈 Modelos & Prompts
⚙️  Preferencias
```

---

## REDISEÑO POR ROL

### 1. ADMIN DASHBOARD

**ACTUAL (Confuso):**
```
Información Personal + Notificaciones + Seguridad (todo junto)
```

**PROPUESTA:**

```
┌─────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD - ABD RAG Platform                      │
├─────────────────────────────────────────────────────────┤
│
│ 🎯 ATENCIÓN REQUERIDA (Widget Sticky Top)
│ ├─ 2 Usuarios por aprobar roles
│ ├─ 1 Cambio de prompt pendiente aprobación
│ ├─ System Health: 99.2% ✅
│ └─ [Ver todos → Inbox]
│
│ 📊 MÉTRICAS DEL SISTEMA (2 columnas)
│ ├─ Col A: Usuarios Activos (Hoy | Semana | Mes)
│ ├─ Col B: Storage Usage (% capacity, trend)
│ ├─ Col C: API Rate Limits (hoy vs. cuota)
│ └─ Col D: RAG Search Volume (trend)
│
│ 👥 USER MANAGEMENT
│ ├─ [+ New User] [Bulk Import] [Export]
│ ├─ Tabla: Email | Role | Last Active | Status
│ │  └─ Hover: [Edit] [Disable] [Delete]
│ └─ Pendientes: 2 flagged
│
│ 🔐 SECURITY INCIDENTS
│ ├─ Failed Login Attempts (últimos 7 días)
│ ├─ Suspicious IPs: [view details]
│ └─ Last Backup: 2 horas ✓
│
│ ⚙️  QUICK ADMIN ACTIONS
│ ├─ [Configure Quotas] [Set Retention] [Audit Trail]
│ └─ [View API Keys] [Deploy Settings]
│
│ 📅 UPCOMING EVENTS
│ ├─ Subscription expires: 23 days
│ ├─ Certifications due: Jan 30
│ └─ Maintenance: 2025-02-15
│
└─────────────────────────────────────────────────────────┘
```

**Cambios clave:**
- ✅ "Atención requerida" en top (sticky)
- ✅ Métricas visuales y claras
- ✅ User management sin modals (tabla inline)
- ✅ Quick actions obvios (botones)
- ✅ Widgets draggable para personalización

---

### 2. TECNICO WORKSPACE

**PROBLEMA ACTUAL:**
- No hay home
- Funciones dispersas en settings
- No ve tickets pending
- RAG search escondida

**PROPUESTA:**

```
┌─────────────────────────────────────────────────────────┐
│ MI WORKSPACE - TECNICO                                  │
├─────────────────────────────────────────────────────────┤
│
│ 📌 MIS ACCIONES (Sticky, top-left)
│ ├─ 3 Pedidos asignados a mí
│ ├─ 1 Análisis en progreso  
│ ├─ 2 Tickets por responder
│ └─ [Ver todos]
│
│ ┌─────────────────────┐  ┌──────────────────────┐
│ │ 📄 DOCUMENTOS       │  │ 🔍 BÚSQUEDA RÁPIDA   │
│ │ Recientes           │  │                      │
│ │ ├─ PDF-2024-01-28   │  │ [Search box]         │
│ │ ├─ Manual-V3.2      │  │ └─ [Advanced]        │
│ │ └─ [Ver Todo →]     │  │                      │
│ │                     │  │ HISTÓRICO             │
│ │ [+ Subir Doc]       │  │ ├─ Última búsqueda   │
│ │ [+ Template]        │  │ └─ Guardados (5)     │
│ └─────────────────────┘  └──────────────────────┘
│
│ ┌─────────────────────┐  ┌──────────────────────┐
│ │ 📦 MIS PEDIDOS      │  │ 💬 MIS TICKETS       │
│ │ En Progreso (3)     │  │ Abiertos (2)         │
│ │                     │  │                      │
│ │ [Pedido #234]       │  │ [Ticket #15]         │
│ │ ├─ Estado: Analysis │  │ └─ [Responder] →     │
│ │ ├─ Progress: 60%    │  │                      │
│ │ └─ Asignado a: Yo   │  │ [+ New Ticket]       │
│ │                     │  │                      │
│ │ [Ver todos →]       │  │ [Ver todos →]        │
│ └─────────────────────┘  └──────────────────────┘
│
│ 📊 MIS ANÁLISIS
│ ├─ [Nuevo Análisis] [Plantillas]
│ ├─ Tabla: Fecha | Query | Resultados | Acciones
│ │  └─ Botones: Download | Share | Delete
│ └─ [Más análisis →]
│
│ 📚 RECURSOS
│ ├─ [Docs & Guías] [Mi Historial] [Guardados]
│ └─ Quick Links: KB, Training Videos, FAQs
│
└─────────────────────────────────────────────────────────┘
```

**Cambios clave:**
- ✅ Sticky action panel (próximas acciones siempre visibles)
- ✅ 4 cuadrantes: Documentos + Search | Pedidos + Tickets
- ✅ Progressive disclosure (recientes visible, [Ver todos] para histórico)
- ✅ No saturation, pero completo

---

### 3. INGENIERIA DASHBOARD

**Workflow:**
1. Revisar métricas de calidad RAG (RAGAs)
2. Tunar prompts
3. Analizar embeddings
4. A/B testing de modelos
5. Feedback a admin

**PROPUESTA:**

```
┌─────────────────────────────────────────────────────────┐
│ ENGINEERING DASHBOARD - RAG Quality & Models            │
├─────────────────────────────────────────────────────────┤
│
│ 🎯 QUALITY METRICS (Pinned top)
│ ├─ Faithfulness: 0.92 (target: 0.90) ✅
│ ├─ Answer Relevance: 0.88 (target: 0.85) ✅
│ ├─ Context Precision: 0.79 (target: 0.80) 🟡
│ └─ [Improve? → Tune Prompts] [View Details]
│
│ ┌────────────────┐  ┌──────────────────────┐
│ │ 🧪 PROMPTS     │  │ 🤖 MODEL COMPARISON  │
│ │                │  │                      │
│ │ Active (8):    │  │ Current: Gemini 2.0  │
│ │ ├─ System      │  │ ├─ Latency: 750ms    │
│ │ ├─ RAG         │  │ ├─ Quality: 0.89     │
│ │ ├─ Analysis    │  │ └─ Cost: $0.015/call │
│ │ └─ [+ New]     │  │                      │
│ │                │  │ Alternatives:        │
│ │ [Test Mode]    │  │ ├─ Claude 3          │
│ │ [History]      │  │ ├─ LLaMA 70B         │
│ │ [Compare]      │  │ └─ GPT-4o mini       │
│ └────────────────┘  └──────────────────────┘
│
│ 📈 PERFORMANCE TRENDS
│ ├─ Latency Distribution (24h, 7d, 30d): [Chart]
│ ├─ Error Rate: [Chart]
│ └─ Cache Hit Rate: [Chart]
│
│ 🔬 EMBEDDINGS & VECTORS
│ ├─ Embedding Model: OpenAI text-3-small
│ ├─ Vector DB: MongoDB Atlas Vector
│ ├─ Dimension: 1536
│ ├─ Collection Size: 12,450 vectors
│ └─ [Reindex] [Analyze Quality]
│
│ 🧪 QUICK EXPERIMENTS
│ ├─ [A/B Test Template] [Baseline vs. Variant]
│ ├─ Current Experiment:
│ │  ├─ Control: Current system
│ │  ├─ Variant A: New prompt
│ │  └─ Stats: 60% power, 5% significance
│ └─ [Start New Experiment]
│
│ 📊 DETAILED EVALUATION
│ ├─ Query: [Search box]
│ ├─ Results with Scores:
│ │  ├─ [Query #1] - Faith: 0.95, Rel: 0.91
│ │  └─ [Add Query]
│ └─ [Export Results] [Generate Report]
│
└─────────────────────────────────────────────────────────┘
```

**Cambios clave:**
- ✅ Quality metrics pinned (lo más importante siempre visible)
- ✅ Side-by-side Prompts vs. Models
- ✅ Experiment tracking inline
- ✅ Easy A/B testing (no modal)

---

## SUPERESTRUCTURA: INFORMACIÓN PERSONAL + SEGURIDAD

**PROBLEMA ACTUAL:**
- Todo bajo "Información Personal"
- Settings + Security sin contexto

**PROPUESTA: Settings Modal Separado**

```
┌─────────────────────────────────────────┐
│    ⚙️  MI CUENTA & SEGURIDAD             │
│                                         │
│ [← Volver]  [Guardar]  [?]             │
├─────────────────────────────────────────┤
│
│ 📋 PERFIL
│ ├─ Nombre: [text input]
│ ├─ Email: user@abd.es (cambiar)
│ ├─ Foto: [avatar] [+ Cambiar]
│ ├─ Idioma: [Español ▼]
│ ├─ Zona Horaria: [Europe/Madrid ▼]
│ └─ Tema: [☀️ Light] [🌙 Dark] [💻 Sistema]
│
│ 🔐 SEGURIDAD
│ ├─ Contraseña
│ │  └─ [Cambiar Contraseña → Modal]
│ │     Última: 45 días
│ │     Next reset: 75 días
│ │
│ ├─ Autenticación Multifactor (MFA)
│ │  ├─ Status: ✅ Habilitado (Authenticator)
│ │  ├─ [Ver códigos de recuperación]
│ │  ├─ [Deshabilitar]
│ │  └─ [Agregar más métodos]
│ │
│ ├─ Sesiones Activas (3)
│ │  ├─ Chrome / Windows / 192.168.1.1
│ │  │  └─ Última: 5 min / [Cerrar sesión]
│ │  ├─ Safari / iPhone / 45.120.200.1
│ │  │  └─ Última: 2h / [Cerrar sesión]
│ │  └─ Firefox / Linux (antigua)
│ │     └─ Última: 7 días / [Cerrar sesión]
│ │
│ └─ IP Allowlist (Enterprise)
│    ├─ [Enabled ▣]
│    ├─ 192.168.1.0/24
│    ├─ 10.0.0.0/8
│    └─ [+ Add IP Range] [?]
│
│ 🔔 NOTIFICACIONES
│ ├─ Preferencias globales:
│ │  ├─ ☑️  Email para eventos críticos
│ │  ├─ ☑️  In-app para todo
│ │  └─ ☐ SMS (no habilitado)
│ │
│ ├─ Por evento:
│ │  ├─ Aprobación requerida
│ │  │  └─ [Inmediato] [Resumen diario] [Off]
│ │  ├─ Documento nuevo
│ │  │  └─ [Inmediato] [Resumen diario] [Off]
│ │  └─ Error en análisis
│ │     └─ [Inmediato] [Resumen diario] [Off]
│ │
│ └─ Fallback Email: user@abd.es [Cambiar]
│
│ 🗑️ ZONA DE PELIGRO
│ ├─ Eliminar Cuenta
│ │  └─ [Solicitar eliminación → Confirmation]
│ │     (Requiere confirmación en email + 30 días)
│ │
│ └─ Descargo de auditoría
│    └─ [Descargar datos personales (GDPR)]
│
└─────────────────────────────────────────┘
```

**Cambios clave:**
- ✅ Separación clara: Perfil | Seguridad | Notificaciones | Peligro
- ✅ Status badges visuales: ✅ Activo, 🟡 Atención, 🔴 Requerido
- ✅ Sesiones tangibles (listar, no ocultar)
- ✅ Notifications granular pero sensato

---

## CAMBIOS EN LA NAVEGACIÓN GLOBAL

### Top Navbar (Siempre visible)

```
┌──────────────────────────────────────────────────────┐
│ [☰] ABD RAG    [Breadcrumb: Admin > Users]   🔍 [?] │
│                                              🔔 👤  │
└──────────────────────────────────────────────────────┘

[☰]         = Hamburger para mobile o collapse sidebar
[Breadcrumb] = Context actual (dónde estás)
[🔍]        = Búsqueda global (Cmd+K para focus)
[?]         = Ayuda contextual + Keyboard shortcuts
[🔔]        = Badge con # notificaciones pending
[👤]        = Avatar + dropdown (Settings, Logout)
```

### Sidebar Colapsable

```
EXPANDED (250px):
┌─────────────────┐
│ [☰] ABD RAG     │ ← Click para collapse
├─────────────────┤
│ 📊 Dashboard    │
│ 📄 Documentos   │ ← Hover = expand sub-items
│ 📦 Pedidos      │
│ 💬 Soporte      │
│ ⚙️  Settings    │
└─────────────────┘

COLLAPSED (60px):
┌──┐
│☰ │
├──┤
│📊│ ← Hover = tooltip
│📄│
│📦│
│💬│
│⚙️ │
└──┘
```

**Comportamiento:**
- Desktop: Collapse con botón, remember preference
- Mobile: Hamburger menu (full screen overlay)
- Tablet: Smart collapse si hay espacio

---

## PATRONES DE INTERACCIÓN

### 1. Quick Actions (Floating Button)

```
Contexto-dependent:
├─ Dashboard → [+ New Analysis]
├─ Documents → [+ Upload] + [+ Template]
├─ Tickets → [+ New Ticket]
└─ Settings → [+ Add IP] o similar

Comportamiento:
├─ Siempre visible (bottom-right)
├─ Contextual a la página actual
├─ No cubre contenido importante
└─ Accessible via keyboard (Alt+N)
```

### 2. Inline Confirmations (No Modals)

```
ACTUAL (Modal - interrupts):
[Delete] → Modal: "¿Estás seguro?" → [Cancel] [Delete]

PROPUESTA (Inline - less disruptive):
User clicks [Delete]
├─ Row turns red, button becomes [Confirm Delete]
├─ Also shows: "Undo" link (reversible)
├─ Auto-hides after 5 seconds si no acción
└─ Toast notification: "Eliminado correctamente"

Ventaja:
├─ No interrumpe flujo
├─ Reversible (undo)
├─ Menos modal fatigue
└─ Más rápido para expertos
```

### 3. Progressive Disclosure in Forms

```
ACTUAL:
[Form con 20 fields] → Abrumador

PROPUESTA:
Paso 1: [Campos esenciales solo]
├─ Nombre, Email, Rol
└─ [Siguiente]

Paso 2: [Configuración inicial]
├─ Timezone, Idioma, MFA
└─ [Crear]

Paso 3: [Onboarding rápido]
├─ "¡Estás listo! Tu próximo paso es..."
└─ [Ir a Dashboard]

Ventaja:
├─ No overwhelm
├─ Contextual help at each step
└─ Faster completion
```

### 4. Inline Comments (Instead of Modals)

```
ACTUAL:
[Ticket] → Click → Modal con full conversation

PROPUESTA:
[Ticket in Table]
├─ Expandable row (clic en fila)
│  └─ Comments inline below
│     ├─ [Comment 1] - "2h ago by User"
│     ├─ [Comment 2] - "1h ago by User"
│     └─ [+ Add Comment] (text area)
└─ Press Esc to collapse

Ventaja:
├─ Menos context switching
├─ Ves conversación en contexto
└─ Múltiples tickets posible
```

---

## NOTIFICATION HUB (Nuevo)

**Problema:** Notificaciones escondidas en settings

**Solución:** Hub centralizado

```
┌──────────────────────────────────────────┐
│ 🔔 NOTIFICACIONES (badge: 5)             │
├──────────────────────────────────────────┤
│                                          │
│ [Inbox] [Archive] [Preferences]          │
│                                          │
│ 🔴 CRÍTICAS (2)                          │
│ ├─ Cambio de prompt necesita OK          │
│ │  De: Admin @13:45                      │
│ │  [Aprobar] [Rechazar] [Más info]       │
│ │                                        │
│ └─ Storage 95% full                      │
│    De: System @10:30                     │
│    [Expandir cuota] [Ignorar]            │
│                                          │
│ 🟡 IMPORTANTES (3)                       │
│ ├─ Tu ticket #45 fue respondido          │
│ ├─ Documento nuevo compartido            │
│ └─ Sesión en nuevo dispositivo           │
│                                          │
│ ⚪ RECIENTES (20+ more)                   │
│ └─ [Ver todos]                           │
│                                          │
└──────────────────────────────────────────┘
```

**Features:**
- Grouping por tipo + severidad
- Action buttons inline
- Archive, snooze, delete
- Preferences por tipo

---

## DOCUMENTS SECTION (Reorganizado)

**Problema:** No hay vista clara de qué documentos existen

**Solución:** File Explorer + Search

```
┌──────────────────────────────────────────────────┐
│ 📄 DOCUMENTOS TÉCNICOS                           │
├──────────────────────────────────────────────────┤
│                                                  │
│ [+ Upload] [+ Create] [Import from...]           │
│                                                  │
│ 🔍 [Search...] [Filters ▼] [View ▼]             │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ Name          │ Type  │ Added  │ Size │ ... │ │
│ ├──────────────────────────────────────────────┤ │
│ │ 📁 2024       │       │        │      │     │ │
│ │   ├─ 📄 Q1.pdf│ PDF   │ 2d ago │ 2MB  │ ... │ │
│ │   └─ 📄 Q2.pdf│ PDF   │ 1d ago │ 3MB  │ ... │ │
│ │                                              │ │
│ │ 📁 Manuales                                  │ │
│ │   ├─ 📄 V3.2.pdf                            │ │
│ │   ├─ 📄 API-Docs                            │ │
│ │   └─ 📁 Deprecated (collapsed)              │ │
│ │                                              │ │
│ │ 📁 Especificaciones                          │ │
│ │   └─ 📄 Hardware-Spec.xlsx                  │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ Right-click Context Menu:                        │
│ ├─ [Open] [Download] [Share]                    │
│ ├─ [Rename] [Move to Folder] [Archive]          │
│ └─ [Delete] [View Metadata]                     │
│                                                  │
│ Drag & Drop:                                     │
│ ├─ Drag file → Folder to move                   │
│ └─ Drag file → RAG Search box to analyze        │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Features:**
- Hierarchical folder structure
- Breadcrumb navigation
- File preview on hover
- Right-click context menu
- Drag-and-drop actions
- Metadata panel on right

---

## RAG SEARCH (Mejorada)

**Problema:** Search está escondida, no es central

**Solución:** Search como First-Class Citizen

```
┌──────────────────────────────────────────────────┐
│ 🔍 BÚSQUEDA RAG                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │ [🔍] ¿Qué quieres saber?      [⚙️ Filter]    ││
│ │                                              ││
│ │ Quick Examples:                              ││
│ │ ├─ [¿Qué modelos tiene?]                    ││
│ │ ├─ [Especificaciones técnicas]              ││
│ │ └─ [Ver mis búsquedas recientes]            ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ RESULTS                                          │
│ ├─ [Showing 5 results] [Load More]              │
│                                                  │
│ ┌──────────────────────────────┐                │
│ │ 1. Document Title            │ Score: 0.92   │
│ │    [Excerpt with highlight]  │ [View Full]   │
│ │                              │ [Mark Relevant]│
│ └──────────────────────────────┘                │
│                                                  │
│ SIDEBAR (Right, collapsible)                     │
│ ├─ 📊 Answer Summary (LLM)                      │
│ ├─ 📝 Sources Cited (clickable)                 │
│ ├─ 💾 [Save Analysis] [Share] [Export]          │
│ ├─ 🔄 [Regenerate with Different Model]         │
│ └─ 📚 [Related Searches]                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Features:**
- Prominent search box (top of page)
- Quick examples for new users
- Inline results (no modal)
- Score badges
- Side panel for details
- Save/Share actions

---

## KEYBOARD SHORTCUTS

```
Global:
├─ Cmd/Ctrl+K → Search (focus search box)
├─ Cmd/Ctrl+/ → Keyboard shortcuts help
├─ ? → Help panel
└─ Esc → Close modal/panel

In Dashboard:
├─ Alt+N → New [context-aware]
├─ Alt+S → Settings
├─ Alt+H → Help
└─ J/K → Navigate list (vim-style)

In Tables:
├─ Space → Expand row
├─ E → Edit
├─ D → Delete (with confirmation)
├─ / → Filter/search
└─ Shift+Click → Multi-select
```

---

## EMPTY STATES

### New User

```
┌────────────────────────────────────────┐
│ 👋 Welcome to ABD RAG Platform!        │
├────────────────────────────────────────┤
│                                        │
│ You're all set up. Here's what's next: │
│                                        │
│ Step 1: Upload Your First Document     │
│ ├─ [+ Upload PDF] or [Sample Docs]     │
│ └─ Takes < 1 min                       │
│                                        │
│ Step 2: Run Your First Search           │
│ ├─ Try: "What are features?"           │
│ └─ See AI-powered search in action     │
│                                        │
│ Step 3: Explore Settings                │
│ ├─ [Configure Notifications] [Setup MFA]│
│ └─ Optional, but recommended           │
│                                        │
│ 📚 Resources:                           │
│ ├─ [Video Tutorial (2 min)]            │
│ ├─ [Quick Start Guide]                 │
│ └─ [Chat with Support]                 │
│                                        │
│ [Start Uploading] [Take Tour] [Later]  │
│                                        │
└────────────────────────────────────────┘
```

### No Documents

```
┌────────────────────────────────────────┐
│ 📄 DOCUMENTOS                          │
│                                        │
│ No documents yet.                      │
│                                        │
│ [+ Upload Your First] [Browse Samples] │
│                                        │
│ Why upload documents?                  │
│ ├─ Power RAG search across knowledge   │
│ ├─ Get instant, cited answers          │
│ └─ See patterns in documentation       │
│                                        │
│ Max: 50MB/doc | Formats: PDF, TXT, etc │
│                                        │
└────────────────────────────────────────┘
```

---

## RESPONSIVE DESIGN

### Mobile (< 768px)

```
Sidebar → Hamburger menu (full-screen overlay)
Main content → Full width
Action buttons → Bottom fab
Modals → Full-screen slides
Tables → Stacked cards (1 column)

Example: Tickets on Mobile
┌──────────────────────────┐
│ ☰ Support      [Search] │
├──────────────────────────┤
│ 🔴 [#45] In Progress     │
│ Status: Waiting on you   │
│ Last: 2h ago             │
│ [View & Reply]           │
│                          │
│ 🟡 [#42] Waiting         │
│ Status: ...              │
│ Last: 1d ago             │
│ [View & Reply]           │
│                          │
│ ⚪ [#39] Resolved         │
│ Status: ...              │
│ Last: 5d ago             │
│ [View & Reply]           │
│                          │
│        [+ New] [FAQ]     │
└──────────────────────────┘
```

---

## RESUMEN DE CAMBIOS (Priorización)

### Tier 1: Do First (Alto Impacto - 2-3 semanas)

```
1. ✅ Crear Dashboard home diferente por rol
   - Admin → Operations focused
   - Tecnico → Tasks focused
   - Ingenieria → Metrics focused
   Impact: +40% feature adoption
   
2. ✅ Reorganizar Sidebar (clear hierarchy)
   - Primary navigation (3-5 items)
   - Secondary (nested, collapsed)
   - Settings at bottom
   Impact: -50% navigation time
   
3. ✅ Mover Notifications a Hub centralizado
   - Inbox widget en dashboard
   - Notification bell con badge
   - Grouped por tipo + severidad
   Impact: +25% notification effectiveness
   
4. ✅ Inline confirmations en lugar de modals
   - Delete: red row + undo link
   - No interruption
   Impact: +30% task completion speed
```

### Tier 2: Do Next (Medio Impacto - 2-3 semanas)

```
5. 📌 Sticky action panel
   - Always visible, top-left
   - Shows pending tasks
   Impact: -60% time to first action
   
6. 🔍 Global search (Cmd+K)
   - Focus en search box
   - Contextual results
   Impact: +35% search usage
   
7. 💬 Floating support widget
   - Right sidebar o bottom-right
   - Quick access to tickets
   Impact: +50% ticket engagement
   
8. 🎨 Empty states with guidance
   - Not just "no data"
   - Show how to get started
   Impact: +15% new user retention
```

### Tier 3: Polish (Bajo Impacto - 1-2 semanas)

```
9. ⌨️ Keyboard shortcuts
   - Accessibility
   - Power-user friendly
   Impact: +20% power user productivity
   
10. 📱 Mobile-first responsive
    - iPhone, Android testing
    - Hamburger menu
    - Stacked cards
    Impact: +5% mobile adoption
    
11. 🎭 Micro-interactions
    - Hover states clear
    - Loading spinners
    - Success animations
    Impact: +10% perceived performance
    
12. 🌗 Dark mode support
    - CSS variables
    - User preference
    Impact: +8% evening usage
```

---

## ROADMAP DE IMPLEMENTACIÓN

### Semana 1: Foundation
- [ ] Sidebar reorganization by role
- [ ] Home dashboard structure (all roles)
- [ ] Navigation routing updates

### Semana 2: Core UX
- [ ] Notification hub implementation
- [ ] Inline confirmation patterns
- [ ] Progressive disclosure forms

### Semana 3: Enhancement
- [ ] Floating support widget
- [ ] Global search (Cmd+K)
- [ ] Sticky action panels
- [ ] Empty states design

### Semana 4: Polish
- [ ] Keyboard shortcuts
- [ ] Mobile responsiveness
- [ ] Micro-interactions
- [ ] Dark mode support
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## MÉTRICAS DE ÉXITO

### Current → Target

```
Task Completion:
├─ Find document: 4 clicks → 2 clicks (-50%)
├─ Create ticket: 6 steps → 3 steps (-50%)
├─ Check pending: Hidden → Sticky panel (+∞)
└─ Time to first action: 30s → 5s (-83%)

User Engagement:
├─ Daily active users: +25%
├─ Feature adoption: +40%
└─ Support tickets (UX-related): -30%

Performance:
├─ Time to first interaction: <2s
├─ Page load: <1s
├─ Search results: <500ms
└─ Navigation bounce rate: <5%
```

---

## TECHNICAL IMPLEMENTATION NOTES

### Frontend Changes
- React components: Sidebar, Navbar, Dashboard, Notifications
- State management: Zustand o Redux (role-based state)
- Accessibility: @radix-ui/primitives
- Responsive: TailwindCSS breakpoints

### Backend Changes
- New API: `GET /api/dashboard/{role}` (role-specific data)
- New API: `GET /api/notifications/inbox` (grouped + priority)
- Existing APIs: Minor refactoring para caching

### Design System Updates
- New color tokens para status (critical, warning, info)
- New spacing para sidebar + nav
- Keyboard shortcut documentation
- Component documentation updates

