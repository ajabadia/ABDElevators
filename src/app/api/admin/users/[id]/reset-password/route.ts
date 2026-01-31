import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { AppError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * POST /api/admin/usuarios/[id]/reset-password
 * Resetea la contraseña de un usuario (solo ADMIN)
 * SLA: P95 < 1000ms
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id } = await params;
        const db = await connectAuthDB();

        const usuario = await db.collection('users').findOne({
            _id: new ObjectId(id)
        });

        if (!usuario) {
            throw new NotFoundError('Usuario no encontrado');
        }

        // Generar nueva contraseña temporal
        const tempPassword = `temp${Math.random().toString(36).slice(-8)}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    password: hashedPassword,
                    modificado: new Date()
                }
            }
        );

        await logEvento({
            level: 'INFO',
            source: 'API_ADMIN_USUARIOS',
            action: 'RESET_PASSWORD',
            message: `Contraseña reseteada para: ${usuario.email}`, correlationId: correlacion_id,
            details: { usuario_id: id }
        });

        return NextResponse.json({
            success: true,
            temp_password: tempPassword,
        });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            level: 'ERROR',
            source: 'API_ADMIN_USUARIOS',
            action: 'RESET_PASSWORD_ERROR',
            message: error.message, correlationId: correlacion_id,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al resetear contraseña').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 1000) {
            await logEvento({
                level: 'WARN',
                source: 'API_ADMIN_USUARIOS',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `POST /api/admin/usuarios/[id]/reset-password tomó ${duracion}ms`, correlationId: correlacion_id,
                details: { duracion_ms: duracion }
            });
        }
    }
}
