# Re-application Plan: Post-Restoration Fixes

## 📥 Context
The user is manually restoring the codebase from `GIT-BACK` to recover missing files (like the full `prompts.ts` and `db-tenant.ts`). Since the backup is slightly older, it will overwrite the recent build fixes we implemented.

**Objective:** Once the user restores the files, we must re-apply the following fixes to achieve a **Clean Build** again.

## 🛠️ Fixes to Re-apply

### 1. Build Configuration
- [ ] **`tsconfig.json`**: Ensure no BOM/encoding issues (User's restore might bring back a clean version, but we verify).

### 2. Schema & Config
- [ ] **`src/lib/schemas.ts`**: Add `reportConfig` to `TenantConfigSchema`.
- [ ] **`src/lib/rate-limit.ts`**: Add `SANDBOX` limit constant.
- [ ] **`src/lib/schemas/workshop.ts`**: Fix `z.record()` syntax to `z.record(z.string(), z.any())`.

### 3. Core Logic & Types
- [ ] **`src/lib/limits-service.ts`**: Fix `TenantSubscription` type casting.
- [ ] **`src/core/application/use-cases/ExecuteIngestionAnalysisUseCase.ts`**:
    - Rename `sizeBytes` -> `fileSize`.
    - Remove `environment` and `contextHeader` params.
    - Restore audit log default call.

### 4. API & UI
- [ ] **`src/app/api/admin/ingest/jobs/route.ts`**: Add `[status as any]` cast.
- [ ] **`src/components/admin/knowledge/KnowledgeAssetsManager.tsx`**: Change `color="primary"` to `color="blue"`.
- [ ] **`src/components/landing/ROICalculator.tsx`**: Rename `description` prop to `subtitle`.

## 🚀 Execution Strategy
1. **User Action**: Copy content from `GIT-BACK` to `src` (and `tsconfig.json`).
2. **AI Action**: Sequentially apply the diffs for the above items.
3. **Verification**: Run `npx tsc --noEmit`.
