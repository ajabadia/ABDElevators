# 🏛️ ESTRUCTURA REAL DE BASE DE DATOS (ABD RAG Platform)

> **Última Actualización:** 13 de marzo de 2026, 14:30
> **Estado:** 🟢 SINCRONIZADO (Infraestructura corregida y alineada con el código)
> **Arquitectura:** Multi-cluster segregado por dominio (Auth, Main, Logs, Config).

---

## 🔐 1. Database: `ABDElevators-Auth` (AUTH)
*Gestión de identidad, acceso y configuración de tenants.*

| Colección | Documentos | Función | Servicio/Repo principal |
| :--- | :--- | :--- | :--- |
| `users` | 12 | Repositorio de usuarios del sistema. | `auth-utils.ts`, `BulkInviteUseCase.ts` |
| `tenants` | 8 | Clientes/Organizaciones configuradas. | `db-tenant.ts`, `limit-alert-service.ts` |
| `sessions` | 13 | Sesiones activas de usuario. | `coreGetTenantCollection` (@abd/platform) |
| `magic_links` | 18 | Tokens de acceso temporal. | `magic-link/request/route.ts` |
| `permission_groups` | 2 | Definición de grupos de permisos. | `AccessControlService.ts` |
| `api_keys` | 1 | Credenciales para acceso externo. | `ApiKeyService.ts` |

---

## 🏠 2. Database: `ABDElevators` (MAIN)
*Base de datos operativa para negocio y RAG (Knowledge Assets).*

| Colección | Documentos | Función | Servicio/Repo principal |
| :--- | :--- | :--- | :--- |
| `ingestion_blobs.chunks` | 29 | Fragmentos binarios de archivos subidos. | `IngestService.ts`, `GridFS` |
| `ingestion_blobs.files` | 6 | Metadatos de archivos en proceso de ingesta. | `IngestService.ts` |
| `workflow_tasks` | 3 | Estado de tareas automáticas. | `WorkflowService.ts`, `WorkflowTaskRepository` |
| `tickets` | 1 | Incidentes de soporte. | `TicketRepository.ts` |
| `extracted_checklists` | 1 | Resultados de análisis de ascensores. | `ChecklistService.ts`, `/api/core/entities/...` |
| `orders` | - | Pedidos de ascensores (Histórico). | `AnalyticsService.ts` |
| `configs_checklist` | - | Configuración de reglas de análisis. | `lib/configs.ts` |
| `document_chunks` | 0 | ⚠️ Fragmentos vectorizables (**Fallo lógico detectado**). | `VectorStore` |
| `knowledge_assets` | 0 | ⚠️ Activos consolidados (**Fallo lógico detectado**). | `MongoKnowledgeRepository.ts` |

---

## 📈 3. Database: `ABDElevators-Logs` (LOGS)
*Observabilidad, auditoría técnica y métricas de uso.*

| Colección | Documentos | Función | Servicio/Repo principal |
| :--- | :--- | :--- | :--- |
| `application_logs` | 23K | Trazas de ejecución y errores del sistema. | `ObservabilityRepository.ts` |
| `usage_logs` | 2.2K | Actividad de usuarios para dashboard de salud. | `UsageLogRepository.ts` (Fixed Cluster) |
| `audit_ingestion` | 8 | Trazas específicas del pipeline de ingesta. | `audit/ingest/route.ts` |
| `notifications` | 6 | Registro de alertas enviadas. | `NotificationRepository.ts` |
| `workflow_analytics` | 17 | Métricas de rendimiento de procesos. | `AnalyticsService.ts` |

---

## ⚙️ 4. Database: `ABDElevators-Config` (CONFIG)
*Gobernanza de IA, Prompts, Traducciones y Configuración Global.*

| Colección | Documentos | Función | Servicio/Repo principal |
| :--- | :--- | :--- | :--- |
| `translations` | 16K | Literales de internacionalización (i18n). | `TranslationRepository.ts` (Fixed Cluster) |
| `prompts` | 117 | Prompts maestros dinámicos (Gobernanza). | `PromptService.ts` (Fixed Cluster) |
| `prompt_versions` | 112 | Histórico de cambios en prompts. | `PromptService.ts` (Fixed Cluster) |
| `document_types` | 10 | Definición de tipos de documentos soportados. | `DocumentTypeRepository` |
| `ai_configs` | 1 | Configuración global de modelos (Gemini, etc). | `AiModelManager.ts` |

---

### ✅ ACCIONES DE INFRAESTRUCTURA COMPLETADAS
- [x] **PromptService & Translations:** Migrados de clúster `MAIN` a clúster `CONFIG`.
- [x] **Usage & Statistics:** Dashboards corregidos para consultar clúster `LOGS`.
- [x] **System Resets:** Endpoints de mantenimiento mapeados a los clústeres correctos.
- [x] **Ghost Tables:** Confirmado que `extracted_checklists` es funcional y no una tabla huérfana.

### ⚠️ BLOQUEOS ACTUALES (CORE ISSUE)
El sistema RAG falla porque, aunque el código ahora mira al clúster correcto, el pipeline de ingesta deja de procesar después de subir los archivos a `ingestion_blobs`. Las colecciones `knowledge_assets` y `document_chunks` permanecen vacías.

### 🛠️ PRÓXIMO OBJETIVO
1. Analizar el flujo desde `ingestion_blobs` -> `KnowledgeSyncService`.
2. Verificar por qué el webhook de procesamiento no escala los fragmentos a la colección final.

---

### 📐 NORMALIZACIÓN DE ESQUEMAS (ERA 12.1)

> **Fecha:** 13 de marzo de 2026, 21:45

#### Problema Detectado
Los documentos en MongoDB utilizan convenciones mixtas de naming:
- **`tenants` (AUTH)**: `_id` es `ObjectId`, campos `storage.quota_bytes` y `storage.settings.folder_prefix` en snake_case.
- **`usage_logs` (LOGS)**: Campos legacy en español (`tipo`, `valor`, `correlacion_id`) coexisten con campos en inglés (`type`, `value`, `correlationId`).

#### Solución Aplicada
| Capa | Técnica | Archivos |
| :--- | :--- | :--- |
| **Schema** | `z.preprocess()` + `.passthrough()` | `auth.ts`, `billing.ts` |
| **Queries** | `$or` + `$ifNull` para compatibilidad dual | `usage-service.ts`, `audit/stats/route.ts`, `tenant-quota-service.ts` |
| **UI** | Migración a camelCase (`quotaBytes`, `folderPrefix`) | `StorageTab.tsx` |
| **ObjectId** | Coerción `_id.toString()` en preprocessor | `auth.ts` (TenantConfigSchema) |

#### Campos Normalizados

| Colección | Campo Legacy (DB) | Campo Estándar (Schema) |
| :--- | :--- | :--- |
| `tenants` | `storage.quota_bytes` | `storage.quotaBytes` |
| `tenants` | `storage.settings.folder_prefix` | `storage.settings.folderPrefix` |
| `usage_logs` | `tipo` | `type` |
| `usage_logs` | `valor` | `value` |
| `usage_logs` | `correlacion_id` | `correlationId` |

---

### 🔗 MAPEO DE FK CROSS-CLUSTER (Phase 357)

> **Fecha:** 13 de marzo de 2026, 21:55

`KnowledgeAssetRepository` (MAIN) valida integridad referencial contra colecciones en **otros clústeres**:

| FK Field | Target Collection | Target Cluster | Nota |
| :--- | :--- | :--- | :--- |
| `spaceId` | `spaces` | **MAIN** | Mismo clúster |
| `documentTypeId` | `document_types` | **CONFIG** | Cross-cluster |
| `ownerId` | `users` | **AUTH** | Cross-cluster |

`BaseRepository.validateExists()` ahora acepta un parámetro `targetCluster` para resolver correctamente estas validaciones.
