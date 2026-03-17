# Política Operativa de Notificaciones

Este documento define las reglas de uso, configuración y gobernanza del sistema de notificaciones de la plataforma.

## 1. Propósito y Alcance
Asegurar que las comunicaciones (In-App, Email, Push) sean coherentes, no intrusivas y respeten las preferencias del usuario y la configuración del tenant.

## 2. Roles y Responsabilidades
- **Product / CS**: Define eventos de negocio y niveles de prioridad (INFO, SUCCESS, WARN, ERROR).
- **Tenant Admin**: Ajusta canales y destinatarios (dentro de límites permitidos).
- **Ingeniería**: Mantiene plantillas e implementa triggers respetando `NotificationTenantConfig`.

## 3. Tipos y Criticidad
- **Críticos**: `SECURITYALERT`, `BILLINGEVENT` (suspensión), `RISKALERT` (seguridad industrial).
  - *Regla*: No se pueden desactivar totalmente por el tenant; mínimo envío In-App a roles Admin.
- **Operativos**: `ANALYSISCOMPLETE`, `SYSTEM` informativos.
  - *Regla*: Desactivables por el tenant.

## 4. Gestión de Plantillas (NotificationTemplate)
- Todo cambio en el copy sustancial requiere aprobación de Product/Legal.
- Los cambios generan un snapshot en `NotificationTemplateHistory`.
- Se exige disciplina de internacionalización (i18n) para todos los idiomas soportados.

## 5. Triggers y Persistencia
- Prohibida la inserción directa en DB; usar siempre `NotificationService.notify()`.
- Se debe consultar `NotificationTenantConfig` (con caché) antes de cualquier envío.
- Se debe registrar el resultado real (`emailSent`, `read`, etc.) para auditoría.

## 6. Límites y Spam
- Aplicar rate-limit por tipo de evento para evitar fatiga de notificaciones.
- El origen (`source`) debe ser siempre explícito (ej: `NOTIFICATIONS`, `API_NOTIFICATIONS`).
