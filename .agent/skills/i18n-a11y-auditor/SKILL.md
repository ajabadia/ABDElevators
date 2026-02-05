---
name: i18n-a11y-auditor
description: Audita y corrige la implementación de internacionalización (i18n) y accesibilidad (a11y) en componentes y páginas de React/Next.js, compatible con el sistema dinámico de ABDElevators.
---

# i18n & a11y Auditor Skill

## Cuándo usar este skill
- Cuando se cree una nueva página o componente UI.
- Cuando el usuario pida revisar la accesibilidad de una vista.
- Cuando se necesite asegurar que todos los textos están internacionalizados (usando `next-intl` y `TranslationService`).
- Como paso previo a un PR para garantizar estándares de calidad frontend.

## Inputs necesarios
- **Ruta del archivo**: El archivo `.tsx` a auditar.
- **Diccionarios**: Acceso a `messages/es.json` y `messages/en.json` (L4 fallback).
- **Contexto de Dominio**: Recordar que operamos en el sector de **Mantenimiento de Ascensores y RAG**.

## Workflow

### Fase 1: Auditoría i18n
1. **Detección de Hardcoding**: Buscar textos literales en JSX o atributos (`placeholder`, `title`, etc.).
2. **Estructura de Namespacing**: 
   - No usar llaves planas. Usar jerarquía: `[namespace].[component/page].[key]`.
   - Ejemplo: `admin.logs.table.timestamp`.
3. **Verificación de hook**: Asegurar uso de `useTranslations('namespace')` para scoping correcto.
4. **Terminología Crítica**: Asegurar que términos como "Hoistway", "Pit", "Sling", "Buffer", "RAG", "Embeddings" se traduzcan con precisión técnica según el glosario del sector.

### Fase 2: Auditoría de Accesibilidad (a11y)
1. **Semántica HTML**: Verificar uso de `<main>`, `<section>`, `<nav>`, `<header>`, `<h1>-<h6>`.
2. **Interactividad**: Asegurar que botones (`<button>`) y enlaces (`<a>`) tengan etiquetas descriptivas o `aria-label` si solo tienen iconos.
3. **Imágenes**: Verificar que toda etiqueta `<img>` o componente `Image` de Next.js tenga un `alt` descriptivo.
4. **Formularios**: Asegurar que cada `Input` tenga un `Label` asociado correctamente.
5. **SEO (Páginas Públicas)**: Verificar `metadata` (Title tag único, Meta description optimizada).

### Fase 3: Ejecución de Mejoras
1. **Inyección de i18n**: Sustituir textos hardcodeados por `t('clave')`.
2. **Actualización de Diccionarios**: 
   - Añadir claves a `messages/es.json` y `messages/en.json`.
   - **IMPORTANTE**: En este proyecto, los JSONs son el Fallback L4. El sistema sincronizará estos cambios a MongoDB/Redis automáticamente al detectar nuevos despliegues o mediante la consola de "Gobernanza i18n".
3. **Refactorización a11y**: Añadir atributos ARIA missing y corregir jerarquía de etiquetas.

## Instrucciones y Reglas
- **REGLA DE ORO**: No inventes traducciones. Si el término es muy técnico del sector ascensores, mantén el término en inglés si es el estándar industrial o pregunta al usuario.
- **INTEGRIDAD JSON**: Verifica la sintaxis JSON. Un error romperá el fallback local.
- **SINCRONIZACIÓN**: Si añades una clave en un idioma, DEBES añadirla en todos los soportados para evitar `MISSING_MESSAGE`.
- **JERARQUÍA**: Mantén el JSON agrupado por módulos (admin, common, public, profile, etc.).

## Output (formato exacto)
1. **Informe de Auditoría**: Tabla con "Problema", "Tipo (i18n/a11y)" y "Gravedad".
2. **Plan de Acción**: Lista de cambios propuestos incluyendo las nuevas claves propuestas.
3. **Ejecución**: Código refactorizado y bloques de JSON para añadir.

## Manejo de Errores
- Si un componente usa estados complejos para textos dinámicos, recomienda mover esos textos a un archivo de constantes o directamente a los diccionarios.
