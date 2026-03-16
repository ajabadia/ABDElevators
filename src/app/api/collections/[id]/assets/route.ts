import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { CollectionService } from '@/services/core/collection-service';
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

const AddAssetsSchema = z.object({
    assetIds: z.array(z.string()).min(1),
});

/**
 * 📚 Add Assets to Collection API
 * POST: /api/collections/[id]/assets
 */
async function POST_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_COLLECTIONS_ASSETS', action: 'ADD_ASSETS' },
        async ({ log, correlationId }) => {
            try {
                const sessionPermissions = await requirePermission('knowledge', 'manage_collections');
                const { id } = await context.params;

                const body = await req.json();
                const { assetIds } = AddAssetsSchema.parse(body);

                const { auth } = await import('@/auth');
                const session = await auth();

                await log({
                    message: `Adding ${assetIds.length} assets to collection ${id}`,
                    details: { collectionId: id, assetCount: assetIds.length },
                    tenantId: sessionPermissions.user.tenantId
                });

                const success = await CollectionService.addAssetsToCollection(
                    id, 
                    assetIds, 
                    sessionPermissions.user.id, 
                    session as any
                );

                await log({
                    message: 'Assets added successfully',
                    details: { collectionId: id, success },
                    tenantId: sessionPermissions.user.tenantId
                });

                return NextResponse.json({ 
                    success,
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_COLLECTIONS_ASSETS_ADD_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/collections/[id]/assets', thresholdMs: 1000 });
