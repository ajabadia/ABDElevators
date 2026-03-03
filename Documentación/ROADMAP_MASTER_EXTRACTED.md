================================================================================
# ROADMAP_MASTER – Source of Truth for ABD RAG Platform (Unified v5.0.0-alpha - SUITE ERA)

## 📖 Overview

---

- **Status & Metrics (v4.7.7 - CAUSAL ERA)**
- **Global Progress:** 100% (Architecture Pivot complete).
- **Industrialization Progress:** 100% (Phases 101-165 COMPLETED ✅).
- **Vertical Industry Support:** ✅ **FASE 98 COMPLETED** - Infrastructure & Synthetic Data for Legal, Banking, Insurance.
- **UX Transformation:** 100% (Phase 96 COMPLETE, Phase 125 COMPLETED, Phase 155 COMPLETED ✅).
- **Enterprise SaaS Ready:** 100% (Phase 132 COMPLETED ✅).
- **Core Status:** ✅ **RESOLVED** - Ingestion Pipeline Cloudinary Decoupling Complete (Phase 131 COMPLETED)
- **Recent Ship:** **FASE 181: Physical Package Extraction (Platform Core)**, FASE 160: Automated Report Delivery, FASE 176: Strategic Audit Implementation.
- **Project Status:** **Industrial Multi-product Suite (v5.0.0-alpha - Architectural Pivot).**
- **Critical Issue:** ✅ PHASE 181 RESOLVED - Platform Core Isolation & Stabilization.
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

- [🅿️] **Delivery Automático**: Envío programado de informes por email. *(PARKING: No existe infraestructura de email — requiere integrar Resend/SendGrid primero)*

### 📦 ERA 5: SUITE EVOLUCION & INDUSTRIAL PLATFORM SHELL (VISION 2026-2027)

**Objetivo:** Transformar la plataforma en un cascarón industrial reutilizable capaz de soportar múltiples productos.
**Referencia:** [Doc 2110_suite_evolution.md](file:///d:/desarrollos/ABDElevators/Documentación/21/2110_suite_evolution.md)

#### 🏗️ FASE 180: MONOREPO FOUNDATION & NAMESPACE ALIASING

**Status:** `[PLANNED 🚀]`

- [ ] **Workspaces Setup**: Migrar a PNPM Workspaces o Turborepo (apps/rag-app, packages/*).
- [ ] **Strategic Aliasing**: Configurar `tsconfig.base.json` con paths `@abd/platform-core/*`, `@abd/ui/*`, `@abd/workflow/*`, `@abd/rag/*`.
- [ ] **Shared Configs**: Extraer `eslint-config-custom`, `tailwind-config-base` y `tsconfig-base` a `/config`.
- [ ] **Build Pipeline**: Asegurar compilación incremental de paquetes mediante Turbo/Pnpm.

#### 🧩 FASE 181: PLATFORM-CORE & UI-KIT EXTRACTION

**Status:** `[COMPLETADO ✅]`

- [X] **Auth Package**: Mover NextAuth, MFA flows y middleware helpers a `platform-core/auth`.
- [X] **DB & Logging Package**: Centralizar `SecureCollection`, `logEvento` y `SLAInterceptors` en `platform-core/db` y `logging`.
- [ ] **UI Component Library**: Extraer componentes Shadcn, layouts base y themes a `ui-kit`.
- [ ] **Shared Hooks**: Desacoplar `useApiItem`, `useApiState` y `useOnboarding` del dominio RAG.
- [X] **Governance Registry**: Mover `PromptService` y `UsageService` a `platform-core`. (Schemas migrated)

#### 🧠 FASE 182: DOMAIN DECOUPLING (RAG vs WORKFLOW)

**Status:** `[PLANNED 🚀]`

- [ ] **Workflow Engine Separation**: Mover `CaseWorkflowEngine` y `AIWorkflowEngine` a `workflow-engine`, eliminando alias a `ELEVATORS`.
- [ ] **HITL Task Management**: Independizar el servicio de tareas humanas de las entidades de RAG.
- [ ] **RAG Vertical Package**: Aislar ingesta, chunking (`KnowledgeAsset`) y retrieval en `rag-engine`.
- [ ] **Constants Cleanup**: Reemplazar `industry: ELEVATORS` por configuraciones inyectadas vía `TenantConfig`.

#### 🛡️ FASE 183: SECURITY HARDENING & INTERNAL GATEWAY

**Status:** `[PLANNED 🚀]`

- [ ] **Internal Gateway**: Implementar IP allow-listing y rotación automática de secretos para rutas de servicios internos.
- [ ] **Centralized Logger**: Homogeneizar todos los logs de plataforma evitando leaks en producción.
- [ ] **DB Access Consolidation**: Auditoría final de `SecureCollection` para prohibir accesos raw.

#### 🎮 FASE 184: SUITE FEATURES & NEXT-GEN UTILITIES (REF: 2502.txt)

**Status:** `[PLANNED 🚀]`

- [ ] **Feature Flag Service**: Sistema `isEnabled(tenantId, flag)` con persistencia en DB y soporte en Middleware.
- [ ] **Module & Licensing Registry**: Catálogo de módulos (RAG, Workflow, Billing) con tiers (Free/Pro/Enterprise) vinculados a límites.
- [ ] **Job Scheduler Multi-tenant**: Generalización de cron jobs para tareas periódicas (re-index, reportes, limpiezas).
- [ ] **Form & Checklist Builder**: Extender `ChecklistConfig` con UI para crear campos dinámicos y reglas de validación.
- [ ] **Universal Notification Hub**: Unificación de Toasts, Emails y Webhooks con colecciones dedicadas.
- [ ] **AI Model Manager**: Configuración por tenant de LLM (Gemini/otros), temperatura, top-p y políticas de redacción.
- [ ] **Model Evaluation Dataset**: Herramientas para cargar QA datasets y ejecutar benchmarks batch de calidad RAG.
- [ ] **Platform Ops Dashboard**: Dashboard para SuperAdmin con errores por endpoint, SLA violations y colas de procesos.
- [ ] **Secure Loupe Inspector**: Buscador global para SuperAdmin con redacción automática de datos PII.
- [ ] **Industrial Migration Tool**: Estandarización de scripts `up()` / `down()` con registro de ejecución en DB.

*Updated on 2026-02-18 by Antigravity v5.0.0-alpha (Strategic Proposal for Suite Evolution Integrated ✅)*

================================================================================
FILE: .\start_app.bat
================================================================================
@echo off
cls
echo ========================================
echo   ABD RAG Plataform System - Startup
echo ========================================
echo.

REM Verificar que existe .env.local
if not exist ".env.local" (
    echo [ERROR] No se encontro .env.local
    echo.
    echo Por favor crea el archivo .env.local con:
    echo   MONGODB_URI=tu_connection_string
    echo   GEMINI_API_KEY=tu_api_key
    echo   NEXTAUTH_URL=http://localhost:3000
    echo   NEXTAUTH_SECRET=tu_secret_generado
    echo.
    echo Presiona cualquier tecla para salir...
    pause >nul
    exit /b 1
)

REM Verificar que node_modules existe
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Fallo la instalacion de dependencias
        echo Presiona cualquier tecla para salir...
        pause >nul
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas correctamente
    echo.
)

echo [INFO] Verificando infraestructura local...
echo.

REM 1. Verificar Redis (Docker) - Non-blocking check
docker ps >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Docker detectado.
    docker ps -a -q -f name=abd-redis >nul 2>nul
    if %errorlevel% neq 0 (
        echo [INFO] Creando nuevo contenedor Redis 'abd-redis'...
        docker run -d --name abd-redis -p 6379:6379 redis:alpine >nul 2>nul
    ) else (
        echo [INFO] Asegurando que 'abd-redis' este iniciado...
        docker start abd-redis >nul 2>nul
    )
    echo [OK] Redis esta activo en el puerto 6379.
) else (
    echo [WARN] Docker no esta en ejecucion o no esta instalado.
    echo        Los Async Jobs podrian fallar si no hay un Redis local.
)
echo.

REM 2. Limpiar procesos en Puerto 3000 (Next.js)
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [INFO] Detectada instancia previa en puerto 3000. Limpiando para evitar conflictos...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    echo [OK] Puerto 3000 liberado.
)
echo.

REM 3. Iniciar Worker en ventana separada
echo [INFO] Iniciando Background Worker en ventana independiente...
start "ABD Worker" cmd /c "npx tsx src/lib/workers/ingest-worker.ts"

echo.
echo [OK] Todo listo. Iniciando frontend...
echo.
echo Servidor disponible en: http://localhost:3000
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

REM Usar call para que no se cierre la ventana si hay error
call npm run dev

REM Si npm run dev termina (por error o Ctrl+C), pausar antes de cerrar
echo.
echo.
echo El servidor se ha detenido. Un momento mientras cerramos los servicios...
docker stop abd-redis >nul 2>nul
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul

================================================================================
FILE: .\test-resolution.ts
================================================================================
import { IndustryTypeSchema } from './packages/platform-core/src/index';
console.log('✅ IndustryTypeSchema resolved:', IndustryTypeSchema !== undefined);

try {
    const { connectDB } = require('./packages/platform-core/src/server');
    console.log('✅ Server module resolved (CommonJS)');
} catch (e) {
    console.log('❌ Server module resolution failed (expected if ESM only)');
}

================================================================================
FILE: .\tsconfig.json
================================================================================
{
  "compilerOptions": {
    "baseUrl": ".",
    "types": [
      "jest",
      "node"
    ],
    "target": "ES2018",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./src/*"
      ],
      "@abd/platform-core": [
        "./packages/platform-core/src/index.ts"
      ],
      "@abd/platform-core/server": [
        "./packages/platform-core/src/server.ts"
      ],
      "@abd/platform-core/*": [
        "./packages/platform-core/src/*"
      ],
      "@abd/ui/*": [
        "./src/components/shared/*",
        "./src/components/ui/*"
      ],
      "@abd/workflow/*": [
        "./src/lib/workflow-engine/*",
        "./src/lib/workflow-orchestrator/*"
      ],
      "@abd/rag-engine/*": [
        "./src/lib/rag/*",
        "./src/lib/llm/*",
        "./src/lib/pdf-utils/*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": [
    "node_modules",
    "scripts",
    "src/scripts",
    "tests",
    "test-prompt-tester.ts",
    "jest.setup.ts",
    ".next",
    "GIT-BACK",
    "new"
  ]
}
================================================================================
FILE: .\vercel.json
================================================================================
{
    "crons": [
        {
            "path": "/api/cron/stuck-jobs",
            "schedule": "*/5 * * * *"
        },
        {
            "path": "/api/cron/scheduled-reports",
            "schedule": "0 7 * * *"
        }
    ]
}
