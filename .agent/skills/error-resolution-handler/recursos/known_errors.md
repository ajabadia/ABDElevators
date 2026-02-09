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
