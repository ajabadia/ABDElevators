# ADR 003: Testing Strategy

## Status
Proposed (Phase Remediation)

## Context
The application currently lacks a consistent test suite. While Jest and some base configurations exist, coverage is minimal and fragmented. We need a clear strategy to ensure long-term maintainability.

## Decision
We will adopt a multi-layered testing approach:

1. **Unit Testing (Vitest)**:
   - Faster execution and better ESM support compared to legacy Jest setup.
   - Focus on pure functions, validators, and business logic in `src/lib` and `src/services`.
   
2. **Integration Testing (Vitest/Supertest)**:
   - Validating API Route Handlers and database interactions.
   
3. **End-to-End Testing (Playwright)**:
   - High-level user flows (Ingestion, Analysis, User Management).
   - Validation of UI components in their final context.

## Consequences
- Developers must include tests for new business logic.
- CI pipelines will enforce a minimum coverage threshold (aiming for 80% on core services).
- Modernization of existing Jest tests to Vitest where appropriate.
