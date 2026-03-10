import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { SpaceService } from '@/services/tenant/space-service';
import { logEvento } from '@/lib/logger';
import crypto from 'node:crypto';

/**
 * DELETE /api/admin/knowledge-assets/[id]/spaces/[spaceId]
 * Proposito: Desvincular un documento de un espacio.
 */
export async function DELETE(
    req: Request,
    { params }: { params: { id: string, spaceId: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('knowledge', 'write');
        const assetId = params.id;
        const spaceId = params.spaceId;

        await SpaceService.unlinkAssetFromSpace(assetId, spaceId, session as any);

        await logEvento({
            level: 'INFO',
            source: 'API_ASSET_SPACES',
            action: 'UNLINK_ASSET',
            message: `Asset ${assetId} unlinked from space ${spaceId}`,
            correlationId,
            tenantId: session.user.tenantId,
            details: { assetId, spaceId }
        });

        return NextResponse.json({
            success: true,
            message: 'Asset unlinked successfully'
        });
    } catch (error) {
        return handleApiError(error, 'API_ASSET_SPACES_DELETE', correlationId);
    }
}
