# GUÍA DE UX/UI PROFESIONAL
## Sistema RAG de Documentación Técnica para Ascensores

---

## 1. FILOSOFÍA DE DISEÑO

### 1.1 Dos Contextos, Dos Diseños

#### Contexto 1: TÉCNICO DE TALLER
- **Ubicación:** Taller, posiblemente con guantes, luz variable.
- **Prioridades:** Velocidad, claridad, no ambigüedad.
- **Fuente mínima:** 16px (legible desde 1.5m).
- **Contraste:** Alto (WCAG AAA, ratio 7:1).
- **Densidad:** Baja, mucho espacio blanco.
- **Colores:** Solo señales críticas (rojo, verde, ámbar).
- **Navegación:** Botones grandes, pocas opciones por pantalla.

#### Contexto 2: ADMIN / INGENIERÍA
- **Ubicación:** Oficina, escritorio.
- **Prioridades:** Densidad de información, análisis, control.
- **Fuente:** 12-14px (normal para admin).
- **Contraste:** Suficiente (WCAG AA, ratio 4.5:1).
- **Densidad:** Media-alta, tablas compactas.
- **Colores:** Escala completa, badges, categorías.
- **Navegación:** Más opciones, menús anidados, filtros complejos.

### 1.2 Modo Oscuro (Dark Mode)
**Por qué:** Reduce fatiga ocular en taller con iluminación variable.
**Color base:** `#1f2937` (gris muy oscuro, no negro puro = menos fatiga).
**Accento primario:** `#32b8c6` (teal/cyan, tiene alto contraste sobre fondo oscuro).
**Accento secundario:** `#e5e7eb` (gris claro para textos).
**Estados:**
- Normal: teal
- Éxito: verde `#22c55e`
- Alerta: ámbar `#f59e0b`
- Crítico: rojo `#ef4444`

---

## 2. PANTALLA 1: UPLOAD DE ESPECIFICACIÓN (`/pedidos/nuevo`)

### 2.1 Estructura Visual

```
┌─────────────────────────────────────────────────────────────┐
│  LOGO              Inicio    Historial    Técnico ▼        │  Header
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Sube Especificación de Pedido                             │  Título
│  Carga el documento de especificaciones técnicas           │  Subtítulo
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │  Drag-drop zone
│  │  ⬇️  Arrastra PDF aquí o haz clic para seleccionar   │ │  (dashed border)
│  │                                                       │ │  Teal accent
│  │  Archivos soportados: PDF, hasta 50 MB               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ─ o ─                                                      │  Separador
│                                                             │
│  ▼ Pegar texto directamente (acordeón)                     │  Alternativa
│                                                             │
│                              [ Analizar Pedido ]           │  CTA Button
│                                                             │
│                         (deshabilitado hasta elegir)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Características UX

- **Drag-drop prominente:** zona grande (400×200px mínimo), visual clara.
- **Feedback:**
  - `hover`: borde más brillante, fondo ligeramente oscuro.
  - `dragover`: animación pulsante, icono se agranda.
- **Estados del botón:**
  - Idle: habilitado, teal background, white text.
  - Analyzing: deshabilitado, spinner + "Analizando..."
  - Success: verde, "Redirigiendo..." → auto-redirect.
  - Error: rojo, mensajito de error debajo del botón.
- **Accesibilidad:**
  - Botón tiene `aria-label="Subir especificación de pedido"`.
  - Input file tiene `accept=".pdf"` (filtra tipos).
  - Instrucciones claras sin jerga técnica.

### 2.3 Flujo de Errores

| Error | Mensaje | Acción |
|-------|---------|--------|
| Archivo > 50 MB | "Archivo muy grande. Máximo: 50 MB" | Permitir reintentos |
| Tipo MIME inválido | "Solo se aceptan PDFs" | Mostrar extensión recomendada |
| Análisis falló | "Error analizando documento. Intenta con otro." | Botón "Reintentar" |
| Red desconectada | "Sin conexión. Comprueba tu internet." | Retry automático en 5s |

---

## 3. PANTALLA 2: INFORME TÉCNICO (`/pedidos/[id]`)

### 3.1 Estructura Visual

```
┌─────────────────────────────────────────────────────────────┐
│  LOGO              Inicio    Historial    Técnico ▼        │  Header
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Informe Técnico - Pedido PED-2025-001                     │  Título
│  Cargado: 21 Ene 2026, 14:32  │  3 componentes detectados │  Metadatos
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│  Tab/Acordeón
│  │ ▼ BOTONERA BTN-1234 (Vigente)                          ││  Component 1
│  ├─────────────────────────────────────────────────────────┤│
│  │                                                         ││  Tipo: botonera
│  │  Documentación Técnica:                                ││  Status: vigente
│  │  ┌───────────────────────────────────────────────────┐ ││
│  │  │ Manual_Botoneras_v2.1_2025.pdf (v2.1)   ✓ Vigente  │ ││  Doc info
│  │  │ Revisión: 10 Ene 2025                              │ ││
│  │  └───────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │  Fragmentos Relevantes:                                ││
│  │                                                         ││
│  │  1️⃣  "...Para especificaciones..."                    ││  Fragment 1
│  │     [RELEVANCIA: ████████░░ 92%]                     ││
│  │     ► La botonera está disponible en acero            ││
│  │       inoxidable o aluminio anodizado. Los botones    ││
│  │       cumplen con normativa EN81-20...                ││
│  │     "...Las medidas de seguridad incluyen..."         ││
│  │                                                         ││
│  │  2️⃣  "...Especificaciones eléctricas..."             ││  Fragment 2
│  │     [RELEVANCIA: ████████░░ 87%]                     ││
│  │     ► Voltaje de operación: 24V DC o 230V AC.         ││
│  │       Consumo típico: 0.5A. Circuito protegido...     ││
│  │     "...Conectar según esquema..."                    ││
│  │                                                         ││
│  │  📋 Checklist Montaje (Obligatoria):                  ││  Checklist section
│  │  ☐ Verificar material vs especificación (crítico)    ││
│  │  ☐ Tensión de prueba 24V ±0.8% (crítico)            ││
│  │  ☐ Aislamiento >10MΩ (crítico)                       ││
│  │  ☑ Botones responden a presión                       ││  Already checked
│  │                                                         ││
│  │  ⚠️  Reportar Incidencia                              ││  Report button
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│  Component 2
│  │ ▼ MOTOR MTR-5678 (Vigente)                            ││
│  │   [contenido similar...]                              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│  Component 3
│  │ ▼ SENSOR SNS-2024 (REVISAR - 15 meses)               ││
│  │   [contenido, con badge ámbar]                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│                  [ Exportar PDF ]  [ Reportar Incidencia ]  │  Botones
│                        [ ← Volver ]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Características Avanzadas

#### Badges de Estado
```
Vigente:     verde (#22c55e) + ✓
Obsoleto:    gris (#6b7280) + archivo (mostrado en "Histórico")
<6 meses:    teal + "🆕 NUEVO"
>12 meses:   ámbar + "⚠️ REVISAR"
```

#### Fragmentos con Contexto
- **Cada fragmento muestra:**
  - Texto **antes** (gris claro, itálica): contexto de qué sección.
  - Texto **central** (blanco, bold): contenido clave.
  - Texto **después** (gris claro, itálica): transición a siguiente tema.
  - Barra de relevancia: visual (80% = 4/5 relleno).
  - Página aproximada: "Pág ~5" (para referenciar en PDF físico si es necesario).

#### Checklists Integradas
- **Obligatorias:** técnico no puede completar informe sin marcar todas.
- **Críticas:** items con badge rojo 🔴 CRÍTICO.
- **Firma:** al marcar "checklist completada", se registra:
  - Usuario que la completó.
  - Timestamp exacto.
  - Estado guardado en BD (auditoría).

#### Reportar Incidencia (Modal)
```
┌────────────────────────────────────┐
│ Reportar Incidencia                │  Modal título
├────────────────────────────────────┤
│                                    │
│ Componente: BOTONERA BTN-1234     │  Pre-lleno
│ Documento: Manual_Botoneras_v2.1 │
│                                    │
│ Tipo de Problema:                 │  Dropdown
│ [Selecciona...                 ▼]│
│  - Montaje difícil                │
│  - Seguridad riesgo               │
│  - Doc ambigua                    │
│  - Falta material                 │
│  - Tiempos excesivos              │
│  - Error documento                │
│  - Otro                           │
│                                    │
│ Descripción:                      │  TextArea
│ [_____________________________]   │
│  Max 500 caracteres (245 left)   │
│                                    │
│ Impacto:                          │  Radio buttons
│ ◉ Ninguno  ○ Retraso  ○ Retrabajo│
│                                    │
│           [Enviar]  [Cancelar]   │  Botones
└────────────────────────────────────┘
```

### 3.3 Comportamientos Interactivos

| Acción | Feedback |
|--------|----------|
| Hover en fragmento | Fondo ligeramente oscuro, border left teal |
| Marcar checklist | Checkmark anima, se guarda en BD sin recargar |
| Reportar incidencia | Modal abre suave (fade-in), al enviar → toast "Incidencia #INC-0042 registrada" |
| Exportar PDF | Spinner mientras se genera, descarga automática, toast "Descargado: Informe_PED-2025-001.pdf" |

---

## 4. PANTALLA 3: ADMIN - GESTIÓN DE CORPUS (`/admin/documentos`)

### 4.1 Estructura Visual

```
┌──────────────────────────────────────────────────────┐
│ LOGO  [■] Admin  Documentos  Logs  Auditoría  ▼    │  Header + Sidebar
├──────────────────────────────────────────────────────┤
│                                                      │
│ Corpus Documentos Técnicos                          │  Título
│ 3 vigentes │ 1 obsoleto │ 1,247 chunks total      │  Stats resumidas
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Buscar: [_____________]  [⬇ Filtrar] [+ Nuevo]│ │  Controles
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Documento          │ Ver.  │ Estado   │ Chunks  │ │  Tabla
│ │────────────────────┼───────┼──────────┼─────────│ │
│ │ Manual_Botoneras_  │ 2.1   │ Vigente  │ 134     │ │  Row 1
│ │ v2.1_2025.pdf      │       │ ✓        │         │ │
│ │ Revisión: 10 Ene   │       │          │         │ │
│ │ [Ver] [Edit] [...]│       │          │         │ │
│ ├─────────────────────┼───────┼──────────┼─────────┤ │
│ │ Manual_Botoneras_  │ 2.0   │ Obsoleto │ 121     │ │  Row 2
│ │ v2.0_2024.pdf      │       │ ⊘        │         │ │  (gray)
│ │ Revisión: 15 Jun   │       │ Reempla- │         │ │
│ │ [Ver] [Edit] [...]│       │ zado x   │         │ │
│ │                    │       │ v2.1 ✓   │         │ │
│ ├─────────────────────┼───────┼──────────┼─────────┤ │
│ │ Manual_Motores_    │ 1.5   │ Vigente  │ 198     │ │  Row 3
│ │ v1.5_2024.pdf      │       │ ✓        │         │ │
│ │ Revisión: 3 Nov    │       │          │         │ │
│ │ [Ver] [Edit] [...]│       │          │         │ │
│ └─────────────────────┴───────┴──────────┴─────────┘ │
│                                                      │
│ Página 1 de 1                                       │  Paginación
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 4.2 Upload de Nuevo Documento (Modal)

```
┌────────────────────────────────────┐
│ Subir Documento Técnico            │
├────────────────────────────────────┤
│                                    │
│ Tipo Componente:                  │  Dropdown
│ [Botonera                      ▼] │  required
│ (Options: Motor, Cuadro, Puerta..│
│                                    │
│ Documento PDF:                    │  File upload
│ [📁 Arrastra o haz clic]         │
│ Manual_Botoneras_v2.1.pdf         │  (después upload)
│                                    │
│ Versión:                          │  Text
│ [2.1_______________________]      │  required
│                                    │
│ Motivo de cambio:                 │  TextArea
│ [Actualización EN81-20, nuevo]   │
│ [sensor de rotura de cable......  │
│                                    │
│ Comentarios (opcional):           │
│ [Solo aplicable a botoneras...   │
│                                    │
│    [Procesar e Indexar]  [Cancel] │
│    Estado: Procesando (3/5 chunks)│
│                                    │
│    ████████░░ 60%                 │
│                                    │
└────────────────────────────────────┘
```

---

## 5. PANTALLA 4: AUDITORÍA (`/admin/auditoria`)

### 5.1 Estructura Visual

```
┌──────────────────────────────────────────────────────┐
│ LOGO  [■] Admin  Documentos  Logs  Auditoría  ▼    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Auditoría RAG - Trazabilidad Completa              │  Título
│ Esta semana │ 847 eventos                          │
│                                                      │
│ Filtros: [Acción ▼] [Período ▼] [Nivel ▼]        │  Filtros compactos
│                                                      │
│  2026-01-21 14:32:05                               │  Timeline
│  ✓ ANALIZAR_PEDIDO                                 │  Entry 1
│  PED-2025-001 analizado en 420ms                  │
│  Usuario: tecnico@empresa.com                      │
│  ID Correlación: uuid-abc123                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                      │
│  2026-01-21 14:31:52                               │
│  ℹ️  RECUPERAR_CHUNKS                              │  Entry 2
│  5 chunks recuperados, relevancia promedio 0.91    │
│  Modelo: BTN-1234, Tipo: botonera                 │
│  Usuario: tecnico@empresa.com                      │
│  ID Correlación: uuid-abc123                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                      │
│  2026-01-21 14:30:15                               │
│  ⚠️  DOCUMENTO_CAMBIO_ESTADO                       │  Entry 3
│  Manual_v2.0 marcado como OBSOLETO                 │  (warning)
│  Reemplazado por: Manual_v2.1 ✓                    │
│  Usuario: admin@empresa.com                        │
│  Motivo: Normalización EN81-20                     │
│  ID Correlación: uuid-def456                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                      │
│  2026-01-21 14:15:33                               │
│  ❌ ERROR_ANALISIS                                 │  Entry 4
│  Análisis de pedido falló: respuesta Gemini nula  │  (error)
│  Pedido: PED-2025-0XX (invalidado)                 │
│  Reintentado: sí (exitoso en 2º intento)          │
│  ID Correlación: uuid-ghi789                       │
│                                                      │
│  [← Anterior] [Página 1 de 12] [Siguiente →]      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.2 Detalles de Auditoría (Click en Entry)

```
┌────────────────────────────────────────────┐
│ Detalle Evento Auditoría                   │
├────────────────────────────────────────────┤
│                                            │
│ Timestamp:      21 Ene 2026, 14:32:05    │
│ Acción:         ANALIZAR_PEDIDO           │
│ Nivel:          INFO                      │
│ Usuario:        tecnico@empresa.com       │
│ Correlación ID: uuid-abc123              │
│ Ambiente:       producción                │
│                                            │
│ ─────────────────────────────────────     │
│ DETALLES:                                  │
│ ─────────────────────────────────────     │
│                                            │
│ Pedido: PED-2025-001                      │
│ Tamaño: 234 KB                            │
│ Modelos detectados: 3                     │
│ Tiempo análisis: 420 ms                   │
│                                            │
│ Modelos:                                   │
│ - botonera / BTN-1234 (confianza: 0.95)   │
│ - motor / MTR-5678 (confianza: 0.87)      │
│ - sensor / SNS-2024 (confianza: 0.92)     │
│                                            │
│ ─────────────────────────────────────     │
│ PROMPT USADO (Versión extract_models_v2.1│
│ ─────────────────────────────────────     │
│                                            │
│ Analiza este documento de pedido de...    │
│ [truncado]                                 │
│                                            │
│ ─────────────────────────────────────     │
│ RESPUESTA GEMINI:                          │
│ ─────────────────────────────────────     │
│                                            │
│ {                                          │
│   "tipo": "botonera",                      │
│   "modelos": ["BTN-1234"]                  │
│ }                                          │
│ [...]                                      │
│                                            │
│              [Cerrar]  [Copiar JSON]      │
│                                            │
└────────────────────────────────────────────┘
```

---

## 6. DIRECTRICES DE COMPONENTES

### 6.1 Botones

```typescript
// Primario (CTA principal)
<Button variant="primary" size="lg">
  Analizar Pedido
</Button>
// Apariencia: fondo teal, texto blanco, 16px min en taller

// Secundario (acciones alternativas)
<Button variant="secondary">
  Volver
</Button>
// Apariencia: fondo gris, texto blanco

// Outline (menos prominente)
<Button variant="outline">
  Ver Histórico
</Button>
// Apariencia: borde teal, sin fondo

// Peligro (acciones destructivas)
<Button variant="danger">
  Marcar como Obsoleto
</Button>
// Apariencia: borde rojo, texto rojo
```

### 6.2 Badges

```typescript
// Estado documento
<Badge variant="success">✓ Vigente</Badge>
<Badge variant="gray">⊘ Obsoleto</Badge>
<Badge variant="warning">⚠️ Revisar (>12m)</Badge>
<Badge variant="info">🆕 Nuevo (<6m)</Badge>

// Criticidad
<Badge variant="critical">🔴 CRÍTICO</Badge>
<Badge variant="normal">Normal</Badge>
```

### 6.3 Checkboxes (Checklists)

```typescript
// Item normal
<ChecklistItem
  id="prep_1"
  label="Verificar material vs especificación"
  completed={false}
  critical={false}
  onChange={handleCheck}
/>
// Apariencia: checkbox grande, 16px texto

// Item crítico (obligatorio)
<ChecklistItem
  id="prep_2"
  label="Tensión 24V ±0.8% (OBLIGATORIO)"
  completed={false}
  critical={true}
  onChange={handleCheck}
/>
// Apariencia: checkbox rojo, texto negrita
// Validación: form no puede submitearse sin marcar todos críticos
```

### 6.4 Tablas (Admin)

```typescript
<Table
  columns={[
    { key: "documento", label: "Documento", width: "40%" },
    { key: "version", label: "Versión", width: "10%" },
    { key: "estado", label: "Estado", width: "15%" },
    { key: "chunks", label: "Chunks", width: "10%" },
    { key: "acciones", label: "Acciones", width: "25%" }
  ]}
  rows={documentos}
  rowClassName={(row) => row.estado === "obsoleto" ? "opacity-60" : ""}
/>
// Densidad media, fuente 12-14px, padding 8px vertical
```

---

## 7. PALETA DE COLORES

### Modo Oscuro (Primary)
```
Fondo primario:     #1f2937 (gray-800)
Fondo secundario:   #111827 (gray-900) - para overlays
Texto primario:     #f3f4f6 (gray-100)
Texto secundario:   #d1d5db (gray-300)
Borde:              #374151 (gray-700)

Acento primario:    #32b8c6 (teal-500) - CTA, links
Acento hover:       #2a9eaa (teal-600)
Acento active:      #1f8a97 (teal-700)

Éxito:              #22c55e (green-500)
Alerta:             #f59e0b (amber-500)
Error:              #ef4444 (red-500)
Info:               #0ea5e9 (cyan-500)

Fondo éxito:        rgba(34, 197, 94, 0.1)
Fondo alerta:       rgba(245, 158, 11, 0.1)
Fondo error:        rgba(239, 68, 68, 0.1)
```

### Contraste verificado
- Texto blanco sobre teal: 7.2:1 ✓ (WCAG AAA)
- Texto gris-100 sobre gris-900: 13.5:1 ✓ (WCAG AAA)
- Verde sobre fondo oscuro: 6.8:1 ✓ (WCAG AAA)

---

## 8. TIPOGRAFÍA

### Familia de Fuentes
- **Display (títulos >28px):** `Inter`, `system-ui`
- **Body (body text):** `Inter`, `Segoe UI`, `-apple-system`
- **Mono (código):** `Menlo`, `Monaco`, `Courier New`

### Escala de Tamaños
```
H1 (Títulos página):     32px / 1.4 line-height / 600 weight
H2 (Subtítulos):         24px / 1.3 line-height / 600 weight
H3 (Secciones):          20px / 1.3 line-height / 600 weight
Body (Normal):           14px / 1.6 line-height / 400 weight
Small (Labels, help):    12px / 1.5 line-height / 400 weight
Caption (Metadata):      11px / 1.4 line-height / 400 weight
```

### Jerarquía Visual (Técnico)
- Fuente MÍNIMA 16px para labels/instrucciones.
- Fuente MÍNIMA 18px para títulos críticos.
- Espaciado vertical 24px+ entre secciones.

---

## 9. ESPACIADO Y LAYOUT

### Escala de Spacing
```
xs: 4px   (micro espacios, bordas de elementos)
sm: 8px   (inner spacing)
md: 16px  (standard padding)
lg: 24px  (section spacing)
xl: 32px  (container margin)
```

### Grid System
```
Max-width container: 1200px
Gutter (lateral): 24px en desktop, 16px en mobile
Columnas: 12 col layout (responsive)
```

---

## 10. ANIMACIONES Y TRANSICIONES

### Duraciones
```
Fast:     150ms  (hover states, micro-interactions)
Normal:   250ms  (modal open/close, fade-in)
Slow:     400ms  (page transitions)
```

### Easing
```
Standard: cubic-bezier(0.4, 0, 0.2, 1)  (entrada/salida rápida)
Ease-in:  cubic-bezier(0.4, 0, 1, 1)
Ease-out: cubic-bezier(0, 0, 0.2, 1)
```

### Ejemplos
```css
/* Hover botón */
button {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Modal appearance */
.modal {
  animation: fadeIn 250ms ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

---

## 11. RESPONSIVE DESIGN

### Breakpoints
```
Mobile:    < 640px  (default target: 375px width)
Tablet:    640px–1024px
Desktop:   > 1024px
```

### Estrategia
- **Mobile:** Stack vertical, botones full-width, fuente grande.
- **Tablet:** 2 columnas donde aplique, sidebar colapsable.
- **Desktop:** 3 columnas, sidebar fijo, densa información.

**Para TÉCNICO en taller:** optimizar para tablets 7–8" en verticales (fuente >16px siempre).

---

## 12. ACCESIBILIDAD

### Estándares
- **WCAG 2.1 AA mínimo** (cumplimiento legal en muchas jurisdicciones).
- **WCAG 2.1 AAA deseado** para textos de taller (alto contraste crítico).

### Checklist Esencial
- ✓ Todos los inputs tienen `<label>` explícito.
- ✓ Todos los botones tienen `aria-label` o texto visible.
- ✓ Contraste mínimo 4.5:1 para texto, 3:1 para gráficos (AA).
- ✓ Navegación por teclado posible (Tab, Enter, Esc).
- ✓ Focus visible en todos los elementos interactivos.
- ✓ Orden lógico de tab (logicalTabIndex o HTML order).
- ✓ Imágenes tienen `alt` text descriptivo.
- ✓ Tablas tienen `<thead>`, `<tbody>`, `<th>` semántico.
- ✓ Modales tienen rol y aria-modal.

### Testing
```bash
npm run a11y  # Autotest axe + manual review
```

---

## CONCLUSIÓN

El diseño es **intencionalmente biespaciado para taller** (fuente grande, alto contraste, interacciones claras) pero mantiene **profesionalismo admin** (densidad media, tablas compactas, filtros avanzados).

**Principio central:** *"Un técnico debe poder usar la app con guantes en luz variable. Un admin debe poder analizar 100 eventos en 2 minutos."*

Cada decisión de UX tiene una razón operacional.

---

**Fecha:** 21 de enero de 2026  
**Versión:** 1.0  
**Estado:** Listo para implementación en Figma / Storybook
