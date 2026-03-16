import { NextResponse } from 'next/server';
import { NotificationService } from '@/services/core/NotificationService';
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { TenantIdSchema, EntityIdSchema } from '@/lib/schemas/common';

const NotificationSchema = z.object({
    title: z.string().min(1),
    message: z.string().min(1),
    level: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
    type: z.enum(['SYSTEM', 'ANALYSIS_COMPLETE', 'RISK_ALERT', 'BILLING_EVENT', 'SECURITY_ALERT']),
    tenantId: TenantIdSchema,
    userId: EntityIdSchema.optional(),
    link: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Endpoint for client-side notification persistence.
 * Leverages unified NotificationService.
 */
export async function POST(req: Request) {
    return withCorrelation(
        { level: 'INFO', source: 'API_NOTIFICATIONS', action: 'CREATE_NOTIFICATION' },
        async ({ log, correlationId }) => {
            const start = Date.now();

            try {
                const body = await req.json();
                const validated = NotificationSchema.parse(body);

                // Core business notification (MAIN cluster + Email if configured)
                await NotificationService.notify(validated);

                const duration = Date.now() - start;

                await log({
                    message: `Notification created: ${validated.title}`,
                    details: { duration_ms: duration, type: validated.type }
                });

                return NextResponse.json({ success: true, correlationId });

            } catch (error: unknown) {
                return handleApiError(error, 'API_NOTIFICATIONS_POST', correlationId);
            }
        }
    );
}

