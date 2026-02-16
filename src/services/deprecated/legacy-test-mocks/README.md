# Legacy Test Mocks & Deprecated Services

**Status:** Deprecated / Unused  
**Moved:** 2026-02-10  
**Original Location:** `src/services/`

---

## 📁 Files in This Folder

1. **`ingest-worker-service.ts`** - BullMQ queue management (replaced by `lib/workers/ingest-worker.ts`)
2. **`mock-checklist-service.ts`** - Mock LLM responses for testing (unused)

---

## 🗑️ Why Deprecated?

### 1. `ingest-worker-service.ts`

**Original Purpose:** BullMQ queue initialization for async ingestion

**Why Deprecated:**
- ❌ **Not imported anywhere** in the codebase
- ✅ **Replaced by:** `lib/workers/ingest-worker.ts` (active implementation)
- ✅ **Current Queue:** `lib/queue-service.ts` (centralized queue management)

**Migration Path:** Code was refactored into modular workers in `lib/workers/`

---

### 2. `mock-checklist-service.ts`

**Original Purpose:** Mock LLM caller for checklist extraction tests

**Why Deprecated:**
- ❌ **Not imported anywhere** in the codebase
- ✅ **Testing Strategy Changed:** Using real Gemini API in test environment
- 📍 **Related:** `lib/checklist-extractor.ts` (production implementation)

**Note:** Mock was useful during initial development but abandoned in favor of integration tests with real LLM

---

## 🔄 Restoration (If Needed)

If you need to restore these files for any reason:

```bash
# Move back to services/
mv src/services/pendientes/legacy-test-mocks/*.ts src/services/

# Re-import in consuming files
# (search codebase for previous import locations)
```

---

## 🗑️ Safe to Delete?

**YES** - These files can be safely deleted if:
- No one remembers why they exist
- Git history preserves them for reference
- Disk space cleanup is needed

**Recommendation:** Keep for 3-6 months, then delete if no one restores them.

---

## 📝 Notes

- These were likely created during early development phases
- Superseded by current architecture
- Kept here for historical reference only
