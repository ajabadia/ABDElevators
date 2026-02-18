# Evolución a Suite Multi-Producto & Estructura Monorepo

## 1. Evaluación: ¿Sirve como base multi-producto?
Sí, gracias a los módulos de Auth, Middleware, Tenancy/RBAC, Auditoría y Prompt Governance.

## 2. Líneas de Mejora Estratégica

### 2.1. Núcleo de Plataforma
Agrupar en un "core" reutilizable:
- **Auth**: NextAuth, MFA, Middleware.
- **Tenant/RBAC**: Guardian, PermissionMatrix, Roles.
- **Observabilidad**: logEvento, UsageService, SLA Interceptors.
- **Prompt/LLM**: PromptService, WorkflowLLMNodeService.

### 2.2. Desacoplar Dominio RAG
- Evitar hardcoding de `industry: ELEVATORS`.
- Aislar `KnowledgeAsset` e ingesta en un módulo vertical.

## 3. Seguridad y Limpieza
- Centralizar logs (evitar `console.error` en producción).
- Proteger rutas internas con "Internal Gateway".
- Mover scripts experimentales fuera del build de producción.
- Consolidar el acceso a DB solo vía `SecureCollection`.

## 4. Funcionalidad de Suite
- **Feature Flags**: Colección por tenant y servicio común.
- **Catálogo de Módulos**: `ModuleRegistry` para activar RAG, Workflows, etc.
- **Product Shell**: Encapsular layout y branding.

## 5. Estructura Propuesta (Monorepo)
```text
apps/
  rag-app/           # ABD RAG
packages/
  platform-core/     # Auth, tenants, RBAC, logging, DB, prompts
  ui-kit/            # Componentes UI
  workflow-engine/   # Motor de workflows + HITL
  rag-engine/        # Ingesta, RAG, quality
  dev-tools/         # Scripts e i18n
```

## 6. Plan de Migración (Commit strategy)
1. **Commit 1**: Setup monorepo + aliases (sin mover código).
2. **Commit 2**: Refactor de imports a namespaces (`@abd/*`).
3. **Commit 3**: Extracción física de `platform-core` y `ui`.
4. **Commit 4**: Extracción de `workflow` y `rag` + limpieza final.
