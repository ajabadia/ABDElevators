---
description: Genera y estructura nuevos archivos (Componentes, APIs, Servicios) asegurando el cumplimiento de los estándares de ABD RAG Platform desde el inicio.
---

# Code Scaffolder - ABD RAG Platform

## Propósito

Esta skill proporciona **plantillas y reglas de construcción** para crear nuevos archivos en la plataforma. Su objetivo es garantizar que todo **código nuevo** nazca cumpliendo la "Definition of Done", minimizando la necesidad de correcciones posteriores por parte del auditor.

## Cuándo Usar

- **Siempre** que debas crear un archivo nuevo.
- Al implementar una nueva **Ruta API**.
- Al crear un nuevo **Componente React** o Página.
- Al definir un nuevo **Servicio de Dominio** o Worker.

## Proceso de Scaffolding

### 1. Identificar el Arquetipo
Determina qué estás construyendo:
- **API Route** (Secure, Validated, Logged)
- **Domain Service** (Typed, Resilient, Observable)
- **React Client Component** (Interactive, i18n, A11y)
- **React Server Component** (Data Fetching, Layout)

### 2. Seleccionar el Patrón (Templates)
Copia y adapta el esqueleto correspondiente. **NO** inventes estructuras nuevas si ya existe un estándar.

---

## 🏗️ Arquetipo 1: API Route (`app/api/.../route.ts`)

**Reglas de Oro**:
1. Seguridad primero (`auth`, `permissions`).
2. Validación estricta (`Zod`).
3. Manejo de errores centralizado (`AppError`).
4. Observabilidad (`logEvento`).

**Template Base**:
```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // Auth.js v5
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { crypto } from '@/lib/crypto'; // Si necesitas IDs

// 1. Zod Schema (Input Validation)
const RequestSchema = z.object({
  tenantId: z.string().uuid(),
  data: z.record(z.any()),
});

export async function POST(req: Request) {
  const correlationId = crypto.randomUUID();
  const session = await auth();

  // 2. Auth & RBAC Check
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 3. Request Parsing & Validation
    const body = await req.json();
    const validated = RequestSchema.parse(body);

    // 4. Permission Check (Granular)
    // await PermissionService.enforce(session.user.id, 'resource', 'write');

    // 5. Business Logic
    await logEvento({
      level: 'INFO',
      source: 'API_NEW_MODULE',
      action: 'PROCESS_START',
      correlationId,
      details: { user: session.user.email }
    });

    // ... call service ...

    return NextResponse.json({ success: true, id: correlationId });

  } catch (error: any) {
    // 6. Centralized Error Handling
    await logEvento({
      level: 'ERROR',
      source: 'API_NEW_MODULE',
      action: 'PROCESS_ERROR',
      correlationId,
      message: error.message,
      stack: error.stack
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', issues: error.issues }, { status: 400 });
    }
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    return NextResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
```

---

## 🏗️ Arquetipo 2: Domain Service (`lib/services/...`)

**Reglas de Oro**:
1. Singleton o falta de estado (Stateless).
2. Tipado fuerte (Return Types explícitos).
3. No mezcla lógica HTTP (Req/Res) con lógica de negocio.

**Template Base**:
```typescript
import { SecureCollection } from '@/lib/db'; // Siempre SecureCollection
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';

// Input/Output Types
export const InputSchema = z.object({ id: z.string() });
export type InputType = z.infer<typeof InputSchema>;

export class MyNewService {
  private static COLLECTION = 'my_collection';

  /**
   * Descripción de lo que hace el método.
   */
  static async executeAction(params: InputType, session?: any): Promise<void> {
    // 1. Validate (Double check for internal calls)
    const { id } = InputSchema.parse(params);

    try {
      const db = await SecureCollection.get(this.COLLECTION);
      
      // 2. DB Operation
      await db.updateOne(
        { _id: id },
        { $set: { updatedAt: new Date() } },
        { session }
      );

      // 3. Audit Trail (if critical)
      // await AuditTrailService.record(...)

    } catch (error: any) {
      // 4. Wrap & Throw AppError
      throw new AppError('SERVICE_OP_FAILED', 500, error.message);
    }
  }
}
```

---

## 🏗️ Arquetipo 3: React Client Component (`components/...`)

**Reglas de Oro**:
1. `useTranslations` para todo texto visible.
2. Accesibilidad (`aria-label`, headings correctos).
3. `useApiItem` o `useApiList` para data fetching (standard hooks).
4. `toast` para feedback de usuario.

**Template Base**:
```tsx
"use client";

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  initialData?: any;
}

export function MyNewComponent({ initialData }: Props) {
  const t = useTranslations('myModule.namespace'); // Namespace específico
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      // Logic
      toast.success(t('success_message'));
    } catch (err) {
      toast.error(t('error_message'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" role="region" aria-label={t('title')}>
          <p className="text-muted-foreground">{t('description')}</p>
          
          <Button 
            onClick={handleAction} 
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? t('processing') : t('action_button')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🏗️ Arquetipo 4: React Server Page (`app/.../page.tsx`)

**Reglas de Oro**:
1. `getTranslations` para i18n server-side.
2. Metadata dinámica.
3. `PageContainer` y `PageHeader` para consistencia visual.

**Template Base**:
```tsx
import { getTranslations } from 'next-intl/server';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { MyNewComponent } from '@/components/my-new-component';

export async function generateMetadata() {
  const t = await getTranslations('myModule.page');
  return {
    title: t('meta_title'),
    description: t('meta_desc')
  };
}

export default async function NewPage() {
  const t = await getTranslations('myModule.page');

  return (
    <PageContainer>
      <PageHeader 
        title={t('title')} 
        description={t('description')} 
        breadcrumbs={[{ label: t('breadcrumb'), href: '#' }]}
      />
      
      <div className="mt-6">
        <MyNewComponent />
      </div>
    </PageContainer>
  );
}
```

---

## Validación Post-Creación

Una vez generado el archivo, **ejecuta mentalmente** la skill `code-quality-auditor` sobre él:
- ¿He validado inputs?
- ¿He manejado errores con `AppError`?
- ¿Están todos los textos en `messages/es/|en/...`?
- ¿Es accesible?

Si la respuesta es SÍ, has completado el scaffolding correctamente.
