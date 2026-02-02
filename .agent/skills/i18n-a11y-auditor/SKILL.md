---
name: i18n-a11y-auditor
description: Audita y corrige la implementación de internacionalización (i18n) y accesibilidad (a11y) en componentes y páginas de React/Next.js.
---

# i18n & a11y Auditor Skill

## Cuándo usar este skill
- Cuando se cree una nueva página o componente UI.
- Cuando el usuario pida revisar la accesibilidad de una vista.
- Cuando se necesite asegurar que todos los textos están internacionalizados (usando `next-intl`).
- Como paso previo a un PR para garantizar estándares de calidad frontend.

## Inputs necesarios
- **Ruta del archivo**: El archivo `.tsx` a auditar.
- **Diccionarios**: Acceso a `messages/es.json` y `messages/en.json` para verificar/añadir claves.

## Workflow

### Fase 1: Auditoría i18n
1. **Detección de Hardcoding**: Buscar textos literales entre etiquetas JSX o en atributos (`placeholder`, `title`, `label`, `alt`).
2. **Verificación de hook**: Asegurar que se importa y usa `useTranslations`.
3. **Mapeo de Claves**: Proponer nombres de claves semánticas (ej: `dashboard.title` en lugar de `texto1`).

### Fase 2: Auditoría de Accesibilidad (a11y)
1. **Semántica HTML**: Verificar uso de `<main>`, `<section>`, `<nav>`, `<header>`, `<h1>-<h6>`.
2. **Interactividad**: Asegurar que botones (`<button>`) y enlaces (`<a>`) tengan etiquetas descriptivas o `aria-label` si solo tienen iconos.
3. **Imágenes**: Verificar que toda etiqueta `<img>` o componente `Image` de Next.js tenga un `alt` descriptivo.
4. **Formularios**: Asegurar que cada `Input` tenga un `Label` asociado correctamente.

### Fase 3: Ejecución de Mejoras
1. **Inyección de i18n**: Sustituir textos hardcodeados por `t('clave')`.
2. **Actualización de Diccionarios**: Añadir las nuevas claves a los archivos `.json` de traducciones.
3. **Refactorización a11y**: Añadir atributos ARIA missing y corregir jerarquía de etiquetas.

## Instrucciones y Reglas
- **REGLA DE ORO**: No inventes traducciones si no estás seguro del contexto; usa marcadores si es necesario o pregunta al usuario.
- **JERARQUÍA**: Mantén una estructura lógica en el JSON de traducciones (ej: agrupar por página o componente).
- **ARIA**: Prioriza el HTML semántico sobre los atributos `aria-*`. Usa `aria-label` solo cuando el elemento no tenga texto visible.

## Output (formato exacto)
1. **Informe de Auditoría**: Tabla con "Problema", "Tipo (i18n/a11y)" y "Gravedad".
2. **Plan de Acción**: Lista de cambios propuestos.
3. **Ejecución**: Código refactorizado y actualizaciones de JSON.

## Manejo de Errores
- Si no encuentras el archivo de traducciones, pregunta al usuario por la ruta correcta.
- Si un componente es demasiado complejo para auditarlo de una vez, divídelo en sub-auditorías por secciones.
