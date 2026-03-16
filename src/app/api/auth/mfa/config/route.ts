import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { MfaService } from '@/services/auth/MfaService';
import { AppError, handleApiError } from '@/lib/errors';
import { EmailService } from '@/services/infra/EmailService';
import { requirePermission } from '@/lib/auth';
import { EntityIdSchema } from '@/lib/schemas';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function GET_internal() {
    return withCorrelation(
        { level: 'INFO', source: 'API_AUTH_MFA_CONFIG', action: 'GET_STATUS' },
        async ({ correlationId, log }) => {
            try {
                const session = await requirePermission('user:profile', 'write');
                const enabled = await MfaService.isEnabled(EntityIdSchema.parse(session.user.id));
                return NextResponse.json({ enabled });
            } catch (error: unknown) {
                return handleApiError(error, 'API_AUTH_MFA_CONFIG_GET', correlationId);
            }
        }
    );
}

async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_AUTH_MFA_CONFIG', action: 'MFA_ACTION' },
        async ({ correlationId, log }) => {
            try {
                const session = await requirePermission('user:profile', 'write');
                const body = await req.json();
                const { action } = body;

                if (action === 'SETUP') {
                    const { secret, qrCode } = await MfaService.setup(EntityIdSchema.parse(session.user.id), session.user.email || '');
                    await log({ message: 'MFA setup initiated', details: { userId: session.user.id } });
                    return NextResponse.json({ secret, qrCode });
                }
                if (action === 'DISABLE') {
                    await MfaService.disable(EntityIdSchema.parse(session.user.id));
                    await log({ level: 'WARN', message: 'MFA disabled', details: { userId: session.user.id } });
                    return NextResponse.json({ success: true });
                }
                if (action === 'VERIFY') {
                    const { token } = body;
                    const isValid = await MfaService.verify(EntityIdSchema.parse(session.user.id), token);
                    return NextResponse.json({ success: isValid });
                }
                throw new AppError('VALIDATION_ERROR', 400, 'Acción no válida');
            } catch (error: unknown) {
                return handleApiError(error, 'API_AUTH_MFA_CONFIG_POST', correlationId);
            }
        }
    );
}

async function PUT_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_AUTH_MFA_CONFIG', action: 'ENABLE_MFA' },
        async ({ correlationId, log }) => {
            try {
                const session = await requirePermission('user:profile', 'write');
                const { secret, token } = await req.json();
                if (!secret || !token) throw new AppError('VALIDATION_ERROR', 400, 'Secret y Token requeridos');

                const result = await MfaService.enable(EntityIdSchema.parse(session.user.id), secret, token);
                if (!result.success) throw new AppError('VALIDATION_ERROR', 400, 'Código inválido');

                EmailService.sendMfaEnabledEmail({
                    to: session.user.email || '',
                    userName: session.user.name || session.user.email || 'User'
                }).catch(err => log({ level: 'ERROR', message: `MFA Email Error: ${err.message}` }));

                await log({ message: 'MFA enabled successfully', details: { userId: session.user.id } });

                return NextResponse.json({ success: true, recoveryCodes: result.recoveryCodes });
            } catch (error: unknown) {
                return handleApiError(error, 'API_AUTH_MFA_CONFIG_PUT', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/auth/mfa/config', thresholdMs: 1000 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/auth/mfa/config', thresholdMs: 1000 });
export const PUT = withPerformanceSLA(PUT_internal, { endpoint: 'PUT /api/auth/mfa/config', thresholdMs: 1000 });
