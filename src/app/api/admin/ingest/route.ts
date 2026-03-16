import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { IngestApiService } from '@/services/ingest/IngestApiService';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/ingest
 * Processes a PDF file using the IngestService.
 * SLA: P95 < 20000ms
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_INGEST', action: 'START_INGEST' },
        async ({ log, correlationId }) => {
            try {
                // Authentication & ABAC Enforcement (Rule #11)
                const session = await requirePermission('ingest', 'write');

                const result = await IngestApiService.handleIngestRequest(req, session);
                
                if (!result.success) {
                    await log({
                        level: 'WARN',
                        message: 'Ingestion failed with business error',
                        details: { result }
                    });
                    return NextResponse.json(result, { status: 422 });
                }

                await log({
                    message: 'Ingestion request accepted and processing started',
                    details: { docId: result.docId, tenantId: session.user.tenantId }
                });

                return NextResponse.json(result);

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_INGEST_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/ingest', thresholdMs: 20000 });
