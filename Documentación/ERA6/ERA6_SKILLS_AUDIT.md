# ERA 6: Skills Adaptation Analysis
## Auditoría de Skills Existentes para la Nueva Era

**Fecha:** 2026-02-19
**Contexto:** Las skills actuales fueron diseñadas durante ERA 4-5 (Feature Development). ERA 6 cambia el foco a usabilidad y consolidación. Algunas skills tienen contradicciones internas con la filosofía ERA 6.

---

## 📊 Matriz de Skills vs Fases ERA 6

| Skill | FASE 190 (Visual) | FASE 191 (Nav) | FASE 192 (Flows) | FASE 193 (Admin) | FASE 194 (Onboard) | FASE 195-196 (Feedback/Cleanup) | ¿Requiere update? |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `ui-styling` | ✅ CORE | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 🟡 MENOR |
| `hub-dashboard-architect` | ⚪ | ✅ CORE | ⚪ | ✅ CORE | ⚪ | ⚪ | 🔴 MAYOR |
| `i18n-a11y-auditor` | ⚪ | ⚪ | ✅ | ⚪ | ✅ | ✅ | 🟡 MENOR |
| `security-auditor` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ CORE | ⚪ OK |
| `hygiene-reviewer` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ CORE | ⚪ OK |
| `toast-notifier-auditor` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ⚪ OK |
| `code-quality-auditor` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚪ OK |
| `guardian-auditor` | ⚪ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ OK |
| `app-full-reviewer` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚪ OK (wrapper) |

---

## 🔍 Análisis por Skill

### 1. `ui-styling` — 🟡 Update MENOR

**Estado actual:** Ya prohíbe colores hardcodeados (línea 28-33). Tiene tabla de conversión, reglas de dark mode, componentes primitivos (`PageContainer`, `PageHeader`, `ContentCard`).

**Problema encontrado:** La MetricCard en línea 173 acepta `color="blue"` como prop:
```tsx
<MetricCard ... color="blue" />
```
Esto contradice la regla de "NUNCA colores hardcodeados".

**Acción ERA 6:**
- Cambiar la referencia de `color="blue"` a `color="primary"` o eliminar la prop en favor de variant semántica.
- Añadir una sección "ERA 6: Validación masiva" con el regex de grep para auditoría de archivos a escala.
- Añadir referencia a `ERA6_FASE190_VISUAL.md` como guía de ejecución detallada.

---

### 2. `hub-dashboard-architect` — 🔴 Update MAYOR

**Estado actual:** Diseña hubs con cards y colores por categoría.

**Problemas encontrados:**

1. **Línea 30**: Recomienda `color: Estilo de borde (ej: border-l-blue-500)` → Hardcoded color.
2. **Línea 49**: Paleta de colores hardcodeada: `Blue, Emerald, Amber, Purple, Rose, Indigo` → Contradice `ui-styling` directamente.
3. **Filosofía:** El concepto de "Hub con 3+ fichas" era válido en ERA 4-5 para crear puntos de entrada. En ERA 6, los hubs se **consolidan** (de 35 a 4 secciones). La skill debe actualizarse para:
   - Soportar "secciones colapsables" (Avanzado)
   - Usar variables semánticas para bordes de categoría (`border-l-primary`, `border-l-secondary`, `border-l-accent`, `border-l-destructive`)
   - Incluir lógica de "progressive disclosure" (mostrar/ocultar por rol)

**Acción ERA 6:**
- Reescribir la sección de colores para usar variables semánticas exclusivamente.
- Añadir patrón "Collapsible Section" para la sección "Avanzado".
- Añadir regla: "Si el hub tendría > 6 fichas, usar secciones agrupadas con colapsable."
- Añadir filtrado por rol como paso obligatorio.

---

### 3. `i18n-a11y-auditor` — 🟡 Update MENOR

**Estado actual:** Cubre i18n (hardcoded text detection, namespacing) + a11y (semántica HTML, ARIA) + UX (toasts, errores).

**Problema encontrado en Fase 3 (línea 49):**
```
Colores standard: Amber (bg-amber-500) para advertencias, Red (bg-red-600) para errores, 
Purple (bg-purple-600) para errores lógicos.
```
Esto contradice `ui-styling`. Los badges deberían usar:
- Advertencias: `bg-amber-500/10 text-amber-600` → ACEPTABLE (semántico por naturaleza, no es branding)
- Errores: `bg-destructive/10 text-destructive` → Usar variable semántica
- Lógicos: `bg-secondary/10 text-secondary` → Usar variable semántica

**💡 Matiz importante:** Los colores de estado (success/warning/error/info) son un caso especial. `amber-500` para warning y `green-500` para success son estándares UX universales, no "branding". La regla debería ser:
- **Branding colors** (primary, accent): SIEMPRE semánticos
- **Status colors** (success, warning, error, info): Se PUEDEN usar por nombre, pero definir como CSS variables (`--success`, `--warning`, etc.)

**Acción ERA 6:**
- Actualizar Fase 3 para usar variables semánticas de estado.
- Añadir regla de "Terminología de negocio" reforzada (ERA 6 pone foco en que el usuario NO vea jerga técnica).
- Añadir regla: toasts de error en lenguaje de negocio (no códigos de error).

---

### 4. `security-auditor` — ⚪ OK (sin cambios)

**Estado actual:** Cubre inyecciones, sesiones, headers, PII, multi-tenant.

**Análisis ERA 6:** Completamente compatible. Será la herramienta principal para FASE 196 (cleanup de `error.message` exposure y middleware security). Sin necesidad de modificación.

---

### 5. `hygiene-reviewer` — ⚪ OK (sin cambios)

**Estado actual:** Cubre `any` casts, console.log, hardcoded limits, race conditions, legacy engines.

**Análisis ERA 6:** Directamente útil para FASE 196. El patrón HYG-001 (session type safety) y HYG-006 (API catch block) son exactamente lo que necesitamos auditar. Sin necesidad de modificación.

**Nota:** Podría añadirse un patrón HYG-008 para "setIsSaving sin finally" pero no es urgente.

---

### 6. `toast-notifier-auditor` — ⚪ OK (sin cambios)

**Estado actual:** Detecta interacciones sin feedback visual y añade toasts.

**Análisis ERA 6:** Útil para FASE 196 (unificación de mensajes de error). La skill ya cubre el "qué" (añadir toasts); ERA 6 añade el "cómo" (lenguaje de negocio, no técnico).

---

### 7. `code-quality-auditor` — ⚪ OK (sin cambios)

**Estado actual:** Checklist integral (API routes, servicios, componentes, auth, logging, a11y).

**Análisis ERA 6:** Es la skill más completa y ya cubre:
- i18n (líneas 170-185)
- a11y (líneas 187-194)
- UX consistency (líneas 201-204)
- Rendimiento (líneas 206-212)
- Composición (líneas 214-219)

Sin necesidad de modificación. Sirve como "meta-skill" que invoca a las demás.

---

### 8. `guardian-auditor` — ⚪ OK (sin cambios)

**Análisis ERA 6:** Será crucial para FASE 191 (navigation por rol) y FASE 193 (admin consolidation). La lógica de permisos existente es lo que controla qué ve cada rol. Sin necesidad de modificación.

---

## 📋 Plan de Actualización de Skills

### Prioridad ALTA (antes de empezar FASE 190)

1. **`ui-styling`**: Fix menor en MetricCard color prop + añadir sección "ERA 6 Bulk Audit"
2. **`hub-dashboard-architect`**: Reescribir colores → semánticos + añadir collapsible sections + progressive disclosure

### Prioridad MEDIA (antes de empezar FASE 194)

3. **`i18n-a11y-auditor`**: Fix colores de Fase 3 + reforzar regla de terminología de negocio

### Sin cambios necesarios

4. `security-auditor` → OK
5. `hygiene-reviewer` → OK  
6. `toast-notifier-auditor` → OK
7. `code-quality-auditor` → OK
8. `guardian-auditor` → OK

---

## 🗺️ Referencia: `map.md`

El archivo `map.md` contiene (o debería contener) todas las rutas de la aplicación. Es la referencia principal para:

- **FASE 190**: Identificar TODAS las páginas que necesitan auditoría visual
- **FASE 191**: Verificar qué rutas existen vs qué muestra la navegación
- **FASE 193**: Mapear qué rutas admin se consolidan/fusionan
- **FASE 196**: Identificar rutas placeholder vs funcionales

**Acción:** Verificar que `map.md` está actualizado (se auditó recientemente en FASE 185-186) y usarlo como checklist de progreso en cada FASE.
