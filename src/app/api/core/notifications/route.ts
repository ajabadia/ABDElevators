import { NextResponse } from 'next/server';
import { NotificationService } from '@/services/core/NotificationService';
import { z } from 'zod';
import { logEvento, checkSla } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';
import { EntityIdSchema, TenantIdSchema } from '@/lib/schemas/common';
import { AppError, ValidationError, handleApiError } from '@/lib/errors';

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
    const correlationId = generateUUID();
    const start = Date.now();

    try {
        const body = await req.json();
        const validated = NotificationSchema.parse(body);

        // Core business notification (MAIN cluster + Email if configured)
        await NotificationService.notify(validated);

        const duration = Date.now() - start;
        
        // Use standardized SLA check (Rule 8)
        await checkSla(duration, 500, 'API_NOTIFICATIONS', 'CREATE_NOTIFICATION', correlationId, { type: validated.type });

        await logEvento({
            level: 'INFO',
            source: 'API_NOTIFICATIONS',
            action: 'CREATE_NOTIFICATION',
            message: `Notification created: ${validated.title}`,
            correlationId,
            details: { duration_ms: duration, type: validated.type }
        });

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        return handleApiError(error, 'API_NOTIFICATIONS', correlationId);
    }
}

