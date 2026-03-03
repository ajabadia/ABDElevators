import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { AppError, ValidationError, NotFoundError, handleApiError } from '@/lib/errors';

/**
 * GET /api/auth/invite/verify
 * Verifica si un token de invitación es válido y no ha expirado
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    try {
        if (!token) throw new ValidationError('Token no proporcionado');

        const authDb = await connectAuthDB();
        const invite = await authDb.collection('invitaciones').findOne({ token });

        if (!invite) throw new NotFoundError('Invitación no encontrada');
        if (invite.status !== 'PENDIENTE') throw new AppError('INVITE_ALREADY_USED', 400, `Invitación ya ${invite.status.toLowerCase()}`);

        if (new Date() > new Date(invite.expira)) {
            await authDb.collection('invitaciones').updateOne({ _id: invite._id }, { $set: { estado: 'EXPIRADA' } });
            throw new AppError('INVITE_EXPIRED', 400, 'La invitación ha expirado');
        }

        const tenant = await authDb.collection('tenants').findOne({ tenantId: invite.tenantId });

        return NextResponse.json({
            valid: true,
            invite: { email: invite.email, tenantName: tenant?.name || invite.tenantId, rol: invite.rol }
        });

    } catch (error: unknown) {
        return handleApiError(error, 'API_INVITE_VERIFY', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/auth/invite/verify', thresholdMs: 1000 });
