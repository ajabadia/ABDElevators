import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { MfaService } from '@/services/auth/MfaService';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { EmailService } from '@/services/infra/EmailService';
import { z } from 'zod';

/**
 * GET /api/auth/mfa/config
 * Obtiene el estado del MFA para el usuario actual.
 */
async function GET_internal () {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const correlationId = crypto.randomUUID();
        const enabled = await MfaService.isEnabled(session.user.id);
        await logEvento({
            level: 'INFO',
            source: 'API_AUTH_MFA_CONFIG',
            action: 'GET_STATE',
            message: `User: ${session.user.id}, Enabled: ${enabled}`,
            correlationId
        });
        return NextResponse.json({ enabled });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

/**
 * POST /api/auth/mfa/config
 * Inicia el setup (Gerenar QR) o elimina el MFA.
 */
async function POST_internal (req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

/**
 * PUT /api/auth/mfa/config
 * Finaliza el setup validando el primer código.
 */
async function PUT_internal (req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const { secret, token } = await req.json();

        if (!secret || !token) throw new AppError('VALIDATION_ERROR', 400, 'Secret y Token requeridos');

        const result = await MfaService.enable(session.user.id, secret, token);

        if (!result.success) {
            throw new AppError('VALIDATION_ERROR', 400, 'Código inválido. Intenta de nuevo.');
        }

        // Enviar email de confirmación (background)
        EmailService.sendMfaEnabledEmail({
            to: session.user.email || '',
            userName: session.user.name || session.user.email || 'User'
        }).catch(err => logEvento({
            level: 'ERROR',
            source: 'API_AUTH_MFA_CONFIG',
            action: 'EMAIL_ERROR',
            message: err.message,
            stack: err.stack
        }));

        return NextResponse.json({
            success: true,
            recoveryCodes: result.recoveryCodes
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/auth/mfa/config', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/auth/mfa/config', thresholdMs: 1000 });

export const PUT = withPerformanceSLA(PUT_internal, { endpoint: 'PUT /api/auth/mfa/config', thresholdMs: 1000 });
