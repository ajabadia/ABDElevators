# ⏳ DATA_LIFECYCLE.md
# Gestión de Retención y Purga de Datos (Fase 304)

## 📋 Resumen de Políticas
Para garantizar el cumplimiento de normativas (GDPR/SOC2) y optimizar costes de almacenamiento, se definen las siguientes reglas de retención automática.

| Tipo de Datos | Retención (Días) | Acción | Nivel de Seguridad |
| :--- | :--- | :--- | :--- |
| **Logs de Aplicación** | 30 | Purga Física | Media |
| **Audit Trails (Config)** | 365+ | Archivado S3/Glacier | Alta |
| **Audit Trails (Access)** | 90 | Purga Física | Alta |
| **Archivos Temporales** | 7 | Purga Física | Media |
| **Knowledge Assets (Soft Deleted)** | 30 | Purga Física | Alta |

## 🛠️ Implementación: CleanupWorker
El sistema ejecuta una tarea CRON diaria (`/api/cron/data-lifecycle`) que procesa estas reglas.

### Reglas de Purga
1. **Logs Técnicos**: Registros en `application_logs` con `timestamp < now() - 30d`.
2. **Audit Trails de Acceso**: Registros en `audit_data_access` con `timestamp < now() - 90d`.
3. **Drafts Huérfanos**: Knowledge Assets en estado `UPLOADED` por más de 24h sin pasar a `PROCESSING`.

## 🔒 Auditoría de Purga
Cada ejecución del CleanupWorker debe registrar una entrada en `audit_admin_ops` indicando:
- Número de registros eliminados por colección.
- Espacio liberado (estimado).
- Estado final de la operación.
