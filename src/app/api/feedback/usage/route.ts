import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db';
import { RagUsageSchema } from '@/lib/schemas/feedback';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

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

                const collection = await getTenantCollection('rag_usage', session);
                await collection.insertOne({
                    ...validated,
                    tenantId: session.user.tenantId,
                    userId: session.user.id,
                    createdAt: new Date(),
                });

                await log({
                    message: `RAG Interaction: ${validated.type} in ${validated.uiContext}`,
                    details: {
                        tenantId: session.user.tenantId,
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
