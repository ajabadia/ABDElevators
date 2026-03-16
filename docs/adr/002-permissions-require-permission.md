# ADR 002: Uniform Permission Checks

## Status
Accepted (Phase Remediation)

## Context
Authorization checks were scattered across server actions and API routes using variety of patterns (e.g., checking `session.user.role` manually). This was error-prone and made it difficult to audit the permission model (Guardian V3).

## Decision
We adopted `requirePermission` (from `@/lib/auth-utils` or core platform) as the mandatory pattern for authorization in the server layer.

### Pattern:
```typescript
await requirePermission('perm:action', session?.user?.tenantId);
```

## Consequences
- Guaranteed consistency with the Guardian system.
- Easier to audit: grep for `requirePermission` reveals the entire security surface.
- Automatic handling of tenant isolation and missing sessions.
