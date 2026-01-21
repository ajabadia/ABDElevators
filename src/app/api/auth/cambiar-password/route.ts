import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
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

        const db = await connectDB();
        const user = await db.collection('usuarios').findOne({ email: session.user.email });

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

        await db.collection('usuarios').updateOne(
            { email: session.user.email },
            {
                $set: {
                    password: hashedPassword,
                    modificado: new Date()
                }
            }
        );

        await logEvento({
            nivel: 'INFO',
            origen: 'API_PERFIL',
            accion: 'CHANGE_PASSWORD',
            mensaje: `Contraseña cambiada para ${session.user.email}`,
            correlacion_id
        });

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
            nivel: 'ERROR',
            origen: 'API_PERFIL',
            accion: 'CHANGE_PASSWORD_ERROR',
            mensaje: error.message,
            correlacion_id,
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
                nivel: 'WARN',
                origen: 'API_PERFIL',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `POST /api/auth/cambiar-password tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
