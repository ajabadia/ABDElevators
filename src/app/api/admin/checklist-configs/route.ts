import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { enforcePermission } from '@/lib/guardian-guard';
import { logEvento } from '@/lib/logger';
import { ChecklistConfigSchema } from '@/lib/schemas';
import { AppError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';
import { z } from 'zod';

/**
 * GET /api/admin/checklist-configs
 * Lista todas las configuraciones de checklist del tenant.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        await enforcePermission('checklists', 'read');
        const collection = await getTenantCollection('configs_checklist');

        const configs = await (collection.find({}, {
            sort: { creado: -1 } as any
        }) as any).toArray();

        return NextResponse.json({ configs });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_CHECKLIST_CONFIGS',
            action: 'GET_ALL',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al obtener configuraciones').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_CHECKLIST_CONFIGS',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `GET /api/admin/checklist-configs took ${duration}ms`,
                correlationId,
                details: { duration_ms: duration }
            });
        }
    }
}

/**
 * POST /api/admin/checklist-configs
 * Crea una nueva configuración de checklist.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await enforcePermission('checklists', 'write');
        const body = await req.json();

        // Inyectar metadatos
        const configToValidate = {
            ...body,
            tenantId: session.user.tenantId,
            creado: new Date(),
            actualizado: new Date()
        };

        const validated = ChecklistConfigSchema.parse(configToValidate);
        const collection = await getTenantCollection('configs_checklist');

        const result = await collection.insertOne(validated as any);

        await logEvento({
            level: 'INFO',
            source: 'API_CHECKLIST_CONFIGS',
            action: 'CREATE',
            message: `Checklist config created: ${validated.name}`,
            correlationId,
            details: { tenantId: session.user.tenantId, config_id: result.insertedId }
        });

        return NextResponse.json({ success: true, config_id: result.insertedId });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                new ValidationError('Datos de configuración inválidos', error.issues).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_CHECKLIST_CONFIGS',
            action: 'CREATE_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al crear configuración').toJSON(),
            { status: 500 }
        );
    }
}
