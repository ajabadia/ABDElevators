# ERA 11: Unified Navigation & Role architecture

Este documento describe la estructura definitiva de navegación y rutas de la Era 11 de ABDElevators, optimizada para multi-tenant y multi-vertical.

---

## 🎭 VISTA POR ROL (Simulación Sidebar)

### SuperAdministrador (`SUPER_ADMIN`)
```plain
┌────────────────────────────────────────┐
│  🔍 Búsqueda inteligente...           │
├────────────────────────────────────────┤
│  🏠 Dashboard                          │
│  ───────────────────────────────────── │
│  📋 TRABAJO & PEDIDOS                  │
│  ├─ Pedidos / Contratos             12 │
│  ├─ Validaciones                       │
│  ├─ Mis Tareas                      5  │
│  └─ Documentos                         │
│  ───────────────────────────────────── │
│  🧠 INTELIGENCIA RAG                   │
│  ├─ ⭐ Búsqueda RAG (Ctrl+K)           │
│  ├─ Explorador Semántico               │
│  ├─ Mapa de Conocimiento               │
│  ├─ Activos de Conocimiento            │
│  ├─ Gestión de Espacios                │
│  └─ Calidad RAG                        │
│  ───────────────────────────────────── │
│  🤖 AGENTES & IA                       │
│  ├─ Flujos de Trabajo                  │
│  ├─ Biblioteca de Prompts              │
│  ├─ IA Playground                      │
│  └─ Gobernanza de IA                   │
│  ───────────────────────────────────── │
│  📊 INSIGHTS & DATOS                   │
│  ├─ Generador de Informes              │
│  ├─ Informes Programados               │
│  ├─ Analítica Avanzada                 │
│  └─ Trazabilidad Audit                 │
│  ───────────────────────────────────── │
│  ⚙️ CONFIGURACIÓN                       │
│  ├─ Mi Perfil                          │
│  ├─ Organización                       │
│  ├─ Permisos Guardian                  │
│  └─ Sistema & Infra                    │
│  ───────────────────────────────────── │
│  🎓 SOPORTE & AYUDA                    │
│  ├─ Documentación                      │
│  ├─ Referencia API                     │
│  ├─ Ticket de Soporte                  │
│  └─ Zona Labs                          │
└────────────────────────────────────────┘
```

### Administrador (Tenant) (`ADMIN`)
```plain
┌────────────────────────────────────────┐
│  🔍 Búsqueda inteligente...           │
├────────────────────────────────────────┤
│  🏠 Dashboard                          │
│  ───────────────────────────────────── │
│  📋 TRABAJO & PEDIDOS                  │
│  ├─ Pedidos / Contratos             8  │
│  ├─ Validaciones                       │
│  ├─ Mis Tareas                      3  │
│  └─ Documentos                         │
│  ───────────────────────────────────── │
│  🧠 INTELIGENCIA RAG                   │
│  ├─ ⭐ Búsqueda RAG (Ctrl+K)           │
│  ├─ Explorador Semántico               │
│  ├─ Mapa de Conocimiento               │
│  ├─ Activos de Conocimiento            │
│  ├─ Gestión de Espacios                │
│  └─ Calidad RAG                        │
│  ───────────────────────────────────── │
│  🤖 AGENTES & IA                       │
│  ├─ Flujos de Trabajo                  │
│  ├─ Biblioteca de Prompts              │
│  └─ IA Playground                      │
│  ───────────────────────────────────── │
│  📊 INSIGHTS & DATOS                   │
│  ├─ Generador de Informes              │
│  ├─ Informes Programados               │
│  └─ Analítica Avanzada                 │
│  ───────────────────────────────────── │
│  ⚙️ CONFIGURACIÓN                       │
│  ├─ Mi Perfil                          │
│  ├─ Organización                       │
│  └─ Permisos Guardian                  │
│  ───────────────────────────────────── │
│  🎓 SOPORTE & AYUDA                    │
│  ├─ Documentación                      │
│  ├─ Referencia API                     │
│  └─ Ticket de Soporte                  │
└────────────────────────────────────────┘
```

### Técnico (`TECHNICAL`)
```plain
┌────────────────────────────────────────┐
│  🔍 Búsqueda inteligente...           │
├────────────────────────────────────────┤
│  🏠 Dashboard                          │
│  ───────────────────────────────────── │
│  📋 TRABAJO & PEDIDOS                  │
│  ├─ Pedidos / Contratos             5  │
│  ├─ Validaciones                    2  │
│  ├─ Mis Tareas                      8  │
│  └─ Documentos                         │
│  ───────────────────────────────────── │
│  🧠 INTELIGENCIA RAG                   │
│  ├─ ⭐ Búsqueda RAG (Ctrl+K)           │
│  ├─ Explorador Semántico               │
│  └─ Mapa de Conocimiento               │
│  ───────────────────────────────────── │
│  ⚙️ CONFIGURACIÓN                       │
│  └─ Mi Perfil                          │
│  ───────────────────────────────────── │
│  🎓 SOPORTE & AYUDA                    │
│  ├─ Documentación                      │
│  └─ Ticket de Soporte                  │
└────────────────────────────────────────┘
```

---

## 🏷️ ETIQUETADO DINÁMICO (Vertical-Aware)

El item **"Pedidos"** adapta su nombre automáticamente según la Vertical de Industria activa:

| Vertical | Etiqueta (ES) | Etiqueta (EN) |
| :--- | :--- | :--- |
| **Generales / Ascensores** | Pedidos | Orders |
| **Banca & Finanzas** | Contratos | Contracts |
| **Inmuebles & Activos** | Inmuebles | Properties |
| **Mente Legal** | Casos | Cases |
| **Córtex Clínico** | Pacientes | Patients |

---

## 📍 ESTRUCTURA DE URLS CANÓNICAS

### Núcleo de Trabajo (`WORK`)
```plain
🏠 /dashboard              → Panel principal (personalizado por rol)
📋 /work/orders            → Gestión de Entidades (Pedidos/Contratos)
📋 /work/validations       → Centro de validaciones y cumplimiento
📋 /work/tasks             → Tareas de workflows y procesos
📋 /intelligence/my-docs   → Repositorio personal de documentos
```

### Inteligencia y RAG (`INTELLIGENCE`)
```plain
🧠 /search                 → Interfaz principal de Búsqueda RAG
🧠 /intelligence/explorer  → Navegación semántica del conocimiento
🧠 /intelligence/graph     → Visualización del mapa de relaciones
🧠 /intelligence/assets    → Gestión de colecciones y activos
🧠 /intelligence/spaces    → Definición de entornos de conocimiento
🧠 /agents/rag-quality     → Monitor de precisión y calidad de IA
```

### Agentes y Automatización (`AGENTS`)
```plain
🤖 /agents/workflows       → Diseñador de procesos autónomos
🤖 /agents/prompts         → Catálogo maestro de instrucciones
🤖 /agents/playground      → Laboratorio de pruebas de modelos
🤖 /agents/governance      → Gobernanza y cuotas de modelos IA
```

### Insights y Auditoría (`INSIGHTS`)
```plain
📊 /insights/reports       → Pantalla para generar nuevos informes
📊 /insights/scheduled     → Listado de reportes automáticos
📊 /insights/analytics     → Dashboards de uso y rendimiento
📊 /insights/audit         → Trazabilidad completa (SOC2)
```

### Configuración y Sistema (`SETTINGS`)
```plain
⚙️ /settings/profile       → Preferencias de usuario, MFA y tema
⚙️ /settings/organization  → Datos del Tenant (Marca, Facturación)
⚙️ /settings/permissions     → Gestión de grupos Guardian V3
⚙️ /settings/system          → Hub del Sistema (SuperAdmin)
   ├─ /settings/system/operations
   ├─ /settings/system/security
   ├─ /settings/system/notifications
   ├─ /settings/system/i18n
   └─ /settings/system/api
```

### Soporte y Recursos (`HELP`)
```plain
🎓 /help/support           → Centro de Ayuda y FAQ
🎓 /help/api               → Documentación Técnica para Desarrolladores
🎓 /help/labs              → Funcionalidades experimentales
```

---

## 🛠️ TOOLING ERA 11

### Guardian V3 Integration
Todas las rutas están protegidas mediante `GuardianEngine`:
- **AuthN**: NextAuth.js 5+
- **AuthZ**: ABAC (Attribute-Based Access Control) mediante `secureByResource(resource, action)`.
- **Verticals**: Etiquetas inyectadas vía `VerticalRegistryService`.

### i18n Era 11
Uso de `next-intl` con fallbacks maestros en base de datos:
- Archivos locales: `messages/es/common.json`.
- Sincronización: `npx tsx scripts/sync-translations.ts`.
- Claves canónicas: `navigation.nav.*`.
