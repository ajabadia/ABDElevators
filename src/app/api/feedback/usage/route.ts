import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { RagUsageSchema, type RagUsageInput } from '@/lib/schemas/feedback';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { TenantIdSchema } from '@/lib/schemas';

/**
 * 📊 RAG Usage Tracking API
 * Tracks implicit feedback like clicks, views, and downloads.
 * WAVE 14
 */
export const POST = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'API_USAGE', action: 'TRACK_RAG_USAGE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('rag:query', 'read'); 
                const body = await req.json();
                const validated = RagUsageSchema.parse(body);
                const tenantId = TenantIdSchema.parse(session.user.tenantId);

                const collection = await getTenantCollection<RagUsageInput & { tenantId: any; userId: any; createdAt: Date }>('rag_usage', session, 'LOGS');
                await collection.insertOne({
                    ...validated,
                    tenantId,
                    userId: session.user.id as any,
                    createdAt: new Date(),
                });

                await log({
                    message: `RAG Interaction: ${validated.type} in ${validated.uiContext}`,
                    details: {
                        tenantId,
                        userId: session.user.id,
                        assetId: validated.assetId,
                        uiContext: validated.uiContext,
                        type: validated.type,
                        correlationId: validated.correlationId // Optional link to original query
                    }
                });

                return NextResponse.json({ success: true, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_USAGE', correlationId);
            }
        }
    ),
    { endpoint: 'POST /api/feedback/usage', thresholdMs: 500 }
);
