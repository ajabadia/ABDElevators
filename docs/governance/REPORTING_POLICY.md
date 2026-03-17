# Política Operativa de Reporting

Garantiza la estandarización y trazabilidad de los informes técnicos y de cumplimiento de la plataforma.

## 1. Alcance
Aplica a `ReportTemplate`, `ReportSchedule` y la generación de `ReportData`.

## 2. Tipos de Plantillas
- **Plantillas CORE**: `ragQuality`, `audit`, `workflow`. 
  - *Gobernanza*: Solo modificables por el equipo de plataforma. Requieren validación similar a los prompts (versión, revisión, pruebas).
- **Plantillas CUSTOM**: `inspection`, proyectos específicos.
  - *Gobernanza*: Mayor flexibilidad, pero deben respetar los tipos de datos de `ReportData`.

## 3. Metadatos de Gobernanza RAG
> [!IMPORTANT]
> Los informes de tipo `ragQuality` **DEBEN** incluir metadatos de gobernanza: modelo, `promptVersion` y `engineVersion`.

No se aceptan informes de calidad con números "a pelo" sin contexto de la configuración que los generó.

## 4. Programación (Schedules)
- Solo roles autorizados pueden crear/editar `ReportSchedule`.
- Los informes sensibles (Audit/Seguridad) deben restringirse a roles de Administración o Compliance.
- Fallos repetidos en el envío de informes críticos deben disparar una alerta al Admin del tenant.

## 5. Auditoría
Cualquier cambio estructural en plantillas CORE o en schedules de envío debe loguearse con `source: REPORTS/INSIGHTS`.
