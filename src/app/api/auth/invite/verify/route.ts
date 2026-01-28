import { NextRequest, NextResponse } from 'next/server';
import { connectDB, connectAuthDB } from '@/lib/db';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * GET /api/auth/invite/verify
 * Verifica si un token de invitación es válido y no ha expirado
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    try {
        if (!token) {
            throw new ValidationError('Token no proporcionado');
        }

        const authDb = await connectAuthDB();
        const invite = await authDb.collection('invitaciones').findOne({ token });

        if (!invite) {
            throw new NotFoundError('Invitación no encontrada');
        }

        if (invite.estado !== 'PENDIENTE') {
            throw new AppError('INVITE_ALREADY_USED', 400, `Esta invitación ya ha sido ${invite.estado.toLowerCase()}`);
        }

        if (new Date() > new Date(invite.expira)) {
            // Marcar como expirada si no lo estaba
            await authDb.collection('invitaciones').updateOne(
                { _id: invite._id },
                { $set: { estado: 'EXPIRADA' } }
            );
            throw new AppError('INVITE_EXPIRED', 400, 'La invitación ha expirado');
        }

        // Obtener info del tenant (MIGRADOS A AUTH)
        const tenant = await authDb.collection('tenants').findOne({ tenantId: invite.tenantId });

        return NextResponse.json({
            valid: true,
            invite: {
                email: invite.email,
                tenantName: tenant?.name || invite.tenantId,
                rol: invite.rol
            }
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_INVITE_VERIFY',
            accion: 'VERIFY_ERROR',
            mensaje: error.message,
            correlacion_id,
            detalles: { token }
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al verificar invitación').toJSON(),
            { status: 500 }
        );
    }
}
