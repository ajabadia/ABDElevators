import { NextResponse } from 'next/server';
import { NotificationService } from '@/services/core/NotificationService';
import { z } from 'zod';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';

const NotificationSchema = z.object({
    title: z.string().min(1),
    message: z.string().min(1),
    level: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
    type: z.enum(['SYSTEM', 'ANALYSIS_COMPLETE', 'RISK_ALERT', 'BILLING_EVENT', 'SECURITY_ALERT']),
    tenantId: z.string(),
    userId: z.string().optional(),
    link: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
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
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: 'VALIDATION_ERROR', details: error.format() }, { status: 400 });
        }

        console.error('[API_NOTIFICATIONS] Error:', error);
        return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}

