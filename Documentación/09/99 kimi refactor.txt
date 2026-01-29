Basándome en el análisis del código, identifico varias áreas críticas de mejora organizadas por impacto y tipo:
🔴 Crítico (Seguridad & Estabilidad)
1. Bypass de Seguridad en Middleware
En middleware.ts, el bloque catch permite el paso de requests si falla el middleware:
TypeScript
Copy
catch (error: any) {
    // ... logging ...
    return NextResponse.next(); // ⚠️ Permite bypass si hay error
}
Riesgo: Si hay un error en auth() o rateLimit, el atacante pasa directamente.
Fix: Retornar 500 o redirección a error, nunca next().
2. Falta de Transacciones Atómicas
Operaciones críticas como cambios de plan (billing/change-plan) o creación de usuarios no usan transacciones MongoDB. Si falla medio proceso, queda inconsistente.
Fix: Usar session.withTransaction() para operaciones multi-documento.
3. Validación CSRF Ausente
Las API routes no implementan validación CSRF tokens explícita (solo dependen de la cookie de sesión).
Fix: Implementar double-submit cookie pattern o headers personalizados para mutaciones.
🟠 Alto (Performance & Arquitectura)
4. Consultas N+1 en Listados
En DataTable y componentes de listado, se cargan todas las relaciones en loops (ej: prompts con tenantInfo usa Promise.all pero sin batching).
Fix: Implementar DataLoader pattern o agregaciones MongoDB con $lookup.
5. Ausencia de Caché Estratégica
No hay Redis/Upstash para:
Configuración de tenants (se consulta en cada request)
Plantillas de email
Taxonomías y metadatos estáticos
Impacto: Latencia innecesaria y costos de DB elevados.
6. Inconsistencia de Idiomas (Codebase)
Mezcla de español/inglés severa:
Variables: nombre_archivo vs fileName
Schemas: creado vs createdAt
APIs: /api/admin/documentos vs /api/billing/portal
Fix: Estandarizar a inglés para todo el código (mantener i18n para UI).
7. Manejo de Errores Inconsistente
Algunas rutas usan handleApiError, otras try/catch manual, otras AppError.
Fix: Middleware de errores unificado con formato RFC 7807 (Problem Details).
8. Falta de Rate Limiting Global
El rate limiting actual es por usuario autenticado, pero no hay protección contra:
Ataques de fuerza bruta a /api/auth/*
DDoS a endpoints públicos
Scraping de la landing
🟡 Medio (Deuda Técnica)
9. Uso Excesivo de any
Patrón repetido: const [state, setState] = useState<any>(null) y activity: any.
Impacto: Pérdida de type-safety, bugs en runtime.
10. Componentes God Object
Páginas como admin/tenants/page.tsx (>500 líneas) o pedidos/page.tsx mezclan:
Lógica de negocio
UI/Render
State management
Fix: Separar en hooks personalizados y sub-componentes.
11. Validación Parcial de Webhooks
Stripe webhook verifica firma pero no implementa idempotency keys ni verifica stripe-signature timestamp (anti-replay).
12. Falta de Soft Deletes
Los documentos (documentos_tecnicos) se borran físicamente (línea 88 en delete/route.ts implícito). No hay recuperación posible.
Fix: Campo deletedAt + índices filtrados.
13. Gestión de Imágenes Síncrona
Uploads a Cloudinary son síncronos en la request HTTP.
Fix: Cola de procesamiento (bullmq/upstash q) para heavy lifting.
🟢 Bajo (UX/DevEx)
14. Loading States Genéricos
Muchos componentes usan "Cargando..." en lugar de Skeletons específicos que eviten layout shift.
15. No hay Feature Flags
No existe sistema para activar/desactivar funcionalidades progresivamente (LaunchDarkly o similare).
16. Falta de OpenAPI/Swagger
La documentación debe mantenerse manualmente. Con Zod ya se podría generar automáticamente.
17. Monolitización del Frontend
Todo está en /app. Para escalar, considerar:
Micro-frontends por módulo (admin vs técnico)
Module Federation si crece el equipo
18. Observabilidad Limitada
No hay métricas de negocio (tiempo de análisis promedio, tasa de éxito RAG)
Faltan alertas automatizadas (PagerDuty/Slack webhooks)
No hay distributed tracing entre servicios
🔧 Recomendaciones Prioritarias (Roadmap 30-60-90 días)
30 días (Seguridad):
Fix del bypass en middleware
Implementar CSRF tokens
Agregar transacciones a billing y user creation
60 días (Performance):
4. Implementar Redis para tenant configs y prompts
5. Migrar uploads a colas asíncronas
6. Refactor de componentes grandes (>300 líneas)
90 días (Calidad):
7. Estandarizar nombres a inglés
8. Implementar soft deletes
9. Agregar test suite básica (Vitest + Playwright)


| Archivo                                 | Tipo       | Mejora(s)                                                        |
| --------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `middleware.ts`                         | **SEG**    | Eliminar bypass en catch (línea 108)                             |
| `middleware.ts`                         | **PERF**   | Cachear session en edge (Request Memoization)                    |
| `middleware.ts`                         | **SEG**    | Añadir headers CSP estrictos                                     |
| `app/globals.css`                       | **ARCH**   | Migrar a CSS Layers (@layer) para especificidad                  |
| `app/layout.tsx`                        | **PERF**   | Preload fuentes críticas (Geist)                                 |
| `app/layout.tsx`                        | **SEO**    | Añadir schema.org JSON-LD                                        |
| `app/page.tsx`                          | **PERF**   | Lazy load secciones below-the-fold (Solutions/Enterprise)        |
| `app/page.tsx`                          | **UX**     | Añadir aria-labels a navegación                                  |
| `(authenticated)/layout.tsx`            | **PERF**   | Suspense boundaries para Sidebar/Header                          |
| `admin/page.tsx`                        | **ARCH**   | Separar lógica de datos a hooks (useDashboardStats)              |
| `admin/page.tsx`                        | **TYP**    | Eliminar `any` en normalización datos (línea 33)                 |
| `admin/analytics/page.tsx`              | **ARCH**   | Streaming SSR para PlatformAnalytics                             |
| `admin/auditoria/page.tsx`              | **UX**     | Implementar virtualización tabla (react-window)                  |
| `admin/auditoria/page.tsx`              | **PERF**   | Paginación servidor (skip/limit)                                 |
| `admin/documentos/page.tsx`             | **SEG**    | Sanitizar nombre\_archivo antes de mostrar (XSS)                 |
| `admin/documentos/page.tsx`             | **UX**     | Optimistic UI para cambios de estado                             |
| `admin/documentos/page.tsx`             | **ARCH**   | Extraer lógica CRUD a custom hook                                |
| `admin/notifications/page.tsx`          | **PERF**   | Revalidación ISR (cache 60s) para stats                          |
| `admin/perfil/page.tsx`                 | **SEG**    | Validación permisos server-side (redundante)                     |
| `admin/perfil/page.tsx`                 | **PERF**   | Paralelizar fetch de datos (Promise.all)                         |
| `admin/prompts/page.tsx`                | **ARCH**   | Componentizar lista (PromptListItem)                             |
| `admin/prompts/page.tsx`                | **UX**     | Debounce en búsqueda (500ms)                                     |
| `admin/tenants/page.tsx`                | **ARCH**   | Dividir en sub-componentes (Tabs separados)                      |
| `admin/tenants/page.tsx`                | **TYP**    | Tipar estrictamente TenantConfig (sin `?` opcionales)            |
| `admin/usuarios/page.tsx`               | **UX**     | Implementar infinite scroll vs paginación                        |
| `pedidos/page.tsx`                      | **PERF**   | React Query para estado servidor (caching)                       |
| `pedidos/page.tsx`                      | **ARCH**   | Separar upload logic a hook useFileUpload                        |
| `api/admin/global-stats/route.ts`       | **PERF**   | Cache Redis (TTL 5min) + stale-while-revalidate                  |
| `api/admin/global-stats/route.ts`       | **PERF**   | Agregaciones MongoDB paralelas (Promise.all)                     |
| `api/admin/ingest/route.ts`             | **ARCH**   | Mover lógica a service (IngestService)                           |
| `api/admin/ingest/route.ts`             | **PERF**   | Procesamiento asíncrono (cola Bull/Upstash)                      |
| `api/admin/ingest/route.ts`             | **TYP**    | Eliminar variable duplicada (estimatedSavedTokens)               |
| `api/admin/documentos/route.ts`         | **SEC**    | Añadir rate limiting específico (10 req/min)                     |
| `api/admin/documentos/status/route.ts`  | **SEC**    | Transacción MongoDB (atomic update doc+chunks)                   |
| `api/admin/billing/seed-plans/route.ts` | **SEC**    | Añadir rate limiting extremo (1 req/hora)                        |
| `api/admin/usuarios/route.ts`           | **SEC**    | Hash password con bcrypt (10 salt rounds) - ya existe, verificar |
| `api/admin/usuarios/route.ts`           | **SEC**    | Validar dominio email contra whitelist tenant                    |
| `api/admin/usuarios/invite/route.ts`    | **FIX**    | Completar envío email (usar NotificationService)                 |
| `api/auth/cambiar-password/route.ts`    | **SEC**    | Requerir MFA si está activo                                      |
| `api/auth/cambiar-password/route.ts`    | **SEC**    | Bloquear contraseñas previas (histórico 5)                       |
| `api/auth/mfa/config/route.ts`          | **SEC**    | Rate limiting strict (3 intentos/15min)                          |
| `api/tecnico/pedidos/analyze/route.ts`  | **PERF**   | Streaming progresivo (SSE) para análisis largo                   |
| `api/tecnico/pedidos/analyze/route.ts`  | **ARCH**   | Extraer a Job Queue (no bloquear HTTP)                           |
| `api/webhooks/stripe/route.ts`          | **SEC**    | Idempotency check (guardar eventId procesado)                    |
| `api/webhooks/stripe/route.ts`          | **SEC**    | Validar timestamp firma (anti-replay)                            |
| `lib/schemas.ts`                        | **TYP**    | Añadir branded types (flavoring) para IDs                        |
| `lib/schemas.ts`                        | **QA**     | Añadir tests Zod (zod-to-json-schema)                            |
| `hooks/useApiItem.ts`                   | **PERF**   | Implementar SWR (stale-while-revalidate)                         |
| `hooks/useApiMutation.ts`               | **UX**     | Añadir retry automático (exponential backoff)                    |
| `components/admin/DocumentUploadModal`  | **UX**     | Drag & drop nativo (react-dropzone)                              |
| `components/admin/DocumentUploadModal`  | **UX**     | Previsualización PDF (thumbnail)                                 |
| `components/admin/DataTable`            | **PERF**   | Virtualización si >100 filas                                     |
| `components/landing/HeroSection`        | **PERF**   | Priority loading LCP image                                       |
| `components/landing/HeroSection`        | **SEO**    | H1 semántico único                                               |
| `env validation`                        | **SEC**    | Schema Zod para variables entorno (ej: envalid)                  |
| `docker/ops`                            | **DEPLOY** | Multi-stage build Dockerfile                                     |
| `tests/`                                | **QA**     | Crear suite E2E (Playwright) - crítico                           |
| `tests/`                                | **QA**     | Unit tests servicios críticos (Billing, Auth)                    |


Resumen por frecuencia:
Arquitectura: Separar lógica de UI (hooks/services)
Seguridad: Rate limiting, transacciones, 