# ADR 001: Standardization of Loading States

## Status
Accepted (Phase Remediation)

## Context
Multiple components were using ad-hoc loading indicators (e.g., raw `Loader2` from lucide-react, simple `div` placeholders). this led to an inconsistent UX and made it difficult to manage accessibility (aria-live regions, etc.) globally.

## Decision
We decided to implement a centralized `LoadingState` component in `src/components/shared/LoadingState.tsx`. All ad-hoc loaders and `Suspense` fallbacks must migrate to this component.

### Guidelines:
- Use for full-page loading.
- Use for skeleton-like placeholders in hubs.
- Use within buttons during async actions.

## Consequences
- Unified visual language for loading.
- Centralized point for accessibility improvements.
- Slightly higher bundle size for the shared component, but offset by removal of duplicated skeleton logic.
