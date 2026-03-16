import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { IngestEnrichmentService } from '@/services/admin/stub-services';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/ingest/[id]/enrich
 */
async function POST_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_INGEST_ENRICH', action: 'START' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('ingest:manage', 'write');
                const { id } = await context.params;

                await log({ message: `Starting manual enrichment for ingest asset ${id}` });
                const result = await IngestEnrichmentService.enrichAsset(id, session.user.tenantId, correlationId);

                return NextResponse.json({ success: true, result, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_INGEST_ENRICH_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/ingest/[id]/enrich', thresholdMs: 5000 });
