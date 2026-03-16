import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { auth } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/errors';

/**
 * API Route so client-side components can log events securely.
 */
async function POST_internal(req: NextRequest) {
    // Note: withCorrelation provides the framework, but we have to handle the session for security first
    const session = await auth();
    if (!session?.user) throw new AppError('UNAUTHORIZED', 401, 'Session required for logging');

    const body = await req.json();
    const { level, source, action, message, details, stack, correlationId } = body;

    // Use platform's correlation ID if provided by client, otherwise withCorrelation will provide one
    return withCorrelation({ 
        level: level || 'INFO', 
        source: `${source || 'UNKNOWN'}_CLIENT`, 
        action: action || 'LOG', 
        correlationId: correlationId || body.correlacion_id, // withCorrelation handles fallback if undefined
        tenantId: session.user.tenantId 
    }, async ({ log, correlationId: effectiveCorrelationId }) => {
        try {
            await log({
                message: message || 'Client log entry',
                details: details || {},
                stack
            });
            return NextResponse.json({ 
                success: true, 
                correlationId: effectiveCorrelationId 
            });
        } catch (error: unknown) {
            return handleApiError(error, 'API_LOGS_CLIENT_POST', effectiveCorrelationId);
        }
    });
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/logs', thresholdMs: 1000 });
