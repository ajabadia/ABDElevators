# Roadmap – Multi‑Industry Simulation Platform (Vision 2.0)

## ✅ Completed (as of 2026‑01‑22)

- **Dynamic Prompt Management**
  - Added Zod schemas for prompts (`PromptVariableSchema`, `PromptSchema`, `PromptVersionSchema`).
  - Implemented `PromptService` with CRUD, versioning, rendering, and audit logging.
  - Created API routes `/api/admin/prompts` and `/api/admin/prompts/[id]/versions` (admin‑only, structured logging).
  - Seed script `scripts/seed-prompts.ts` to populate default prompts for new tenants.
- **RiskAlerter UI Component**
  - Built reusable `RiskAlerter` component with severity styling and mitigation suggestions.
  - Integrated into `RagReportView` and passed risk data from `PedidosPage`.
- **Refactored Core Services for Stand‑alone Scripts**
  - Made `db.ts`, `llm.ts`, `db-tenant.ts` script‑friendly (lazy Gemini client init, proper env loading).
  - Fixed UUID generation and dotenv loading in `scripts/demo-legal-risk.ts`.
- **Improved Logging & Error Handling**
  - Consistent `logEvento` usage with correlation IDs across new services.
  - Switched to `AppError` subclasses for all thrown errors.
- **Documentation & Planning Artifacts**
  - Generated implementation plans, testing guides, risk engine design, and multi‑industry strategy documents.

## 📋 Upcoming (next sprint)

1. **Unit & Integration Tests**
   - Add Jest tests for `RiskService` (mock `PromptService` and `callGeminiMini`).
   - Add coverage for `PromptService` CRUD and rendering logic.
2. **Prompt Management UI**
   - Build `/admin/prompts` dashboard with Monaco editor, version history table, and rollback actions.
   - Implement client‑side validation (Zod) and server‑side enforcement.
3. **Audit Prompt Usage**
   - Log each `PromptService.renderPrompt` invocation, increment usage counters.
   - Expose admin view of most‑used prompts.
4. **Performance Verification**
   - Add timing middleware to measure LLM call latency; warn if > 2 s.
5. **Security Hardening**
   - Ensure all admin routes enforce role‑based access and rate‑limit (100 req/h).
6. **Documentation Refresh**
   - Update README with new prompt system architecture diagram.

## 🛠️ Unplanned Work Done

- Implemented **lazy initialization** of the Gemini client in `src/lib/llm.ts` to guarantee env vars are loaded before API key access.
- Added **seed‑prompts** script to automatically create baseline prompts for any new tenant, reducing manual setup.
- Refactored error handling in several services to use `AppError` subclasses, improving observability.

*Roadmap will be revisited each sprint to incorporate new priorities and adjust timelines.*
