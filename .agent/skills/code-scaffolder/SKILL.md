---
description: Guía paso a paso para crear nuevas rutas, servicios o componentes siguiendo los estándares de ABD RAG Platform desde el inicio.
---

# Code Scaffolder - ABD RAG Platform

## Propósito

Esta skill proporciona **plantillas y guías** para crear nuevas rutas, servicios o componentes desde cero, asegurando que cumplan con todos los estándares de ABD RAG Platform **desde el primer momento**.

## Cuándo Usar

- **Antes de crear** una nueva ruta API
- **Antes de crear** un nuevo servicio de dominio
- **Antes de crear** una nueva página o componente React
- **Cuando necesites** una plantilla completa que ya cumpla todos los estándares

## Plantillas Disponibles

### 1. API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import crypto from 'crypto';

// 1. Define Zod Schema
const RequestSchema = z.object({
    // TODO: Define your schema
    name: z.string().min(1),
    description: z.string().optional(),
});

/**
 * [OPERATION_NAME]
 * SLA: P95 < [TIME]ms
 */
export async function [METHOD](req: NextRequest) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        // 2. Rate Limiting (if needed)
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        await checkRateLimit(ip, LIMITS.CORE);

        // 3. Authentication & Authorization
        const user = await enforcePermission('[resource]', '[action]');

        // 4. Validate Input
        const body = await req.json();
        const validated = RequestSchema.parse(body);

        // 5. Get Tenant Collection
        const { auth } = await import('@/lib/auth');
        const session = await auth();
        const collection = await getTenantCollection('[collection_name]', session);

        // 6. Business Logic
        // TODO: Implement your logic here

        // 7. Log Success
        await logEvento({
            level: 'INFO',
            source: '[API_MODULE]',
            action: '[OPERATION]_SUCCESS',
            message: `[Operation] completed successfully`,
            correlationId,
            tenantId: user.tenantId,
            details: { /* relevant data */ }
        });

        // 8. Return Response
        return NextResponse.json({
            success: true,
            data: { /* your data */ },
            correlationId
        });

    } catch (error: any) {
        // 9. Error Handling
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                code: 'VALIDATION_ERROR',
                message: 'Invalid input',
                details: error.issues
            }, { status: 400 });
        }

        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: '[API_MODULE]',
            action: '[OPERATION]_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Something went wrong').toJSON(),
            { status: 500 }
        );
    } finally {
        // 10. Performance Monitoring
        const duration = Date.now() - start;
        if (duration > [SLA_MS]) {
            await logEvento({
                level: 'WARN',
                source: '[API_MODULE]',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `Operation slow: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
```

### 2. Domain Service Template

```typescript
import { logEvento } from '@/lib/logger';
import { AppError, ExternalServiceError } from '@/lib/errors';
import { executeWithResilience } from '@/lib/resilience';
import { AuditService } from '@/lib/audit-service';
import { z } from 'zod';

// 1. Define Schemas
const InputSchema = z.object({
    // TODO: Define your input schema
});

const OutputSchema = z.object({
    // TODO: Define your output schema
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

/**
 * [SERVICE_NAME]
 * Handles [DESCRIPTION]
 */
export class [ServiceName] {
    /**
     * [METHOD_DESCRIPTION]
     */
    static async [methodName](input: Input): Promise<Output> {
        const correlationId = AuditService.generateCorrelationId();

        // 2. Validate Input
        const validated = InputSchema.parse(input);

        await logEvento({
            level: 'INFO',
            source: '[SERVICE_NAME]',
            action: '[OPERATION]_START',
            message: `Starting [operation]`,
            correlationId,
            details: { /* relevant data */ }
        });

        try {
            // 3. Business Logic with Resilience
            const result = await executeWithResilience(
                async () => {
                    // TODO: Implement your logic
                    return { /* your result */ };
                },
                {
                    maxRetries: 3,
                    timeout: 5000,
                    onRetry: (attempt, error) => {
                        logEvento({
                            level: 'WARN',
                            source: '[SERVICE_NAME]',
                            action: 'RETRY_ATTEMPT',
                            message: `Retry attempt ${attempt}: ${error.message}`,
                            correlationId
                        });
                    }
                }
            );

            // 4. Validate Output
            const validatedOutput = OutputSchema.parse(result);

            // 5. Audit Trail (if needed)
            await AuditService.record({
                tenantId: validated.tenantId,
                userId: validated.userId,
                action: '[OPERATION]',
                resourceType: '[RESOURCE_TYPE]',
                resourceId: '[RESOURCE_ID]',
                status: 'SUCCESS',
                correlationId,
                metadata: { /* relevant data */ }
            });

            await logEvento({
                level: 'INFO',
                source: '[SERVICE_NAME]',
                action: '[OPERATION]_SUCCESS',
                message: `[Operation] completed successfully`,
                correlationId
            });

            return validatedOutput;

        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: '[SERVICE_NAME]',
                action: '[OPERATION]_FAILED',
                message: error.message,
                correlationId,
                stack: error.stack
            });

            throw new ExternalServiceError(
                `[Operation] failed: ${error.message}`,
                error
            );
        }
    }
}
```

### 3. React Page Template (Server Component)

```typescript
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageContainer, PageHeader, ContentCard } from '@/components/ui';

export default async function [PageName]() {
    // 1. Authentication
    const session = await auth();
    if (!session) {
        redirect('/login');
    }

    // 2. i18n
    const t = await getTranslations('[namespace]');

    // 3. Data Fetching (if needed)
    // const data = await fetchData();

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                description={t('description')}
            />

            <ContentCard>
                {/* TODO: Implement your UI */}
            </ContentCard>
        </PageContainer>
    );
}

// 4. Metadata
export async function generateMetadata() {
    const t = await getTranslations('[namespace]');
    return {
        title: t('metaTitle'),
        description: t('metaDescription'),
    };
}
```

### 4. React Component Template (Client Component)

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/components/ui';
import { toast } from 'sonner';

interface [ComponentName]Props {
    // TODO: Define your props
}

export function [ComponentName]({ /* props */ }: [ComponentName]Props) {
    // 1. i18n
    const t = useTranslations('[namespace]');

    // 2. State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 3. Handlers
    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // TODO: Implement your logic
            const response = await fetch('/api/...', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ /* data */ })
            });

            if (!response.ok) {
                throw new Error(t('errors.failed'));
            }

            toast.success(t('success'));
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div role="region" aria-label={t('ariaLabel')}>
            {/* TODO: Implement your UI */}
            
            {isLoading && (
                <div aria-live="polite" aria-busy="true">
                    {t('loading')}
                </div>
            )}

            {error && (
                <div role="alert" aria-live="assertive">
                    {error}
                </div>
            )}
        </div>
    );
}
```

---

## Guía de Uso

### Para Crear una Nueva API Route

1. **Copia la plantilla** de API Route
2. **Reemplaza los TODOs**:
   - `[METHOD]`: GET, POST, PUT, DELETE
   - `[OPERATION_NAME]`: Nombre descriptivo
   - `[TIME]`: SLA en ms (200, 500, 2000)
   - `[resource]`, `[action]`: Para `enforcePermission`
   - `[collection_name]`: Nombre de la colección MongoDB
   - `[API_MODULE]`: Identificador del módulo (ej. `API_KNOWLEDGE_ASSETS`)
3. **Define el schema Zod** con los campos necesarios
4. **Implementa la lógica** en la sección "Business Logic"
5. **Añade rate limiting** si es una ruta sensible
6. **Verifica** con `code-quality-auditor` antes de commit

### Para Crear un Nuevo Servicio

1. **Copia la plantilla** de Domain Service
2. **Reemplaza los TODOs**:
   - `[SERVICE_NAME]`: Nombre del servicio
   - `[ServiceName]`: Clase del servicio
   - `[methodName]`: Nombre del método
   - `[DESCRIPTION]`: Descripción del servicio
3. **Define schemas** de entrada y salida
4. **Implementa la lógica** con resiliencia si llama a externos
5. **Añade audit trail** si es una operación crítica
6. **Verifica** con `code-quality-auditor`

### Para Crear una Nueva Página

1. **Copia la plantilla** de React Page (Server o Client según necesites)
2. **Reemplaza los TODOs**:
   - `[PageName]`: Nombre de la página
   - `[namespace]`: Namespace i18n
3. **Añade las traducciones** en `es.json` y `en.json`
4. **Implementa la UI** usando componentes del sistema
5. **Verifica accesibilidad** (labels, roles, aria)
6. **Verifica** con `i18n-a11y-auditor`

---

## Checklist Pre-Creación

Antes de crear cualquier archivo nuevo, asegúrate de:

- [ ] Tener claro el **propósito** y **responsabilidad** del archivo
- [ ] Conocer el **SLA** esperado (si es API)
- [ ] Saber qué **permisos** se requieren
- [ ] Tener definidos los **schemas Zod** de entrada/salida
- [ ] Conocer las **colecciones MongoDB** que usarás
- [ ] Tener las **traducciones i18n** preparadas (si es UI)
- [ ] Saber si necesitas **rate limiting** o **resilience**

---

## Integración con Otras Skills

- **code-quality-auditor**: Usa después de crear el archivo para verificar cumplimiento
- **app-full-reviewer**: Usa para auditoría completa de la feature
- **guardian-auditor**: Usa para verificar permisos correctos
- **i18n-a11y-auditor**: Usa para verificar i18n y accesibilidad en UI

---

## Notas Finales

Estas plantillas son **punto de partida**, no código final. Siempre:
- **Adapta** a tu caso de uso específico
- **Elimina** secciones que no necesites
- **Añade** lógica específica de tu dominio
- **Verifica** con `code-quality-auditor` antes de commit

El objetivo es **empezar bien** para no tener que refactorizar después.
