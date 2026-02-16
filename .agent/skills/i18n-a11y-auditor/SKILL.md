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
- **Diccionarios**: Acceso a `messages/[locale]/[namespace].json` (ej: `messages/es/common.json`). Los archivos monolíticos `messages/[locale].json` se consideran **LEGACY** y solo deben usarse como referencia de recuperación.
- **Contexto de Dominio**: Recordar que operamos en el sector de **Mantenimiento de Ascensores e Inteligencia Técnica**.

## Workflow

### Fase 1: Auditoría i18n
1. **Detección de Hardcoding**: Buscar textos literales en JSX o atributos (`placeholder`, `title`, etc.).
2. **Estructura de Namespacing**: 
   - No usar llaves planas. Usar jerarquía: `[namespace].[component/page].[key]`.
   - **REGLA DE ESTRUCTURA**: Secciones globales (ej: `spaces`, `security`, `search`, `admin`) DEBEN residir dentro del objeto raíz `"common"` para garantizar un namespacing consistente (`common.spaces.*`).
   - **PREVENCIÓN DE COLISIONES**: No puede existir una llave que sea a la vez un string y un objeto padre. Ej: No tener `common.spaces: "..."` si existen `common.spaces.title`. Esto causa `TypeError` en el frontend.
   - Ejemplo: `common.spaces.table.title`.
3. **Verificación de hook**: Asegurar uso de `useTranslations('namespace')` para scoping correcto.
4. **Terminología Profesional**: 
   - **CRÍTICO**: Asegurar que NO se usen términos técnicos de desarrollo como "RAG", "Vector", "Explorer", "Agentic", "Simulator".
   - **Usar en su lugar**: "Inteligencia Técnica", "Búsqueda Semántica", "Buscador", "Inteligente", "Simulador de Análisis".
   - **Términos del sector ascensores**: Mantener precisión técnica para "Hoistway", "Pit", "Sling", "Buffer", etc.
   - **Referencia**: Ver diccionarios en `messages/` secciones `user_dashboard`, `common.help`, `common.activities` para ejemplos de terminología aprobada.

### Fase 2: Auditoría de Accesibilidad (a11y)
1. **Semántica HTML**: Verificar uso de `<main>`, `<section>`, `<nav>`, `<header>`, `<h1>-<h6>`.
2. **Interactividad**: Asegurar que botones (`<button>`) y enlaces (`<a>`) tengan etiquetas descriptivas o `aria-label` si solo tienen iconos.
3. **Imágenes**: Verificar que toda etiqueta `<img>` o componente `Image` de Next.js tenga un `alt` descriptivo.
4. **Formularios**: Asegurar que cada `Input` tenga un `Label` asociado correctamente.
5. **SEO (Páginas Públicas)**: Verificar `metadata` (Title tag único, Meta description optimizada).

### Fase 3: Auditoría de Errores y Estados (UX Standard)
1. **Presentación de Errores (Toasts)**:
   - Toda acción asíncrona (save, delete, ingest) que falle DEBE mostrar un `toast` con `variant: "destructive"`.
   - El mensaje DEBE estar internacionalizado.
   - Referencia: `useWorkflowCRUD.ts`.
2. **Validación Visual de Reglas**:
   - Los errores lógicos o de integridad (ej: bucles en grafos, campos faltantes) DEBEN presentarse como **Badges** o **Warning Labels** sobre el elemento afectado.
   - Colores standard: Amber (`bg-amber-500`) para advertencias/huérfanos, Red (`bg-red-600`) para errores críticos/anomalías, Purple (`bg-purple-600`) para errores lógicos/ciclos.
   - Referencia: `ActionNode.tsx` (badges de bucle/desconexión).
3. **Detección de Anomalías**:
   - Desviaciones de datos (ej: tasa de error > 15%) DEBEN resaltarse con efectos visuales (`animate-pulse`) y etiquetas de "ANOMALÍA".
4. **Estados de Carga y Vacíos**:
   - Las listas DEBEN manejar el estado `isLoading` con esqueletos o mensajes de carga.
   - Las tablas vacías DEBEN mostrar un mensaje informativo claro (`t('table.empty')`).

### Fase 4: Ejecución de Mejoras
1. **Inyección de i18n**: Sustituir textos hardcodeados por `t('clave')`.
2. **Actualización de Diccionarios y Sanitización**: 
   - **CRÍTICO: ESTRUCTURA MODULAR**: 
     - ❌ **PROHIBIDO**: Editar `messages/es.json` o `messages/en.json` (archivos monolíticos legacy).
     - ✅ **OBLIGATORIO**: Usar archivos modulares en `messages/es/[namespace].json` y `messages/en/[namespace].json`.
     - Si el namespace no existe como archivo individual, **CRÉALO**.
   - **LIMPIEZA OBLIGATORIA**: Tras cualquier edición (manual o por IA), DEBES verificar la integridad del archivo json modular.
   - **MANDATORIO**: Tras añadir claves y validar el JSON, DEBES sincronizar con la base de datos y limpiar la caché de Redis ejecutando:
     ```bash
      npx tsx scripts/sync-i18n.ts [locale] to-db
     ```
     (donde `[locale]` es `es`, `en` o ambos).
3. **Refactorización a11y**: Añadir atributos ARIA missing y corregir jerarquía de etiquetas.
4. **Estandarización de Errores**: Implementar Toasts destructivos o Badges según el patrón de `/admin/workflows`.

## Instrucciones y Reglas
- **REGLA DE ORO #1**: No inventes traducciones.
- **REGLA DE ORO #2 (TERMINOLOGÍA PROFESIONAL)**: 
  - ❌ "RAG", "Vector Search", "Explorer".
  - ✅ "Inteligencia Técnica", "Búsqueda Semántica", "Buscador".
- **REGLA DE ORO #3 (PRESENTACIÓN DE ERRORES)**: Los errores no son solo logs. El usuario DEBE verlos mediante Toasts (acciones) o Badges (datos). Si el error es crítico para el negocio o la seguridad, DEBE registrarse además vía `AuditTrailService`.
- **REGLA DE ORO #4 (SALUD DEL DICCIONARIO)**: NUNCA permitas que crezcan bloques redundantes. Si detectas que el archivo JSON tiene una estructura irregular o se comporta de forma inconsistente, sánitizalo inmediatamente (`JSON.parse` -> `JSON.stringify`) antes de realizar cualquier cambio adicional.

## Output (formato exacto)
1. **Informe de Auditoría**: Tabla con "Problema", "Tipo (i18n/a11y/Error)" y "Gravedad".
2. **Plan de Acción**: Lista de cambios propuestos incluyendo las nuevas claves propuestas.
3. **Ejecución**: Código refactorizado y bloques de JSON para añadir.

## Manejo de Errores
- Si un componente usa estados complejos para textos dinámicos, recomienda mover esos textos a un archivo de constantes o directamente a los diccionarios.
- **ERROR: MISSING_MESSAGE**: Si detectas este error en runtime (pero las claves SÍ están en los JSON), es probable que el sistema de caché (Redis/DB) esté desincronizado. 
  - **SOLUCIÓN**: Consulta la skill `error-resolution-handler` e implementa la solución `i18n_missing_key`.
  - **COMANDO**: `npx tsx scripts/force-sync-i18n.ts [locale]`
