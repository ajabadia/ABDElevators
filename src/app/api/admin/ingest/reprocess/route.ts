import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { IngestService } from '@/services/ingest/IngestService';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

const ReprocessSchema = z.object({
    docId: z.string().min(1),
    options: z.object({
        highPrecision: z.boolean().default(true),
        enableVision: z.boolean().optional(),
    }).optional()
});

/**
 * POST /api/admin/ingest/reprocess
 * Permite a un administrador re-procesar manualmente un activo.
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_INGEST_REPROCESS', action: 'EXECUTE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('ingest', 'write');
                const body = await req.json();
                const { docId, options } = ReprocessSchema.parse(body);

                // Trigger analysis with high precision flags if requested
                const result = await IngestService.executeAnalysis(docId, {
                    correlationId,
                    userEmail: session.user.email || undefined,
                    enableVision: options?.enableVision ?? true,
                    enableGraphRag: true,
                    enableCognitive: true
                });

                await log({
                    message: `Manual re-processing triggered for asset ${docId}`,
                    details: { docId, options, triggeredBy: session.user.email }
                });

                return NextResponse.json({
                    success: true,
                    message: 'Reprocess request accepted',
                    correlationId,
                    docId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_INGEST_REPROCESS_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, {
    endpoint: 'POST /api/admin/ingest/reprocess',
    thresholdMs: 2000
});
