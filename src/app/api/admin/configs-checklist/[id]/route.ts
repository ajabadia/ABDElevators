import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { ChecklistConfigSchema } from '@/lib/schemas';
import { AppError, ValidationError, DatabaseError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';

/**
 * GET /api/admin/configs-checklist/[id]
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenantId = (session.user as any).tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }
        const db = await connectDB();

        const config = await db.collection('configs_checklist').findOne({
            _id: new ObjectId(id),
            tenantId
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
 * PATCH /api/admin/configs-checklist/[id]
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenantId = (session.user as any).tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }
        const body = await req.json();

        const db = await connectDB();

        // Verificar existencia y pertenencia
        const existing = await db.collection('configs_checklist').findOne({
            _id: new ObjectId(id),
            tenantId
        });

        if (!existing) {
            throw new NotFoundError(`Configuración ${id} no encontrada`);
        }

        const updateData = {
            ...body,
            tenantId,
            actualizado: new Date()
        };

        const validated = ChecklistConfigSchema.partial().parse(updateData);

        await db.collection('configs_checklist').updateOne(
            { _id: new ObjectId(id) },
            { $set: validated }
        );

        await logEvento({
            nivel: 'INFO',
            origen: 'API_ADMIN_CONFIGS_CHECKLIST_ID',
            accion: 'UPDATE',
            mensaje: `Configuración de checklist actualizada: ${id}`,
            correlacion_id,
            detalles: { tenantId, config_id: id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Datos de actualización inválidos', error.errors).toJSON(),
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
 * DELETE /api/admin/configs-checklist/[id]
 */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenantId = (session.user as any).tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }
        const db = await connectDB();

        const result = await db.collection('configs_checklist').deleteOne({
            _id: new ObjectId(id),
            tenantId
        });

        if (result.deletedCount === 0) {
            throw new NotFoundError(`Configuración ${id} no encontrada`);
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'API_ADMIN_CONFIGS_CHECKLIST_ID',
            accion: 'DELETE',
            mensaje: `Configuración de checklist eliminada: ${id}`,
            correlacion_id,
            detalles: { tenantId, config_id: id }
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
