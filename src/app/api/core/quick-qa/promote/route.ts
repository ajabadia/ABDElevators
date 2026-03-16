import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

const PromoteSchema = z.object({
    snippet: z.string().min(1),
    title: z.string().min(1),
    spaceId: z.string().optional(),
    uiOrigin: z.string().optional(), // WAVE 14: track where it was promoted from
});

/**
 * 🚀 Quick Q&A -> Asset Promotion API (Phase 125.3)
 * Converts an ephemeral snippet into a persistent KnowledgeAsset.
 */
async function POST_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_QUICK_QA_PROMOTE', action: 'PROMOTE_START' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge', 'ingest');
                const body = await req.json();
                const { snippet, title, spaceId, uiOrigin = 'QUICK_QA_PANEL' } = PromoteSchema.parse(body);

                await log({
                    message: `Promocionando snippet a asset: ${title} (Origin: ${uiOrigin})`,
                    details: { tenantId: session.user.tenantId, spaceId, uiOrigin }
                });

                const buffer = Buffer.from(snippet, 'utf-8');
                const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;

                const { IngestPreparer } = await import('@/services/ingest/IngestPreparer');

                const asset = await IngestPreparer.prepare({
                    file: {
                        name: fileName,
                        size: buffer.length,
                        arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
                    } as any,
                    metadata: {
                        type: 'QUICK_QA' as any, // Cast as any temporarily if schema is strict on string vs number
                        version: '1.0',
                        scope: 'USER' as any,
                        uiOrigin
                    },
                    tenantId: session.user.tenantId,
                    userEmail: session.user.email!,
                    correlationId
                });

                await log({
                    message: `Asset creado desde snippet: ${asset.docId}`,
                    details: { assetId: asset.docId }
                });

                return NextResponse.json({
                    success: true,
                    assetId: asset.docId,
                    message: "Snippet guardado correctamente como Documento.",
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_QUICK_QA_PROMOTE', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/core/quick-qa/promote', thresholdMs: 1000 });
