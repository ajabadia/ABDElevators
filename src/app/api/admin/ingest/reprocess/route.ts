import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { IngestService } from '@/services/ingest/IngestService';
import { logEvento } from '@/lib/logger';
import { handleApiError, AppError } from '@/lib/errors';
import { z } from 'zod';

const ReprocessSchema = z.object({
    docId: z.string().min(1),
    options: z.object({
        highPrecision: z.boolean().default(true),
        enableVision: z.boolean().optional(),
    }).optional()
});

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('ingest', 'write');
        const body = await req.json();
        const { docId, options } = ReprocessSchema.parse(body);

        await logEvento({
            level: 'INFO',
            source: 'API_INGEST_REPROCESS',
            action: 'REPROCESS_TRIGGERED',
            message: `Manual re-processing triggered for asset ${docId}`,
            correlationId,
            tenantId: session.user.tenantId,
            details: { docId, options }
        });

        // Trigger analysis with high precision flags if requested
        // Execute analysis is async and we don't await the whole process if it's long,
        // but here we can wait for the start
        const result = await IngestService.executeAnalysis(docId, {
            correlationId,
            userEmail: session.user.email || undefined,
            enableVision: options?.enableVision ?? true, // Default to true for self-healing
            enableGraphRag: true,
            enableCognitive: true
        });

        return NextResponse.json({
            success: true,
            message: 'Reprocess request accepted',
            correlationId,
            docId
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_INGEST_REPROCESS', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, {
    endpoint: 'POST /api/admin/ingest/reprocess',
    thresholdMs: 2000
});
