# Deuda Técnica i18n (Fase 223)

Historial de elementos secundarios y textos profundos detectados durante las auditorías de Era 8 que no se migraron al diccionario global porque no son críticos o por su naturaleza fuertemente acoplada al código en esta etapa.

## Elementos Registrados:

1. **Dashboard principal (`admin/page.tsx`):**
   - Textos de componentes del dashboard (Insights rápidos, Notificaciones, etc.) que actualmente se obtienen localmente.

2. **Detalles de errores en `AppError` y manejos CATCH de Server Actions:**
   - Hay mensajes de error técnicos incrustados en throw new AppError() que a menudo ven loggers internos, por lo que no requieren una traducción directa urgente, pero podrían mostrarse en toasts eventualmente.

3. **Placeholder en Modales Administrativos:**
   - Existen placeholders en Inputs de modales específicos de configuración, ejemplo: `placeholder="https://..."`.

### Consideraciones:

Estos elementos deben priorizarse en una futura **Fase 23x - Pulido de Frontend** en caso de necesitar localización absoluta.
