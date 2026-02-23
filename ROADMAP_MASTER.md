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
- **Recent Ship**: **FASE 198: POST-INGESTION ENRICHMENT**, FASE 213: PLATFORM OBSERVABILITY HUB, FASE 210: LLM CORE & PROMPT GOVERNANCE, FASE 201: OBSERVABILITY & AUDIT HUB.
- **Project Status**: **Modular Industrial Suite Transition (v5.2.0-beta).**
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
 
**Status:** `[PLANNED 🚀]` | **Prioridad:** MEDIA | **Estimación:** 1 semana
 
- [ ] **LLM Core Tests**: Suite de tests para `PromptRunner` (utilizando mocks de Gemini) y `LlmJsonParser`.
- [ ] **Repository Tests**: Cobertura de tests para `BaseRepository` y repositorios clave (`TechnicalEntity`, `Tickets`).
- [ ] **Isolation Audit**: Tests automatizados para verificar el aislamiento estricto de `tenantId` en la capa de datos.
