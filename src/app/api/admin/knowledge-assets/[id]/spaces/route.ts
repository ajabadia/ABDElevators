import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { handleApiError, ValidationError } from '@/lib/errors';
import { SpaceService } from '@/services/tenant/space-service';
import { logEvento } from '@/lib/logger';
import crypto from 'node:crypto';
import { EntityIdSchema, TenantIdSchema } from '@abd/platform-core';

/**
 * GET /api/admin/knowledge-assets/[id]/spaces
 * Proposito: Listar todos los espacios vinculados a un documento.
 */
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('knowledge', 'read');

        // Rule 18 Alignment: Strict Branding
        const assetId = EntityIdSchema.parse(params.id);

        // SpaceService methods are static
        const links = await SpaceService.getAssetLinks(assetId, session as any);

        return NextResponse.json({
            success: true,
            links
        });
    } catch (error) {
        return handleApiError(error, 'API_ASSET_SPACES_GET', correlationId);
    }
}

/**
 * POST /api/admin/knowledge-assets/[id]/spaces
 * Proposito: Vincular un documento a un nuevo espacio.
 */
export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('knowledge', 'write');

        // Rule 18 Alignment: Strict Branding
        const assetId = EntityIdSchema.parse(params.id);
        const { spaceId: rawSpaceId } = await req.json();

        if (!rawSpaceId) throw new ValidationError('spaceId is required');

        const spaceId = EntityIdSchema.parse(rawSpaceId);
        const tenantId = TenantIdSchema.parse(session.user.tenantId);

        await SpaceService.linkAssetToSpace(assetId, spaceId, tenantId, session as any);

        await logEvento({
            level: 'INFO',
            source: 'API_ASSET_SPACES',
            action: 'LINK_ASSET',
            message: `Asset ${assetId} linked to space ${spaceId}`,
            correlationId,
            tenantId: session.user.tenantId,
            details: { assetId, spaceId }
        });

        return NextResponse.json({
            success: true,
            message: 'Asset linked successfully'
        });
    } catch (error) {
        return handleApiError(error, 'API_ASSET_SPACES_POST', correlationId);
    }
}
