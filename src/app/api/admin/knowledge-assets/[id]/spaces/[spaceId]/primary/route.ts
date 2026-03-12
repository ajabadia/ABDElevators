import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { SpaceService } from '@/services/tenant/space-service';
import { logEvento } from '@/lib/logger';
import crypto from 'node:crypto';
import { EntityIdSchema, TenantIdSchema } from '@abd/platform-core';

/**
 * PATCH /api/admin/knowledge-assets/[id]/spaces/[spaceId]/primary
 * Proposito: Establecer un espacio como primario para el activo.
 */
export async function PATCH(
    req: Request,
    { params }: { params: { id: string, spaceId: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('knowledge', 'write');

        // Rule 18 Alignment: Strict Branding
        const assetId = EntityIdSchema.parse(params.id);
        const spaceId = EntityIdSchema.parse(params.spaceId);
        const tenantId = TenantIdSchema.parse(session.user.tenantId);

        await SpaceService.setPrimarySpace(assetId, spaceId, tenantId, session as any);

        await logEvento({
            level: 'INFO',
            source: 'API_ASSET_SPACES',
            action: 'SET_PRIMARY_ASSET',
            message: `Space ${spaceId} set as primary for asset ${assetId}`,
            correlationId,
            tenantId: session.user.tenantId,
            details: { assetId, spaceId }
        });

        return NextResponse.json({
            success: true,
            message: 'Primary space updated successfully'
        });
    } catch (error) {
        return handleApiError(error, 'API_ASSET_SPACES_PRIMARY_PATCH', correlationId);
    }
}
