import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { AdminUpdateUserSchema } from '@/lib/schemas';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * PATCH /api/admin/usuarios/[id]
 * Actualiza datos de un usuario (solo ADMIN)
 * SLA: P95 < 400ms
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id } = await params;
        const body = await req.json();

        // REGLA #2: Zod Validation BEFORE Processing
        const validated = AdminUpdateUserSchema.parse(body);

        const db = await connectDB();

        const updateData: any = {
            ...validated,
            modificado: new Date()
        };

        const result = await db.collection('usuarios').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            throw new NotFoundError('Usuario no encontrado');
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'API_ADMIN_USUARIOS',
            accion: 'UPDATE_USER',
            mensaje: `Usuario actualizado: ${id}`,
            correlacion_id,
            detalles: { userId: id, updatedFields: Object.keys(validated) }
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

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_ADMIN_USUARIOS',
            accion: 'UPDATE_USER_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al actualizar usuario').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 400) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_ADMIN_USUARIOS',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `PATCH /api/admin/usuarios/[id] tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}

/**
 * GET /api/admin/usuarios/[id]
 * Obtiene un usuario por ID
 * SLA: P95 < 200ms
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id } = await params;
        const db = await connectDB();
        const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(id) });

        if (!usuario) {
            throw new NotFoundError('Usuario no encontrado');
        }

        const { password, ...safeUser } = usuario;
        return NextResponse.json(safeUser);
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_ADMIN_USUARIOS',
            accion: 'GET_USER_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error del servidor').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 200) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_ADMIN_USUARIOS',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `GET /api/admin/usuarios/[id] tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
