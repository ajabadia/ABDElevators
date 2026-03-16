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

### 6. DB_SCHEMA_MISMATCH: Schema vs Database Field Naming
- **ID**: `db_schema_mismatch`
- **Patrón**: `Invalid input: expected string, received ObjectId` o `TENANT_CONFIG_ERROR` con código 400
- **Causa**:
    1. MongoDB almacena campos en **snake_case** (e.g., `quota_bytes`, `folder_prefix`) o en **español** (e.g., `tipo`, `valor`, `correlacion_id`), mientras que los schemas Zod esperan **camelCase** en inglés.
    2. MongoDB `_id` es un `ObjectId` nativo, pero schemas como `TenantConfigSchema` esperan un `string` (vía `TenantIdSchema`/`EntityIdSchema`).
    3. Esto causa fallos silenciosos: el `BrandingProvider` crashea, las métricas de `UsageService` devuelven 0, y el HMR loop se dispara.
- **Solución**:
    1. **`z.preprocess`**: Añadir una función de preprocesamiento al schema para mapear `_id` a string y campos snake_case a camelCase antes de la validación.
    2. **`.passthrough()`**: Usar `.passthrough()` en el schema base para no rechazar campos extra del documento MongoDB.
    3. **Queries duales**: En agregaciones MongoDB (`$match`, `$group`), usar `$or` para `type`/`tipo` y `$ifNull` para `$value`/`$valor`.
### 7. KNOWLEDGE_STATUS_MISMATCH: Spanish vs English Strings
- **ID**: `knowledge_status_mismatch`
- **Patrón**: Los filtros de documentos devuelven 0 resultados o la actualización de estado falla silenciosamente.
- **Causa**: Discrepancia entre valores en español (`vigente`, `obsoleto`) y constantes en inglés (`ACTIVE`, `ARCHIVED`).
- **Solución**: Estandarizar a `AssetStatus` (`DRAFT`, `ACTIVE`, `ARCHIVED`). Actualizar `AssetControls.tsx` (value props) y API `status/route.ts` (Zod enum).

### 8. DB_TENANT_SESSION_MISSING: Missing Session in getTenantCollection
- **ID**: `db_tenant_session_missing`
- **Patrón**: `Expected 2-3 arguments, but got 1` (lint) o fallos de aislamiento multi-tenant.
- **Causa**: Llamar a `getTenantCollection` sin pasar el objeto `session` obtenido de `requirePermission` o `auth`. El Proxy no puede inyectar el `tenantId` sin la sesión.
- **Solución**: Siempre heredar la `session` desde el punto de entrada (API Route / Server Action) hacia los servicios.
- **Archivos afectados**: `FeedbackService.ts`, `ContactService.ts`, `TechnicalStatsService.ts`.

### 9. RUNTIME_ERROR: crypto is not defined
- **ID**: `runtime_crypto_missing`
- **Patrón**: `ReferenceError: crypto is not defined` al usar `crypto.randomUUID()`.
- **Causa**: Uso de `crypto.randomUUID()` en entornos Node.js sin importación explícita de `node:crypto`.
- **Solución**: Añadir `import crypto from 'node:crypto';` en la cabecera del archivo.

### 10. TYPE_ERROR: Converting circular structure to JSON
- **ID**: `circular_structure_json`
- **Patrón**: `TypeError: Converting circular structure to JSON` o `starting at object with constructor 'HTMLButtonElement'`
- **Causa**: Pasar directamente una función que acepta argumentos opcionales a un `onClick` de React. React inyecta el objeto `event` como primer argumento. Si la función intenta hacer `JSON.stringify` de sus argumentos (común en llamadas `fetch`), falla por las referencias circulares internas del DOM/Fiber.
- **Solución**:
    1. **Wrapper en UI**: Cambiar `onClick={handler}` por `onClick={() => handler()}` para asegurar que no se pase el evento.
    2. **Defensa en Hook**: Validar que el argumento sea del tipo esperado antes de usarlo (ej: `const val = (typeof arg === 'string') ? arg : undefined`).
    3. **Tipado Estricto**: Evitar firmas como `(arg?: string) => void` si se va a usar directamente en eventos, o manejar el tipo `React.MouseEvent` explícitamente.
