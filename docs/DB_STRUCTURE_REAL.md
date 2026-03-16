# 🏛️ ESTRUCTURA REAL DE BASE DE DATOS (ABD RAG Platform)

> **Auditoría Realizada:** 13 de marzo de 2026, 14:20
> **Estado:** 🟢 Activo (Verificado vía MongoDB Compass - 4 Bases de Datos detectadas)
> **Arquitectura:** Multi-cluster segregado por dominio (Auth, Main, Logs, Config).

---

## 🔐 1. Database: `ABDElevators-Auth`
*Gestión de identidad, acceso y configuración de tenants.*

| Colección | Documentos | Función |
| :--- | :--- | :--- |
| `users` | 12 | Repositorio de usuarios del sistema. |
| `tenants` | 8 | Clientes/Organizaciones configuradas. |
| `sessions` | 13 | Sesiones activas de usuario. |
| `magic_links` | 18 | Tokens de acceso temporal. |
| `permission_groups` | 2 | Definición de grupos de permisos. |
| `api_keys` | 1 | Credenciales para acceso externo. |

---

## 🏠 2. Database: `ABDElevators` (MAIN)
*Base de datos operativa para negocio y RAG (Knowledge Assets).*

| Colección | Documentos | Función |
| :--- | :--- | :--- |
| `ingestion_blobs.chunks` | 29 | Fragmentos binarios de archivos subidos. |
| `ingestion_blobs.files` | 6 | Metadatos de archivos en proceso de ingesta. |
| `workflow_tasks` | 3 | Estado de tareas automáticas. |
| `tickets` | 1 | Incidentes de soporte. |
| `extracted_checklists` | 1 | Resultados de análisis de ascensores. |
| `document_chunks` | 0 | ⚠️ Fragmentos vectorizables (Vacía = Fallo en RAG). |
| `knowledge_assets` | 0 | ⚠️ Activos de conocimiento consolidados (Vacía). |

---

## 📈 3. Database: `ABDElevators-Logs`
*Observabilidad, auditoría técnica y métricas de uso.*

| Colección | Documentos | Función |
| :--- | :--- | :--- |
| `application_logs` | 23K | Trazas de ejecución y errores del sistema. |
| `usage_logs` | 2.2K | Actividad de usuarios para dashboard de salud. |
| `audit_ingestion` | 8 | Trazas específicas del pipeline de ingesta. |
| `notifications` | 6 | Registro de alertas enviadas. |
| `workflow_analytics` | 17 | Métricas de rendimiento de procesos. |

---

## ⚙️ 4. Database: `ABDElevators-Config`
*Gobernanza de IA, Prompts, Traducciones y Configuración Global.*

| Colección | Documentos | Función |
| :--- | :--- | :--- |
| `translations` | 16K | Literales de internacionalización (i18n). |
| `prompts` | 117 | Prompts maestros dinámicos (Gobernanza). |
| `prompt_versions` | 112 | Histórico de cambios en prompts. |
| `document_types` | 10 | Definición de tipos de documentos soportados. |
| `organizations` | 7 | Metadatos de estructura organizativa. |
| `ai_workflows` | 5 | Orquestación de flujos de IA. |
| `spaces` | 3 | Áreas de trabajo/contexto. |
| `ai_configs` | 1 | Configuración global de modelos (Gemini, etc). |

---

### 🚨 CONCLUSIÓN DEL DIAGNÓSTICO
El sistema está correctamente segregado. El **Error de Ingesta** ocurre porque el flujo se detiene después de guardar en `ingestion_blobs` (MAIN), sin llegar a transformar esos datos en `knowledge_assets` y `document_chunks`. La falta de datos en estas últimas es lo que causa los errores de agregación en los Dashboards.
