# Bridge & Stub Audit - Symphony ERA 9

This document tracks legacy compatibility bridges and stubs that need to be maintained or eventually removed.

## Current Bridges

| Bridge Name | Status | Location | Rationale |
|-------------|--------|----------|-----------|
| `@abd/platform-core` | **KEEP** | `packages/platform-core` | Core shared logic between RAG and other modules. |
| `@abd/workflow-engine` | **KEEP** | `packages/workflow-engine` | De-coupled workflow logic. |
| `@abd/rag-engine` | **KEEP** | `packages/rag-engine` | De-coupled RAG logic. |
| `pdf-bridge` | **REMOVE** | `app/(public)/features/pdf-bridge` | Demo-only bridge, needs decommissioning in ERA 9 final. |

## Stubs & Mocks

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| `JobSchedulerService` | **CONSOLIDATE** | `src/services/ops/IntelligenceWorker.ts` | Currently a simplified wrapper around Cron/BullMQ. Needs unification with `@abd/workflow`. |
| `SimpleQueue` | **TEMP** | `src/services/ops/simple-queue/` | Prototype for low-resource environments. Use BullMQ in production. |
| `AuditLogBridge` | **KEEP** | `src/lib/schemas/audit-logs.ts` | Compatibility with legacy audit structures from v4.x. |

## Guidelines for New Code
- **DO NOT** add new re-exports to existing bridges.
- **DO NOT** use `SimpleQueue` for banking-grade or critical tasks.
- **ALWAYS** use `logEvento` for tracing instead of local console mocks.
