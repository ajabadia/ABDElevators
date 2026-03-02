# 📐 Convenciones de Código — ABD RAG Platform (ERA 9)

> **Versión:** 1.0 | **Última actualización:** 2026-03-02

## 1. TypeScript

### Tipado Estricto
```typescript
// ✅ CORRECTO
const userId: string = session.user.id;
const count: number = await collection.countDocuments(query);

// ❌ PROHIBIDO (en lib/ y services/)
const data: any = await fetch('/api/...');
```

### Manejo de Errores
```typescript
// ✅ CORRECTO
try {
  await riskyOperation();
} catch (error: unknown) {
  if (error instanceof AppError) {
    return handleApiError(error, 'SOURCE', correlationId);
  }
  throw new AppError('INTERNAL_ERROR', 500, 'Operación fallida');
}

// ❌ PROHIBIDO
try { ... } catch (e) { console.log(e); }
```

### Imports
```typescript
// ✅ Usar alias de monorepo
import { AppError } from '@abd/platform-core';
import { getTenantCollection } from '@/lib/db-tenant';

// ❌ No usar rutas relativas profundas
import { AppError } from '../../../packages/platform-core/src/errors';
```

## 2. Patrones de API

### Estructura de Endpoint
```typescript
// PATRÓN ESTÁNDAR (ERA 9)
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { handleApiError } from '@/lib/errors';

async function METHOD_internal(request: Request) {
  const correlationId = globalThis.crypto.randomUUID(); // Edge-compatible
  try {
    const session = await enforcePermission('resource', 'action');
    // ... lógica con session para tenant isolation
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error, 'API_SOURCE', correlationId);
  }
}

export const METHOD = withPerformanceSLA(METHOD_internal, {
  endpoint: 'METHOD /api/path',
  thresholdMs: 500
});
```

### Respuestas Estandarizadas
```typescript
// Éxito
{ success: true, data: T, count?: number }

// Error
{ success: false, error: { code: string, message: string, details?: unknown } }
```

## 3. Base de Datos

### Acceso Multi-tenant
```typescript
// ✅ SIEMPRE usar SecureCollection via getTenantCollection
const collection = await getTenantCollection('workflow_tasks', session);
const tasks = await collection.find({ status: 'PENDING' });

// ❌ NUNCA acceso directo
const db = await connectDB();
db.collection('workflow_tasks').find({}); // ¡FALTA aislamiento!
```

### Transacciones
```typescript
// Para operaciones múltiples: SIEMPRE usar withTransaction
import { withTransaction } from '@/lib/db-tenant';

await withTransaction(async (mongoSession) => {
  await collection.insertOne(data, { session: mongoSession });
  await otherCollection.updateOne(filter, update, { session: mongoSession });
});
```

## 4. Crypto (Edge Runtime)

```typescript
// ✅ Usar globalThis.crypto (compatible con Edge Runtime de Vercel)
const id = globalThis.crypto.randomUUID();
const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));

// ❌ PROHIBIDO (rompe Edge Runtime)
import crypto from 'crypto';
crypto.randomUUID();
```

## 5. Internacionalización (i18n)

### Estructura de Archivos
```
messages/
  es/
    common.json       # Claves globales (breadcrumbs, actions, etc.)
    admin.json        # Panel de administración
    support.json      # Módulo de soporte
    operations.json   # Hub de operaciones
  en/
    common.json       # Mismo contenido, en inglés
    admin.json
    ...
```

### Uso en Componentes
```tsx
// Client Component
'use client';
import { useTranslations } from 'next-intl';
const t = useTranslations('common');
return <h1>{t('breadcrumbs.tasks')}</h1>;

// Server Component
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('admin');
```

### Reglas i18n
1. **Nunca** hardcodear texto visible al usuario
2. **Siempre** añadir clave en ES y EN simultáneamente
3. Usar `toast()` de `sonner` para notificaciones (nunca `use-toast`)
4. Los namespaces siguen la estructura de carpetas en `messages/`

## 6. React 19

```tsx
// ✅ ref como prop (React 19 — no forwardRef)
function Input({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}

// ✅ use(Context) en lugar de useContext
import { use } from 'react';
const value = use(MyContext);

// ✅ startTransition para updates no urgentes
import { startTransition } from 'react';
startTransition(() => setFilter(newFilter));

// ❌ PROHIBIDO
const MyInput = forwardRef((props, ref) => ...); // forwardRef obsoleto
```

## 7. Logging Estructurado

```typescript
await logEvento({
  level: 'INFO',                    // DEBUG | INFO | WARN | ERROR
  source: 'API_TASKS',             // Módulo origen
  action: 'TASK_CREATED',          // Acción realizada
  message: 'Tarea creada exitosamente',
  correlationId,                    // UUID único por request
  tenantId: session.user.tenantId,  // Aislamiento de tenant
  details: { taskId, priority },    // Objetos relevantes
});
```

## 8. Notificaciones UI

```typescript
// ✅ ÚNICO sistema autorizado
import { toast } from 'sonner';

toast.success('Operación exitosa');
toast.error('Error al procesar');
toast.loading('Procesando...', { id: 'my-toast' });

// ❌ PROHIBIDO
import { useToast } from '@/hooks/use-toast'; // NO USAR
```

## 9. Composición de Componentes

```tsx
// ✅ Compound Components (ERA 9)
<DataTable>
  <DataTable.Header columns={columns} />
  <DataTable.Body rows={data} />
  <DataTable.Pagination total={total} />
</DataTable>

// ❌ Prop drilling excesivo
<DataTable
  columns={columns}
  data={data}
  total={total}
  loading={loading}
  error={error}
  primary={true}
  showHeader={true}
  // ... explosión de props
/>
```

## 10. Performance

```typescript
// ✅ Paralelizar fetches independientes
const [users, tasks, stats] = await Promise.all([
  getUsers(tenantId),
  getTasks(tenantId),
  getStats(tenantId),
]);

// ❌ Cascada de promesas
const users = await getUsers(tenantId);
const tasks = await getTasks(tenantId);  // Espera innecesaria
const stats = await getStats(tenantId);  // Espera innecesaria
```

## 11. Testing

```typescript
// Archivo: tests/unit/MiServicio.test.ts
import { describe, it, expect, jest } from '@jest/globals';

describe('MiServicio', () => {
  it('should validate input with Zod', () => {
    expect(() => MiSchema.parse(invalidData)).toThrow();
  });

  it('should throw AppError on failure', async () => {
    await expect(miServicio.process(badInput))
      .rejects.toThrow(AppError);
  });
});
```
