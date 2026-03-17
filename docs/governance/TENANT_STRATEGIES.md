# Políticas por Tipo de Tenant

ABDElevators diferencia la gobernanza según la criticidad y el plan del cliente.

## 1. Tenants Enterprise (Alta Criticidad)
- **Aprobación Dual**: Los cambios requieren aprobación de Product y del contacto técnico del cliente.
- **Pilotos Aislados**: Ventanas de 2-4 semanas solo en sombra para ese tenant antes de cualquier cambio oficial.
- **Métricas Dedicadas**: Golden Sets personalizados basados en su documentación privada.
- **Rollback Específico**: Capacidad de mantener versiones de prompts "legacy" solo para este tenant.

## 2. Tenants Estándar
- **Gobernanza Global**: Siguen la configuración por defecto del vertical (p.ej. Elevadores).
- **Despliegue Progresivo**: Los cambios validados en pilotos Enterprise se despliegan gradualmente a los usuarios estándar.
- **Métricas Agregadas**: Se evalúan contra Golden Sets representativos del sector, no personalizados por cliente.
- **Ciclo de Vida Corto**: Rollback global ante incidentes; no se permiten versiones personalizadas a largo plazo.

## Tabla Comparativa de Gobernanza
| Aspecto | Enterprise | Estándar |
|---------|------------|----------|
| **Aprobación** | Dual (Interna + Cliente) | Interna |
| **Golden Sets** | Personalizados | Por Vertical |
| **Overrides** | Intensivo | Mínimo |
| **Audit Log** | Forense / Detallado | Estándar |
