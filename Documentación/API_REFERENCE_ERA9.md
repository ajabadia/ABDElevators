# 📡 Referencia de APIs — ABD RAG Platform (ERA 9)

> **Total:** 128 endpoints | **Última auditoría:** 2026-03-02

## Convenciones

- **Autenticación:** Todos los endpoints requieren sesión activa (NextAuth JWT), excepto `/api/auth/*` y `/api/health`.
- **Autorización:** Todos usan `enforcePermission(resource, action)` (Guardian V3 ABAC).
- **Respuesta éxito:** `{ success: true, data: T, count?: number }`
- **Respuesta error:** `{ success: false, error: { code: string, message: string } }`
- **Performance:** Todos envueltos en `withPerformanceSLA()`.

---

## 1. Tasks (`/api/tasks`)

| Endpoint | Método | Recurso:Acción | Descripción |
|----------|--------|-----------------|-------------|
| `/api/tasks/my` | GET | `workflow:task` : `read` | Tareas asignadas al usuario actual |
| `/api/tasks/created` | GET | `workflow:task` : `read` | Tareas creadas por el usuario actual |

---

## 2. User (`/api/user`)

| Endpoint | Método | Recurso:Acción | Descripción |
|----------|--------|-----------------|-------------|
| `/api/user/stats` | GET | `user:stats` : `read` | Estadísticas del usuario |
| `/api/user/search` | GET | `rag` : `search` | Búsqueda RAG conversacional |
| `/api/user/preferences` | GET/PUT | `user:preferences` : `read/write` | Preferencias de notificación |

---

## 3. Admin: Users (`/api/admin/users`)

| Endpoint | Método | Recurso:Acción | Descripción |
|----------|--------|-----------------|-------------|
| `/api/admin/users` | GET/POST | `user` : `manage` | Listar/crear usuarios |
| `/api/admin/users/[id]` | GET/PATCH | `user` : `read/manage` | Detalle/actualizar usuario |
| `/api/admin/users/invite` | GET/POST | `user:invite` : `read/manage` | Gestionar invitaciones |
| `/api/admin/users/invite/bulk` | POST | `user:invite` : `manage` | Invitaciones masivas CSV |
| `/api/admin/users/invite/revoke` | POST | `user:invite` : `manage` | Revocar invitación |

---

## 4. Admin: Billing (`/api/admin/billing`)

| Endpoint | Método | Recurso:Acción | Descripción |
|----------|--------|-----------------|-------------|
| `/api/admin/billing/usage` | GET | `billing:usage` : `read` | Métricas de consumo |
| `/api/admin/billing/contracts` | GET/POST | `billing:contract` : `read/manage` | Contratos activos |
| `/api/admin/billing/invoice-preview` | GET | `billing:invoice` : `read` | Previsualización de factura |
| `/api/admin/billing/prediction` | GET | `billing:prediction` : `read` | Predicción de costos |
| `/api/admin/billing/manual-change` | POST | `billing:contract` : `manage` | Cambio manual de plan |
| `/api/admin/billing/seed-plans` | POST | `system:billing` : `manage` | Seed de planes base |

---

## 5. Admin: Knowledge (`/api/admin/knowledge-assets`)

| Endpoint | Método | Recurso:Acción | Descripción |
|----------|--------|-----------------|-------------|
| `/api/admin/knowledge-assets/[id]` | GET/PATCH/DELETE | `knowledge` : `read/manage` | CRUD de activos |
| `/api/admin/knowledge-assets/[id]/download` | GET | `knowledge` : `read` | Descargar archivo original |
| `/api/admin/knowledge-assets/[id]/preview` | GET | `knowledge` : `read` | Previsualización |
| `/api/admin/knowledge-assets/[id]/retry` | POST | `knowledge` : `manage` | Reintentar ingesta |
| `/api/admin/knowledge-assets/[id]/review` | POST | `knowledge` : `manage` | Aprobar/rechazar |
| `/api/admin/knowledge-assets/[id]/trace` | GET | `knowledge` : `read` | Trazabilidad completa |
| `/api/admin/knowledge-assets/[id]/suggest-questions` | GET | `knowledge` : `read` | Preguntas sugeridas por IA |
| `/api/admin/knowledge-assets/[id]/relationships` | GET | `knowledge` : `read` | Relaciones en grafo |

---

## 6. Admin: Ingestion (`/api/admin/ingest`)

| Endpoint | Método | Recurso:Acción | Descripción |
|----------|--------|-----------------|-------------|
| `/api/admin/ingest` | POST | `ingest` : `write` | Subir documento para ingesta |
| `/api/admin/ingest/jobs` | GET | `ingest:metrics` : `read` | Jobs activos de ingesta |
| `/api/admin/ingest/metrics` | GET | `ingest:metrics` : `read` | Métricas del pipeline |
| `/api/admin/ingest/[id]/enrich` | POST | `ingest` : `manage` | Enriquecimiento post-ingesta |
| `/api/admin/ingest/status/[docId]` | GET | `ingest` : `read` | Estado de documento |
| `/api/admin/ingest/logs/[id]` | GET | `audit:ingest` : `read` | Logs de ingesta |

---

## 7. Admin: Audit & Logs (`/api/admin`)

| Endpoint | Método | Recurso:Acción | Descripción |
|----------|--------|-----------------|-------------|
| `/api/admin/audit/stats` | GET | `audit:stats` : `read` | Estadísticas de auditoría |
| `/api/admin/audit/config` | GET/POST | `audit:config` : `manage` | Configuración de retención |
| `/api/admin/audit/ingest` | GET | `audit:ingest` : `read` | Auditoría de ingesta |
| `/api/admin/logs` | GET | `audit:logs` : `read` | Logs del sistema |
| `/api/admin/logs/stats` | GET | `audit:logs` : `read` | Estadísticas de logs |
| `/api/admin/logs/export` | GET | `audit:logs` : `read` | Exportar logs |

---

## 8. Admin: i18n (`/api/admin/i18n`)

| Endpoint | Método | Recurso:Acción | Descripción |
|----------|--------|-----------------|-------------|
| `/api/admin/i18n` | GET | `i18n` : `manage` | Estado global i18n |
| `/api/admin/i18n/[locale]` | GET/POST | `i18n` : `manage` | Traducciones por locale |
| `/api/admin/i18n/auto-translate` | POST | `i18n` : `manage` | Traducción automática (Gemini) |
| `/api/admin/i18n/stats` | GET | `i18n` : `read` | Cobertura de traducciones |
| `/api/admin/i18n/sync` | POST | `i18n` : `manage` | Sincronizar DB ↔ JSON |

---

## 9. Support (`/api/support`)

| Endpoint | Método | Recurso:Acción | Descripción |
|----------|--------|-----------------|-------------|
| `/api/support/tickets` | GET/POST | `support:ticket` : `read/write` | Listar/crear tickets |
| `/api/support/tickets/[id]` | GET/PATCH | `support:ticket` : `read/manage` | Detalle/actualizar ticket |
| `/api/support/tickets/[id]/reply` | POST | `support:ticket` : `write` | Responder ticket |
| `/api/support/tickets/[id]/reassign` | POST | `support:ticket` : `manage` | Reasignar ticket |
| `/api/support/stats` | GET | `support:stats` : `read` | Métricas de soporte |

---

## 10. Core AI (`/api/core`)

| Endpoint | Método | Recurso:Acción | Descripción |
|----------|--------|-----------------|-------------|
| `/api/core/quick-qa` | POST | `rag` : `search` | Q&A efímera sobre snippet |
| `/api/core/quick-qa/promote` | POST | `rag` : `write` | Promocionar snippet a documento |
| `/api/core/insights` | GET | `dashboard` : `read` | Insights del dashboard |
| `/api/core/graph` | GET | `graph` : `read` | Datos del knowledge graph |
| `/api/core/predictive/maintenance` | POST | `predictive` : `read` | Mantenimiento predictivo |
| `/api/core/agents/correct` | POST | `rag` : `write` | Auto-corrección agéntica |
| `/api/core/automation/workflows` | GET/POST | `workflow` : `read/write` | Workflows automatizados |

---

## 11. Billing Portal (`/api/billing`)

| Endpoint | Método | Recurso:Acción | Descripción |
|----------|--------|-----------------|-------------|
| `/api/billing/portal` | GET | `billing` : `read` | Portal de facturación |
| `/api/billing/create-checkout` | POST | `billing` : `write` | Crear sesión de pago Stripe |
| `/api/billing/change-plan` | POST | `billing` : `manage` | Cambiar plan |
| `/api/billing/simulate-change` | POST | `billing` : `read` | Simular cambio de plan |

---

## Categorías SLA

| Categoría | Threshold P95 | Max | Ejemplo |
|-----------|--------------|-----|---------|
| **FAST** | 200ms | 500ms | `/api/admin/logs/stats` |
| **MEDIUM** | 500ms | 1000ms | `/api/tasks/my`, `/api/support/tickets` |
| **SLOW** | 1000ms | 2000ms | `/api/admin/ingest`, `/api/core/quick-qa` |
| **HEAVY** | 2000ms | 5000ms | `/api/user/search` (RAG full pipeline) |
