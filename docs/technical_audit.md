# Technical Audit Report & Refactoring Plan - ABD RAG Platform

## 📋 Resumen Ejecutivo
Tras una auditoría técnica profunda del repositorio, se confirman hallazgos críticos de seguridad y deuda técnica estructural. Aunque la plataforma ya aplica patrones modernos (Next.js 15, Server Components, Parallel Fetching), existen áreas de riesgo en el Middleware y en la tipado estricto de servicios Core.

---

## 🔴 Análisis de Hallazgos Críticos

### 1. Seguridad: Exposición en Logs y Validación de Host
- **Hallazgo**: `middleware.ts:L372` utiliza `console.error` con errores crudos de validación de API Keys, pudiendo exponer secretos en logs.
- **Redundancia**: La validación de `Host` se realiza en dos bloques distintos (`L45-67` y `L94-116`), aumentando el riesgo de bypass por inconsistencia.
- **Blindaje**: Falta sanitización estructurada en el bloque `catch` final del middleware.

### 2. Arquitectura: Violación de SRP en Middleware
- **Hallazgo**: El archivo `middleware.ts` excede las 480 líneas, gestionando Auth, Rate Limit, CORS, CSRF, API Keys y Security Headers en un solo bloque.
- **Riesgo**: Alta probabilidad de introducir bugs durante actualizaciones de versiones de Next.js o NextAuth.

### 3. Deuda TypeScript (ERA 8 & 12)
- **Hallazgo**: Uso excesivo de `: any` y casts manuales en `PromptsHubClient.tsx` y `DashboardService.ts` (especialmente en accesos a `unsecureRawCollection`).
- **Hallazgo**: `AdminPromptsPage:L28` envía una promesa con un cast `as any`, rompiendo la cadena de tipado estricto.

### 4. Performance & DX
- **Estado Actual**: Se ha verificado que `AdminDashboardPage` YA utiliza `Promise.all` (Fase 457), mitigando waterfalls en dashboards principales.
- **Mejora**: Falta estandarización de TanStack Query para fetch de lado cliente, conviviendo hooks custom (`useApiList`) con lógica de `use(promise)` de React 19 de forma inconsistente.

---

## 🛠️ Plan de Integración (Propuesta)

### P0: Seguridad Inmediata (Fase 601)
- [ ] **Middleware Split**: Refactorizar `middleware.ts` en submódulos: `auth`, `securityHeaders`, `apiValidation`, `rateLimit`.
- [ ] **Secure Logging**: Implementar `logEvento` con sanitización estricta en todos los bloques `catch` del middleware.
- [ ] **Host Header Consolidation**: Unificar la lógica de validación de dominios permitidos.

### P1: TypeScript & Clean Data Layer (Fase 602)
- [ ] **Branded ID Hardening**: Eliminar casts `as any` en `PromptsHub` y definir interfaces completas para `PromptWithInfo`.
- [ ] **Database Access Abstraction**: Crear métodos tipados en `BaseRepository` para evitar llamadas directas a `unsecureRawCollection` con casts.

### P2: DX & Monitoring (Fase 603)
- [ ] **SLA Monitoring Expansion**: Extender el tracking de latencia a todos los hooks de datos.
- [ ] **Documentation Update**: Generar JSDoc para los servicios refactorizados y actualizar `map.md`.

---

## 🗺️ Actualización del Roadmap
Se propone insertar la **ERA 19: Security Consolidation & Clean Architecture** para abordar estos puntos de manera sistemática.

| Fase | Tarea | Impacto | PRIORIDAD |
|------|-------|---------|-----------|
| 601  | Middleware Isolation (SRP) | Estabilidad & Seguridad | P0 |
| 602  | Type Safety Hardening (AI Hub) | Mantenibilidad | P1 |
| 603  | Standardized Query Layer | Performance | P2 |

---
**Auditado por:** Antigravity (IA)
**Fecha:** 16 de Marzo, 2026
**Referencia de Skill:** `roadmap-architect-analyst`
