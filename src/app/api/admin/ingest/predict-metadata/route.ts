import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { IngestPredictionService } from '@/services/admin/IngestPredictionService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/ingest/predict-metadata
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_INGEST_PREDICT', action: 'PREDICT' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('ingest:manage', 'write');
                const body = await req.json();

                await log({ message: 'Predicting metadata for ingestion asset' });
                const prediction = await IngestPredictionService.predictMetadata(body.text, session.user.tenantId);

                return NextResponse.json({ success: true, prediction, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_INGEST_PREDICT_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/ingest/predict-metadata', thresholdMs: 3000 });
