# Base de Conocimientos de Errores (KB)

## Índice de Errores Conocidos

### 1. MISSING_MESSAGE: Could not resolve `key` in messages
- **ID**: `i18n_missing_key`
- **Patrón**: `MISSING_MESSAGE: Could not resolve .* in messages for locale`
- **Causa**:
    1. La clave no existe en el archivo JSON del locale.
    2. Problema de caché en `next-intl` o Turbopack que no detecta cambios recientes en los JSON.
    3. Error tipográfico en el código (`navigation.ts`, componentes) que no coincide con el JSON.
- **Solución**:
    1. Verificar que la clave existe en `messages/{locale}.json`.
    2. Verificar que el código llama a la clave exacta.
    3. **Si el error persiste**: Ejecutar `npx tsx scripts/force-sync-i18n.ts [locale]` para forzar la sincronización de archivos locales a la Base de Datos y limpiar la caché de Redis.
       - *Nota*: La arquitectura de i18n prioriza Redis > DB > Archivos. Si Redis tiene una versión antigua, el cambio en archivo no se reflejará hasta que expire el TTL o se invalide manualmente. Este script carga `.env` y `.env.local` manualmente para asegurar conexión.

### 2. EXPORT_MISSING: Export X doesn't exist in target module
- **ID**: `build_export_missing_schemas`
- **Patrón**: `Export .* doesn't exist in target module` o `The export .* was not found in module`
- **Causa**:
    1. El archivo es demasiado grande (>1000 líneas), causando que Turbopack o el compilador de TS tenga problemas de consistencia en el cache de símbolos.
    2. El esquema existe físicamente pero no se exporta correctamente o hay una definición circular oculta.
    3. **DocumentTypeSchema** específicamente tendía a desaparecer del cache tras ediciones rápidas.
- **Solución**:
    1. **Modularización**: Se ha refactorizado `src/lib/schemas.ts` en una estructura de directorio `src/lib/schemas/*.ts`.
    2. **Orquestador en index.ts**: El archivo `src/lib/schemas.ts` debe ELIMINARSE y sustituirse por `src/lib/schemas/index.ts`. Esto evita conflictos de resolución en Turbopack entre un archivo y un directorio con el mismo nombre base.
    3. **Re-exportación Explícita**: Para símbolos críticos como `DocumentTypeSchema`, usar `export { X } from './module'` en el `index.ts` además del `export *` para garantizar la descubribilidad estática.
    4. Limpiar cache de Next.js: `rm -rf .next` y reiniciar el servidor de desarrollo.
