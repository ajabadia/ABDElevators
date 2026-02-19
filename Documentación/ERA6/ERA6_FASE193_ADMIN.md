# FASE 193: Admin Panel Consolidation
## Guía de Ejecución Detallada

**Prioridad:** MEDIA | **Estimación:** 2 semanas | **Depende de:** FASE 191 (navigation)

---

## 🎯 Objetivo

Consolidar 35 subdirectorios admin en 4 secciones claras con progressive disclosure.
Reducir las páginas visibles para un Admin estándar de 35 a ~12.

---

## 📋 Mapeo de Consolidación

### Sección 1: EQUIPO (5 → 2 rutas visibles)

| Ruta actual | Acción | Ruta consolidada |
|-------------|--------|-----------------|
| `/admin/users` | Mantener (primaria) | `/admin/users` |
| `/admin/permissions` | Mantener (secundaria) | `/admin/permissions` |
| `/admin/profile` | Mover a `/settings` | `/settings/profile` |
| `/admin/organizations` | Mover a "Avanzado" | Solo visible SUPERADMIN |
| `/admin/superadmin` | Mover a "Avanzado" | Solo visible SUPERADMIN |

### Sección 2: DOCUMENTACIÓN (6 → 2 rutas visibles)

| Ruta actual | Acción | Ruta consolidada |
|-------------|--------|-----------------|
| `/admin/knowledge` | Mantener (primaria) | `/admin/knowledge` |
| `/admin/knowledge-assets` | **FUSIONAR** con knowledge | Redirect a `/admin/knowledge?tab=assets` |
| `/admin/knowledge-base` | **FUSIONAR** con knowledge | Redirect a `/admin/knowledge?tab=base` |
| `/admin/my-documents` | Mantener (secundaria) | `/admin/my-documents` |
| `/admin/document-types` | Mover a "Avanzado" | Tab dentro de knowledge config |
| `/admin/spaces` | Mover a "Avanzado" | (O renombrar a "Carpetas") |

### Sección 3: OPERACIONES (6 → 3 rutas visibles)

| Ruta actual | Acción | Ruta consolidada |
|-------------|--------|-----------------|
| `/admin/cases` | Mantener (primaria) | `/admin/cases` |
| `/admin/checklist-configs` | Mantener (secundaria) | `/admin/checklist-configs` |
| `/admin/reports` | Mantener (secundaria) | `/admin/reports` |
| `/admin/workshop` | **EVALUAR**: ¿Se usa? | Si sí, mantener. Si no, ocultar. |
| `/admin/tasks` + `/admin/workflow-tasks` | **FUSIONAR** | `/admin/tasks` |
| `/admin/ingest` | Mover a "Avanzado" | Parte de Knowledge config |

### Sección 4: SEGURIDAD (4 → 2 rutas visibles)

| Ruta actual | Acción | Ruta consolidada |
|-------------|--------|-----------------|
| `/admin/audit` | Mantener (primaria) | `/admin/audit` |
| `/admin/compliance` | Mantener (secundaria) | `/admin/compliance` |
| `/admin/security` | Mover a "Avanzado" | Sessions management es raro |
| `/admin/permissions` (simulator) | Mover a "Avanzado" | Power-user only |

### Sección 5: AVANZADO (colapsado por defecto)

Todos los siguientes se **mantienen como están** pero solo aparecen en la sección colapsada:

| Ruta | Justificación |
|------|---------------|
| `/admin/ai` (playground, predictive) | Power-user / data scientist |
| `/admin/prompts` | Prompt governance specialist |
| `/admin/workflows` | Automation engineer |
| `/admin/rag-quality` | Quality assurance |
| `/admin/analytics` | Business analytics |
| `/admin/billing` | Finance |
| `/admin/api-keys` | Developer / integration |
| `/admin/api-docs` | Developer |
| `/admin/settings` (i18n, branding) | Platform admin |
| `/admin/operations` (trace, maintenance) | DevOps |
| `/admin/logs` | DevOps |
| `/admin/notifications` | Platform admin |
| `/admin/intelligence` | Data science |

---

## 🔧 Implementación

### Paso 1: Crear redirect routes para fusiones

```typescript
// src/app/(authenticated)/(admin)/admin/knowledge-assets/page.tsx
// Convertir en redirect
import { redirect } from 'next/navigation';
export default function KnowledgeAssetsPage() {
  redirect('/admin/knowledge?tab=assets');
}
```

### Paso 2: Configurar agrupación en sidebar

El cambio es de **configuración**, no de código nuevo. La sidebar ya tiene la estructura; solo hay que:
1. Definir `ADMIN_SECTIONS` con las 4 secciones + "Avanzado"
2. Marcar items como `advancedOnly: true`
3. Añadir `defaultCollapsed: true` a la sección "Avanzado"

### Paso 3: Verificar Guardian V3

Cada ruta que se mueve o se oculta debe mantener su permiso actual. No se alteran permisos, solo **visibilidad en la navegación**.

---

## ✅ Criterio de "Done"

- [ ] Sidebar de Admin muestra 4 secciones claras
- [ ] Sección "Avanzado" colapsada por defecto
- [ ] `knowledge-assets` y `knowledge-base` redirigen a `/admin/knowledge?tab=...`
- [ ] `tasks` + `workflow-tasks` fusionados
- [ ] Todas las rutas antiguas siguen respondiendo (redirects, no 404)
- [ ] Máximo 12-15 items visibles sin expandir "Avanzado"
