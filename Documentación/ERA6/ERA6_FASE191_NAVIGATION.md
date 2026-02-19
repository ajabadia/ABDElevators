# FASE 191: Navigation Simplification & Progressive Disclosure
## Guía de Ejecución Detallada

**Prioridad:** CRÍTICA | **Estimación:** 2 semanas | **Depende de:** FASE 190 (visual consistency)

---

## 🎯 Objetivo

Reducir la profundidad de navegación de 4 niveles a 2 máximo para el usuario técnico.

---

## 📋 Diagnóstico (Verificado 2026-02-19)

### Los 35 subdirectorios actuales bajo `admin/`

```
admin/
├── ai/                    → AI Hub (playground, predictive)
├── analytics/             → Analytics Dashboard
├── api-docs/              → API Documentation
├── api-keys/              → API Key Management
├── audit/                 → Audit Trail
├── billing/               → Billing Management
├── cases/                 → Case Management
├── checklist-configs/     → Checklist Configuration
├── compliance/            → Compliance Dashboard
├── document-types/        → Document Type Config
├── ingest/                → Ingestion Management
├── intelligence/          → Intelligence Hub
├── knowledge/             → Knowledge Hub
├── knowledge-assets/      → Knowledge Assets (DUPLICADO de knowledge)
├── knowledge-base/        → Knowledge Base (DUPLICADO de knowledge)
├── logs/                  → System Logs
├── my-documents/          → My Documents
├── notifications/         → Notification Center
├── operations/            → Operations (trace, maintenance)
├── organizations/         → Organization Settings
├── permissions/           → Permission Matrix / Guardian
├── profile/               → User Profile
├── prompts/               → Prompt Governance
├── rag-quality/           → RAG Quality Dashboard
├── reports/               → Report Hub
├── security/              → Security (sessions)
├── settings/              → Settings (i18n, branding)
├── spaces/                → Space Management
├── superadmin/            → SuperAdmin Panel
├── support/               → Support Management
├── tasks/                 → Task Management
├── users/                 → User Management
├── workflow-tasks/        → Workflow Tasks
├── workflows/             → Workflow Designer
└── workshop/              → Workshop / Orders
```

### Duplicados identificados:
- `knowledge/` + `knowledge-assets/` + `knowledge-base/` → **Fusionar en 1**
- `workflow-tasks/` + `tasks/` → **Fusionar en 1**
- `my-documents/` (admin) + `my-documents/` (authenticated) → **Mismo concepto, 2 rutas**

---

## 🏗️ Modelo de Navegación Propuesto

### Vista TÉCNICO (role: USER)

Solo 4 acciones visibles en la sidebar principal:

```
┌──────────────────────────────────┐
│ 🔍 Buscar en Documentación      │  → /search (GlobalSemanticSearch)
│ 📄 Analizar Documento            │  → /analyze (SimpleAnalyzeFlow)
│ 📊 Mis Informes                  │  → /reports (lista + generador)
│ 📋 Mis Casos                     │  → /cases (lista de tickets/pedidos)
├──────────────────────────────────┤
│ ⚙️ Mi Perfil                     │  → /settings (datos personales)
│ ❓ Soporte                       │  → /support
└──────────────────────────────────┘
```

**Keyboard shortcuts:**
- `Cmd+K` → Buscar
- `Cmd+U` → Subir documento
- `Cmd+R` → Mis informes

### Vista ADMIN (role: ADMIN)

```
┌──────────────────────────────────┐
│ 📊 Panel General                 │  → /admin (dashboard consolidado)  
├──────────────────────────────────┤
│ GESTIÓN                          │
│  👥 Equipo                       │  → /admin/users
│  📚 Documentación                │  → /admin/knowledge (fusionado)
│  📋 Checklist & Entidades        │  → /admin/checklist-configs
│  🏭 Casos & Pedidos              │  → /admin/cases
├──────────────────────────────────┤
│ SEGURIDAD                        │
│  🔒 Permisos                     │  → /admin/permissions
│  📝 Auditoría                    │  → /admin/audit
│  🛡️ Compliance                   │  → /admin/compliance
├──────────────────────────────────┤
│ ▼ AVANZADO (colapsado)           │
│  🧠 IA & Prompts                 │  → /admin/prompts, /admin/ai
│  ⚡ Workflows                    │  → /admin/workflows
│  📊 RAG Quality                  │  → /admin/rag-quality
│  💰 Billing                      │  → /admin/billing
│  🔧 Operaciones                  │  → /admin/operations
│  🔑 API Keys                     │  → /admin/api-keys
│  ⚙️ Configuración                │  → /admin/settings
│  📋 Logs                         │  → /admin/logs
└──────────────────────────────────┘
```

### Vista SUPERADMIN (role: SUPERADMIN)

Igual que ADMIN pero con acceso a:
- `/admin/superadmin` → Panel de SuperAdmin
- `/admin/organizations` → Gestión multi-tenant
- Módulos avanzados expandidos por defecto

---

## 🔧 Implementación Técnica

### Archivo principal: `src/components/layout/sidebar.tsx` (o similar)

La sidebar actual ya tiene lógica de navegación. El cambio consiste en:

1. **Filtrar items por rol** usando el session del usuario
2. **Agrupar items** en secciones lógicas (GESTIÓN, SEGURIDAD, AVANZADO)
3. **Colapsar "Avanzado"** por defecto con `defaultCollapsed: true`

### Hook `useNavigation` 

Verificar si ya existe y tiene soporte para `activeModules`. Si no, crear:

```typescript
// Pseudocódigo de referencia
function useFilteredNavigation(role: UserRole) {
  const allItems = useNavigation();
  
  if (role === 'USER') {
    return allItems.filter(i => TECHNICAL_ITEMS.includes(i.id));
  }
  
  if (role === 'ADMIN') {
    return groupItems(allItems, ADMIN_SECTIONS);
  }
  
  return allItems; // SUPERADMIN ve todo
}
```

### Route Aliases

Las rutas existentes NO se eliminan. Se mantienen para:
- Bookmarks de usuarios
- Links internos en documentación
- Deep links desde emails/notificaciones

Solo se cambia **lo que aparece en la sidebar**.

---

## ✅ Criterio de "Done"

- [ ] Un usuario con `role: USER` ve máximo 6 items en la sidebar
- [ ] Un usuario con `role: ADMIN` ve máximo 15 items (con "Avanzado" colapsado)
- [ ] `knowledge-assets` + `knowledge-base` fusionados en un solo hub visible
- [ ] Todas las rutas existentes siguen respondiendo (no hay 404 nuevos)
- [ ] Breadcrumbs muestran máximo 2 niveles
- [ ] Atajos de teclado (`Cmd+K`, `Cmd+U`) funcionan

---

## ⚠️ Riesgos

- **Guardian V3:** La Matriz de Permisos ya controla qué ve cada rol. No duplicar lógica → usar `enforcePermission` existente para decidir visibilidad.
- **useTranslations:** Las claves de traducción de la sidebar están en `common.json` o `admin.json`. Si se reorganizan items, verificar que las claves siguen resolviendo.
- **Deep links:** Si alguien tiene bookmark a `/admin/knowledge-assets`, debe seguir funcionando aunque la sidebar ahora muestre "Documentación".
