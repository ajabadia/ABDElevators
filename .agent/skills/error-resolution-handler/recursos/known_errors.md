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
    1. Verificar que la clave existe en el archivo correspondiente: `messages/{locale}/{namespace}.json`.
    2. Verificar que el código llama a la clave exacta.
    3. **Si el error persiste**: Ejecutar `npx tsx scripts/sync-i18n.mts [locale] to-db` para forzar la sincronización de archivos locales a la Base de Datos y limpiar la caché de Redis.
       - *Nota*: La arquitectura de i18n prioriza Redis > DB > Archivos. Si Redis tiene una versión antigua, el cambio en archivo no se reflejará hasta que expire el TTL o se invalide manualmente.

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

### 4. React Hook Order Violation
- **ID**: `react_hook_order_violation`
- **Patrón**: `React has detected a change in the order of Hooks` o `Rendered more hooks than during the previous render`
- **Causa**:
    1. Llamar a un hook después de una sentencia `return` (retorno temprano).
    2. Llamar a un hook dentro de un `if`, `for` o función anidada.
    3. En `AppSidebar.tsx`, el hook `useNavigationStore` estaba después de la verificación de `mounted`.
- **Solución**:
    1. Reubicar todos los hooks (`useContext`, `useMemo`, `useState`, etc.) al nivel superior del componente, antes de cualquier lógica de control de flujo o retornos condicionales.
    2. **Impacto en Red**: Estos errores de React suelen manifestarse como "Failed to fetch" en el navegador si ocurren en layouts globales, ya que el crash interrumpe el ciclo de renderizado y aborta las peticiones pendientes.
    3. Verificar con `npx next build` para asegurar que las reglas de hooks se cumplen estáticamente.
### 5. TYPE_ERROR: toArray is not a function (DB Proxy)
- **ID**: `db_proxy_to_array_async_collision`
- **Patrón**: `usageLogsCol.aggregate\(...\).toArray is not a function` o `.*\.find\(...\).toArray is not a function`
- **Causa**:
    1. Se ha modificado el Proxy de aislamiento multi-tenant (`db-tenant.ts`) para interceptar métodos.
    2. Al usar un wrapper `async` en el Proxy para métodos que originalmente retornan un `Cursor` síncrono (como `find` o `aggregate`), el driver retorna una `Promise<Cursor>`.
    3. Una `Promise` no tiene el método `.toArray()`, lo que causa el crash en tiempo de ejecución.
- **Solución**:
    1. **Restaurar Sincronicidad**: Modificar el Proxy para que los métodos de tipo Cursor (`find`, `aggregate`) no sean interceptados con funciones `async`.
    2. **Sanitización Síncrona**: Utilizar `MongoSanitizer.sanitizeQuerySync` para asegurar la seguridad de la consulta sin interrumpir el flujo del driver de MongoDB.
    3. **Validación**: Asegurar que las llamadas en los servicios (e.g., `DashboardService`) realicen el `.toArray()` sobre el objeto retornado síncronamente por el Proxy.
