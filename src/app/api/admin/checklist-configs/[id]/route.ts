import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { requirePermission } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { ChecklistConfigSchema } from '@/lib/schemas';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * GET /api/admin/checklist-configs/[id]
 */
async function GET_internal (req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
        return NextResponse.json(
            new ValidationError('ID inválido', []).toJSON(),
            { status: 400 }
        );
    }

    try {
        const session = await requirePermission('checklists', 'read');
        const collection = await getTenantCollection('checklist_configs', session);

        const config = await collection.findOne({
            _id: new ObjectId(id)
        });

        if (!config) {
            throw new NotFoundError(`Configuración ${id} no encontrada`);
        }

        return NextResponse.json({ config });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al obtener configuración').toJSON(),
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/checklist-configs/[id]
 */
async function PATCH_internal (req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const correlationId = crypto.randomUUID();

    if (!ObjectId.isValid(id)) {
        return NextResponse.json(
            new ValidationError('ID inválido', []).toJSON(),
            { status: 400 }
        );
    }

    try {
        const session = await requirePermission('checklists', 'write');
        const body = await req.json();

        const collection = await getTenantCollection('checklist_configs', session);

        const updateData = {
            ...body,
            actualizado: new Date()
        };

        const validated = ChecklistConfigSchema.partial().parse(updateData);

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: validated }
        );

        if (result.matchedCount === 0) {
            throw new NotFoundError(`Configuración ${id} no encontrada`);
        }

        await logEvento({
            level: 'INFO',
            source: 'API_CHECKLIST_CONFIGS_ID',
            action: 'UPDATE',
            message: `Checklist config updated: ${id}`,
            correlationId,
            details: { tenantId: session.user.tenantId, config_id: id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                new ValidationError('Datos de actualización inválidos', error.issues).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al actualizar configuración').toJSON(),
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/checklist-configs/[id]
 */
async function DELETE_internal (req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const correlationId = crypto.randomUUID();

    if (!ObjectId.isValid(id)) {
        return NextResponse.json(
            new ValidationError('ID inválido', []).toJSON(),
            { status: 400 }
        );
    }

    try {
        const session = await requirePermission('checklists', 'write');
        const collection = await getTenantCollection('checklist_configs', session);

        const result = await collection.deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            throw new NotFoundError(`Configuración ${id} no encontrada`);
        }

        await logEvento({
            level: 'INFO',
            source: 'API_CHECKLIST_CONFIGS_ID',
            action: 'DELETE',
            message: `Checklist config deleted: ${id}`,
            correlationId,
            details: { tenantId: session.user.tenantId, config_id: id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al eliminar configuración').toJSON(),
            { status: 500 }
        );
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/checklist-configs/[id]', thresholdMs: 1000 });

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/checklist-configs/[id]', thresholdMs: 1000 });

export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'DELETE /api/admin/checklist-configs/[id]', thresholdMs: 1000 });
