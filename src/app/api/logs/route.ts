import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { auth } from '@/lib/auth';
import { handleApiError, AppError, ValidationError } from '@/lib/errors';
import { ApplicationLogSchema, TenantIdSchema } from '@/lib/schemas';
import { z } from 'zod';

const ClientLogSchema = z.object({
    level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']),
    source: z.string(),
    action: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    stack: z.string().optional(),
    correlationId: z.string().optional(),
    correlacion_id: z.string().optional()
});

/**
 * API Route so client-side components can log events securely.
 */
async function POST_internal(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) throw new AppError('UNAUTHORIZED', 401, 'Session required for logging');

        const tenantId = TenantIdSchema.parse(session.user.tenantId);
        const body = await req.json();
        
        // Rule #2: Zod Validation BEFORE Processing
        const validated = ClientLogSchema.parse(body);

        // Standardize correlation IDs
        const clientCorrelationId = validated.correlationId || validated.correlacion_id;

        return withCorrelation({ 
            level: validated.level, 
            source: `${validated.source}_CLIENT`, 
            action: validated.action, 
            correlationId: clientCorrelationId, // withCorrelation handles fallback if undefined
            tenantId 
        }, async ({ log, correlationId: effectiveCorrelationId }) => {
            try {
                await log({
                    message: validated.message,
                    details: validated.details || {},
                    stack: validated.stack
                });
                return NextResponse.json({ 
                    success: true, 
                    correlationId: effectiveCorrelationId 
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_LOGS_CLIENT_INNER', effectiveCorrelationId);
            }
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return handleApiError(new ValidationError('Invalid log format', error.issues), 'API_LOGS_CLIENT_VALIDATION', 'UNKNOWN');
        }
        return handleApiError(error, 'API_LOGS_CLIENT_POST', 'UNKNOWN');
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/logs', thresholdMs: 1000 });
