import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { ChecklistConfigSchema } from '@/lib/schemas';
import { AppError, ValidationError, DatabaseError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';

/**
 * GET /api/admin/configs-checklist
 * Lista todas las configuraciones de checklist del tenant.
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenantId = (session.user as any).tenantId || 'default_tenant';
        const db = await connectDB();
        const configs = await db.collection('configs_checklist')
            .find({ tenantId })
            .sort({ creado: -1 })
            .toArray();

        return NextResponse.json({ configs });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_ADMIN_CONFIGS_CHECKLIST',
            accion: 'GET_ALL',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al obtener configuraciones').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 500) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_ADMIN_CONFIGS_CHECKLIST',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `GET /api/admin/configs-checklist tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}

/**
 * POST /api/admin/configs-checklist
 * Crea una nueva configuración de checklist.
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenantId = (session.user as any).tenantId || 'default_tenant';
        const body = await req.json();

        // Inyectar tenantId si no viene
        const configToValidate = {
            ...body,
            tenantId,
            creado: new Date(),
            actualizado: new Date()
        };

        const validated = ChecklistConfigSchema.parse(configToValidate);
        const db = await connectDB();

        const result = await db.collection('configs_checklist').insertOne(validated);

        await logEvento({
            nivel: 'INFO',
            origen: 'API_ADMIN_CONFIGS_CHECKLIST',
            accion: 'CREATE',
            mensaje: `Configuración de checklist creada: ${validated.nombre}`,
            correlacion_id,
            detalles: { tenantId, config_id: result.insertedId }
        });

        return NextResponse.json({ success: true, config_id: result.insertedId });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Datos de configuración inválidos', error.errors).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_ADMIN_CONFIGS_CHECKLIST',
            accion: 'CREATE_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al crear configuración').toJSON(),
            { status: 500 }
        );
    }
}
