import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { MfaService } from '@/services/auth/MfaService';
import { AppError, handleApiError } from '@/lib/errors';
import { EmailService } from '@/services/infra/EmailService';
import { enforcePermission } from '@/lib/guardian-guard';
import { logEvento } from '@/lib/logger';

async function GET_internal() {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('user:profile', 'write');
        const enabled = await MfaService.isEnabled(session.user.id);
        return NextResponse.json({ enabled });
    } catch (error: unknown) {
        return handleApiError(error, 'API_AUTH_MFA_CONFIG_GET', correlationId);
    }
}

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('user:profile', 'write');
        const body = await req.json();
        const { action } = body;

        if (action === 'SETUP') {
            const { secret, qrCode } = await MfaService.setup(session.user.id, session.user.email || '');
            return NextResponse.json({ secret, qrCode });
        }
        if (action === 'DISABLE') {
            await MfaService.disable(session.user.id);
            return NextResponse.json({ success: true });
        }
        if (action === 'VERIFY') {
            const { token } = body;
            const isValid = await MfaService.verify(session.user.id, token);
            return NextResponse.json({ success: isValid });
        }
        throw new AppError('VALIDATION_ERROR', 400, 'Acción no válida');
    } catch (error: unknown) {
        return handleApiError(error, 'API_AUTH_MFA_CONFIG_POST', correlationId);
    }
}

async function PUT_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('user:profile', 'write');
        const { secret, token } = await req.json();
        if (!secret || !token) throw new AppError('VALIDATION_ERROR', 400, 'Secret y Token requeridos');

        const result = await MfaService.enable(session.user.id, secret, token);
        if (!result.success) throw new AppError('VALIDATION_ERROR', 400, 'Código inválido');

        EmailService.sendMfaEnabledEmail({
            to: session.user.email || '',
            userName: session.user.name || session.user.email || 'User'
        }).catch(err => logEvento({ level: 'ERROR', source: 'API_AUTH_MFA_CONFIG', action: 'EMAIL_ERROR', message: err.message }));

        return NextResponse.json({ success: true, recoveryCodes: result.recoveryCodes });
    } catch (error: unknown) {
        return handleApiError(error, 'API_AUTH_MFA_CONFIG_PUT', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/auth/mfa/config', thresholdMs: 1000 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/auth/mfa/config', thresholdMs: 1000 });
export const PUT = withPerformanceSLA(PUT_internal, { endpoint: 'PUT /api/auth/mfa/config', thresholdMs: 1000 });
