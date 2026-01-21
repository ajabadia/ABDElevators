import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
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
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id } = await params;
        const db = await connectDB();

        const usuario = await db.collection('usuarios').findOne({
            _id: new ObjectId(id)
        });

        if (!usuario) {
            throw new NotFoundError('Usuario no encontrado');
        }

        // Generar nueva contraseña temporal
        const tempPassword = `temp${Math.random().toString(36).slice(-8)}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await db.collection('usuarios').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    password: hashedPassword,
                    modificado: new Date()
                }
            }
        );

        await logEvento({
            nivel: 'INFO',
            origen: 'API_ADMIN_USUARIOS',
            accion: 'RESET_PASSWORD',
            mensaje: `Contraseña reseteada para: ${usuario.email}`,
            correlacion_id,
            detalles: { usuario_id: id }
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
            nivel: 'ERROR',
            origen: 'API_ADMIN_USUARIOS',
            accion: 'RESET_PASSWORD_ERROR',
            mensaje: error.message,
            correlacion_id,
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
                nivel: 'WARN',
                origen: 'API_ADMIN_USUARIOS',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `POST /api/admin/usuarios/[id]/reset-password tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
