# Configuración de Logging y Retención

| Colección | Tipo de Datos | PII | Retención Producida | Mecanismo |
|-----------|---------------|-----|----------------------|-----------|
| `logs_app` | Errores / Info | Parcial (masking) | 12 meses (ERROR), 90 días (INFO) | Índice TTL |
| `audit_logs` | Cambios Config | No | 24 meses | Índice TTL |
| `sessions` | Sesiones activas | UserId, IP | 90 días | Índice TTL |
| `ragquerylogs`| Queries RAG | Texto Usuario | 180 días | Índice TTL |
| `ragevaluations`| Métricas Calidad| No | 24 meses | Retención larga |

## Implementación de Masking
- **Emails**: `u***@example.com`
- **IPs**: `192.168.1.xxx`
Este control minimiza los datos PII almacenados en reposo y ayuda al cumplimiento del RGPD.
