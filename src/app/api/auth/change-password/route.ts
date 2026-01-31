import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectAuthDB } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logEvento } from '@/lib/logger';
import { ChangePasswordSchema } from '@/lib/schemas';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * POST /api/auth/cambiar-password
 * Cambia la contraseña del usuario autenticado.
 * SLA: P95 < 1000ms (debido al hashing de bcrypt)
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await req.json();

        // REGLA #2: Zod Validation BEFORE Processing
        const validated = ChangePasswordSchema.parse(body);

        const db = await connectAuthDB();
        const user = await db.collection('users').findOne({ email: session.user.email });

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

        await db.collection('users').updateOne(
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
            message: `Contraseña cambiada para ${session.user.email}`, correlationId: correlacion_id});

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Datos de contraseña inválidos', error.errors).toJSON(),
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
            message: error.message, correlationId: correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al cambiar contraseña').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 1000) {
            await logEvento({
                level: 'WARN',
                source: 'API_PERFIL',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `POST /api/auth/cambiar-password tomó ${duracion}ms`, correlationId: correlacion_id,
                details: { duracion_ms: duracion }
            });
        }
    }
}
