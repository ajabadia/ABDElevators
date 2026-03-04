import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { connectAuthDB } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logEvento } from '@/lib/logger';
import { ChangePasswordSchema } from '@/lib/schemas';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

/**
 * POST /api/auth/cambiar-password
 * Cambia la contraseña del usuario autenticado.
 * SLA: P95 < 1000ms (debido al hashing de bcrypt)
 */
async function POST_internal(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await enforcePermission('profile', 'write');

        const body = await req.json();

        // REGLA #2: Zod Validation BEFORE Processing
        const validated = ChangePasswordSchema.parse(body);

        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: session.user.email });

        if (!user) {
            throw new NotFoundError('Usuario no encontrado');
        }

        // Verificar contraseña actual
        const isPasswordCorrect = await bcrypt.compare(validated.currentPassword, user.password);
        if (!isPasswordCorrect) {
            throw new ValidationError('La contraseña actual es incorrecta');
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

        await authDb.collection('users').updateOne(
            { email: session.user.email },
            {
                $set: {
                    password: hashedPassword,
                    modificado: new Date()
                }
            }
        );

        await logEvento({
            level: 'INFO',
            source: 'API_PERFIL',
            action: 'CHANGE_PASSWORD',
            message: `Contraseña cambiada para ${session.user.email}`, correlationId: correlacion_id
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                new ValidationError('Datos de contraseña inválidos', error.issues).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_PERFIL',
            action: 'CHANGE_PASSWORD_ERROR',
            message: error instanceof Error ? error.message : 'Unknown change password error',
            correlationId: correlacion_id,
            details: { stack: error instanceof Error ? error.stack : undefined }
        });

        const message = error instanceof Error ? error.message : 'Error al cambiar contraseña';
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, message).toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 1000) {
            await logEvento({
                level: 'WARN',
                source: 'API_PERFIL',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `POST /api/auth/cambiar-password tomó ${duracion}ms`,
                correlationId: correlacion_id,
                details: { duracion_ms: duracion }
            });
        }
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/auth/change-password', thresholdMs: 1000 });
