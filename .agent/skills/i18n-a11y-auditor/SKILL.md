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
- **Contexto de Dominio**: Recordar que operamos en el sector de **Mantenimiento de Ascensores e Inteligencia Técnica**.

## Workflow

### Fase 1: Auditoría i18n
1. **Detección de Hardcoding**: Buscar textos literales en JSX o atributos (`placeholder`, `title`, etc.).
2. **Estructura de Namespacing**: 
   - No usar llaves planas. Usar jerarquía: `[namespace].[component/page].[key]`.
   - Ejemplo: `admin.logs.table.timestamp`.
3. **Verificación de hook**: Asegurar uso de `useTranslations('namespace')` para scoping correcto.
4. **Terminología Profesional**: 
   - **CRÍTICO**: Asegurar que NO se usen términos técnicos de desarrollo como "RAG", "Vector", "Explorer", "Agentic", "Simulator".
   - **Usar en su lugar**: "Inteligencia Técnica", "Búsqueda Semántica", "Buscador", "Inteligente", "Simulador de Análisis".
   - **Términos del sector ascensores**: Mantener precisión técnica para "Hoistway", "Pit", "Sling", "Buffer", etc.
   - **Referencia**: Ver `messages/es.json` y `messages/en.json` secciones `user_dashboard`, `common.help`, `common.activities` para ejemplos de terminología aprobada.

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
   - **MANDATORIO**: Tras añadir claves, DEBES sincronizar con la base de datos y limpiar la caché de Redis ejecutando:
     ```bash
     npx tsx scripts/force-sync-i18n.ts [locale]
     ```
     (donde `[locale]` es `es`, `en` o ambos).
   - **Gobernanza DB**: El sistema prioriza Redis > DB > Archivos. Sin este paso, las nuevas claves no se verán en producción/dev hasta que expire el TTL.
   - **Prompts Dinámicos**: Si se detectan términos técnicos en prompts de IA, reportar para auditoría con `audit-db-prompts-simple.ts`
3. **Refactorización a11y**: Añadir atributos ARIA missing y corregir jerarquía de etiquetas.

## Instrucciones y Reglas
- **REGLA DE ORO #1**: No inventes traducciones. Si el término es muy técnico del sector ascensores, mantén el término en inglés si es el estándar industrial o pregunta al usuario.
- **REGLA DE ORO #2 (TERMINOLOGÍA PROFESIONAL)**: 
  - ❌ NUNCA usar: "RAG", "Vector Search", "Explorer", "Agentic", "Simulator" en UI visible al usuario.
  - ✅ SIEMPRE usar: "Inteligencia Técnica", "Búsqueda Semántica", "Buscador", "Inteligente", "Simulador de Análisis".
  - 📋 Referencia: `messages/es.json` y `messages/en.json` (secciones `user_dashboard`, `common`).
- **INTEGRIDAD JSON**: Verifica la sintaxis JSON. Un error romperá el fallback local.
- **SINCRONIZACIÓN (MANDATORIA)**:
  - Si añades una clave en un idioma, DEBES añadirla en todos los soportados para evitar `MISSING_MESSAGE`.
  - **DEBES** ejecutar `scripts/force-sync-i18n.ts` inmediatamente después de modificar los JSONs para invalidar la caché.
- **JERARQUÍA**: Mantén el JSON agrupado por módulos (admin, common, public, profile, etc.).
- **GOBERNANZA DB**: El archivo JSON local es la fuente de verdad (L4) para el desarrollador, pero la DB/Redis es la fuente de verdad para el runtime. La sincronización es el puente obligatorio.

## Output (formato exacto)
1. **Informe de Auditoría**: Tabla con "Problema", "Tipo (i18n/a11y)" y "Gravedad".
2. **Plan de Acción**: Lista de cambios propuestos incluyendo las nuevas claves propuestas.
3. **Ejecución**: Código refactorizado y bloques de JSON para añadir.

## Manejo de Errores
- Si un componente usa estados complejos para textos dinámicos, recomienda mover esos textos a un archivo de constantes o directamente a los diccionarios.
- **ERROR: MISSING_MESSAGE**: Si detectas este error en runtime (pero las claves SÍ están en los JSON), es probable que el sistema de caché (Redis/DB) esté desincronizado. 
  - **SOLUCIÓN**: Consulta la skill `error-resolution-handler` e implementa la solución `i18n_missing_key`.
  - **COMANDO**: `npx tsx scripts/force-sync-i18n.ts [locale]`
