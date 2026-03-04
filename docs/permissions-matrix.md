# Permissions Matrix (Guardian V3)

Este documento registra el mapeo de recursos y acciones para el sistema de permisos ABAC de la plataforma.

## APIs Administrativas (/api/admin)

| Módulo | Ruta | Método | Recurso | Acción | Status |
|--------|------|--------|----------|---------|--------|
| **Tenants** | `/api/admin/tenants/route.ts` | ALL | `tenant` | `manage` | ✅ |
| **Tenants** | `/api/admin/tenants/[tenantId]/branding/upload` | POST | `tenant:branding` | `update` | ✅ |
| **Billing** | `/api/admin/billing/usage` | GET | `billing:usage` | `read` | ✅ |
| **Billing** | `/api/admin/billing/contracts` | ALL | `billing:contract` | `read/manage` | ✅ |
| **Billing** | `/api/admin/billing/invoice-preview` | GET | `billing:invoice` | `read` | ✅ |
| **Billing** | `/api/admin/billing/prediction` | GET | `billing:prediction` | `read` | ✅ |
| **Knowledge** | `/api/admin/knowledge-base/sync` | POST | `knowledge:sync` | `write` | ⏳ |
| **Platform** | `/api/admin/global-stats` | GET | `platform:metrics` | `read` | ✅ |
| **Knowledge** | `/api/auth/knowledge-assets` | ALL | `knowledge:asset` | `read/write`| ✅ |
## Bloque 3: Operaciones e i18n (/api/admin)

| Módulo | Ruta | Método | Recurso | Acción | Status |
|--------|------|--------|----------|---------|--------|
| **i18n** | `/api/admin/i18n/route.ts` | ALL | `i18n` | `manage` | ✅ |
| **i18n** | `/api/admin/i18n/[locale]` | GET/POST | `i18n` | `manage` | ✅ |
| **Prompts** | `/api/admin/prompts/route.ts` | ALL | `prompt` | `manage` | ✅ |
| **Audit** | `/api/admin/audit/stats` | GET | `audit:stats` | `read` | ✅ |
| **Audit** | `/api/admin/audit/config` | ALL | `audit:config` | `manage` | ✅ |
| **Audit** | `/api/admin/audit/ingest` | GET | `audit:ingest` | `read` | ✅ |

## Bloque 4: Ajustes, Usuarios y Varios (/api/admin)

| Módulo | Ruta | Método | Recurso | Acción | Status |
|--------|------|--------|----------|---------|--------|
| **Logs** | `/api/admin/logs/route.ts` | GET | `audit:logs` | `read` | ✅ |
| **Logs** | `/api/admin/logs/stats` | GET | `audit:logs` | `read` | ✅ |
| **Logs** | `/api/admin/logs/export` | GET | `audit:logs` | `read` | ✅ |
| **System** | `/api/admin/system/reset-rag` | POST | `system:rag` | `manage` | ✅ |
| **Users** | `/api/admin/users/route.ts` | ALL | `user` | `manage` | ✅ |
| **Users** | `/api/admin/users/[id]` | GET/PATCH | `user` | `read/manage` | ✅ |
| **Invites** | `/api/admin/users/invite` | GET | `user:invite` | `read` | ✅ |
| **Invites** | `/api/admin/users/invite/bulk` | POST | `user:invite` | `manage` | ✅ |
| **Notifications** | `/api/admin/notifications/route.ts` | ALL | `notification` | `manage` | ✅ |
| **Workflows** | `/api/admin/workflow-definitions` | ALL | `ai_governance` | `read/write` | ✅ |
| **Workflows** | `/api/admin/workflow-definitions/[id]` | ALL | `workflow` | `read/manage` | ✅ |
| **Workflows** | `/api/admin/workflow-definitions/active`| GET | `workflow` | `read` | ✅ |
| **Cases** | `/api/admin/cases/[id]/workflow` | ALL | `case` | `read/manage` | ✅ |
| **Usage** | `/api/admin/usage/roi` | GET | `usage` | `read` | ✅ |
| **Compliance** | `/api/admin/compliance/*` | ALL | `compliance` | `manage` | ✅ |
| **Environments**| `/api/admin/environments/promote` | POST | `environment` | `manage` | ✅ |
| **Gov/Prompts** | `/api/admin/prompts/sync` | POST | `prompt` | `manage` | ✅ |
| **Support** | `/api/admin/contacts` | ALL | `support` | `read/manage` | ✅ |

## Bloque 5: Filtros Técnicos y Debug (/api/admin)

| Módulo | Ruta | Método | Recurso | Acción | Status |
|--------|------|--------|----------|---------|--------|
| **Export** | `/api/admin/export` | GET | `export` | `read` | ✅ |
| **Trace** | `/api/admin/ai-trace/[id]` | GET | `audit:logs` | `read` | ✅ |
| **Security** | `/api/admin/permissions/check` | GET | `system:security`| `read`| ✅ |
| **i18n** | `/api/admin/i18n/[locale]/debug`| GET | `i18n` | `read` | ✅ |
| **Notifications**| `/api/admin/notifications/config` | ALL | `notification:config`| `read/manage`| ✅ |

## Convenciones de Acciones
- `read`: Acceso de solo lectura.
- `write`: Creación o modificación básica.
- `delete`: Eliminación de recursos.
- `manage`: Control total (lectura/escritura/configuración).
- `execute`: Disparo de procesos batch o jobs.
