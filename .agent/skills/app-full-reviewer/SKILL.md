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

## Workflow

### Fase 1: Auditoría de Estilo (Skill: ui-styling)
1. Analiza consistencia visual, uso de componentes de sistema y gestión de estado con Zustand.
2. Identifica estilos inline o layouts no estandarizados.

### Fase 2: Auditoría de Internacionalización y Accesibilidad (Skill: i18n-a11y-auditor)
1. Detecta textos hardcodeados.
2. Revisa semántica HTML, ARIA labels y compatibilidad con lectores de pantalla.

### Fase 3: Auditoría de Seguridad y Permisos (Skill: guardian-auditor)
1. Verifica la presencia de `enforcePermission` o protecciones equivalentes.
2. Valida el aislamiento por tenant en la lógica de datos.

### Fase 4: Sincronización con el Mapa de Aplicación (map.md)
1. Comprueba si la ruta o funcionalidad revisada está presente en `map.md`.
2. Si **no está** y es una ruta pública, autenticada, administrativa o de API, debes **agregarla** siguiendo el formato de la tabla correspondiente.
3. Actualiza (o agrega) la columna **Última Revisión** con la fecha y hora actual de la ejecución de esta skill (Ej: `2026-02-03 10:15`).

## Registro de Ejecución (Checklist)
- [ ] Ejecutada Auditoría UI/Styling
- [ ] Ejecutada Auditoría i18n/a11y
- [ ] Ejecutada Auditoría Guardian V2
- [ ] Sincronizado map.md (Agregado/Actualizado con timestamp)
- [ ] Sincronizados resultados de las 4 fases

## Output (formato exacto)
Presenta un **Dashboard de Calidad** consolidado:

### 🏆 Resumen de Calidad: [Nombre del Componente]
| Categoría | Calificación | Hallazgos Críticos |
|-----------|--------------|--------------------|
| UI / UX   | A-F          | [X]                |
| i18n/a11y | A-F          | [X]                |
| Seguridad | A-F          | [X]                |

### 📝 Plan de Acción Integrado
Lista priorizada de cambios necesarios mezclando las tres disciplinas.

### 🛠️ Aplicación de Cambios
Propuesta de refactorización final que resuelva todos los puntos detectados.

## Instrucciones y Reglas
- **ORQUESTACIÓN**: Debes llamar mentalmente o explícitamente a las instrucciones de las otras tres skills.
- **PRIORIDAD**: La seguridad (`guardian-auditor`) siempre tiene prioridad máxima si se detecta una vulnerabilidad.
- **COHERENCIA**: Asegura que una mejora de UI no rompa la accesibilidad.
