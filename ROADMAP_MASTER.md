# ROADMAP_MASTER – Source of Truth for ABD RAG Platform (Unified v5.1.1-beta - SUITE ERA)

## 📖 Overview

---

- **Status & Metrics (v5.0.0 - SUITE ERA)**
- **Global Progress:** 100% (Industrialization & Suite foundation complete).
- **Industrialization Progress:** 100% (Phases 101-182 COMPLETED ✅).
- **Vertical Industry Support:** ✅ **FASE 98 COMPLETED** - Infrastructure & Synthetic Data for Legal, Banking, Insurance.
- **UX Transform**Last Audit:** 2026-02-20 (Phase 194.3 / FASE 26 Initial)
55 COMPLETED, Phase 176 COMPLETED ✅).
- **Enterprise SaaS Ready:** 100% (Phase 182 COMPLETED ✅).
- **Core Status:** ✅ **STABLE** - Massive TypeScript Cleanup & Namespace Migration Complete.
- - [X] **Compliance Status:** 🛡️ **FASE 176 COMPLETED** - Strategic Audit Implementation (Security Hardening & IA)
- - [X] **UX Status:** 🎨 **FASE 176 COMPLETED** - Hub-based Navigation Organization
- **Recent Ship**: **FASE 217: INTERACTION EXCELLENCE**, FASE 216: UX SURGICAL POLISH, FASE 215: QUALITY SHIELD, FASE 214: DOMAIN-SPECIALIZED DASHBOARDS, FASE 213: PLATFORM OBSERVABILITY HUB.
- **Project Status**: **ERA-7 Industrial Suite Transition (v5.2.0-beta).**
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

#### 🚀 FASE 160: ENTERPRISE REPORTING & AGENTIC EVOLUTION (IN PROGRESS)

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
> **Motivación**: Tras 217 fases de construcción, la plataforma tiene deuda técnica acumulada: rutas duplicadas, datos fake, servicios solapados, permisos desconectados y conceptos confusos (Suite Apps vs Verticales vs Permisos). ERA 8 cura todo esto antes de expandir.
> **Referencia**: [architecture_review.md](file:///C:/Users/ajaba/.gemini/antigravity/brain/a189174c-2cf4-40c8-90e7-6907ec477156/architecture_review.md)

> [!IMPORTANT]
> **POLÍTICA DE DEPRECACIÓN**: NUNCA borrar una funcionalidad directamente. Si una ruta, servicio o componente se identifica como candidato a eliminación, se le marca con un comentario visible `/* 🔴 PROPONER DEPRECAR: [motivo] — ERA 8, FASE X */` y se documenta en la sección DEPRECATED de `map.md`. Solo se elimina tras revisión explícita del equipo.

---

#### 🧹 FASE 218: ROUTE DEDUPLICATION & GHOST CLEANUP

**Objetivo:** Auditar todas las rutas, identificar duplicados y fantasmas, y definir UNA ruta canónica por concepto. Las rutas candidatas a eliminación se marcan como PROPONER DEPRECAR — no se borran.

**Contexto del problema:**
- `/admin/knowledge-base` es un redirect pero `/admin/knowledge-base/graph` tiene código vivo.
- `/admin/my-documents` y `/admin/knowledge/my-docs` son dos rutas para documentos personales.
- `/admin/knowledge-assets` es un redirect legacy sin valor claro.
- Existen rutas de administración que no aparecen en el sidebar (`/admin/analytics`, `/admin/api-docs`).
- `/admin/tasks` y `/admin/workflow-tasks` son dos módulos de tareas con propósitos solapados.
- `/admin/cases` solo tiene `[id]` pero no tiene page de hub.
- `/admin/workshop` está vacío (sin `page.tsx`).
- Total: 35 subdirectorios bajo `/admin`, varios con problemas de coherencia.

**Tareas:**
- [ ] **218.1: Inventario exhaustivo de rutas**: Listar TODAS las `page.tsx` del proyecto con su propósito. Clasificar cada una como: CANÓNICA, REDIRECT, PROPONER DEPRECAR, o EVALUAR.
- [ ] **218.2: Evaluar `/admin/knowledge-base/graph`**: ¿Es idéntico a `/graphs`? Si sí → redirect. Si tiene funcionalidad única → documentar y mantener.
- [ ] **218.3: Resolver dualidad de documentos personales**: Decidir si la ruta canónica es `/admin/my-documents` o `/admin/knowledge/my-docs`. La no-canónica se marca PROPONER DEPRECAR.
- [ ] **218.4: Evaluar `/admin/knowledge-assets`**: Verificar si el redirect funciona y si hay links que apuntan a ella. Si es totalmente inerte → marcar PROPONER DEPRECAR.
- [ ] **218.5: Auditar rutas sin sidebar**: Verificar `/admin/analytics`, `/admin/api-docs`, `/admin/api-keys`, `/admin/cases` — ¿están en navegación? ¿tienen funcionalidad real? Documentar decisión.
- [ ] **218.6: Evaluar dualidad de tareas**: `/admin/tasks` (tareas de negocio) vs `/admin/workflow-tasks` (orquestación técnica). ¿Son conceptos distintos o duplicados? Si distintos → documentar la frontera. Si solapados → unificar.
- [ ] **218.7: Actualizar `map.md`** con el resultado final. Verificar que el diagrama Mermaid coincida 1:1 con las rutas reales.

**Criterio de aceptación:** Cada ruta tiene un estado documentado (CANÓNICA/REDIRECT/PROPONER DEPRECAR). `map.md` refleja la realidad al 100%.

---

#### 🚢 FASE 219: FAKE DATA PURGE & MODULE UNIFICATION

**Objetivo:** Identificar TODOS los módulos con datos fake/hardcoded y conectarlos a APIs reales. Unificar las islas de soporte en un módulo coherente.

**Contexto del problema:**
- `/support-dashboard` = Dashboard de KPIs con **datos 100% fake** (hardcoded: 145 tickets, 98.4% SLA, 94.1% IA).
- `/admin/workflow-tasks` = stats de tareas con **datos 100% fake** (hardcoded: 12 pending, 5 in review, 28 completed, 45m avg).
- `/support` = Portal de cliente con tickets + búsqueda IA. Conectado a API. ✅
- `/admin/support` = Panel admin con lista/detalle de tickets. Conectado a API. ✅
- Pueden existir más módulos con datos fake no detectados aún.

**Tareas:**
- [ ] **219.1: Scan de datos fake en TODA la app**: Buscar patterns de datos hardcoded (`value="12"`, `"98.4%"`, etc.) en archivos `.tsx` bajo `src/app`. Documentar cada hallazgo.
- [ ] **219.2: Conectar `/support-dashboard` a datos reales**: Crear endpoint `/api/support/stats` que devuelva KPIs reales desde MongoDB.
- [ ] **219.3: Conectar `/admin/workflow-tasks` a datos reales**: Las stats (pending, in review, completed, avg time) deben venir del endpoint `/api/admin/workflow-tasks` con un `?stats=true` query.
- [ ] **219.4: Definir estrategia de vistas por rol en Soporte**: El usuario final ve `/support` (crear ticket, buscar). El admin ve todo + KPIs.
- [ ] **219.5: Integrar dashboard en `/support`**: Mover KPIs de `/support-dashboard` como tab/sección dentro de `/support`, visible solo para ADMIN/SUPPORT_STAFF.
- [ ] **219.6: Evaluar `/admin/support`**: ¿Es redundante con la vista admin de `/support`? Si sí → redirect. Si no → documentar diferencia.
- [ ] **219.7: Marcar `/support-dashboard` como PROPONER DEPRECAR**: Una vez integrado en `/support`, marcar ruta antigua.
- [ ] **219.8: i18n Audit del módulo**: Verificar que "Centro de Soporte", "Tickets Activos", "Mis Tareas", "Nueva Tarea" usen `useTranslations`.

**Criterio de aceptación:** Zero datos fake en producción. Cada número visible viene de una API con datos reales de MongoDB.

---

#### 🔐 FASE 220: PERMISSION SYSTEM ALIGNMENT

**Objetivo:** Unificar el sistema de permisos para que Guardian V3 (ABAC) y el sidebar (roles simples) usen la misma fuente de verdad.

**Contexto del problema:**
- `navigation.ts` filtra elementos con `item.roles.includes(userRole)` — array estático.
- `GuardianEngine` evalúa políticas ABAC con herencia de grupos y condiciones.
- Un usuario puede ver un enlace pero ser rechazado por Guardian, o viceversa.

**Tareas:**
- [ ] **220.1: Crear hook `useGuardianAccess(resource, action)`**: Un hook React que consulte un endpoint ligero o un cache de políticas para determinar si el usuario tiene acceso.
- [ ] **220.2: Migrar `navigation.ts` a Guardian**: Reemplazar `item.roles` por `item.resource` + `item.action`. El sidebar consulta `useGuardianAccess` para cada item.
- [ ] **220.3: Fallback gradual**: Durante la migración, mantener el check por roles como fallback si Guardian no responde. Log de discrepancias.
- [ ] **220.4: PROPONER DEPRECAR `roles[]` de MenuItem**: Una vez migrado y verificado, marcar el campo `roles` como deprecated en `navigation.ts`. No eliminar hasta confirmar estabilidad.
- [ ] **220.5: Documentar la Matriz de Permisos**: Crear una tabla en `docs/permissions-matrix.md` con todos los recursos y acciones definidos.

**Criterio de aceptación:** Si Guardian dice NO, el sidebar no muestra el enlace. Si Guardian dice SÍ, el enlace aparece. Una sola fuente de verdad.

---

#### 🗂️ FASE 221: APP REGISTRY & ROUTE GROUP REALIGNMENT

**Objetivo:** Alinear el App Registry (5 apps con basePath) con los route groups reales de Next.js para que `getAppByPath()` funcione correctamente.

**Contexto del problema:**
- `OPERATIONS.basePath = '/ops/reports'` pero esa ruta no existe como page.
- `CONFIG.basePath = '/admin/permissions'` que es solo un subpath, no una app.
- `TECHNICAL.basePath = '/technical'` pero las rutas reales son `/entities` y `/graphs`.
- `getAppByPath()` hace `startsWith` sobre estos basePaths, causando matches incorrectos.

**Tareas:**
- [ ] **221.1: Redefinir basePaths reales**: TECHNICAL → `/entities` | SUPPORT → `/support` | OPERATIONS → `/admin/operations` | CONFIG → `/admin/settings` | PERSONAL → `/spaces`.
- [ ] **221.2: Multi-basePath support**: Modificar `AppDefinition` para soportar un array de `basePaths` en vez de un solo string. TECHNICAL matchea `/entities` y `/graphs`. CONFIG matchea `/admin/settings`, `/admin/permissions`, `/admin/billing`.
- [ ] **221.3: Actualizar `getAppByPath()`**: Recorrer el array de basePaths para cada app.
- [ ] **221.4: Verificar CommandMenu**: El menú de comandos usa el app activo para priorizar resultados. Verificar que funcione con los nuevos basePaths.
- [ ] **221.5: Verificar sidebar filtering**: `useNavigation()` filtra secciones por `section.appId`. Verificar coherencia después del cambio.

**Criterio de aceptación:** `getAppByPath('/admin/operations/logs')` devuelve OPERATIONS. `getAppByPath('/entities')` devuelve TECHNICAL. Sin falsos positivos.

---

#### 📦 FASE 222: SERVICE LAYER CONSOLIDATION

**Objetivo:** Reducir el sprawl de `src/lib` (127+ archivos) y `src/services` (15 directorios) eliminando duplicados, moviendo deprecated y organizando por dominio.

**Contexto del problema:**
- `src/lib` tiene 127+ archivos planos sin organización por dominio.
- `src/services/deprecated` y `src/services/pendientes` contienen código abandonado.
- `src/core` tiene 8 subdirectorios que solapan con `src/services`.
- Hay dos GuardianService: `src/lib/guardian-service.ts` (re-export) y `src/services/security/guardian-service.ts` (real).

**Tareas:**
- [ ] **222.1: EVALUAR `src/services/deprecated`**: Verificar que nada lo importa. Si tiene código reutilizable, moverlo. Si es inerte → marcar PROPONER DEPRECAR.
- [ ] **222.2: EVALUAR `src/services/pendientes`**: Si `graph-rag` es código futuro, documentar y decidir si vive en un branch o se mantiene con marca de `PENDING`.
- [ ] **222.3: Consolidar re-exports en `src/lib`**: Identificar archivos que son solo `export { X } from '...'`. Si no añaden valor como fachada, marcar como PROPONER DEPRECAR.
- [ ] **222.4: Organizar `src/lib` por subdirectorios**: Agrupar los 127 archivos en carpetas lógicas: `lib/auth/`, `lib/billing/`, `lib/rag/`, `lib/support/`, etc.
- [ ] **222.5: Resolver solapamiento `src/core` vs `src/services`**: Definir que `src/core` contiene engines y lógica pura, `src/services` contiene orquestación con IO. Documentar la frontera.
- [ ] **222.6: Eliminar `console.log` de APIs**: Auditar las 7 rutas API con `console.log` residual. Reemplazar por `logEvento()`.

**Criterio de aceptación:** `src/services/deprecated` y `pendientes` no existen. `src/lib` tiene subdirectorios lógicos. Zero `console.log` en `src/app/api`.

---

#### 🧩 FASE 222B: UI DRY COMPONENT EXTRACTION

**Objetivo:** Eliminar código duplicado a nivel de componentes UI. Extraer piezas reutilizables y estandarizar patrones de data fetching.

**Contexto del problema:**
- Billing, Operations y Security tienen el mismo patrón "Hub Page" (array de secciones → grid de Cards) reimplementado 3 veces con diferencias mínimas.
- `StatSimple` (inline en workflow-tasks, 15 líneas con `: any`) hace lo mismo que `MetricCard` (componente estándar en `src/components/ui`).
- `superadmin/page.tsx` es un monolito de 489 líneas con 5 widgets que podrían ser componentes independientes.
- `notifications/page.tsx` no usa `<PageContainer>` ni `<PageHeader>` — layout inconsistente.
- `intelligence/trends` usa `useEffect + fetch` manual en vez del hook estándar `useApiItem`.
- `notifications/page.tsx` hace `connectDB()` directo sin service layer.
- **Referencia DRY detallada**: [implementation_plan.md](file:///C:/Users/ajaba/.gemini/antigravity/brain/a189174c-2cf4-40c8-90e7-6907ec477156/implementation_plan.md)

**Tareas:**
- [ ] **222B.1: Crear `<HubPage>`**: Componente genérico que recibe `sections[]` con `{title, description, href, icon, color, isActive}`. Migrar Billing, Operations y Security a usarlo. Cada página queda en ~15 líneas.
- [ ] **222B.2: Eliminar `StatSimple` inline**: Reemplazar en `workflow-tasks/page.tsx` por `MetricCard` estándar de `@/components/ui`. Eliminar la función inline con `: any`.
- [ ] **222B.3: Descomponer Superadmin**: Extraer `FinancialsCard`, `AnomaliesWidget`, `InfraCard`, `EvolutionDashboard` como componentes independientes bajo `src/components/admin/superadmin/`. La página queda en ~40 líneas.
- [ ] **222B.4: Estandarizar layout de Notifications**: Migrar `notifications/page.tsx` a usar `<PageContainer>` + `<PageHeader>` en vez de `<h1>` + `<div>` manual.
- [ ] **222B.5: Migrar intelligence/trends a `useApiItem`**: Reemplazar el patrón `useEffect + fetch + useState` por el hook estándar. Eliminar `console.error` residual.
- [ ] **222B.6: Service layer para Notifications**: Crear `NotificationService.getStats()` y `NotificationService.getRecent()` para encapsular las queries directas a `connectDB()`.

**Criterio de aceptación:** Zero `StatSimple` inline. Las 3 Hub Pages usan `<HubPage>`. Superadmin tiene ≤60 líneas. Todos los client components usan `useApiItem`/`useApiList`.

---

#### 🌐 FASE 223: i18n HARDCODE PURGE

**Objetivo:** Eliminar TODOS los strings hardcodeados en español/inglés de componentes y páginas. Todo texto visible debe pasar por `useTranslations()`.

**Contexto del problema:**
- `RagQualityDashboard.tsx` tiene "Análisis Críticos", "Evolución de Calidad", "Atención Técnica Requerida" hardcoded.
- `support-dashboard` tiene "Centro de Soporte", "Tickets Activos", "Cumplimiento SLA" hardcoded.
- Múltiples componentes en `src/components/admin` tienen mezcla de i18n y hardcode.

**Tareas:**
- [ ] **223.1: Scan automático de hardcode**: Ejecutar un script/grep que busque strings en español dentro de archivos `.tsx` que NO estén en archivos de traducción.
- [ ] **223.2: Fase 1 — Componentes Admin**: Purgar hardcodes en `RagQualityDashboard`, `SupportDashboard`, y todos los componentes bajo `src/components/admin`.
- [ ] **223.3: Fase 2 — Páginas Root**: Purgar hardcodes en páginas bajo `src/app/(authenticated)` que no sean admin.
- [ ] **223.4: Fase 3 — Componentes Shared**: Auditar `src/components/shared` y `src/components/ui` para hardcodes.
- [ ] **223.5: Sync diccionarios ES/EN**: Verificar que para cada key en `messages/es/*.json` existe su equivalente en `messages/en/*.json` y viceversa.
- [ ] **223.6: Usar skill `i18n-a11y-auditor`**: Ejecutar la auditoría completa sobre todas las páginas modificadas.

**Criterio de aceptación:** Zero strings en español/inglés fuera de archivos JSON de traducción. Cambiar locale de ES a EN muestra la UI completa en inglés.

---

#### 🏗️ FASE 224: VERTICAL ARCHITECTURE CLEANUP

**Objetivo:** Dar coherencia a la estructura de verticales (`src/verticals`) para que sea un sistema preparado pero no confuso. Las verticales vacías no deben fingir funcionalidad.

**Contexto del problema:**
- Solo `elevators/` tiene componentes funcionales (11 archivos).
- `banking/`, `insurance/`, `legal/`, `real-estate/` solo tienen `config.ts` + un template vacío.
- El `DomainRouter` clasifica queries en 6 industrias pero solo Elevators tiene UI.
- No hay documentación de cómo añadir una vertical.

**Tareas:**
- [ ] **224.1: Estandarizar estructura de vertical**: Definir el contrato mínimo: `config.ts` + `templates/` + `components/` (opcional). Documentar en `docs/vertical-guide.md`.
- [ ] **224.2: Evaluar verticales placeholder**: Si `banking/templates/` solo tiene un archivo esqueleto, documentar que es placeholder. No eliminar si `config.ts` define el contrato.
- [ ] **224.3: Validar DomainRouter fallback**: Asegurar que si una query se clasifica como BANKING pero no hay componentes, el sistema usa el flujo GENERIC sin error.
- [ ] **224.4: Unificar con EntityEngine**: Verificar que la ontología (`elevators.json`) y el `EntityEngine` son extensibles a otras industrias. Documentar el patrón.
- [ ] **224.5: Mover `real-estate/CausalFlow` a shared si es genérico**: Si el componente CausalFlow no es específico de real-estate, moverlo a `src/components/shared`.

**Criterio de aceptación:** Las carpetas de verticales vacías solo tienen `config.ts`. Existe `docs/vertical-guide.md` que explica cómo añadir una industria.

---

#### 🧪 FASE 225: COHERENCE VERIFICATION & SKILL ADAPTATION

**Objetivo:** Verificar que toda la consolidación de ERA 8 funciona end-to-end. Actualizar las skills de desarrollo para que reflejen la nueva realidad arquitectónica y no causen regresiones.

**Tareas:**
- [ ] **225.1: Build + Test completo**: Ejecutar `npm run build` y verificar zero errores TypeScript. Ejecutar test suites existentes.
- [ ] **225.2: Auditar skills existentes**: Revisar CADA skill en `.agent/skills/` para verificar que sus instrucciones no referencian rutas, patrones o servicios eliminados/movidos.
- [ ] **225.3: Actualizar `project-context-loader`**: Reflejar la nueva organización de `src/lib`, `src/services` y `src/core`.
- [ ] **225.4: Actualizar `guardian-auditor`**: Adaptar a la nueva integración sidebar-Guardian (FASE 220).
- [ ] **225.5: Actualizar `code-quality-auditor`**: Añadir regla de "zero console.log en APIs" y "zero hardcode i18n".
- [ ] **225.6: Actualizar `hub-dashboard-architect`**: Reflejar las rutas canónicas post-deduplicación (FASE 218).
- [ ] **225.7: Smoke test visual**: Navegar por TODAS las rutas del sidebar y verificar que no hay páginas rotas, redirects infinitos o datos fake.
- [ ] **225.8: Actualizar `README.md` y `map.md`**: Reflejar ERA 8 como completada con la versión v6.0.0.
