---
name: app-full-reviewer
description: Ejecuta un ciclo completo de auditoría (UI/UX, i18n/a11y y Permisos/Seguridad) sobre una parte específica de la aplicación.
---

# App Full Reviewer Skill (Meta-Auditor)

## Cuándo usar este skill
- Cuando el usuario pida un "repaso completo" o "revisión general" de una nueva feature o página.
- Antes de despliegues importantes a producción.
- Para garantizar que una pantalla cumple con todos los estándares del proyecto (Estilo, Accesibilidad, Idioma, Seguridad e Industrial Performance).

## Inputs necesarios
- **Ruta del archivo o carpeta**: Lo que se quiere revisar.

## Workflow (Route-Aware)
Antes de iniciar, determina si el archivo pertenece a **Área Pública (Marketing)** o **Área Privada (App/Admin)**:
- **Área Pública**: Rutas como `/`, `/about`, `/terms`, `/privacy`, `/pricing`, `/accessibility`, componentes en `src/components/landing`.
- **Área Privada**: Rutas bajo `/admin`, `/profile`, `/dashboard`, componentes en `src/components/admin` o `src/components/ui`.

### Fase 1: Auditoría de Estilo
- **Área Privada**: Usa skill `ui-styling` (Consistencia, Dashboards, Zustand).
- **Área Pública**: Usa skill `marketing-styling` (Impacto visual, Gradients, Conversión).

### Fase 2: Auditoría de Internacionalización y Accesibilidad (Skill: i18n-a11y-auditor)
1. Detecta textos hardcodeados y garantiza sincronización ES/EN.
2. Revisa semántica HTML, ARIA labels y compatibilidad con lectores de pantalla.
3. **Público Solo**: Verifica metadatos SEO (Title, Description).

### Fase 3: Auditoría de Seguridad y Permisos (Skill: guardian-auditor)
- **Área Privada**: Verifica `enforcePermission`, `requireRole` y aislamiento de tenant.
- **Área Pública**: Verifica que NO haya exposición de datos internos, APIs administrativas o PII (Bypass autorizado).

### Fase 4: Auditoría de Higiene y Deuda Técnica (Skill: hygiene-reviewer)
1. Escanea patrones de error recurrentes.
2. Aplica refactorizaciones automáticas.

### Fase 5: Sincronización con el Mapa de Aplicación (map.md)
1. Comprueba si la ruta o funcionalidad revisada está presente en `map.md`.
2. Si **no está** y es una ruta pública, autenticada, administrativa o de API, debes **agregarla** siguiendo el formato de la tabla correspondiente.
3. Actualiza (o agrega) la columna **Última Revisión** con la fecha y hora actual de la ejecución de esta skill (Ej: `2026-02-03 10:15`).

## Registro de Ejecución (Checklist)
- [ ] Identificada Área (Pública vs Privada)
- [ ] Ejecutada Auditoría UI/Styling (ui-styling O marketing-styling)
- [ ] Ejecutada Auditoría i18n/a11y (+ SEO si es público)
- [ ] Ejecutada Auditoría Guardian V2 (Protección O Bypass Público)
- [ ] Ejecutada Auditoría de Higiene (Technical Debt)
- [ ] Sincronizado map.md (Agregado/Actualizado con timestamp)
- [ ] Sincronizados resultados de todas las fases

## Output (formato exacto)
Presenta un **Dashboard de Calidad** consolidado:

### 🏆 Resumen de Calidad: [Nombre del Componente]
| Categoría | Calificación | Hallazgos Críticos |
|-----------|--------------|--------------------|
| UI / UX   | A-F          | [X]                |
| i18n/a11y | A-F          | [X]                |
| Seguridad | A-F          | [X]                |
| Higiene   | A-F          | [X]                |

### 📝 Plan de Acción Integrado
Lista priorizada de cambios necesarios mezclando las tres disciplinas.

### 🛠️ Aplicación de Cambios
Propuesta de refactorización final que resuelva todos los puntos detectados.

## Instrucciones y Reglas
- **ORQUESTACIÓN**: Debes llamar mentalmente o explícitamente a las instrucciones de las otras tres skills.
- **PRIORIDAD**: La seguridad (`guardian-auditor`) siempre tiene prioridad máxima si se detecta una vulnerabilidad.
- **COHERENCIA**: Asegura que una mejora de UI no rompa la accesibilidad.
