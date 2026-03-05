# ROADMAP_MASTER – Source of Truth for ABD RAG Platform (Unified v5.6.0 - ERA 9 SYMPHONY)

## 📖 Overview

---

- **Status & Metrics (v5.0.0 - SUITE ERA)**
- **Global Progress:** 100% (Industrialization & Suite foundation complete).
- **Industrialization Progress:** 100% (Phases 101-182 COMPLETED ✅).
- **Vertical Industry Support:** ✅ **FASE 98 COMPLETED** - Infrastructure & Synthetic Data for Legal, Banking, Insurance.
- **UX Transform**- **Last Audit:** 2026-03-02 (Phase 244 / FASE 26 Implementation)
- **Enterprise SaaS Ready:** 100% (Phase 182 COMPLETED ✅).
- **Core Status:** ✅ **STABLE** - Massive TypeScript Cleanup & Namespace Migration Complete.
- - [X] **Compliance Status:** 🛡️ **FASE 176 COMPLETED** - **v5.7.4** (2026-03-04): [Fase 272] Route Deduplication & Ghost Page Audit 🧹
- - [X] **UX Status:** 🎨 **FASE 176 COMPLETED** - Hub-based Navigation Organization
- **Recent Ship**: **FASE 261: INGESTION CENTER REDESIGN** (COMPLETED), **FASE 260: ERA 10 FOUNDATION** (COMPLETED), **FASE 272: ROUTE DEDUPLICATION** (COMPLETED), **FASE 271: PERFORMANCE HARDENING P1** (COMPLETED), **FASE 255: BRIDGE CLEANUP** (COMPLETED), **FASE 254: PERFORMANCE SKELETONS** (COMPLETED).
- **Project Status**: ✅ **ERA 8 & 9 COMPLETED**. **ERA 10: CLARITY** in progress (v5.8.0).
- **Active Track**: 🌅 **ERA 10: CLARITY — THREE MOTHER VIEWS (PHASES 262-269)**.
- **Recent Context**: ✅ PHASE 261 COMPLETED: Ingestion Center Redesign (v5.8.0). 
- **Strategic Mandate**: ⚠️ Al finalizar la ERA 10, se deberán REPETIR las fases de saneamiento, auditoría y deduplicación (v5.7.0 - v5.7.4) como un barrido final de integridad arquitectónica.
- **Critical Issue:** ✅ PHASE 140 RESOLVED - Missing Rate Limiting & Log Vulnerabilities.
- **Architecture Review:** FASE 129-155 (Knowledge Graph Evolution + Enterprise Maturity + UX Standardization)

#### 🔮 FASE 73: FRONTERAS TECNOLÓGICAS (VISION 2028+)

**Objetivo:** Diferenciación competitiva extrema mediante tecnologías de vanguardia (Ref: `1502.md`).

- [🅿️] **Federated Learning Consortium**: Alertas de patrones de fraude/fallo compartidos sin exchange de PII. *(PARKING: I+D pura, sin demanda de mercado inmediata ni infraestructura base)*
- [🅿️] **Digital Twins**: Gemelos digitales de flujo de caja y procesos operativos para simulación predictiva. *(PARKING: Requiere integración IoT y datos operativos reales, fuera de alcance actual)*

---

#### 🚀 FASE 110: ENTERPRISE ANALYTICS (COMPLETADO ✅)

**Objetivo:** Observabilidad multi-tenant y salud financiera.

- [X] **Global Dashboard PRO (v1)**: Métricas unificadas, salud de cluster y Financial Health (Predictiva).
- [X] **Predictive Costing v1**: Proyección lineal de consumo basada en histórico real (v4.7.8).
- [X] **Self-Healing Knowledge Assets**: Auditoría automática de obsolescencia.

- [🅿️] **Predictive LLM Costing (v2)**: Modelos de IA entrenados con histórico >90 días.
- [🅿️] **Advanced Ingestion Workers**: Clúster distribuido de workers (solo con alta carga).

#### 🚀 FASE 160: ENTERPRISE REPORTING & AGENTIC EVOLUTION (COMPLETADO ✅)

**Objetivo:** Generación industrial de informes y evolución del estudio de automatización agéntica.
**Target:** Operaciones, Ingeniería y Auditoría.

##### 160.1: Industrial PDF Reporting `[COMPLETADO ✅]`

- [X] **Motor de Reportes**: Implementación de `ReportEngine` (jsPDF) con soporte para Templates declarativos (Zod).
- [X] **Templates Industriales**: Informes de Inspección, Calidad RAG y Auditoría (Registry Pattern).
- [X] **Report Hub**: Nueva interfaz `/admin/reports` para generación y gestión de informes históricos.

- [X] **Delivery Automático**: Envío programado de informes por email. (Implemented in `email-service.ts`)

### 📦 ERA 5: SUITE EVOLUCION & INDUSTRIAL PLATFORM SHELL (VISION 2026-2027)

**Objetivo:** Transformar la plataforma en un cascarón industrial reutilizable capaz de soportar múltiples productos.
**Referencia:** [Doc 2110_suite_evolution.md](file:///d:/desarrollos/ABDElevators/Documentación/21/2110_suite_evolution.md)

#### 🏗️ FASE 180: MONOREPO FOUNDATION & NAMESPACE ALIASING

**Status:** `[COMPLETADO ✅]`

- [X] **Workspaces Setup**: Migrar a PNPM Workspaces o Turborepo (apps/rag-app, packages/*).
- [X] **Strategic Aliasing**: Configurar `tsconfig.base.json` con paths `@abd/platform-core/*`, `@abd/ui/*`, `@abd/workflow/*`, `@abd/rag/*`.
- [X] **Shared Configs**: Extraer `eslint-config-custom`, `tailwind-config-base` y `tsconfig-base` a `/config`.
- [X] **Build Pipeline**: Asegurar compilación incremental de paquetes mediante Turbo/Pnpm.

#### 🧩 FASE 181: PLATFORM-CORE & UI-KIT EXTRACTION

**Status:** `[COMPLETADO ✅]`

- [X] **Auth Package**: Mover NextAuth, MFA flows y middleware helpers a `platform-core/auth`.
- [X] **DB & Logging Package**: Centralizar `SecureCollection`, `logEvento` y `SLAInterceptors` en `platform-core/db` y `logging`.
- [X] **UI Component Library**: Extraer componentes Shadcn, layouts base y themes a `ui-kit`.
- [X] **Shared Hooks**: Desacoplar `useApiItem`, `useApiState` y `useOnboarding` del dominio RAG.
- [X] **Governance Registry**: Mover `PromptService` y `UsageService` a `platform-core`. (Schemas migrated)

#### 🧠 FASE 182: DOMAIN DECOUPLING (RAG vs WORKFLOW)

**Status:** `[COMPLETADO ✅]`

- [X] **Workflow Engine Separation**: Mover `CaseWorkflowEngine` y `AIWorkflowEngine` a `workflow-engine`, eliminando alias a `ELEVATORS`.
- [X] **HITL Task Management**: Independizar el servicio de tareas humanas de las entidades de RAG.
- [X] **RAG Vertical Package**: Aislar ingesta, chunking (`KnowledgeAsset`) y retrieval en `rag-engine`.
- [X] **Constants Cleanup**: Reemplazar `industry: ELEVATORS` por configuraciones inyectadas vía `TenantConfig`.

#### 🛡️ FASE 183: SECURITY HARDENING & INTERNAL GATEWAY

**Status:** `[COMPLETED ✅]`

- [X] **Internal Gateway**: Implementar IP allow-listing y rotación automática de secretos para rutas de servicios internos. ✅
- [X] **Centralized Logger**: Homogeneizar todos los logs de plataforma evitando leaks en producción (PII Sanitization). ✅
- [X] **DB Access Consolidation**: Auditoría final de `SecureCollection` para prohibir accesos raw en servicios core y RAG. ✅

#### 🧬 FASE 184: SUITE FEATURES & NEXT-GEN UTILITIES (REF: 2502.txt)

**Status:** `[COMPLETED ✅]`

- [X] **Suite Infrastructure**: Implementación de `FeatureFlagService` (DB-backed) y `ModuleRegistryService` (Licensing). ✅
- [X] **Generic Scheduler**: Evolución a `JobScheduler` (Cron-as-a-Service) multi-tenant. ✅
- [X] **AI Governance**: `AiModelManager` para selección de modelo por tenant y Dataset de Evaluación RAG. ✅
- [X] **Secure Loupe**: Inspector de datos restringido con PII Redaction para SuperAdmins. ✅
- [X] **System Utilities**: `FormBuilderService` y `NotificationHub` unificado. ✅

---

### 🎯 ERA 6: UX-FIRST CONSOLIDATION & USABILITY SURGERY (VISION 2026 H1)

**Filosofía:** *"Un técnico debe poder subir un PDF y obtener una respuesta útil en 60 segundos, sin leer un manual."*

**Objetivo:** Congelar desarrollo de features nuevos. Cirugía selectiva sobre lo existente para maximizar usabilidad, consistencia visual y Time-To-First-Value (TTFV).

**Contexto estratégico:** La plataforma cuenta con ~35 subdirectorios admin, 5+ páginas placeholder ("coming_soon"), 50+ archivos con colores hardcodeados y un `OnboardingProvider` vacío. El código es impresionante como portfolio de ingeniería; como producto, necesita cirugía mayor.

> **REGLA DE ERA 6:** No se crea ninguna funcionalidad nueva. Solo se refactoriza, simplifica, consolida o elimina. Cada FASE debe reducir la complejidad percibida por el usuario final.

**📂 Documentación de referencia:** [Documentación/ERA6/](file:///d:/desarrollos/ABDElevators/Documentación/ERA6/)
- [ERA6_STRATEGY.md](file:///d:/desarrollos/ABDElevators/Documentación/ERA6/ERA6_STRATEGY.md) — Estrategia maestra, análisis crítico de propuestas, riesgos y métricas
- [ERA6_FASE190_VISUAL.md](file:///d:/desarrollos/ABDElevators/Documentación/ERA6/ERA6_FASE190_VISUAL.md) — Guía de ejecución con grep commands, tabla de conversión de colores e inventario de archivos
- [ERA6_FASE191_NAVIGATION.md](file:///d:/desarrollos/ABDElevators/Documentación/ERA6/ERA6_FASE191_NAVIGATION.md) — Modelo de navegación propuesto, inventario de 35 dirs admin, implementación técnica
- [ERA6_FASE192_CORE_FLOWS.md](file:///d:/desarrollos/ABDElevators/Documentación/ERA6/ERA6_FASE192_CORE_FLOWS.md) — Especificación de 3 flujos core (Analizar, Buscar, Informes) con modo Simple vs Experto
- [ERA6_FASE193_ADMIN.md](file:///d:/desarrollos/ABDElevators/Documentación/ERA6/ERA6_FASE193_ADMIN.md) — Mapeo completo de consolidación de 35 subdirectorios a 4 secciones
- [ERA6_FASE194_ONBOARDING.md](file:///d:/desarrollos/ABDElevators/Documentación/ERA6/ERA6_FASE194_ONBOARDING.md) — Wireframes de onboarding, WorkContext Engine, plan de ayuda contextual
- [ERA6_FASE195_196_FEEDBACK_CLEANUP.md](file:///d:/desarrollos/ABDElevators/Documentación/ERA6/ERA6_FASE195_196_FEEDBACK_CLEANUP.md) — Feedback widget, dashboard de valor, inventario de placeholders y deuda técnica
- [ERA6_SKILLS_AUDIT.md](file:///d:/desarrollos/ABDElevators/Documentación/ERA6/ERA6_SKILLS_AUDIT.md) — Auditoría de skills existentes: compatibilidad con ERA 6 y plan de adaptación

**🔒 Backup:** Copia de seguridad de ERA 5 confirmada por el usuario antes de iniciar ERA 6 (2026-02-19).

#### 🚀 FASE 190: VISUAL CONSISTENCY & DESIGN TOKEN ENFORCEMENT

**Status:** `[COMPLETADO ✅]` | **Prioridad:** CRÍTICA | **Estimación:** 2 semanas

**Objetivo:** Eliminar la fractura visual entre módulos. Un solo lenguaje de diseño.

**Diagnóstico real (verificado en codebase):**
- 50+ archivos `.tsx` con colores hardcodeados (`bg-teal-600`, `bg-orange-500`, `text-purple-600`, etc.)
- 5+ sistemas de color compitiendo entre componentes
- Botones con 3-4 variantes de sombra/animación no estandarizadas
- Inconsistencia entre módulos: `teal` en prompts, `orange` en workshop, `emerald` en compliance

**Tareas:**
- [X] **Grep & Destroy**: Auditoría masiva con regex `bg-(teal|orange|emerald|purple|red|green|blue|amber|cyan|violet|indigo|fuchsia|pink|rose|yellow|lime|sky)-[0-9]` → reemplazar por variables semánticas (`primary`, `secondary`, `destructive`, `accent`).
- [X] **Button Standardization**: Definir 4 variantes máximo (`primary`, `secondary`, `ghost`, `destructive`) y aplicar en todos los módulos via `ui-styling` skill.
- [X] **Shadow/Animation Unification**: Un solo sistema de sombras (`shadow-sm`, `shadow-md`, `shadow-lg`) y animaciones (`transition-all`, `hover:scale-[1.02]`).
- [X] **Dark Mode Audit**: Verificar que todos los componentes respetan `dark:` variants y no usan colores que rompen en mode oscuro.
- [X] **Metrics de éxito**: 0 colores hardcodeados fuera de `globals.css` y archivos de tema.

---

#### 🚀 FASE 191: NAVIGATION SIMPLIFICATION & PROGRESSIVE DISCLOSURE

**Status:** `[COMPLETADO ✅]` | **Prioridad:** CRÍTICA | **Estimación:** 2 semanas

**Objetivo:** Reducir la profundidad de navegación de 4 niveles a 2 máximo para el usuario técnico.

**Diagnóstico real:**
- 35 subdirectorios bajo `admin/` (confirmado en codebase)
- Hubs anidados 3-4 niveles (Dashboard → Admin → AI Hub → Playground/RAG Quality/Workflows)
- El usuario debe tomar ~8-12 clicks y 3 decisiones técnicas para hacer una pregunta básica

**Modelo de navegación propuesto (máximo 2 niveles para rol técnico):**

```
┌────────────────────────────────────────────────────────┐
│  ROL: TÉCNICO (Vista por defecto)                      │
│  🔍 Buscar    📄 Analizar    📊 Informes    📋 Casos  │
│  (Todo lo demás: oculto)                               │
├────────────────────────────────────────────────────────┤
│  ROL: ADMIN (Acceso completo)                          │
│  Panel → Equipo | Documentación | Seguridad | Avanzado │
│  "Avanzado" (colapsado): Prompts, Workflows,           │
│   Ontologías, API Keys, Billing, Matriz Guardian       │
└────────────────────────────────────────────────────────┘
```

**Tareas:**
- [X] **Role-Based View Filtering**: Implementar lógica en `useNavigation` para que `role === 'USER'` solo vea 4 acciones principales. `role === 'ADMIN'` ve panel completo con sección "Avanzado" colapsada.
- [X] **Flat Navigation for Technicians**: Crear `SmartNav` con acciones directas (Buscar, Analizar, Informes, Historial) sin sub-menús. Atajos de teclado (`Cmd+K` buscar, `Cmd+U` subir).
- [X] **Admin Consolidation**: Agrupar los 35 subdirectorios en 4 secciones lógicas: Equipo, Documentación, Seguridad, Avanzado.
- [X] **Breadcrumb Simplification**: Máximo 2 niveles de breadcrumb visibles. El resto colapsado.
- [X] **Metrics de éxito**: Clicks para llegar a función principal ≤ 3.

---

#### ⚡ FASE 192: CORE FLOW OPTIMIZATION (SIMPLE vs EXPERT MODE)

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 3 semanas

**Objetivo:** Los 3 flujos core deben funcionar sin fricción en modo "Simple" por defecto. El "Modo Experto" se oculta bajo un toggle.

**Problema actual:** El flujo de análisis requiere elegir Space, configurar chunking, elegir modelo, escribir prompt template... un técnico de mantenimiento con tablet y 15 minutos no hará esto.

##### Flujo 1: Analizar Documento (TTFV < 60s)
- [X] **SimpleAnalyzeFlow**: Drag & drop → auto-detección de tipo → pregunta natural (con sugerencias) → respuesta con fuentes visuales.
- [X] **useSmartConfig Hook**: Auto-configurar `chunkSize`, modelo y `temperature` según tipo de documento detectado. El usuario NUNCA ve estos parámetros en modo Simple.
- [X] **Confidence humanizada**: Reemplazar "faithfulness: 0.87" por "Confianza: Alta / Media / Baja" con código de color.
- [X] **Source Preview**: Miniaturas del PDF en la página exacta de donde viene la respuesta.
- [X] **Expert Toggle**: Botón discreto "⚙️ Modo experto (chunking, modelos, temperatura...)" que expande la UI actual.

##### Flujo 2: Buscar en Base de Conocimiento
- [X] **Simplified Search**: Una caja de texto prominente con selector sencillo de ámbito (Mi empresa / Mi espacio / Todo). Chips de filtros predefinidos por vertical.
- [X] **Results with Context**: Resultados con preview inline del fragmento relevante + highlight.
- [X] **Colapsar métricas RAG**: Trazas de agente, faithfulness scores, etc., dentro de acordeón "Ver detalle técnico".

##### Flujo 3: Generar Informe
- [X] **Template Selection Visual**: Selección de plantilla con preview visual (no lista de texto).
- [X] **Pre-filled Data**: Datos pre-llenados desde el último análisis. Preview antes de exportar.
- [X] **One-click Export**: Generar PDF/Email en un solo click.

---

#### 🚀 FASE 193: ADMIN PANEL CONSOLIDATION

**Status:** `[COMPLETADO ✅]` | **Prioridad:** MEDIA | **Estimación:** 2 semanas

**Objetivo:** Consolidar 35 subdirectorios admin en 4 secciones claras con progressive disclosure.

**Estructura propuesta:**

```yaml
CONFIGURACIÓN (Admin Hub):
  EQUIPO:
    - Invitar miembros
    - Miembros activos
    - Roles básicos (ADMIN / USER)
  DOCUMENTACIÓN:
    - Todos los documentos subidos
    - Carpetas (abstracción de "Spaces")
    - Estadísticas de uso (qué se consulta más)
  SEGURIDAD:
    - Exportar datos (GDPR)
    - Accesos recientes
    - Audit Trail (simplificado)
  AVANZADO (colapsado por defecto):
    - Prompt governance
    - Workflow designer
    - Permiso Matrix (Guardian)
    - Modelos de IA (AiModelManager)
    - API Keys & Integraciones
    - Billing & Contratos
    - Ontologías
    - Operaciones & Logs técnicos
```

**Tareas:**
- [X] **Settings Hub Page**: Crear vista unificada con cards por sección. La sección "Avanzado" colapsa por defecto.
- [X] **Route Aliases**: Las rutas existentes siguen funcionando, pero la navegación primaria las agrupa.
- [X] **Remove Duplicate Hubs**: Eliminar o fusionar hubs redundantes (ej: `knowledge-assets` + `knowledge-base` → un solo `documents`).
- [X] **Contextual Access**: Los items de "Avanzado" solo aparecen si `role === 'SUPERADMIN'`.
- [X] **Metrics de éxito**: Reducir páginas admin visibles para un Admin estándar de 35 a 12.

---

#### 🚀 FASE 194: ONBOARDING REAL & CONTEXTUAL HELP

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 2 semanas

**Objetivo:** Reemplazar el `OnboardingProvider` vacío con un flujo de onboarding progresivo y medible.

**Diagnóstico real:** `OnboardingProvider` actual es un shell sin lógica (28 líneas, `value={{}}`). `useOnboarding` hook existe en `onboarding-overlay.tsx` con tours parciales pero desconectados del flujo core.

**Tareas:**
- [X] **Progressive Onboarding (4 pasos obligatorios)**:
  1. "Bienvenido a ABD RAG" → Elegir contexto de trabajo (`inspection`, `maintenance`, `audit`, `training`)
  2. "Sube tu primer documento" → Drag & drop con opción de PDF demo incluido
  3. "Haz tu primera pregunta" → Con sugerencias preconfiguradas por contexto elegido
  4. "Explorar entorno" → Acciones directas basadas en el rol seleccionado.
- [X] **Context-Based Defaults**: Según el contexto elegido, pre-configurar prompts, documentos relevantes, y checklists asociadas.
- [X] **Persistent Progress Bar**: Barra flotante discreta mostrando "Paso X de Y" con opción de saltar.
- [X] **Contextual Help Enhancement**: Activar `HelpButton`, `HelpTooltipComponent`, `InlineHelpPanel` ya existentes con contenido real (no placeholders) e integración en `PageHeader`.
- [X] **Demo Sandbox**: Integrar un tenant demo con datos sintéticos de ascensores preconfigurados para que el onboarding use datos realistas.
- [X] **Placeholders en Search**: Añadir ejemplos concretos en todos los inputs de búsqueda ("Ej: ¿Qué mantenimiento preventivo aplica al modelo X?").
- [X] **Metrics de éxito**: Time-to-first-value (TTFV) < 3 minutos. Tasa de completado del onboarding > 80%.

---

#### 📡 FASE 195: FEEDBACK LOOP & VALUE-ORIENTED DASHBOARD

**Status:** `[COMPLETADO ✅]` | **Prioridad:** MEDIA | **Estimación:** 2 semanas

**Objetivo:** Implementar mecanismos de feedback y reorientar dashboards hacia valor de negocio.

##### 195.1: Answer Feedback Widget
- [X] **Thumbs Up/Down**: Widget embebido en cada respuesta RAG. Thumbs down expande categorías de fallo (Incorrecta, Incompleta, Irrelevante, Fuente errónea). ✅
- [X] **Feedback Storage**: Almacenar feedback en colección `rag_feedback` para mejora continua del RAG. ✅
- [X] **Quality Loop**: Dashboard admin mostrando ratio de satisfacción y patrones de fallo. ✅

##### 195.2: Action-Oriented Dashboard
- [X] **Replace Metrics with Actions**: Sección principal "Requiere tu atención" con items urgentes y tiempo estimado ("2 min"). ✅
- [X] **Value Summary**: Reemplazar "Procesaste 24 documentos" por "Ahorraste 12 horas" con cálculo basado en análisis × tiempo promedio. ✅
- [X] **Smart Suggestions**: Sugerencias basadas en patrones ("3 pedidos similares detectados → ¿Crear checklist estándar?"). ✅
- [X] **Reduce Cognitive Load**: Máximo 3-4 HeroCards con métricas clave. Todo lo demás en secciones secundarias/colapsables. ✅

---

#### 🧹 FASE 196: PLACEHOLDER CLEANUP & TECHNICAL DEBT REDUCTION

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 2 semanas

**Objetivo:** Eliminar código muerto, placeholders y mock data que generan falsas expectativas.

**Diagnóstico real (verificado en codebase):**
- `admin/ai/predictive/page.tsx` → "coming_soon" placeholder
- `admin/security/sessions/page.tsx` → "coming_soon" placeholder
- `admin/operations/maintenance/page.tsx` → Empty state permanente
- `spaces/page.tsx` → "coming_soon" placeholder
- Estimado ~30-40% de rutas admin son placeholders o mock data

**Tareas:**
- [X] **Audit All Routes**: Escanear todas las rutas y clasificar en: Funcional / Placeholder / Mock Data. ✅
- [X] **Remove or Hide Placeholders**: Las rutas "coming_soon" se eliminan de la navegación. ✅
- [X] **Mock Data Cleanup**: Verificar que endpoints referenciados en el frontend existen y responden. ✅
- [X] **Race Condition Audit**: Revisar handlers con `setIsSaving(true)` sin `finally`. ✅
- [X] **Security Review**: Eliminar exposición de `error.message` en middleware de producción. ✅
- [X] **DOMMatrix Polyfill**: Documentado como hotfix necesario para Vercel Node 20+. ✅
- [X] **Toast & Error Text Unification**: Todas las notificaciones en lenguaje de negocio. ✅
- [x] **Metrics de éxito**: 0 páginas "coming_soon" visibles en navegación. 0 endpoints frontend sin backend real.

---

#### 🚀 FASE 200: SUPPORT HUB ISOLATION & CONSOLIDATION
**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 1 semana

**Objetivo:** Desacoplar el módulo de soporte como una aplicación independiente dentro de la suite.

- [X] **Domain Separation**: Creación de `src/services/support/` con repositorio y servicios aislados.
- [X] **Unified Ticket Schema**: Consolidación de esquemas legacy y enterprise en un solo modelo Robusto.
- [X] **UI Consolidation**: Migración de componentes a `src/components/support/` y actualización de rutas.
- [X] **Legacy Redirect**: Redirección automática de `/support-ticket` hacia el nuevo `/support/nuevo`.

#### 🚀 FASE 201: OBSERVABILITY & AUDIT HUB
**Status:** `[COMPLETADO ✅]` | **Prioridad:** CRÍTICA | **Estimación:** 1 semana

**Objetivo:** Centralizar la telemetría y auditoría de grado industrial en un módulo común.

- [X] **Observability Core**: Centralización en `src/services/observability/` (Logs, Audit, Lifecycle, Ops).
- [X] **Industrial Safety Base**: Implementación de `smoke-test.ts` y auditoría de integridad PDF.
- [X] **Standardized Schemas**: Implementación de `EventSchema` y `AuditSchema` para trazabilidad total.
- [X] **Security Instrumentation**: `GuardianService` integrado con `AuditTrailService`.
- [X] **Standardized Tracing**: `CorrelationIdService` con soporte para tagging por dominio (`source`).

---

#### 🔔 FASE 197: GLOBAL NOTIFICATION STANDARDIZATION (SONNER)

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 1 semana

**Objetivo:** Eliminar la inconsistencia entre mecanismos de notificación (Radix legacy vs Sonner) y asegurar visibilidad absoluta del feedback al usuario.

**Tareas:**
- [X] **Audit Skill Upgrade**: Actualizar `toast-notifier-auditor` con criterios de visibilidad y compatibilidad técnica. ✅
- [X] **Sonner Bridge**: Refactorizar `@/hooks/use-toast.ts` para actuar como un bridge hacia `sonner`, restaurando la visibilidad inmediata en 50+ archivos. ✅
- [X] **Full Migration**: Reemplazar progresivamente `useToast` por `import { toast } from "sonner"` en todos los componentes para usar la API nativa y más potente. ✅
- [X] **Accessibility Review**: Asegurar que todos los toasts cumplen WCAG (duración suficiente, compatibles con lectores de pantalla). ✅
- [X] **Metrics de éxito**: 100% de los componentes usando un solo motor de notificaciones (`sonner`). ✅

---

### 📊 MÉTRICAS DE ÉXITO GLOBALES (ERA 6)

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Time-to-first-value (TTFV) | < 3 min | Telemetría: upload → first useful answer |
| Clicks para función principal | ≤ 3 | Audit de flujo |
| Colores hardcodeados | 0 | `grep` regex en codebase |
| Páginas placeholder visibles | 0 | Audit de rutas |
| Tasa de completado onboarding | > 80% | Evento de tracking |
| Satisfacción de respuestas RAG | > 75% thumbs up | Colección `rag_feedback` |
| Admin subdirectorios visibles (rol User) | ≤ 4 | Config de navegación |

### 🧠 PRINCIPIOS DE DISEÑO (ERA 6)

1. **Progressive Disclosure**: Lo simple primero, lo complejo bajo "Avanzado"
2. **Smart Defaults**: Auto-configurar según tipo de documento y contexto de trabajo
3. **Feedback Inmediato**: Preview de PDF, highlight de fuentes, confianza humanizada
4. **Contextual Help**: Ayuda en el momento exacto de la duda, no manuales
5. **Reduce Cognitive Load**: Máximo 3 opciones visibles, el resto en "Más opciones"
6. **Value-Oriented Metrics**: "Ahorraste 12 horas" > "Procesaste 24 documentos"
7. **Zero Dead Ends**: Ninguna página sin funcionalidad real visible al usuario


#### 💎 FASE 198: POST-INGESTION ENRICHMENT & ACTIONS
  
**Status:** `[COMPLETADO ✅]` | **Prioridad:** MEDIA | **Estimación:** 2 semanas
  
**Objetivo:** Permitir "enriquecer" documentos ya ingestados con funcionalidades Premium (Vision, Traducción, Cognitive) sin necesidad de volver a subirlos.
  
**Escenario:** Un usuario subió un manual en modo "Simple" (rápido, barato). Semanas después, es crítico para un caso y necesita análisis visual de los diagramas. Actualmente, tendría que borrar y resubir.
  
**Tareas:**
- [X] **Document Action Menu**: Añadir opción "Enriquecer Documento" en el menú de acciones (`...`) de la tabla de documentos. ✅
- [X] **Enrichment Modal**: Modal similar a `UnifiedIngestModal` pero solo mostrando las opciones premium disponibles para activar. ✅
- [X] **Backend Endpoint**: `POST /api/admin/ingest/[id]/enrich` que acepta flags (`enableVision`, `enableCognitive`, etc.). ✅
- [X] **Partial Re-processing**: Lógica en `IngestService` para ejecutar solo los analyzers faltantes y actualizar los chunks/vectores existentes de forma atómica. ✅

#### 🛡️ FASE 199: INGESTION PIPELINE INTEGRITY & COMPREHENSIVE AUDIT

**Status:** `[COMPLETADO ✅]` | **Prioridad:** CRÍTICA | **Estimación:** 2 semanas | **Source:** `2601.txt`, `2602.txt`

**Objetivo:** Auditoría exhaustiva y endurecimiento del pipeline de ingesta para garantizar robustez, idempotencia y aislamiento total. "No más debugging en producción".

**Tareas Críticas (Audit FASE 26 integration):**
- [X] **Unificación de Estados (FSM)**: Sincronizar `IngestionStatusEnum` (@abd/rag-engine) con `IngestState` (FSM). Añadir `STUCK` y `DEAD` al Core Schema. ✅
- [X] **Ingest Orchestrator**: Crear orquestador central que maneje la secuencia: `Validate → Trace → Process → Cost → Update DB`. ✅
- [X] **Cost Tracking Persistence**: Migrar `LLMCostTracker` de memoria volátil a persistencia en DB para evitar pérdida de datos en reinicios del worker (Resuelve riesgo de Serverless). ✅
- [X] **UI Signal Hardening**: Implementar badges específicos para `STUCK`, `DEAD` y `COMPLETED_NO_INDEX` en el `KnowledgeAssetsManager`. ✅

**Escenarios Obligatorios:**
- [X] **Ingesta Simple (Clean Slate)**: Subida de PDF nuevo sin opciones premium. Validación de parsing básico, chunking default y vectores. ✅
- [X] **Ingesta Premium (Feature Isolation)**: Verificar Vision, Translation, Cognitive y Graph RAG de forma aislada. ✅
- [X] **Recuperación de Estado (Incomplete State)**: Simular fallos y jobs con 0 chunks. ✅
- [X] **Re-Ingesta & Idempotencia**: Duplicate Detection (MD5 hash). ✅
- [X] **Ciclo de Vida de Datos**: Logical/Physical Delete integrity. ✅
- [x] **Multi-tenant Isolation Hooks**: Verificado (Standardized sizeBytes and md5 audits). ✅

**Entregable:**
- Suite de pruebas de integración (E2E) para cada escenario.
- Reporte de "Ingestion Integrity" en `docs/audit/ingestion_integrity.md`.

---

### 📦 ERA 7: INDUSTRIAL SUITE & DOMAIN DECOUPLING (VISION 2026-2027)

**Objetivo:** Evolucionar la plataforma de un proyecto monolítico a una suite de aplicaciones modulares desacopladas de la infraestructura.

**Filosofía:** *"Cualquier módulo (Tickets, RAG, Ops) debe poder extraerse a un repositorio propio o escalar de forma independiente sin dolor."*

#### 🏗️ FASE 210: LLM CORE & PROMPT GOVERNANCE (UNIFIED)

**Status:** `[COMPLETADO ✅]` | **Prioridad:** CRÍTICA | **Estimación:** 1 semana

- [X] **Prompt Registry**: Consolidación de todos los prompts dispersos en `lib/llm-core/PromptRegistry.ts`. ✅
- [X] **Prompt Runner**: Implementación de `PromptRunner` con métricas, logging y retry logic integrados. ✅
- [X] **Safe JSON Parsing**: Implementación de `LlmJsonParser` para eliminar parseos manuales frágiles. ✅

#### 🧩 FASE 211: DOMAIN DECOUPLING (SERVICE + REPOSITORY)
 
**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 2 semanas
 
- [X] **Repository Layer**: Creación de repositorios para `TechnicalEntity`, `Tickets` y `Workflows`. ✅
- [X] **Service Refactor**: Desacoplar la lógica de negocio de las queries de MongoDB en los servicios principales. ✅
- [X] **Infra Adapters**: Wrappers para Mongo, Redis, Stripe y Resend en `lib/infra/`. ✅

#### 🚦 FASE 212: API MODULARIZATION & SUITE UX
 
**Status:** `[COMPLETADO ✅]` | **Prioridad:** MEDIA | **Estimación:** 2 semanas
 
- [X] **API Restructuring**: Organización de `/api` por dominios (`/api/technical`, `/api/support`). ✅
- [X] **App Registry**: Implementación de `lib/app-registry.ts` para gestionar los módulos de la suite. ✅
- [X] **Modular Layouts**: Switcher de aplicaciones y navegación filtrada por contexto de dominio. ✅

 
#### 📊 FASE 213: PLATFORM OBSERVABILITY HUB
 
**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 2 semanas
 
- [X] **Multi-tenant Metrics**: Dashboard global para SuperAdmin con consumo de tokens y latencia por tenant. ✅
- [X] **Prompts Health**: Visualización de tasas de éxito/error de `PromptRunner` por modelo y dominio. ✅
- [X] **Audit Trail Revamp**: Filtros avanzados en UI para trazabilidad mediante `correlationId` y `trace_id`. ✅
 
#### 🏠 FASE 214: DOMAIN-SPECIALIZED DASHBOARDS
 
**Status:** `[COMPLETADO ✅]` | **Prioridad:** MEDIA | **Estimación:** 1 semana
 
- [X] **Contextual Landing**: Implementación de Dashboards diferenciados según `AppId` (Técnico vs Soporte).
- [X] **Technical KPIs**: Widgets de salud de entidades, estado de indexación RAG y estadísticas de grafos.
- [X] **Support KPIs**: Dashboards de tickets activos, cumplimiento de SLA y métricas de resolución AI.
 
#### 🛡️ FASE 215: QUALITY SHIELD (UNIT TESTING)

**Status:** `[COMPLETADO ✅]` | **Prioridad:** MEDIA | **Estimación:** 1 semana

- [X] **LLM Core Tests**: Suite de tests para `PromptRunner` (utilizando mocks de Gemini) y `LlmJsonParser`. ✅
- [X] **Repository Tests**: Cobertura de tests para `BaseRepository` y repositorios clave (`TechnicalEntity`, `Tickets`). ✅
- [X] **Isolation Audit**: Tests automatizados para verificar el aislamiento estricto de `tenantId` en la capa de datos. ✅

#### 🚀 FASE 216: UX SURGICAL POLISH (COMPLETADO ✅)

**Objetivo:** Micro-cirugía de usabilidad para transformar una herramienta avanzada en una experiencia fluida de grado industrial.

- [X] **216.1: Context-Aware Command Center**: Priorización de activos técnicos en rutas `/entities` y `/graphs`. ✅
- [X] **216.2: Multi-modal Source Highlighting**: Sincronización de citas de chat con el visor PDF (Navegación por página). ✅
- [X] **216.3: Agentic Quick-Analysis**: Inferencia automática de preguntas clave tras la ingesta de documentos (Gemini Flash). ✅
- [X] **216.4: Proactive Empty States**: Rediseño de vistas vacías con CTAs de "Próximo Mejor Paso". ✅
- [X] **216.5: Professional Error Mapping**: Conversión de excepciones de infraestructura en mensajes de negocio orientados a la solución. ✅

> [!NOTE]
> El sistema de coordenadas (bounding boxes) para resaltado preciso de texto dentro del PDF queda pendiente de la evolución del motor de extracción en futuras fases, integrándose la navegación por página como solución core de esta fase.

#### 🚀 FASE 217: INTERACTION EXCELLENCE & PLATFORM RESILIENCE (COMPLETADO ✅)

**Objetivo:** Elevar la calidad de la plataforma mediante interacciones de alta fidelidad, accesibilidad avanzada y transparencia en métricas técnicas.

- [X] **217.1: Advanced Command Menu UX**: Soporte total para navegación por teclado (ArrowKeys/Enter) y foco visual. ✅
- [X] **217.2: Platform Metrics Observability**: Tooltips técnicos explicativos para métricas RAG y salud de servicios. ✅
- [X] **217.3: Mobile UI Accessibility Flush**: Refuerzo de responsividad en modales de previsualización y auditoría ARIA. ✅
- [X] **217.4: Ingestion Time Prediction**: Cálculo de ETA dinámico basado en tamaño de archivo y carga de sistema. ✅

---

## 🏛️ ERA 8: PLATFORM CONSOLIDATION & COHERENCE

> **Principio Rector**: Cero funcionalidades nuevas. Solo simplificar, deduplicar, alinear y dar coherencia.
> **Motivación**: Tras 217 fases de construcción, la plataforma tiene deuda técnica acumulada: rutas duplicadas, datos fake, servicios solapados, permisos desconectados y conceptos confusos. ERA 8 cura esto antes de expandir.
> **Nota de Integridad**: 🛡️ Una vez completada la **ERA 10**, se requiere un nuevo barrido de las Fases 270, 271 y 272 para consolidar los cambios en el shell de navegación y garantizar zero-ghost pages post-rediseño.
> **Referencia**: [architecture_review.md](file:///C:/Users/ajaba/.gemini/antigravity/brain/a189174c-2cf4-40c8-90e7-6907ec477156/architecture_review.md) | [route_registry.md](file:///C:/Users/ajaba/.gemini/antigravity/brain/a189174c-2cf4-40c8-90e7-6907ec477156/route_registry.md)
>
> **Estado auditoría (2026-02-23):** 101 rutas auditadas ruta a ruta. `map.md` reescrito con 100% cobertura. 12 fases definidas (218–225C), ~85 sub-tareas granulares.

> [!IMPORTANT]
> **POLÍTICA DE DEPRECACIÓN**: NUNCA borrar una funcionalidad directamente. Si una ruta, servicio o componente se identifica como candidato a eliminación, se le marca con un comentario visible `/* 🔴 PROPONER DEPRECAR: [motivo] — ERA 8, FASE X */` y se documenta en la sección DEPRECATED de `map.md`. Solo se elimina tras revisión explícita del equipo.

---

#### 🧹 FASE 218: ROUTE DEDUPLICATION & GHOST CLEANUP (COMPLETADO ✅)

**Objetivo:** Auditar todas las rutas, identificar duplicados y fantasmas, y definir UNA ruta canónica por concepto. Las rutas candidatas a eliminación se marcan como PROPONER DEPRECAR — no se borran.

**Contexto del problema (auditoría map.md vs filesystem, 2026-02-23):**

> [!CAUTION]
> **map.md documenta ~50 rutas. El filesystem tiene 101 `page.tsx`.** Casi la mitad de la app es invisible para la documentación.

**A) Rutas DEPRECATED en map.md que SIGUEN EXISTIENDO como archivos:**
- `/admin/billing/plan` → map.md dice "Integrado en sub-secciones" pero el archivo existe.
- `/admin/ingest/jobs` → map.md dice "Movido a /admin/operations/ingest" pero el archivo sigue ahí.
- `/admin/knowledge-base` → map.md dice "Reemplazado por /admin/knowledge" pero el archivo existe (redirect funcional).
- `/admin/knowledge-base/graph` → No documentada en absoluto, con código vivo.

**B) Rutas que EXISTEN pero NO aparecen en map.md (~38):**
- `/admin/ai/governance` — Funcionalidad desconocida.
- `/admin/audit` + `/admin/audit/config-changes` — ¿Duplicado de `/admin/security/audit`?
- `/admin/logs` — ¿Duplicado de `/admin/operations/logs`?
- `/admin/prompts` — **486 líneas, funcionalidad completa de gestión de prompts. NO documentada.**
- `/admin/permissions/matrix` — Subruta de permisos no documentada.
- `/admin/rag-quality` — Redirect a `/admin/ai/rag-quality`, no documentado como tal.
- `/admin/workflows` + `/admin/workflows/[id]` — Editor de workflows individual, no documentado.
- `/admin/settings/branding` + `/admin/settings/i18n` — Sub-secciones de settings no documentadas.
- `/admin/notifications/settings` + `/admin/notifications/templates` + `/admin/notifications/templates/[type]` — Subrutas de notificaciones no documentadas.
- `/admin/organizations/billing` — Sub-ruta de organizaciones no documentada.
- `/admin/billing/usage` — Sub-ruta de billing no documentada.
- `/admin/reports/schedules` — Sub-ruta de reports no documentada.
- `/admin/spaces` — map.md dice DEPRECATED pero archivo existe.
- `/dashboard` — Página de dashboard fuera de admin, no documentada.
- `/search` — Página de búsqueda, no documentada.
- `/profile` + `/settings` — Páginas de usuario, no documentadas.
- `/my-documents` — **TERCER punto de "mis documentos"** (además de `/admin/my-documents` y `/admin/knowledge/my-docs`).
- `/real-estate` — Página de vertical real-estate, no documentada.
- `/technical` — Hub técnico, no documentado.
- `/ops/reports` — Portal de operaciones reportes, no documentado.
- `/spaces/collections` + `/spaces/personal` + `/spaces/playground` + `/spaces/quick-qa` — 4 sub-rutas de spaces no documentadas.
- `/support/[id]` + `/support/nuevo` — Sub-rutas de soporte no documentadas.
- `/support-ticket` — **CUARTO punto de soporte** además de `/support`, `/admin/support`, `/support-dashboard`.

**C) Diagrama Mermaid desalineado:**
- El diagrama NO incluye: Prompts, Tasks, Workflow-Tasks, Compliance, API-Docs, API-Keys, Superadmin, Dashboard, Search, Profile, Settings, Spaces sub-rutas, /ops.
- El diagrama incluye `SupportDash` pero lo muestra conectado a Admin, no como ruta independiente.
- No refleja los route groups de Next.js (`(admin)`, `(technical)`, `(ops)`).

**Resolución definitiva de clusters de duplicación:**

| Cluster | Canónica | Redirects | Deprecar | Dominio |
|---------|----------|-----------|----------|---------|
| **Mis Documentos** | `/my-documents` (user) + `/admin/knowledge/my-docs` (admin) | `/admin/my-documents` → redirect a `/admin/knowledge/my-docs` | — | Knowledge (Admin) / Personal (User) |
| **Soporte** | `/support` + sub-rutas (client) · `/admin/support` (admin redirect OK) | `/support-ticket` → `/support/nuevo` | `/support-dashboard` → integrar KPIs en `/support` (FASE 219) | Support |
| **Audit / Logs** | `/admin/audit` (industrial) · `/admin/security/audit` (security trail) · `/admin/operations/logs` (ops) | `/admin/logs` → `/admin/operations/logs` | — | Security / Operations |
| **Tasks** | `/admin/tasks` (negocio) · `/admin/workflow-tasks` (orquestación técnica) | — | Pendiente inspección si son realmente distintos (218.8) | Operations |

**Tareas:**
- [x] **218.1: Inventario exhaustivo de rutas**: ✅ 101 `page.tsx` clasificadas. Publicado en `map.md` y `route_registry.md`.
- [x] **218.2: Ejecutar resolución "mis documentos"**: ✅ `/admin/my-documents` redirige a `/admin/knowledge/my-docs`.
- [x] **218.3: Ejecutar resolución soporte**: ✅ KPIs integrados en `/support`.
- [x] **218.4: Limpiar DEPRECATED zombis**: ✅ Redirecciones funcionales implementadas.
- [x] **218.5: Documentar `/admin/prompts`**: ✅ Documentada en map.md.
- [x] **218.6: Evaluar dualidad audit**: ✅ SON DIFERENTES. Documentado.
- [x] **218.7: Evaluar dualidad logs**: ✅ `/admin/logs` es redirect.
- [x] **218.8: Evaluar dualidad de tareas**: ✅ `/admin/tasks` redirige a `/admin/workflow-tasks`.
- [x] **218.9-13: Documentar sub-rutas faltantes**: ✅ Todas documentadas en map.md.
- [x] **218.14: Evaluar `/admin/ai/governance`**: ✅ Documentada.
- [x] **218.15: Evaluar `/real-estate` y `/ops/reports`**: ✅ Documentadas.
- [x] **218.16: Auditar API debug/test**: ✅ `/api/admin/environments/promote` verificado y protegido.
- [x] **218.17: Auditoría health checks**: ✅ `/api/health` unificado, zero archivos fantasma.
- [x] **218.18: Reescribir diagrama Mermaid**: ✅ Publicado en map.md.
- [x] **218.19: Auditar `/admin/cases` y `/admin/workshop`**: ✅ Cases solo tiene `[id]`. Workshop limitado.
- [x] **218.20: Añadir columna "dominio responsable" en map.md**: ✅ Columna "Dominio" añadida.

**Criterio de aceptación:** Cada cluster cerrado con 1 ruta canónica + redirects documentados. Zero estados "TBD". map.md refleja la realidad al 100% con dominio responsable por hub.
**Progreso:** 100% (COMPLETADO ✅).


---

#### 🚢 FASE 219: FAKE DATA PURGE & MODULE UNIFICATION

**Objetivo:** Identificar TODOS los módulos con datos fake/hardcoded y conectarlos a APIs reales. Unificar las islas de soporte en un módulo coherente.

**Status:** `[COMPLETADO ✅]` | **Prioridad:** MEDIA | **Estimación:** 4 días

**Contexto del problema:**
- `/support-dashboard` = Dashboard de KPIs con **datos 100% fake** (hardcoded: 145 tickets, 98.4% SLA, 94.1% IA).
- `/admin/workflow-tasks` = stats de tareas con **datos 100% fake** (hardcoded: 12 pending, 5 in review, 28 completed, 45m avg).
- `/real-estate` = Demo Fase 85 con **mockFindings hardcoded** ("Fisura detectada en muro de carga", "Punto de inspección eléctrica").
- `/support` = Portal de cliente con tickets + búsqueda IA. Conectado a API. ✅
- `/admin/support` = Panel admin con lista/detalle de tickets. Conectado a API. ✅

**Política de aislamiento de fake data:**
> Toda fake data que se conserve (demos) debe vivir en un módulo aislado (`src/demo/`) o estar condicionada por un flag (`NEXT_PUBLIC_DEMO_MODE` o `NODE_ENV === 'demo'`). No puede llegar a producción real sin flag activo.

**Tareas:**
- [x] **219.1: Scan de datos fake en TODA la app**: Buscar patterns de datos hardcoded (`value="12"`, `"98.4%"`, `mockFindings`, etc.) en archivos `.tsx` bajo `src/app`. Documentar cada hallazgo. ✅
- [x] **219.2: Conectar `/support-dashboard` a datos reales**: Crear endpoint `/api/support/stats` que devuelva KPIs reales desde MongoDB. ✅
- [x] **219.3: Conectar `/admin/workflow-tasks` a datos reales**: Las stats (pending, in review, completed, avg time) deben venir del endpoint `/api/admin/workflow-tasks` con un `?stats=true` query. ✅
- [x] **219.4: Aislar fake data de `/real-estate`**: Clasificar como **🎭 INTERNAL DEMO**. Mover `mockFindings` a `src/demo/real-estate-fixtures.ts`. Condicionar con flag `NEXT_PUBLIC_DEMO_MODE`. Añadir badge `INTERNAL DEMO` visible en la página. ✅
- [x] **219.5: Definir estrategia de vistas por rol en Soporte**: El usuario final ve `/support` (crear ticket, buscar). El admin ve todo + KPIs. ✅
- [x] **219.6: Integrar dashboard en `/support`**: Mover KPIs de `/support-dashboard` como tab/sección dentro de `/support`, visible solo para ADMIN/SUPPORT_STAFF. ✅
- [x] **219.7: Evaluar `/admin/support`**: ¿Es redundante con la vista admin de `/support`? Si sí → redirect. Si no → documentar diferencia. ✅
- [x] **219.8: Marcar `/support-dashboard` como PROPONER DEPRECAR**: Una vez integrado en `/support`, marcar ruta antigua. ✅
- [x] **219.9: i18n Audit del módulo**: Verificar que "Centro de Soporte", "Tickets Activos", "Mis Tareas", "Nueva Tarea" usen `useTranslations`. ✅

**Criterio de aceptación:** Zero datos fake en rutas de producción. Demos aislados en `src/demo/` con flag explícito. Cada número visible en rutas canónicas viene de una API real.

---

#### 🔐 FASE 220: PERMISSION SYSTEM ALIGNMENT

**Objetivo:** Unificar el sistema de permisos para que Guardian V3 (ABAC) y el sidebar (roles simples) usen la misma fuente de verdad.

**Status:** `[COMPLETADO ✅]` | **Prioridad:** CRÍTICA | **Estimación:** 1 semana

**Contexto del problema:**
- `navigation.ts` filtra elementos con `item.roles.includes(userRole)` — array estático.
- `GuardianEngine` evalúa políticas ABAC con herencia de grupos y condiciones.
- Un usuario puede ver un enlace pero ser rechazado por Guardian, o viceversa.

**Tareas:**
- [x] **220.1: Crear hook `useGuardianAccess(resource, action)`**: Un hook React que consulte un endpoint ligero o un cache de políticas para determinar si el usuario tiene acceso (implementado como canBulk). ✅
- [x] **220.2: Migrar `navigation.ts` a Guardian**: Reemplazar `item.roles` por `item.resource` + `item.action`. El sidebar consulta `useGuardianAccess` para cada item. ✅
- [x] **220.3: Fallback gradual**: Durante la migración, mantener el check por roles como fallback si Guardian no responde. Log de discrepancias. ✅
- [x] **220.4: PROPONER DEPRECAR `roles[]` de MenuItem**: Marcado como propensa a deprecación en `navigation.ts`. ✅
- [X] **220.5: Documentar la Matriz de Permisos**: Definido en `docs/permissions-matrix.md`. ✅
- [x] **220.6: Añadir `enforcePermission` a páginas críticas**: ERA 8 objetivo mínimo — proteger las siguientes páginas con enforcement backend:
  - `billing/*` (plan, usage, invoices, contracts) ✅
  - `audit/*` (audit, config-changes) ✅
  - `security/*` (sessions, audit trail) ✅
  - `settings/*` (branding, i18n) ✅
  - `ai/governance` (config LLM) ✅
  - `superadmin` (platform dashboard) ✅
  - `prompts` (prompt management) ✅
  - `organizations/*` (tenant config) ✅
- [x] **220.7: Crear checklist de cobertura Guardian por módulo**: Tabla con: módulo, nº páginas, nº con `enforcePermission`, nº con `useGuardianAccess`, objetivo ERA 9. Publicar en `docs/permissions-matrix.md`. ✅

**Criterio de aceptación:** Si Guardian dice NO, el sidebar no muestra el enlace. Páginas críticas (billing, audit, security, governance, superadmin) protegidas con `enforcePermission`. Checklist por módulo publicado para ERA 9.

---

#### 🗂️ FASE 221: APP REGISTRY & ROUTE GROUP REALIGNMENT

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 1 día

**Objetivo:** Alinear el App Registry (5 apps con basePath) con los route groups reales de Next.js para que `getAppByPath()` funcione correctamente.

**Contexto del problema:**
- `OPERATIONS.basePath = '/ops/reports'` — ruta SÍ existe (bajo route group `(ops)`) pero OpsHub real es `/admin/operations`. Desalineado.
- `CONFIG.basePath = '/admin/permissions'` que es solo un subpath, no una app. Settings reales están en `/admin/settings` con sub-rutas `/branding` y `/i18n`.
- `TECHNICAL.basePath = '/technical'` pero las rutas reales son `/entities` y `/graphs`. `/technical` SÍ existe como hub page.
- `getAppByPath()` hace `startsWith` sobre estos basePaths, causando matches incorrectos.

**Tareas:**
- [x] **221.1: Redefinir basePaths reales**: TECHNICAL → `/entities` | SUPPORT → `/support` | OPERATIONS → `/admin/operations` | CONFIG → `/admin/settings` | PERSONAL → `/spaces`. ✅
- [x] **221.2: Multi-basePath support**: Modificar `AppDefinition` para soportar un array de `basePaths` en vez de un solo string. TECHNICAL matchea `/entities` y `/graphs`. CONFIG matchea `/admin/settings`, `/admin/permissions`, `/admin/billing`. ✅
- [x] **221.3: Actualizar `getAppByPath()`**: Recorrer el array de basePaths para cada app. ✅
- [x] **221.4: Verificar CommandMenu**: El menú de comandos usa el app activo para priorizar resultados. Verificar que funcione con los nuevos basePaths. ✅
- [x] **221.5: Verificar sidebar filtering**: `useNavigation()` filtra secciones por `section.appId`. Verificar coherencia después del cambio. ✅
- [x] **221.6: Añadir columna "API contract" en map.md**: Cada hub debe indicar su API principal para mantener alineamiento UI↔API. Ejemplo: `/technical` ↔ `api/technical`, `/ops` ↔ `api/ops`, `/admin/billing` ↔ `api/admin/billing`. ✅

**Criterio de aceptación:** `getAppByPath('/admin/operations/logs')` devuelve OPERATIONS. `getAppByPath('/entities')` devuelve TECHNICAL. Sin falsos positivos. map.md incluye columna API contract por hub.

---

#### 📦 FASE 222: SERVICE LAYER CONSOLIDATION

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 1 semana

**Objetivo:** Reducir el sprawl de `src/lib` (127+ archivos) y `src/services` (15 directorios) eliminando duplicados, moviendo deprecated y organizando por dominio.

**Tareas:**
- [X] **222.1: EVALUAR `src/services/deprecated`**: Eliminado. ✅
- [X] **222.2: EVALUAR `src/services/pendientes`**: Reubicado/Eliminado. ✅
- [X] **222.3: Consolidar re-exports en `src/lib`**: Limpieza de fachadas innecesarias. ✅
- [X] **222.4: Organizar `src/lib` por subdirectorios**: Estructura modular completada. ✅
- [X] **222.5: Resolver solapamiento `src/core` vs `src/services`**: Fronteras definidas. ✅
- [X] **222.6: Eliminar `console.log` de APIs**: Migrado a `logEvento()`. ✅

---

#### 🧩 FASE 222B: UI STABILIZATION & OBSERVABILITY

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 2-3 días

**Objetivo:** Eliminar código duplicado a nivel de componentes UI, estandarizar notificaciones y purgar logs de API.

**Tareas:**
- [x] **222.1B: HubPage Generic**: Creación de `<HubPage>` y migración de 6 hubs admin. ✅
- [x] **222.2B: MetricCard Estandardization**: Unificación de variantes de cards. ✅
- [x] **222.3B: Superadmin Decomposition**: Descomposición de la vista monolítica en widgets modulares. ✅
- [x] **222.4B: useApiItem Migration**: Dashboards migrados a fetching reactivo. ✅
- [x] **222.5B: Toast Unification**: Migración masiva a `sonner` y eliminación de bridge legacy. ✅
- [x] **222.6B: API Log Purge**: Reemplazo de `console.log` por logging estructurado. ✅

---

#### 🌐 FASE 223: i18n HARDCODE PURGE (ERA 8 BATCH)

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA

**Objetivo ERA 8 (scope acotado):** Internacionalizar como mínimo:
1. **Todos los paths visibles en navegación principal** (sidebar, header, breadcrumbs).
2. **Todo texto regulatorio/sensible** (governance, audit, compliance) — zero strings hardcoded en inglés.
3. **Sync diccionarios ES↔EN** para keys existentes.

> El resto de texto "profundo" (tooltips internos, placeholders de formularios no críticos) queda como **deuda explícita documentada** para ERA 9.

**Contexto del problema:**
- `RagQualityDashboard.tsx` tiene "Análisis Críticos", "Evolución de Calidad", "Atención Técnica Requerida" hardcoded.
- `support-dashboard` tiene "Centro de Soporte", "Tickets Activos", "Cumplimiento SLA" hardcoded.
- `prompts/page.tsx` tiene "¿Ejecutar Sincronización Global?", "Cancelar", "Sincronizar ahora", opciones de industria y toast hardcoded.
- `compliance/page.tsx` tiene un párrafo entero en inglés: "Compliance Note: This RAG implementation is categorized as...".
- `LanguageSelector.tsx`, `LanguageSwitcher.tsx` y `LocaleSwitcher.tsx` tienen strings hardcoded.
- `useOnboarding.ts` (API-based) tiene todos los steps en español.
- `superadmin/page.tsx` tiene "PRODUCTION / VERCEL", "M10 / Dedicated Cluster" hardcoded.
- `/admin/ai/governance` (361 líneas) — **i18n 100% hardcoded**: es la peor página.
- `/admin/settings/i18n` (317 líneas) — parcialmente hardcoded.
- `/admin/audit` (260 líneas) — hardcoded.

**Tareas ERA 8 (scope obligatorio):**
- [x] **223.1: Scan automático de hardcode**: Ejecutar script/grep. Documentar hallazgos clasificados por prioridad (regulatorio > navegación > profundo). ✅
- [x] **223.2: CRÍTICO — AI Governance i18n**: Migrar las 361 líneas de `/admin/ai/governance` a `useTranslations`. Peor cobertura de toda la app + texto regulatorio (PII, cuotas). ✅
- [x] **223.3: CRÍTICO — Compliance i18n**: Mover "Compliance Note: This RAG implementation..." al JSON en ambos idiomas. Texto regulatorio = prioridad máxima. ✅
- [x] **223.4: CRÍTICO — Audit page i18n**: Migrar hardcodes de `/admin/audit` + `/admin/audit/config-changes`. Texto de auditoría = sensible. ✅
- [x] **223.5: Navegación principal**: Purgar hardcodes en sidebar items, headers, breadcrumbs, y componentes de layout que aparecen en TODAS las páginas. ✅
- [x] **223.6: Prompts page diálogos**: Mover opciones de industria y diálogos de confirmación al JSON. ✅
- [x] **223.7: Onboarding steps**: Mover steps de `useOnboarding.ts` a traducciones. ✅
- [x] **223.8: Sync diccionarios ES/EN**: Verificar paridad 1:1 de keys entre `messages/es/*.json` y `messages/en/*.json`. ✅
- [x] **223.9: Usar skill `i18n-a11y-auditor`**: Ejecutar auditoría sobre todas las páginas modificadas. ✅
- [x] **223.10: Documentar deuda i18n explícita**: N/A - Todo el batcheado principal fue resuelto extensamente en múltiples PRs. ✅


**Criterio de aceptación ERA 8:** Zero texto regulatorio/sensible hardcoded. Navegación principal 100% internacionalizada. Diccionarios ES/EN sincronizados. Deuda profunda documentada explícitamente para ERA 9.

---

#### 🏗️ FASE 224: VERTICAL ARCHITECTURE CLEANUP

**Status:** `[COMPLETADO ✅]` | **Prioridad:** MEDIA

**Objetivo:** Dar coherencia a la estructura de verticales (`src/verticals`) para que sea un sistema preparado pero no confuso. Las verticales vacías no deben fingir funcionalidad.

**Contexto del problema:**
- Solo `elevators/` tiene componentes funcionales (11 archivos).
- `banking/`, `insurance/`, `legal/`, `real-estate/` solo tienen `config.ts` + un template vacío.
- El `DomainRouter` clasifica queries en 6 industrias pero solo Elevators tiene UI.
- No hay documentación de cómo añadir una vertical.
- `/real-estate` (120 líneas) es la ÚNICA vertical con página propia fuera de admin. Es un demo con datos mock. Usa `PropertyTwinViewer` de `src/verticals/real-estate/components/`.

**Tareas:**
- [x] **224.1: Estandarizar estructura de vertical**: Definir el contrato mínimo: `config.ts` + `templates/` + `components/` (opcional). Documentar en `docs/vertical-guide.md`. ✅
- [x] **224.2: Evaluar verticales placeholder**: Placeholder verticals limpiados y configurados. ✅
- [x] **224.3: Validar DomainRouter fallback**: Generic flow fallback asegurado. ✅
- [x] **224.4: Unificar con EntityEngine**: Extensibilidad comprobada. ✅
- [x] **224.5: Mover `real-estate/CausalFlow` a shared si es genérico**: Lógica unificada. ✅
- [x] **224.6: Clasificar `/real-estate` como 🎭 INTERNAL DEMO**: Completado con integración vertical standard. ✅


**Criterio de aceptación:** Las carpetas de verticales vacías solo tienen `config.ts`. Existe `docs/vertical-guide.md` que explica cómo añadir una industria. `/real-estate` clasificada como INTERNAL DEMO con badge visible y fake data aislada.

---

#### 🧪 FASE 225: COHERENCE VERIFICATION & SKILL ADAPTATION

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA

**Objetivo:** Verificar que toda la consolidación de ERA 8 funciona end-to-end. Actualizar las skills de desarrollo para que reflejen la nueva realidad arquitectónica y no causen regresiones.

**Tareas:**
- [x] **225.1: Build + Test completo**: Ejecutar `npm run build` y verificar zero errores TypeScript. Ejecutar test suites existentes. ✅
- [x] **225.2: Auditar skills existentes**: Skills actualizadas y operativas. ✅
- [x] **225.3: Actualizar `project-context-loader`**: Arquitectura consolidada registrada. ✅
- [x] **225.4: Actualizar `guardian-auditor`**: Adaptado a la FASE 220. ✅
- [x] **225.5: Actualizar `code-quality-auditor`**: Regla #5 y zero hardcode integradas pertinentemente en auditorías. ✅
- [x] **225.6: Actualizar `hub-dashboard-architect`**: Rutas canónicas reflejadas. ✅
- [x] **225.7: Smoke test visual**: Navegación de sidebar sin regresiones. ✅
- [x] **225.8: Actualizar `README.md` y `map.md`**: Reflejar ERA 8 como completada con la versión v5.5.0. ✅


**Criterio de aceptación:** Build limpio, test suites pasan, skills actualizadas, smoke test visual OK.

---

#### 🚀 FASE 247: TESTING INFRASTRUCTURE & SUITES (COMPLETADO ✅)
**Status:** `[COMPLETADO ✅]` | **Prioridad:** MEDIA | **Completado:** 2026-03-03

**Objetivo:** Establecer una base de pruebas robusta con Jest 30 para lógica y Playwright para E2E.

- [X] **247.1: Configuration Setup**: Migrar a `jest.config.ts` y crear `tests/setup/jest.setup.ts`. ✅
- [X] **247.2: Auth Unit Tests**: Cobertura de `authorizeCredentials` y callbacks de sesión. ✅
- [X] **247.3: RAG & Worker Tests**: Validar el pipeline de análisis y sincronización de entidades. ✅
- [X] **247.4: Audit & Sanitizer Tests**: Cobertura de PDF Layout y MongoSanitizer. ✅
- [X] **247.5: E2E Smoke Tests**: Flujos críticos de Login y RAG con Playwright. ✅

---

#### 🚀 FASE 249: ARCHITECTURE HARDENING TIER 1 (COMPLETADO ✅)
**Status:** `[COMPLETADO ✅]` | **Prioridad:** CRÍTICA | **Estimación:** 1 día

**Objetivo:** Implementar la auto-recuperación de estados parciales de ingesta y robustecer la DLQ con auto-retry.

- [X] **249.1: PartialStateRecoveryWorker**: Worker para recuperar `STORED_NO_INDEX`, `INDEXED_NO_STORAGE` y `PARTIAL`. ✅
- [X] **249.2: DLQ Auto-Retry**: Evolucionar `retryJob` para encolado real y añadir auto-retry programado. ✅
- [X] **249.3: IngestOrchestrator Integration**: Unificar la lógica de detección de stuck y recuperación parcial. ✅
- [X] **249.4: Idempotency Audit**: Asegurar que re-indexación y re-upload son safe-upserts. ✅

---

#### 🚀 FASE 250: INGEST AUTO-REPAIR EVOLUTION (COMPLETADO ✅)
**Status:** `[COMPLETADO ✅]` | **Prioridad:** CRÍTICA | **Completado:** 2026-03-03

**Objetivo:** Evolucionar `PartialStateRecoveryWorker` (FASE 249) con campos de trazabilidad y métricas de reparación.

**Contexto:** El worker ya recupera STORED_NO_INDEX/INDEXED_NO_STORAGE/PARTIAL con límite de 3 intentos. Se han añadido métricas y visibilidad en UI.

- [X] **250.1: Schema Evolution**: Añadir `repairPhase` y `repairErrorCode` a `KnowledgeAssetSchema`. ✅
- [X] **250.2: Worker Update**: Actualizar `PartialStateRecoveryWorker` para trackeo detallado. ✅
- [X] **250.3: Repair Metrics**: Exponer métricas en `api/admin/ingest/metrics`. ✅
- [X] **250.4: UI Labels**: Mostrar badges de reparación en Knowledge Assets. ✅

---

####- [x] **FASE 251: OPERATIONAL AUTOPILOT (PLAYBOOKS)** (Hardening & Intelligence)
**Status:** `[COMPLETED ✅]` | **Prioridad:** CRÍTICA | **Estimación:** 2-3 días

**Objetivo:** Conectar `AnomalyDetectionService` con playbooks operativos automatizados, controlados por feature flags por tenant.

**Contexto:** La observabilidad existe (Z-score, PlatformOps, AI telemetry) pero es solo diagnóstica. Esta fase la convierte en accionable.

- [x] **251.1: Feature Flags**: Extender `TenantConfigSchema` with `autoOps: { autoRepairIngest, autoPauseOverQuota, autoLlmFallback }`. ✅
- [x] **251.2: OpsPlaybookService**: Crear servicio que consume anomalías y ejecuta playbooks: pausa de ingestas, cambio de modelo LLM. ✅
- [x] **251.3: Cron Integration**: Integrar con el job de self-healing (cada 5-10 min). ✅
- [x] **251.4: UI Visibility**: Sección "Playbooks recientes" en SuperAdmin con `PlaybookExecutionsWidget`. ✅

---

#### 📊 FASE 252: HITL FEEDBACK → RAG RANKING & EVAL DATASET
**Status:** `[PENDIENTE]` | **Prioridad:** ALTA | **Estimación:** 1.5-2 días

**Objetivo:** Usar el feedback humano (FASE 195) para ajustar scoring de chunks y generar datasets de evaluación RAG.

**Contexto:** `RagFeedbackSchema` ya captura thumbs + categorías, pero el feedback no retroalimenta el ranking ni genera datasets.

- [ ] **252.1: Schema Extension**: Añadir `chunkId`, `answer`, `label: correct|incorrect|irrelevant` a `RagFeedbackSchema`.
- [ ] **252.2: RagFeedbackProcessor**: Job nocturno que calcula `feedbackScore` (-1..1) por chunk y lo persiste en `document_chunks`.
- [ ] **252.3: RagEvalDatasetBuilder**: Extractor de triples (query, expectedAnswer, contextChunks) desde feedback positivo → colección `rag_eval_dataset`.
- [ ] **252.4: Cron/Script**: Script `run-rag-feedback-processor.ts` para ejecución nocturna.

---

#### 🎨 FASE 253: UX MODE SIMPLE/EXPERT
**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Completado:** 2026-03-03

**Objetivo:** Persistir modo UX por usuario y aplicarlo sistemáticamente para reducir complejidad percibida en modo simple.

**Contexto:** `UserSchema.preferences` tiene `theme`/`language`/`onboarding` pero no `uxMode`. Las opciones avanzadas siempre están visibles.

- [ ] **253.1: Schema**: Añadir `uxMode: "simple" | "expert"` a `UserSchema.preferences` (default: `"simple"`).
- [ ] **253.2: UxModeProvider**: Context provider + hook `useUxMode()` (React Context, NO localStorage — Regla #5).
- [ ] **253.3: API Endpoint**: `POST /api/profile/ux-mode` para persistir el modo.
- [ ] **253.4: Knowledge Hub**: Ocultar en simple: selector de modelo, chunking avanzado, max context tokens. Mostrar resumen de Smart Config.
- [ ] **253.5: Tenant Settings**: En simple: solo branding, módulos, límites básicos. En expert: AI Governance, Guardian avanzado, billing detallado.
- [ ] **253.6: Graph Explorer**: En simple: vista lectura, filtros básicos. En expert: crear/fusionar nodos, edición de propiedades.

---

#### ⚡ FASE 254: PERFORMANCE SKELETONS & SAFE LIMITS
**Status:** `[COMPLETADO ✅]` | **Prioridad:** MEDIA | **Completado:** 2026-03-04 | **Estimación:** 1 día

**Objetivo:** Sistematizar skeletons de carga en segmentos pesados y forzar ventanas temporales seguras en APIs de logs/observabilidad.

- [ ] **254.1: loading.tsx**: Crear skeletons agresivos para `/knowledge`, `/graph`, `/profile`, `/search` (header + cards + tabla).
- [ ] **254.2: Query Limits**: Asegurar `limit` max=100, default=50 en esquemas Zod de AuditLog, ApplicationLogs, Observability.
- [ ] **254.3: Default Time Windows**: APIs de logs con ventana por defecto "última 1h" (no rango abierto).
- [ ] **254.4: UI Controls**: Botón "Ampliar rango" que dispara nuevo fetch en vez de cargar todo de golpe.

---

#### 🧹 FASE 255: BRIDGE CLEANUP & STUB CONSOLIDATION
**Status:** `[COMPLETADO ✅]` | **Prioridad:** MEDIA | **Completado:** 2026-03-04 | **Estimación:** 1 día

**Objetivo:** Consolidar los 12 archivos de compatibilidad bridge y reemplazar stubs ambiguos por adaptadores claros.

**Contexto:** Existen bridges a `@abd/platform-core`, `@abd/workflow-engine`, `@abd/rag-engine` y un `JobSchedulerService` stub en `PlatformOpsService`.

- [ ] **255.1: Bridge Audit**: Clasificar 12 bridges como KEEP/REMOVE/CONSOLIDATE. Documentar en `docs/bridge-audit.md`.
- [ ] **255.2: JobSchedulerService**: Reemplazar stub por adaptador explícito con TODO único y claro.
- [ ] **255.3: Bridge Headers**: Añadir `// ERA 8 Compatibility Bridge: do not add new exports` a bridges definitivos.
- [ ] **255.4: Dead Export Purge**: Eliminar re-exports no usados (verificar con grep de imports).

---

#### 🚀 FASE 240: EDGE RUNTIME COMPATIBILITY & SYSTEM HYGIENE
**Status:** `[COMPLETED ✅]` | **Prioridad:** CRÍTICA | **Estimación:** 2 días

**Objetivo:** Eliminar dependencias ilegales del módulo `crypto` de Node.js en el Edge Runtime y asegurar la estabilidad de las APIs en Vercel.

- [X] **Refactor de Crypto**: Reemplazo de `crypto.randomUUID()` por `globalThis.crypto.randomUUID()` en componentes de cliente y Middleware. ✅
- [X] **Eliminación de Side-effects**: Remoción de imports innecesarios de `crypto` en utilidades compartidas. ✅

#### 🚀 FASE 241: i18n RECOVERY & STRUCTURAL INTEGRITY
**Status:** `[COMPLETED ✅]` | **Prioridad:** CRÍTICA | **Estimación:** 2 días

**Objetivo:** Reparar la corrupción de archivos JSON i18n y restaurar la gobernanza de traducciones.

- [X] **BOM Purge**: Eliminación del Byte Order Mark (BOM) `EF-BB-BF` que impedía el parseo de JSON en Node.js. ✅
- [X] **Deduplicación Estructural**: Fusión de secciones duplicadas (`onboarding`, `search`) en `common.json`. ✅
- [X] **Restauración de Claves**: Recuperación de claves críticas para `CommandMenu`, `breadcrumbs.trace` y `coming_soon`. ✅
- [X] **Validación de Integridad**: Script de validación automatizada para asegurar JSONs 100% válidos. ✅

---

### 📦 ERA 9: SYMPHONY

**Objetivo:** Resolver violaciones de reglas del proyecto en hooks, eliminar duplicados de componentes compartidos, y auditar seguridad de APIs de debug.

**Contexto del problema:**
- `useLocalStorage` **VIOLA REGLA #5** (NO Browser Storage APIs). Lo usan `LogExplorer.tsx` y `ConsumptionDashboard.tsx`.
- `use-onboarding.ts` usa `zustand/persist` (que internamente usa `localStorage`) — otra violación de la regla #5.
- `useOnboarding.ts` (diferente archivo) usa `fetch('/api/user/preferences')` — diseño correcto pero incompatible con el otro hook.
- Existen **3 language switchers**: `LanguageSelector` (Header.tsx), `LocaleSwitcher` (PublicNavbar.tsx), `LanguageSwitcher` (HUÉRFANO, no importado por nadie).
- 6 hooks de workflow (`useWorkflowCRUD`, `useWorkflowState`, `useWorkflowHistory`, `useWorkflowValidation`, `useWorkflowAnalytics`, `useWorkflowShortcuts`) podrían exponerse como un solo hook compuesto.
- `/api/test-env` expone env vars (SINGLE_TENANT_ID, presencia de MONGODB_URI y GEMINI_API_KEY) **sin ningún middleware de auth**.
- `/api/debug/env` probablemente expone más configuración sin auth.
- 3 health checks diferentes (`/_health`, `/_ready`, `/health/db-check`) sin documentar cuál usa Vercel.

**Status:** `[COMPLETADO ✅]`

- [x] **225B.1: Eliminar `useLocalStorage`**: Migrado `LogExplorer` y `ConsumptionDashboard` a `useState`. Eliminado `useLocalStorage.ts` (Regla #5). ✅
- [x] **225B.2: Unificar onboarding hooks**: `useOnboarding.ts` consolidado como canónico. Eliminado `use-onboarding.ts`. ✅
- [x] **225B.3: Eliminar `LanguageSwitcher`**: Purgado del codebase por redundancia. ✅
- [x] **225B.5: Proteger `/api/test-env` y `/api/debug/env`**: Implementado `requireRole([UserRole.SUPER_ADMIN])` en endpoints de salud y diagnóstico. ✅
- [x] **225B.7: Documentar health checks**: Unificado en `/api/health`.

**Criterio de aceptación:** Zero `useLocalStorage`. Un solo hook de onboarding. Un solo language switcher por contexto (app vs marketing). APIs de debug protegidas con auth.

---

#### 🔒 FASE 225C: TYPESCRIPT STRICT ENFORCEMENT & TYPE HYGIENE

**Status:** `[COMPLETADO ✅]`

- [x] **225C.1: Crear interfaces para domain objects core**: Interfaces tipadas para Tenant, Anomaly, Prompt, Template. ✅
- [x] **225C.2: Purgar `catch (error: any)`**: Migrado a `unknown` con type guards en perímetros críticos. ✅
- [x] **225C.5: Verificar con tsc --noEmit**: Validado mediante build de producción exitoso. ✅

---

#### 🌐 FASE 226 - 231: MASSIVE i18N CONSOLIDATION (ERA 8 BATCH)

**Status:** `[COMPLETADO ✅]`

- [x] **FASE 226**: i18n Hardcode Purge (Security & Limits Batch). ✅
- [x] **FASE 227**: i18n Hardcode Purge (Governance & Debug Batch). ✅
- [x] **FASE 228**: Workflow e i18n Table batch i18n. ✅
- [x] **FASE 229**: Knowledge & Ingest i18n Batch. ✅
- [x] **FASE 230**: Governance & Audit i18n Batch. ✅
- [x] **FASE 231**: Infrastructure & Admin i18n Batch. ✅

---

#### 🏗️ FASE 232: VERTICAL ARCHITECTURE & TECHNICAL HYGIENE

**Status:** `[COMPLETADO ✅]`

- [x] **Vertical Standardization**: Estandarización de `elevators` and `real-estate` con `config.ts` y directorios de plantillas. ✅
- [x] **Vertical Guide**: Creación de `docs/vertical-guide.md` para escalabilidad industrial. ✅
- [x] **Technical Hygiene**: Eliminación definitiva de `useLocalStorage` (Regla #5) y unificación de hooks de onboarding. ✅
- [x] **Security Hardening**: Protección de endpoints de diagnóstico `/api/health` para `SUPER_ADMIN`. ✅

---

#### 🧹 FASE 233: BATCH AUDIT & SYSTEMATIC HYGIENE (ERA 8 TYPING)

**Status:** `[COMPLETADO ✅]`

**Objetivo:** Realizar un barrido sistemático por "Bloques de Calidad" a través de las 101 rutas identificadas, en lugar de una revisión secuencial individual. Esto optimiza el tiempo y garantiza consistencia absoluta.

**Estrategia de Barrido (Sweeps):**
1. **Security & Isolation Sweep**: Verificación de `enforcePermission`, `requireRole` (ABAC V3) y `getTenantCollection` (Gold Rules #2, #7, #11).
2. **UI/UX & Accessibility Sweep**: Consolidación de `HubPage`, `MetricCard`, notificaciones `sonner` y accesibilidad WCAG AA (Gold Rules #10, #14, #16).
3. **i18n & Content Sweep**: Purga total de hardcoded strings y sincronización de diccionarios `es`/`en`.
4. **Performance & Composition Sweep**: Optimización de re-renders, paralelismo de promesas y patrones de composición React 19 (Rule #8, #14).
5. **Zero `any` & Strict Typing Sweep**: Erradicación absoluta del tipo `: any` en módulos core, servicios RAG, facturación, soporte e infra. (Gold Rule #1).

**Estado de Auditoría:**
- [x] **Bloque 1: Security Sweep**: Escaneo de perímetros de rutas privadas. (Notifications OK, Knowledge OK, AI OK, Users OK, Security OK)
- [x] **Bloque 2: UI/UX Sweep**: Alineación con el nuevo Design System. (Notifications OK, Knowledge OK, AI OK, Users OK, Security OK)
- [x] **Bloque 3: i18n Sweep**: Eliminación de textos estáticos. (Notifications OK, Knowledge OK, AI OK, Users OK, Security OK)
- [x] **Bloque 4: Performance Sweep**: Auditoría de waterfalls. (Notifications OK, Knowledge OK, AI OK, Users OK, Security OK)
- [x] **Bloque 5: Strict Typing Sweep**: Todos los módulos core y de negocio auditados para cero `any` con éxito validado por `tsc --noEmit`.

**Mecanismo de Tracking:**
- Los resultados se consolidaron en `map.md` (Columna Última Revisión).
- Se utilizó `task.md` y `walkthrough.md` local para mantener el estado de cada batch audit.

**Tareas Inmediatas:**
- [x] **233.1: Sweep general de Typing en Infraestructura y Core**.
- [x] **233.2: Sweep masivo de Zero `any` en todos los archivos de servicios (`src/services/`) y APIs (`src/app/api/`)**.

---

## 🎵 ERA 9: SYMPHONY — ROBUSTNESS, VERIFICATION & FULL ENFORCEMENT

> **Principio Rector**: Si no está testeado, no existe. Si no está protegido, es una vulnerabilidad.
> **Motivación**: ERA 8 dejó la plataforma coherente, tipada en servicios core y visualmente unificada. Sin embargo, la infraestructura compartida (`src/lib`, middleware) conserva ~32 archivos con `: any`, solo ~30 de 128 APIs tienen `enforcePermission` ABAC, y existe zero cobertura de tests automatizados. ERA 9 transforma la plataforma de "coherente" a **"verificable y robusta"**.
> **Fecha de inicio**: 2026-03-02
>
> **Hallazgos del análisis pre-ERA 9:**
>
> | Área | Estado Actual | Gap |
> |------|---------------|-----
> | Tests | `jest.config.js` existe, **0 archivos de test** | Cobertura 0% |
> | Guardian API | ~30 de 128 `route.ts` con `enforcePermission` | ~98 APIs sin enforcement ABAC |
> | `: any` residual | ~32 archivos en `src/lib` con `: any` | Middleware, HOFs, infra adapters |
> | Performance SLA | `withPerformanceSLA` en ~30 APIs | ~98 sin medición |
> | i18n deuda | Documentada en `docs/i18n-debt.md` | Dashboard, AppError, placeholders |
> | Middleware | `catch (error: any)` L170, `console.log/warn` | Viola Reglas #1 y #4 |

---

#### 🔒 FASE 234: MIDDLEWARE HARDENING & TYPING

**Status:** `[COMPLETADO ✅]` | **Prioridad:** CRÍTICA | **Estimación:** 1-2 días

**Objetivo:** Corregir las violaciones de reglas del proyecto en el punto de entrada más crítico de la aplicación: `middleware.ts`.

**Contexto del problema:**
- `catch (error: any)` en L170 → Viola Regla #1 (TypeScript Strict).
- `request.auth?: any` en L13 → Tipo genérico en vez de interface de NextAuth.
- `console.log`/`console.warn`/`console.error` en L26, L45, L89, L114, L171 → Viola Regla #4 (Structured Logging) y puede filtrar info en producción.

**Tareas:**
- [x] **234.1: Corregir `catch (error: any)`** → `catch (error: unknown)` con type guard. ✅
- [x] **234.2: Tipar `request.auth`** → Interface proper con la session de NextAuth. ✅
- [x] **234.3: Reemplazar `console.log/warn/error`** por `logEvento` o eliminar traces de debug. ✅
- [x] **234.4: Verificar build limpio** con `npm run build`. ✅

**Criterio de aceptación:** Zero `: any` en `middleware.ts`. Zero `console.log` fuera de dev-only guards. Build limpio.

---

#### 🛡️ FASE 235: GUARDIAN ENFORCEMENT SWEEP (APIs ADMIN)

**Status:** `[PENDIENTE]` | **Prioridad:** CRÍTICA | **Estimación:** 3-5 días

**Objetivo:** Implementar `enforcePermission` en todas las APIs bajo `/api/admin/*` que actualmente solo usan `requireRole`.

**Contexto del problema:**
- ~40 rutas bajo `/api/admin/*` protegidas solo con `requireRole` (check de rol estático).
- `enforcePermission` (Guardian ABAC V3) solo cubre ~30 rutas actualmente.
- Un usuario con rol ADMIN podría acceder a recursos de otro tenant si `requireRole` no filtra por tenant.

**Tareas:**
- [x] **235.1: Inventariar TODAS las rutas `api/admin/*`** y clasificar: ✅ `enforcePermission` / ⚠️ solo `requireRole` / ❌ sin protección.
- [x] **235.2: Definir recursos y acciones Guardian** para cada API no cubierta (ej: `knowledge-assets:download → read`, `billing:contracts → read`).
- [x] **235.3: Migrar bloque 1 — Knowledge & RAG APIs** (~15 rutas): `knowledge-assets/*`, `ingest/*`, `graph/*`.
- [x] **235.4: Migrar bloque 2 — Billing & Organizations APIs** (~10 rutas): `billing/*`, `organizations/*`, `compliance/*`.
- [x] **235.5: Migrar bloque 3 — Operations & i18n APIs** (~12 rutas): `operations/*`, `logs/*`, `i18n/*`, `export/*`.
- [x] **235.6: Migrar bloque 4 — Notifications, Settings & Misc** (~8 rutas): `notifications/*`, `settings/*`, `document-types/*`, `contacts/*`.
- [x] **235.7: Actualizar `docs/permissions-matrix.md`** con cobertura 100% de admin APIs.
- [x] **235.8: Verificar build y smoke test** de sidebar (acceso/denegación con roles distintos).

**Criterio de aceptación:** 100% de APIs bajo `/api/admin/*` protegidas con `enforcePermission`. Matriz de permisos actualizada. Zero `requireRole` como único mecanismo de protección.

---

#### 🛡️ FASE 236: GUARDIAN ENFORCEMENT SWEEP (APIs CORE & PUBLIC)

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 2-3 días

**Objetivo:** Extender `enforcePermission` a las APIs bajo `/api/core/*`, `/api/billing/*`, `/api/user/*` y `/api/support/*`.

**Contexto del problema:**
- `/api/core/*` contiene entities, quick-qa, insights, predictive, graph, governance, agents, automation, collaboration, dashboard — muchos sin enforcement.
- `/api/billing/*` tiene portal, webhook, simulate-change, create-checkout, change-plan — mezcla de endpoints de usuario y de Stripe.
- `/api/user/*` tiene preferences, search, documents — acceso personal.

**Tareas:**
- [x] **236.1: Inventariar rutas Core** (`/api/core/*`): entities, quick-qa, insights, predictive, graph, governance, agents, automation, collaboration, dashboard.
- [x] **236.2: Definir recursos Guardian para rutas Core** y migrar al modelo ABAC.
- [x] **236.3: Inventariar y migrar rutas Billing** (`/api/billing/*`): portal, webhook, simulate-change, create-checkout, change-plan.
- [x] **236.4: Inventariar y migrar rutas User** (`/api/user/*`): preferences, search, documents.
- [x] **236.5: Excluir webhooks** (`/api/billing/webhook`) del enforcement — son llamadas de Stripe server-to-server, no de usuarios.
- [x] **236.6: Build + smoke test completo**.

**Criterio de aceptación:** 100% de APIs de la aplicación con enforcement ABAC (excepto webhooks, health checks y auth). Documentado en `docs/permissions-matrix.md`.

---

#### 🔧 FASE 237: STRICT TYPING SWEEP (src/lib INFRASTRUCTURE)

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 3-4 días

**Objetivo:** Purga definitiva de `: any` en los ~32 archivos de `src/lib` que aún lo contienen. Perímetro de infraestructura compartida que toda la app consume.

**Tareas:**
- [x] **237.1: Bloque 1 — LLM & AI Core**: `PromptRunner.ts`, `langgraph-rag.ts`, `gemini-client.ts`. ✅
- [x] **237.2: Bloque 2 — Infra adapters**: `redis.ts`, `stripe.ts`, `cloudinary.ts`. ✅
- [x] **237.3: Bloque 3 — Auth & security**: `auth-utils.ts`, `api-handler.ts`, `guardian-guard.ts`. ✅
- [x] **237.4: Bloque 4 — Business logic & Utils**: `mappers.ts`, `plans.ts`, `utils.ts`. ✅
- [x] **237.5: Verificación final**: Zero `: any` residual en `src/lib/`. ✅

**Criterio de aceptación:** `grep -r ": any" src/lib/` devuelve ZERO resultados. Build limpio.

---

#### 🔧 FASE 238: STRICT TYPING SWEEP (src/services)

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 4-5 días

**Objetivo:** Erradicación de `: any` en toda la capa de servicios (`src/services`), asegurando contratos de tipos robustos en la lógica de negocio.

**Tareas por Bloques:**
- [x] **238.1: Bloque 1 — Infra & Storage Services**: `BlobStorageService.ts`, `SecureCollection.ts`, etc.
- [x] **238.2: Bloque 2 — Security & Auth Services**: `feature-flags.ts`, `security-service.ts`, `SessionService.ts`.
- [x] **238.3: Bloque 3 — Ops & Lifecycle Services**: `usage-service.ts`, `WorkflowTaskService.ts`, `queue-service.ts`.
- [x] **238.4: Bloque 4 — Observability & Support**: `TraceService.ts`, `ObservabilityService.ts`, `TicketService.ts`.
- [x] **238.5: Bloque 5 — LLM & Intelligence Services**: `llm-service.ts`, `prompt-service.ts`, `rag-evaluation-service.ts`.

**Criterio de aceptación:** 100% de `src/services` auditado y tipado estrictamente. Zero `: any` detectado por linter.

---

#### 🧪 FASE 239: TEST INFRASTRUCTURE & CORE UNIT TESTS

**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Estimación:** 4-5 día

**Objetivo:** Activar la infraestructura de testing existente (`jest.config.js`) y escribir los primeros tests unitarios para los módulos más críticos.

**Tareas:**
- [x] **239.1: Crear `jest.setup.ts`** con mocks globales (env vars, MongoDB connection mock).
- [x] **239.2: Crear estructura `tests/unit/` y `tests/integration/`**.
- [x] **239.3: Tests LLM Core** — `PromptRunner.test.ts`, `LlmJsonParser.test.ts` (mocks de Gemini API).
- [x] **239.4: Tests Repositories** — `BaseRepository.test.ts` (mock de MongoDB).
- [x] **239.5: Tests Guardian** — `guardian-guard.test.ts`: `enforcePermission` happy path + denied.
- [x] **239.6: Tests Schemas** — Validación de Zod schemas para ingest, billing, support.

---

#### ⚡ FASE 240: PERFORMANCE SLA COVERAGE EXPANSION

**Status:** `[PENDIENTE]` | **Prioridad:** MEDIA | **Estimación:** 2-3 días

**Objetivo:** Extender `withPerformanceSLA` a todas las APIs de la aplicación y definir SLAs por categoría.

---

#### 🌐 FASE 241: i18n DEEP POLISH & RESIDUAL DEBT

**Status:** `[PENDIENTE]` | **Prioridad:** MEDIA | **Estimación:** 2-3 días

**Objetivo:** Resolver la deuda i18n documentada en `docs/i18n-debt.md` y completar la internacionalización profunda.

---

#### 📖 FASE 242: DOCUMENTATION REFRESH & DEVELOPER ONBOARDING

**Status:** `[COMPLETADO ✅]` | **Prioridad:** MEDIA | **Completado:** 2026-03-02

**Objetivo:** Actualizar toda la documentación de proyecto para reflejar ERA 8+9 y facilitar onboarding de nuevos desarrolladores.

- [X] **ARCHITECTURE_ERA9.md**: Documento de arquitectura completo (monorepo, módulos, seguridad 3 capas, DB multi-cluster, stack).
- [X] **DEVELOPER_ONBOARDING_ERA9.md**: Guía de onboarding para nuevos desarrolladores (setup, estructura, flujos, reglas, checklist PR).
- [X] **CODING_CONVENTIONS_ERA9.md**: Convenciones de código (TypeScript strict, APIs, DB, crypto Edge, i18n, React 19, testing).
- [X] **SECURITY_GUIDE_ERA9.md**: Guía de seguridad (Defense in Depth, multi-tenant isolation, PII, auditoría).
- [X] **API_REFERENCE_ERA9.md**: Referencia de 128 endpoints categorizados por módulo con permisos Guardian y SLAs.


---

### 📊 RESUMEN DE FASES ERA 9

| Fase | Nombre | Duración | Prioridad | Dependencias |
|------|--------|----------|-----------|--------------|
| 234 | Middleware Hardening & Typing | 1-2 días | 🔴 CRÍTICA | — |
| 235 | Guardian Sweep (Admin APIs) | 3-5 días | 🔴 CRÍTICA | — |
| 236 | Guardian Sweep (Core & Public APIs) | 2-3 días | 🟠 ALTA | 235 |
| 237 | Strict Typing Sweep (src/lib) | 3-4 días | 🟠 ALTA | — |
| 238 | Strict Typing Sweep (src/services) | 4-5 días | 🟠 ALTA | 237 [COMPLETADO ✅] |
| 239 | Test Infrastructure & Core Tests | 4-5 días | 🟠 ALTA | 238 [COMPLETADO ✅] |
| 240 | Performance SLA Expansion | 2-3 días | 🟡 MEDIA | 237 |
| 241 | i18n Deep Polish | 2-3 días | 🟡 MEDIA | — |
| 242 | Documentation Refresh | 2-3 días | 🟡 MEDIA | Todo lo anterior [COMPLETADO ✅] |

**Total estimado:** 25-33 días (~6 semanas).

### 📊 MÉTRICAS DE ÉXITO GLOBALES (ERA 9)

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Cobertura `enforcePermission` | 100% APIs (excepto webhooks/health) | `grep` en `src/app/api/` |
| `: any` en `src/lib` y `src/services` | 0 ocurrencias | `grep -r ": any"` |
| Tests unitarios | ≥ 20 tests passing | `npm test` |
| SLA breach visibility | 100% APIs monitorizadas | `withPerformanceSLA` grep |
| i18n debt | 0 items en `docs/i18n-debt.md` | Archivo vacío/resuelto |
| Build status | Zero errores TypeScript | `npm run build` |

### 🧠 PRINCIPIOS DE DISEÑO (ERA 9)

1. **Verification First**: Todo cambio debe ser verificable automáticamente
2. **Defense in Depth**: Auth (middleware) + Authorization (Guardian) + Validation (Zod) en cada endpoint
3. **Zero Trust APIs**: Ningún endpoint accesible sin `enforcePermission` explícito
4. **Typing as Documentation**: Los tipos reemplazan comentarios — `: any` es un comentario que dice "no sé"
5. **Progressive Testing**: Empezar por módulos críticos, expandir cobertura con cada fase futura

---

#### 🧪 FASE 243: AGENTIC RELIABILITY & PROTOCOL REFINEMENT

**Status:** `[COMPLETED ✅]` | **Prioridad:** ALTA | **Estimación:** 2-3 días

**Objetivo:** Consolidar la robustez del motor agéntico y la integridad de los datos de configuración (i18n, prompts) tras la expansión de la ERA 9.

**Tareas:**
- [x] **243.1: Cleanup de Entorno**: Eliminación de reportes temporales `/coverage` (Post-auditoría). ✅
- [x] **243.2: i18n Hygiene (admin.json)**: Sanitización, ordenación y corrección de codificación en el archivo de 88KB. ✅
- [x] **243.3: AI Runner Consolidation**: Unificación de la lógica de ejecución de IA bajo el estándar de `PromptRunner`. ✅
- [x] **243.4: Ingest Recovery Audit**: Mejora en la trazabilidad de fallos de ingesta asíncrona. ✅

**Criterio de aceptación:** `admin.json` organizado y libre de artefactos. Zero runners de IA redundantes. Roadmap actualizado.

---

#### 🛡️ FASE 244: ERA 9 FINALIZATION & HARDENING (SWEEP DE ROBUSTEZ)

**Status:** `[X] COMPLETADO ✅` | **Prioridad:** CRÍTICA | **Completado:** 2026-03-02

**Objetivo:** Cerrar definitivamente las brechas de seguridad, tipado y observabilidad detectadas en la auditoría de marzo 2026.

**Tareas de Seguridad (Guardian Sweep):**
- [x] **244.1: Cobertura 100% enforcePermission**: Implementar en las 88 rutas restantes (Analytics, Billing Admin, Audit, Core/User residuales). ✅
- [x] **244.2: Auditoría de Aislamiento**: Validar que `getTenantCollection` se usa en conjunción con `enforcePermission`. ✅
- [x] **244.3: Limpieza `src/lib`**: Eliminar `: any` en los archivos identificados. ✅
- [x] **244.4: Limpieza `src/services`**: Eliminar `: any` en los archivos de servicios. ✅
- [x] **244.5: RAG v1 SLA**: Aplicar `withPerformanceSLA` a las rutas críticas. ✅
- [x] **244.6: Resolución de Deuda i18n**: Implementar puntos de `docs/i18n-debt.md`. ✅

**Criterio de Aceptación GLOBAL:**
- `grep -r ": any" src/lib src/services` == 0.
- 195/195 APIs con `enforcePermission` y `withPerformanceSLA`.
- `docs/i18n-debt.md` marcado como resuelto.
- Build de producción limpio y tests pasando.

---

#### 🛡️ FASE 246: HARDENING PHASE 2 - REFACTORING & LOGGING HYGIENE [COMPLETED ✅]
**Status:** `[DONE ✅]` | **Prioridad:** CRÍTICA | **Completado:** 2026-03-03

**Objetivo:** Refactorizar lógica monolítica, asegurar workers asíncronos y unificar la observabilidad eliminando console.logs residuales.

- [x] **246.1: Auth Refactoring**: Descomponer `authorizeCredentials` en helpers y migrar a `logEvento`.
- [x] **246.2: Handler Hardening**: Asegurar `auth.ts` con debug condicional y logger estructurado.
- [x] **246.3: Async Worker Security**: Migrar logs de BullMQ worker y `processPdfAnalysis` a `logEvento`.
- [x] **246.4: RAG Pipeline Refactoring**: Descomponer el pipeline de análisis PDF en etapas testeables.
- [x] **246.5: Global Logging Hygiene**: Eliminar `console.log/warn/error` en runtime (PDF Export, Resilience, Sanitizers).
- [x] **246.6: Language & Comments Consistency**: Unificar comentarios técnicos y logs internos a Inglés.

**Criterio de Aceptación:**
- `authorizeCredentials` con < 100 líneas (orquestador).
- Zero `console.log` en producción (auditado via grep).
- Logs de Worker asíncrono visibles en el Audit Log unificado.
- Comentarios "Visión 2.0" y similares migrados a Inglés.

---

#### 🛡️ FASE 247: TESTING INFRASTRUCTURE & SUITES [COMPLETED ✅]
**Status:** `[DONE ✅]` | **Prioridad:** MEDIA | **Completado:** 2026-03-03

**Objetivo:** Establecer una base de pruebas robusta con Jest 30 para lógica y Playwright para E2E.

- [x] **247.1: Configuration Setup**: Migrar a `jest.config.ts` y crear `tests/setup/jest.setup.ts`.
- [x] **247.2: Auth Unit Tests**: Cobertura de `authorizeCredentials` y callbacks de sesión.
- [x] **247.3: RAG & Worker Tests**: Validar el pipeline de análisis y sincronización de entidades.
- [x] **247.4: Audit & Sanitizer Tests**: Cobertura de PDF Layout y MongoSanitizer.
- [x] **247.5: E2E Smoke Tests**: Flujos críticos de Login y RAG con Playwright.

**Criterio de Aceptación:**
- Suite de tests ejecutable con `npx jest`.
- Reporte de cobertura inicial generado.
- Estructura de carpetas `tests/unit`, `tests/integration`, `tests/e2e` establecida.

---

#### 🎨 FASE 248: UX MICRO-SURGERY (COMPLETADO ✅)
**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Completado:** 2026-03-03

**Objetivo:** Cirugía fina de usabilidad post ERA-6. La macroestructura (navegación, flujos, feedback) ya está resuelta. Esta fase se centra en microdetalles: densidad visual, microcopys orientados a tarea, guía contextual consistente, accesibilidad de teclado y aislamiento de demos.

**Contexto:** Las mejoras se priorizan por ratio impacto/esfuerzo. No se crean features nuevas; solo se pule la experiencia existente.

---

##### 248.0: A11Y & TECLADO (P0 — Crítico para Compliance)
**Status:** `[COMPLETADO ✅]`
**Objetivo:** Garantizar operabilidad completa por teclado y cumplimiento WCAG 2.1 AA en flujos core.

- [x] **248.0.1: Audit de `aria-label` en botones icónicos** (Completado en MyDocuments, Search, Analyze, Notifications)
- [x] **248.0.2: CMD+K Consistency** (Refactorizado CommandMenu para incluir temas y navegación completa)
- [x] **248.0.3: Confirmaciones destructivas** (Añadido window.confirm en MyDocuments delete)

##### 248.1: DENSIDAD VISUAL (COMPLETADO ✅)
**Status:** `[COMPLETADO ✅]`
**Objetivo:** Optimizar el espacio en pantalla para usuarios expertos, reduciendo tamaños de fuente secundarios y estandarizando componentes de baja densidad.
  - **Fix:** Añadir `aria-label` descriptivo en cada caso (ej: `aria-label={t('download_document', { name: doc.name })}`).
  - **Archivos probables:** `src/components/shared/`, `src/app/(protected)/my-documents/`, `src/app/(protected)/admin/knowledge/assets/`.
  - **Skill recomendado:** `i18n-a11y-auditor`.

- [x] **248.0.2: Focus management en flujos core** ✅
  - **Qué hacer:** En las 3 páginas core (`/my-documents`, `/search`, `/entities`), asegurar:
    1. `autoFocus` en el input de búsqueda principal al cargar la página.
    2. `Enter` en un resultado abre el detalle.
    3. `Escape` cierra modales y devuelve foco al trigger.
  - **Patrón:** Usar `useEffect(() => inputRef.current?.focus(), [])` y `onKeyDown` handlers.
  - **Archivos:** `src/app/(protected)/my-documents/page.tsx`, `src/app/(protected)/search/page.tsx`, `src/app/(protected)/entities/page.tsx`.

- [x] **248.0.3: CMD+K (CommandCenter) audit de consistencia** ✅
  - **Qué hacer:** Verificar que el `CommandCenter` (Ctrl+K / CMD+K) está montado en el layout principal y accesible desde TODAS las vistas protegidas.
  - **Archivo:** `src/components/shared/CommandCenter.tsx` y `src/app/(protected)/layout.tsx`.
  - **Verificación:** Navegar a 5 páginas distintas y probar que CMD+K siempre abre.

---

##### 248.1: REDUCCIÓN DE DENSIDAD VISUAL (P1 — Alto Impacto, Bajo Esfuerzo) ✅
**Objetivo:** Reducir la carga cognitiva en pantallas ricas agrupando bloques secundarios.

- [x] **248.1.1: Audit automatizado de variantes de sombra/borde por página** ✅
  - **Qué hacer:** Crear un script temporal (`/tmp/audit-card-variants.sh`) que cuente cuántas clases `shadow-*` y `border-*` distintas se usan en cada `page.tsx`.
  - **Comando:** `grep -c 'shadow-\|border-' src/app/**/page.tsx | sort -t: -k2 -rn | head -20`
  - **Output esperado:** Lista de páginas ordenadas por número de variantes. Las que superen 4 variantes son candidatas.

- [x] **248.1.2: Perfil de usuario — Tabs en bloque de seguridad** ✅
  - **Qué hacer:** En la página de Perfil (`/profile` o `/admin/profile`), agrupar las cards de **MFA**, **Sesiones Activas** y **Notificaciones de Seguridad** en un solo bloque con Tabs (patrón `DashboardTabs`).
  - **Archivos:** `src/app/(protected)/profile/page.tsx` o componentes en `src/components/profile/`.
  - **Patrón:** Reutilizar el compound component `DashboardTabs` que ya existe en el Dashboard Admin.
  - **Resultado visual:** 1 card con 3 tabs en vez de 3 cards separadas.

- [x] **248.1.3: Limitar variantes de card a máximo 2 por vista** ✅
  - **Qué hacer:** En las páginas identificadas en 248.1.1, consolidar estilos de card usando máximo 2 variantes: `default` (borde sutil) y `highlighted` (borde accent + sombra). Eliminar variantes intermedias ad-hoc.
  - **Archivos:** Los identificados por el audit.
  - **Tokens CSS:** Definir en `src/app/globals.css` las 2 variantes canónicas si no existen.

---

##### 248.2: MICROCOPYS ORIENTADOS A TAREA (P1 — Alto Impacto, Esfuerzo Medio) ✅
**Objetivo:** Reescribir textos de UI para que sean orientados a tarea ("Configura tu...") en vez de descriptivos ("Sistema de gestión de...").

- [x] **248.2.1: Audit de `PageHeader` subtítulos** ✅
  - **Qué hacer:** Extraer todas las claves i18n usadas como `subtitle` o `description` en componentes `PageHeader` de las rutas admin.
  - **Comando:** `grep -rn 'PageHeader' src/app/(protected)/admin/ --include="*.tsx" -A 5 | grep -E 'subtitle|description'`
  - **Output:** Lista de claves i18n a reescribir.

- [x] **248.2.2: Reescritura Auth & Security (ES + EN)** ✅
  - **Archivos:** `messages/es/admin.json`, `messages/en/admin.json`, `messages/es/security_hub.json`, `messages/en/security_hub.json`.
  - **Patrón de reescritura:**
    - ❌ ANTES: "Panel de seguridad con herramientas avanzadas de monitorización"
    - ✅ DESPUÉS: "Protege tu cuenta y monitoriza accesos sospechosos"
  - **Criterio:** Cada subtítulo debe responder "¿Qué puedo hacer aquí?" en máximo 12 palabras.

- [x] **248.2.3: Reescritura Knowledge & AI (ES + EN)** ✅
  - **Archivos:** `messages/es/knowledge_hub.json`, `messages/en/knowledge_hub.json`, `messages/es/aiHub.json`, `messages/en/aiHub.json`.
  - **Mismo patrón de reescritura que 248.2.2.**

- [x] **248.2.4: Reescritura Billing & Ops (ES + EN)** ✅
  - **Archivos:** `messages/es/admin_billing.json`, `messages/en/admin_billing.json`, `messages/es/operations_hub.json`, `messages/en/operations_hub.json`.
  - **Mismo patrón de reescritura que 248.2.2.**

- [x] **248.2.5: Simplificar modales de acción destructiva** ✅
  - **Qué hacer:** En todos los modales de borrado/confirmación, reducir el cuerpo a máximo 3 líneas: (1) Qué va a pasar, (2) Cuánto tarda, (3) Si es reversible.
  - **Búsqueda:** `grep -rn 'AlertDialog\|ConfirmDialog\|DeleteDialog' src/ --include="*.tsx"`
  - **Archivos:** Componentes en `src/components/shared/` y modales inline.

---

##### 248.3: GUÍA CONTEXTUAL CONSISTENTE (P2 — Impacto Medio, Esfuerzo Medio) ✅
**Objetivo:** Asegurar que cada `PageHeader` de flujos core incluye ayuda contextual accionable.

- [x] **248.3.1: Audit de cobertura de `contextualHelp` en PageHeader** ✅
  - **Qué hacer:** Buscar todos los `PageHeader` que NO tienen prop `helpText`, `contextualHelp` o `description` con enlace de ayuda.
  - **Comando:** `grep -rn 'PageHeader' src/app/ --include="*.tsx" -B 2 -A 10 | grep -L 'helpText\|contextualHelp'`
  - **Output:** Lista de páginas sin guía contextual.

- [x] **248.3.2: Añadir "¿Qué puedo hacer aquí?" en flujos core** ✅
  - **Qué hacer:** Para cada `PageHeader` de flujo core (`/my-documents`, `/search`, `/admin/knowledge`, `/admin/ai`, `/admin/security`), añadir una prop `helpText` con:
    1. 1 frase describiendo la acción principal.
    2. 1 tooltip o enlace "Ver ejemplo" (puede ser un `Popover` con mini-caso).
  - **Archivos:** Los `page.tsx` de las rutas listadas.

- [x] **248.3.3: Progressive disclosure en pantallas de configuración** ✅
  - **Qué hacer:** En `/admin/ai/governance`, `/admin/prompts`, `/admin/security`, agrupar opciones avanzadas bajo una sección colapsable `<Collapsible>` con título "⚙️ Opciones avanzadas".
  - **Patrón:** Usar `<Collapsible>` de Shadcn UI. Estado colapsado por defecto. NO usar un toggle global que cambie todo el layout.
  - **Archivos:** `src/app/(protected)/admin/ai/governance/page.tsx`, `src/app/(protected)/admin/prompts/page.tsx`.

---

##### 248.4: AISLAMIENTO DEMO vs PRODUCCIÓN (P2 — Bajo Esfuerzo, Importante) ✅
**Objetivo:** Clarificar visualmente qué es demo y qué es producción.

- [x] **248.4.1: Crear hub `/admin/labs`** ✅
  - **Qué hacer:** Crear una nueva ruta hub `/admin/labs` que agrupe:
    - Real Estate Demo (`/real-estate`)
    - Causal AI Simulation (si existe como ruta)
    - Cualquier otro flujo experimental.
  - **Patrón:** Usar `<HubPage>` con `<MetricCard>` por cada demo, badge `🧪 LABS` en el header.
  - **Archivos nuevos:** `src/app/(protected)/admin/labs/page.tsx`.
  - **Actualizar:** `map.md`, sidebar navigation config.

- [x] **248.4.2: Condicionar visibilidad en sidebar por `DEMO_MODE`** ✅
  - **Qué hacer:** En la configuración del sidebar, las rutas de Labs solo deben mostrarse si `NEXT_PUBLIC_DEMO_MODE === 'true'`. Si no está activo, la sección "Labs" no aparece.
  - **Archivos:** `src/components/shared/Sidebar.tsx` o el componente de navegación principal.
  - **Patrón:** `{isDemoMode && <SidebarItem ... />}`.

---

**Criterio de Aceptación Global (FASE 248):**
- Zero `<Button size="icon">` sin `aria-label` (verificable con grep).
- Flujos core operables 100% con teclado (focus tests manuales).
- Máximo 2 variantes de card por `page.tsx` en vistas admin.
- 100% de `PageHeader` en flujos core con `helpText` o `contextualHelp`.
- Subtítulos de sección orientados a tarea (≤12 palabras, verbo de acción).
- Demos visualmente separadas en hub `/admin/labs`.
- Zero regresiones visuales (verificación visual en 5 rutas principales).

**Dependencias:**
- Skill `i18n-a11y-auditor` para 248.0.
- Skill `ui-styling` para 248.1.
- Skill `hub-dashboard-architect` para 248.4.1.
- Componentes existentes: `DashboardTabs`, `HubPage`, `MetricCard`, `PageHeader`, `Collapsible`.

**Estimación:** ~3-4 horas de ejecución distribuidas en 5 sub-fases.

---

### 🚀 ERA 9: SYMPHONY - CAPÍTULO 2: HARDENING & INTELLIGENCE (PHASES 250-255)

##### 252: HITL FEEDBACK → RAG RANKING & EVAL DATASET (COMPLETADO ✅)
**Status:** `[COMPLETADO ✅]`
**Fecha:** 2026-03-03
**Objetivo:** Implementar un bucle de retroalimentación humana que optimice el ranking de fragmentos (FAISS/Atlas) y genere un "Golden Dataset" para evaluación continua.

- [x] **252.1: Schema Extension & API**
  - **Qué hacer:** Extender `RagFeedbackSchema` para capturar `chunkIds`, `answer` y `label`.
  - **Archivos:** `src/lib/schemas/feedback.ts`, `src/app/api/feedback/answer/route.ts`.
- [x] **252.2: Search Engine Upgrade**
  - **Qué hacer:** Modificar `rag-engine` para proyectar y devolver `chunkId` en todos los modos de búsqueda.
  - **Archivos:** `packages/rag-engine/src/rag-service.ts`, `packages/rag-engine/src/keyword-search.ts`, `packages/rag-engine/src/multilingual-search.ts`.
- [x] **252.3: RagFeedbackProcessor**
  - **Qué hacer:** Implementar servicio que procesa feedback asíncrono y actualiza `feedbackScore` en `document_chunks`.
  - **Archivos nuevos:** `src/services/core/rag/rag-feedback-processor.ts`.
- [x] **252.4: RagEvalDatasetBuilder**
  - **Qué hacer:** Implementar generador de triplas (Q, A, Chunks) para el dataset de evaluación basado en feedback positivo.
  - **Archivos nuevos:** `src/services/core/rag/rag-eval-dataset-builder.ts`, `scripts/run-rag-feedback-processor.ts`.
- [x] **252.5: Verificación End-to-End**
  - **Pruebas:** `tests/verify-phase-252.ts`.

---

##### 253: UX MODE SIMPLE vs EXPERT (COMPLETADO ✅)
**Status:** `[COMPLETADO ✅]`
**Fecha:** 2026-03-03
**Objetivo:** Implementar un toggle global de UX que oculte/muestre detalles técnicos (prompts, scores, traces) según el perfil del usuario.

- [x] **253.1: Global ExpertMode State** (Zustand + Persistence en Cookies)
- [x] **253.2: Conditional Technical Views** (Search, Analysis, Ingest Modal)
- [x] **253.3: Keyboard Shortcut (Shift+X) for Toggle**

---


---

### 🌅 ERA 10: CLARITY — THREE MOTHER VIEWS (PHASES 260-269)

**Visión:** Transformar la aplicación de un "cockpit de 200 botones" a "tres herramientas claras" por rol. Cada usuario tiene una home enfocada y nunca necesita navegar más de 2 niveles para su tarea diaria.

**Filosofía de diseño:**
- Menos tablas genéricas, más cards de acción.
- Interacciones guiadas (wizards) en vez de configuración directa.
- Estados de negocio visibles; estados técnicos solo en modo experto.
- Un panel "Ahora mismo" siempre accesible como centro de gravedad.

**Métricas de partida (ERA 9):**
| Métrica | ERA 9 (Actual) | ERA 10 (Objetivo) |
|---------|----------------|-------------------|
| Subdirectorios admin | 36 | ≤15 (agrupación lógica) |
| `page.tsx` total | 101 | ~80 (deduplicación) |
| Clics para tarea frecuente | 3-5 | ≤2 |
| Duplicaciones "Mis Documentos" | 3 | 1 canónica |
| Duplicaciones "Audit/Logs" | 3 | 2 (1 security + 1 ops) |
| Puntos de entrada Soporte | 4 | 2 (client + staff) |

**Feature Flag Global:** `NEXT_PUBLIC_ERA10_UX` (permite alternar entre vista ERA 9 y ERA 10 durante la transición).

**Referencia Arquitectónica:** [ERA 10 Implementation Plan](file:///C:/Users/ajaba/.gemini/antigravity/brain/2d3f7440-0568-479b-ae6f-14a8cb0d398/implementation_plan_era10_ux.md)

---

#### 🏗️ FASE 260: ERA 10 FOUNDATION — FEATURE FLAG & UX MODE INFRASTRUCTURE
**Status:** `[COMPLETADO ✅]` | **Prioridad:** CRÍTICA | **Fecha:** 2026-03-04
**Objetivo:** Establecer la infraestructura de transición para que ambas vistas (ERA 9 y ERA 10) coexistan sin conflictos.

- [x] **260.1: Feature Flag `NEXT_PUBLIC_ERA10_UX`** ✅
- [x] **260.2: `useUxMode` Hook Enhancement** ✅
- [x] **260.3: Business State Mapper Integration** ✅


**Dependencias:** Phase 253 (UxMode), `src/lib/ingest-states.ts` (ya implementado).

---

#### 🔧 FASE 261: CENTRO DE INGESTA — OPERATIONS REDESIGN
**Status:** `[COMPLETADO ✅]` | **Prioridad:** ALTA | **Fecha:** 2026-03-04
**Objetivo:** Reemplazar la página de operaciones/ingest con un layout de 3 bloques enfocado en acción.

- [x] **261.1: KPI Cards (Bloque Superior)** ✅
- [x] **261.2: Jobs por Estado (Bloque Central)** ✅
- [x] **261.3: Panel de Diagnóstico (Bloque Inferior)** ✅
- [x] **261.4: Simplificación del Operations Hub** ✅


---

#### 📊 FASE 262: TENANT COMMAND CENTER — PROACTIVE ADMIN [COMPLETADO ✅]
**Status:** `COMPLETO` | **Prioridad:** CRÍTICA | **Finalizado:** 2026-03-05
**Objetivo:** Evolucionar el dashboard de 7 pestañas a un "Centro de Mando" proactivo. No más navegación pasiva; el sistema te dice qué requiere atención.

##### 262.1: Semantic Grid Layout (4 Mother Blocks)
- [x] **Block 1: Identity & Vitality (NW):** Nombre, Logo, Plan, y "Sueldos" de almacenamiento (visualización de cuotas con barra de progreso circular premium). ✅
- [x] **Block 2: Operational "Pulse" (NE):** Semáforo industrial basado en Ingest Health (24h), RAG Latency (<500ms SLA), y Security Audit Anomalies. ✅
- [x] **Block 3: Workforce Activity (Center):** Mapa de calor de accesos recientes y burbujas de usuarios activos en tiempo real. ✅
- [x] **Block 4: AI Brain State (Bottom):** Default LLM (Gemini 1.5/2.0), Security Profile Selector (Strict/Balanced), y toggles de Autopiloto (Self-healing RAG, Auto-retry). ✅

##### 262.2: Advanced "Expert" Disclosure
- [x] El botón "Shift+X" (Expert Mode) no solo muestra texto; revela trazas técnicas (latency charts, token breakdown) directamente sobre las cards de la Fase 262.1. ✅
- **Archivos:** `src/app/(authenticated)/(admin)/admin/page.tsx`, `src/components/admin/TenantCommandCenter/`.

---

#### 📄 FASE 263: CONTEXTUAL CO-PILOT — USER EXPERIENCE 2.0 [COMPLETADO ✅]
**Status:** `COMPLETO` | **Prioridad:** ALTA | **Finalizado:** 2026-03-05
**Objetivo:** Eliminar la fricción entre buscar y actuar.

##### 263.1: The "Split-Mind" View
- [x] **Left (Workspace):** Tabla de documentos/activos inteligente con "Acciones Recomendadas" (ej: Si un doc está procesado, sugerir "Generar Informe"). ✅
- [x] **Right (AI Sidekick):** Chat RAG persistente que "lee" lo que el usuario tiene seleccionado a la izquierda. No hay que pulsar "Preguntar"; el AI conoce el contexto. ✅
- **Archivos:** `src/app/(authenticated)/my-documents/page.tsx`, `src/components/shared/ContextualSidekick/`.

##### 263.2: AI-Powered Upload Wizard (Zero-Config)
- [x] **Stealth Analysis:** Al soltar un archivo, Gemini predice automáticamente el `documentType` y la `industry` antes de que el usuario pulse nada. ✅
- [x] El usuario solo confirma; el sistema hace el resto. ✅
- **Archivos:** `src/components/shared/FastUploadWizard.tsx`.

---

#### 🧭 FASE 264: SMART NAVIGATION & BREADCRUMB HEALING [COMPLETADO ✅]
**Status:** `COMPLETO` | **Prioridad:** MEDIA | **Finalizado:** 2026-03-05 (Graph Visualizer + Hydration Fixes)
**Objetivo:** La navegación debe ser inteligente, no estática.

- [x] **264.1: Adaptive Sidebar:** Los items de navegación cambian de orden según la frecuencia de uso del rol/usuario actual. ✅
- [x] **264.2: Breadcrumb-as-Action:** Los breadcrumbs no son texto; son dropdowns que permiten saltar entre carpetas o activos hermanos del mismo nivel. ✅
- **Archivos:** `src/hooks/use-navigation.ts`, `src/components/shared/BreadcrumbEnhancer.tsx`.

---

#### 📡 FASE 265: THE PULSE — REAL-TIME ACTIVITY CENTER [COMPLETADO ✅]
**Status:** `COMPLETO` | **Prioridad:** MEDIA | **Finalizado:** 2026-03-05
**Objetivo:** Un centro de gravedad visual siempre presente en el header.

- [ ] **265.1: Global Activity Widget (The Pulse):** Un indicador oscilante en el header que muestra "Sistema Sano" o "Procesando documentos...".
- [ ] Al hacer clic, abre un panel lateral con la cola de ingesta, alertas de seguridad de Guardian y el estado del Budget LLM.
- **Archivos:** `src/components/shared/ThePulseWidget.tsx`, `src/app/(authenticated)/layout.tsx`.

---

#### 💬 FASE 266: SEMANTIC FEEDBACK & SELF-HEALING AI [COMPLETADO ✅]
**Status:** `COMPLETO` | **Prioridad:** BAJA | **Finalizado:** 2026-03-05
**Objetivo:** Convertir el feedback del usuario en una acción de reparación automática.

- [x] **266.1: "Fix this answer" button:** En caso de Thumbs Down, ofrecer re-procesar el documento con parámetros más altos (Vision/Deep Research) automáticamente.
- [x] **266.2: Quality Heatmap for Admins:** Ver qué documentos están generando "respuestas pobres" y por qué.
- **Archivos:** `src/app/api/admin/ingest/reprocess/route.ts`, `src/components/shared/AnswerFeedback.tsx`, `src/components/shared/QualityHeatmap.tsx`.

---

#### 🎨 FASE 267: GUIDED INTERACTIONS & WIZARDS
**Status:** `[PENDIENTE]` | **Prioridad:** BAJA | **Estimación:** 3h
**Objetivo:** Envolver configuraciones complejas en asistentes guiados.

- [ ] **267.1: AI Config Wizard**
  - Wizard que pregunta en lenguaje natural: "¿Prefieres coste o precisión?", "¿Tu contenido tiene tablas/imágenes?".
  - Genera configuración concreta editable solo en modo experto.
- [ ] **267.2: Onboarding Renovado**
  - Primer login lleva a un wizard de 3 pasos: "¿Qué tipo de documentos vas a subir?", "¿Cuántos usuarios?", "¿Necesitas compliance GDPR?".
- [ ] **267.3: Troubleshooting Wizard para Errores de Ingest**
  - Cuando un documento falla, ofrecer un wizard: "¿El PDF tiene contraseña?", "¿Supera 50MB?".

---

#### 🏢 FASE 268: SUPERADMIN GOVERNANCE VIEW
**Status:** `[PENDIENTE]` | **Prioridad:** BAJA | **Estimación:** 2h
**Objetivo:** Vista de gobernanza global para SuperAdmin con semáforo por tenant.

- [ ] **268.1: Multi-Tenant Health Grid**
- [ ] **268.2: Anomaly Summary**

---

#### 🗑️ FASE 269: ERA 9 CLEANUP & DEPRECATION
**Status:** `[PENDIENTE]` | **Prioridad:** BAJA
**Objetivo:** Una vez ERA 10 es estable, eliminar código muerto de ERA 9.

---

**Criterio de Aceptación Global ERA 10:**
- Cada rol tiene exactamente 1 home screen clara y proactiva.
- Zero estados técnicos visibles en modo `simple`.
- El sistema informa proactivamente del estado vía "The Pulse".
- Build limpio y tests pasando.
- i18n completo (ES/EN).
- Todas las rutas nuevas documentadas en `map.md`.

**Dependencias de ERA 10:**
- Phase 253: UxMode (✅ implementado).
- `src/lib/ingest-states.ts`: Business state mapper (✅ implementado).
- `docs/bridge-audit.md`: Guía de consolidación (✅ documentado).
- Componentes existentes: `HubPage`, `MetricCard`, `DashboardTabs`, `PageHeader`, `Collapsible`.

**Estimación Total:** ~25-30 horas distribuidas en 10 fases independientes.

---

### 🛡️ ERA 10.S: SECURITY & PERFORMANCE HARDENING (PHASES 270-271)

**Origen:** Auditoría de Seguridad Externa (2026-03-04, 23 hallazgos).
**Análisis:** [Security Audit Analysis Report](file:///C:/Users/ajaba/.gemini/antigravity/brain/2d3f7440-0568-479b-ae6f-14a8cb0d398/security_audit_analysis.md).
**Validación:** 23 hallazgos analizados → 15 confirmados, 3 parcialmente mitigados, 5 falsos positivos.

| Hallazgo | Severidad Audit | Validación Real | Motivo |
|----------|----------------|----------------|--------|
| #1 ObjectId sin Zod | 🔴 | ✅ CONFIRMADO | `api-keys.ts` L43 |
| #2 `dangerouslySetInnerHTML` ×9 | 🔴 | ✅ CONFIRMADO | Compliance, Branding, Public pages, StructuredData |
| #3 Supply chain AI_MODELS | 🔴 | ⚠️ TEÓRICO | Paquete interno `@abd/platform-core` |
| #4 Secrets en test-db.ts | 🔴 | ❌ FALSO POSITIVO | Solo loguea "Exists"/"Missing" |
| #5 CSP `unsafe-eval` | 🟡 | ⚠️ PARCIAL | Solo en dev; producción usa nonces |
| #6 Rate limit in-memory | 🟡 | ❌ FALSO POSITIVO | Usa Upstash Redis |
| #7 tenantId en URL | 🟡 | ✅ CONFIRMADO | Billing page |
| #8 NextAuth 5 Beta | 🟡 | ⚠️ NOTA | Es la ruta estable actual de Auth.js |
| #9/12 useEffect loop | 🟡/🔴 | ✅ CONFIRMADO | `organizations/layout.tsx` L40-42 |
| #10 `catch (error: any)` ×50+ | 🟡 | ✅ CONFIRMADO | 50+ instancias en services, components, APIs |
| #11 Search concatenation | 🟡 | ✅ CONFIRMADO | `AuditClient.tsx` |
| #13 Client-side waterfall | 🔴 | ✅ CONFIRMADO | Admin page `useApiItem` secuencial |
| #14 MongoDB pool | 🔴 | ⚠️ PARCIAL | Ya tiene `maxPoolSize: 10` en platform-core |
| #15 `any` en interfaces | 🟡 | ✅ CONFIRMADO | Múltiples interfaces con `any` |
| #16 Race conditions hooks | 🔴 | ❌ FALSO POSITIVO | `useApiList` YA tiene `AbortController` |
| #17 Secrets en logs | 🟡 | ⚠️ PARCIAL | Middleware usa booleanos; otros archivos sin auditar |
| #18 Recursive setConfig | 🔴 | ❌ FALSO POSITIVO | Patrón funcional correcto en general/page.tsx |
| #19 GraphQL injection | 🟡 | ⚠️ TEÓRICO | GraphExplorer usa queries internas |
| #20 CORS hostname spoof | 🟡 | ✅ CONFIRMADO | `hostname.includes('localhost')` spoofeable |
| #21 Dynamic imports sin prefetch | 🟡 | ✅ CONFIRMADO | Admin page sin `ssr: false` |
| #22 Context en Server Components | 🟡 | ✅ CONFIRMADO | `OnboardingProvider` fuerza client tree |
| #23 Polling sin backoff | 🟡 | ✅ CONFIRMADO | Support stats sin revalidación |

---

#### 🔴 FASE 270: SECURITY HARDENING P0 — IMMEDIATE FIXES
**Status:** `[COMPLETADO ✅]` | **Prioridad:** CRÍTICA | **Estimación:** 4h
**Objetivo:** Remediar las 6 vulnerabilidades de mayor riesgo real (Ref: `walkthrough_phase_270.md`).

##### 270.1: Eliminar `dangerouslySetInnerHTML` (9 instancias)
- [x] **Compliance page**: Reemplazar por componentes React con `<strong>` explícito. ✅
- [x] **BrandingProvider** (×2): Validar que CSS generado no contenga `</style>` injection. Usar `cssText` sanitizado. ✅
- [x] **Public feature pages** (×4): Reemplazar regex `**...**` → `<strong>` por un componente `<FormattedText>` reutilizable. ✅
- [x] **StructuredData.tsx**: `JSON.stringify(jsonLd)` es seguro por definición. Mantener pero documentar. ✅

##### 270.2: Fix Memory Leak en Organizations Layout
- [x] Eliminar `useEffect(() => setIsLoading(isLoading))` que causa render loop. ✅
- [x] Reemplazar por derivación directa del estado en los componentes hijos. ✅

##### 270.3: `catch (error: any)` → `catch (error: unknown)` (50+ instancias)
- [x] Migración masiva con patrón estándar: `const msg = error instanceof Error ? error.message : String(error)`. ✅
- [x] Priorizar: `src/services/` (15), `src/lib/` (8), `src/core/` (10), `src/components/` (12), `src/app/api/` (5+). ✅

##### 270.4: ObjectId Validation con Zod
- [x] Crear `ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/)` en `src/lib/schemas/common.ts`. ✅
- [x] Aplicar en `api-keys.ts`, `document-types/page.tsx`, y cualquier otro punto que use `new ObjectId()` directamente. ✅

##### 270.5: Hostname Spoofing Fix
- [x] En `middleware.ts`, reemplazar `hostname.includes('localhost')` por verificación contra `process.env.NODE_ENV` exclusivamente. ✅

##### 270.6: MongoSanitizer Coverage Audit
- [x] Auditar todos los endpoints con `search` o `query` params. ✅
- [x] Asegurar que `MongoSanitizer.sanitizeQuery()` se aplica antes de pasar a MongoDB. ✅

---

#### ⚡ FASE 271: PERFORMANCE HARDENING — CLIENT OPTIMIZATION [COMPLETADO ✅]
**Status:** `COMPLETO` | **Prioridad:** ALTA | **Finalizado:** 2026-03-04
**Objetivo:** Eliminar anti-patrones de rendimiento en componentes cliente.

##### 271.1: Admin Dashboard Parallel Fetching
- [x] Refactorizar `admin/page.tsx` para optimizar carga dinámica y evitar waterfalls. ✅
- [x] Implementación optimizada de `useApiItem` para reducir bloqueos de UI. ✅
- **Archivo:** `src/app/(authenticated)/(admin)/admin/page.tsx`.

##### 271.2: Dynamic Import Optimization
- [x] Añadido `ssr: false` a los 6 dynamic imports en `admin/page.tsx` para acelerar TTI. ✅
- [x] Reducción de bundle inicial en dashboard administrativo. ✅

##### 271.3: Context Provider Optimization
- [x] Movido `OnboardingProvider` a boundary estrecho en `{children}` del main layout. ✅
- [x] Sidebar y Header desacoplados del contexto de onboarding. ✅
- **Archivo:** `src/app/(authenticated)/layout.tsx`.

##### 271.4: tenantId from Session (Server-Side Derivation)
- [x] Derivación segura de `tenantId` desde la sesión autenticada en el servidor. ✅
- [x] Eliminada exposición de `tenantId` en query strings de facturación. ✅
- **Archivos:** `src/app/(authenticated)/(admin)/admin/organizations/billing/page.tsx`, `usage/stats/route.ts`.

##### 271.5: MongoDB Pool Tuning
- [x] Ajustado `maxPoolSize: 20, minPoolSize: 1` en `platform-core` para Vercel. ✅
- [x] Optimizados timeouts de conexión (`5s`) y colas de espera. ✅
- **Archivo:** `packages/platform-core/src/server/db.ts`.

##### 271.6: Data Structure Harmonization
- [x] Tipado unificado `TenantUsageStats` en schemas y QuotaService. ✅
- [x] Resolución de lints y discrepancias de datos en el UI de facturación. ✅

---

#### 🧹 FASE 272: ROUTE DEDUPLICATION & GHOST PAGE AUDIT (COMPLETADO ✅)

**Objetivo:** Consolidar rutas duplicadas y eliminar páginas fantasma para mejorar el mantenimiento y el rendimiento del enrutamiento.

**Logros:**
- [x] **Redireccionamientos Centralizados**: Migrados 10+ redireccionamientos basados en `page.tsx` a `next.config.ts`.
- [x] **Cluster "My Documents"**: Unificado bajo `/admin/knowledge/my-docs` (admin) y `/my-documents` (user).
- [x] **Cluster "Audit/Logs"**: Unificado en `/admin/audit` con soporte para deep linking (`?tab=ops|security`).
- [x] **Mapa Semántico**: Migrado de `/admin/knowledge-base/graph` a `/admin/knowledge/graph`.
- [x] **Limpieza de Orfandad**: Eliminados archivos `page.tsx` redundantes en 8 rutas prioritarias.
- [x] **Sincronización de Navegación**: Actualizado `config/navigation.ts` con rutas canónicas.

**Archivos:** `next.config.ts`, `src/config/navigation.ts`, `src/app/(authenticated)/(admin)/admin/audit/AuditClient.tsx`.

---

**Criterio de Aceptación ERA 10.S:**
- Zero `dangerouslySetInnerHTML` con contenido dinámico no sanitizado.
- Zero `catch (error: any)` en `src/services/` y `src/lib/`.
- `hostname` check no spoofeable en middleware.
- `MongoSanitizer` aplicado en todos los endpoints con search params.
- Build limpio y tests pasando.

**Cumplimiento Post-Remediación:**
| Estándar | Actual | Objetivo |
|----------|--------|----------|
| OWASP ASVS | 60% | 85% |
| OWASP Top 10 | Parcial | Completo |
| GDPR | 70% | 80% |
| SOC 2 | 65% | 80% |

