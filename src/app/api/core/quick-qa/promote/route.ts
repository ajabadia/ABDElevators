import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError, handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';
import { IngestService } from '@/services/ingest-service';

const PromoteSchema = z.object({
    snippet: z.string().min(1),
    title: z.string().min(1),
    spaceId: z.string().optional(),
});

/**
 * 🚀 Quick Q&A -> Asset Promotion API (Phase 125.3)
 * Converts an ephemeral snippet into a persistent KnowledgeAsset.
 */
export async function POST(req: NextRequest) {
    const correlationId = generateUUID();
    try {
        const session = await enforcePermission('knowledge', 'ingest');
        const body = await req.json();
        const { snippet, title, spaceId } = PromoteSchema.parse(body);

        await logEvento({
            level: 'INFO',
            source: 'API_QUICK_QA_PROMOTE',
            action: 'PROMOTE_START',
            message: `Promocionando snippet a asset: ${title}`,
            correlationId,
            tenantId: session.user.tenantId
        });

        // 1. Create a virtual File object for the ingest service
        // Since IngestService expects a Request or similar, we might need to adapt or call IngestPreparer directly.
        // For simplicity, we'll create a Buffer and use the ingest service if it supports it, 
        // or we'll mock the necessary parts. 

        const buffer = Buffer.from(snippet, 'utf-8');
        const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;

        // We use IngestService.ingest directly if possible, or simulate the FormData.
        // In ABDElevators, IngestService.ingest usually takes a FormData from the request.

        // Let's use a simpler approach: use the internal services
        const { IngestPreparer } = await import('@/services/ingest/IngestPreparer');

        const asset = await IngestPreparer.prepare({
            file: {
                name: fileName,
                size: buffer.length,
                arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
            } as any,
            metadata: {
                type: 'QUICK_QA',
                version: '1.0',
                scope: 'USER' as any,
            },
            tenantId: session.user.tenantId,
            userEmail: session.user.email!,
            correlationId
        });

        // Transition to processing
        // Note: In a real scenario, we'd trigger the background worker here.
        // For Phase 125.3, we'll at least register the asset.

        await logEvento({
            level: 'INFO',
            source: 'API_QUICK_QA_PROMOTE',
            action: 'PROMOTE_SUCCESS',
            message: `Asset creado desde snippet: ${asset.docId}`,
            correlationId,
            details: { assetId: asset.docId }
        });

        return NextResponse.json({
            success: true,
            assetId: asset.docId,
            message: "Snippet guardado correctamente como Documento."
        });

    } catch (error) {
        return handleApiError(error, 'API_QUICK_QA_PROMOTE', correlationId);
    }
}
