import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { UpdateProfileSchema } from '@/lib/schemas';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/auth/perfil
 * Obtiene el perfil del usuario autenticado.
 * SLA: P95 < 300ms
 */
export async function GET() {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const db = await connectDB();
        const user = await db.collection('usuarios').findOne({ email: session.user.email });

        if (!user) {
            throw new NotFoundError('Usuario no encontrado');
        }

        const { password, ...safeUser } = user;
        return NextResponse.json(safeUser);
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_PERFIL',
            accion: 'GET_PROFILE_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al obtener perfil').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 300) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_PERFIL',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `GET /api/auth/perfil tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}

/**
 * PATCH /api/auth/perfil
 * Actualiza el perfil del usuario autenticado.
 * SLA: P95 < 500ms
 */
export async function PATCH(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await req.json();

        // REGLA #2: Zod Validation BEFORE Processing
        const validated = UpdateProfileSchema.parse(body);

        const db = await connectDB();

        const updateData = {
            ...validated,
            modificado: new Date()
        };

        const result = await db.collection('usuarios').updateOne(
            { email: session.user.email },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            throw new NotFoundError('Usuario no encontrado');
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'API_PERFIL',
            accion: 'UPDATE_PROFILE',
            mensaje: `Perfil actualizado para ${session.user.email}`,
            correlacion_id,
            detalles: { updatedFields: Object.keys(validated) }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Datos de perfil inválidos', error.errors).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_PERFIL',
            accion: 'UPDATE_PROFILE_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al actualizar perfil').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 500) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_PERFIL',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `PATCH /api/auth/perfil tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
