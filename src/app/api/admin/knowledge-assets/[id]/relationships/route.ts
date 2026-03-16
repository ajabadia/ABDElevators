import { getErrorMessage } from '@/lib/errors-helpers';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

const RelationshipSchema = z.object({
    targetId: z.string(),
    type: z.enum(['SUPERSEDES', 'COMPLEMENTS', 'DEPENDS_ON', 'AMENDS', 'RELATED_TO']),
    description: z.string().optional()
});

const RelationshipsArraySchema = z.array(RelationshipSchema);

/**
 * PATCH /api/admin/knowledge-assets/[id]/relationships
 * Updates the relationships for a document
 */
async function PATCH_internal(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ASSET_RELATIONSHIPS', action: 'UPDATE' },
        async ({ log, correlationId }) => {
            try {
                const user = await requirePermission('knowledge', 'write');
                const { id } = await params;

                const body = await request.json();
                const validatedRelationships = RelationshipsArraySchema.parse(body);

                const { auth } = await import('@/lib/auth');
                const session = await auth();
                const collection = await getTenantCollection('knowledge_assets', session);

                const result = await collection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            relatedAssets: validatedRelationships,
                            updatedAt: new Date()
                        }
                    }
                );

                if (result.matchedCount === 0) {
                    throw new NotFoundError('Asset not found');
                }

                await log({
                    message: `Relationships updated for document ${id}`,
                    details: { count: validatedRelationships.length, tenantId: user.user.tenantId }
                });

                return NextResponse.json({
                    success: true,
                    message: 'Relationships updated successfully'
                });

            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    return handleApiError(error, 'API_ASSET_RELATIONSHIPS_VAL', correlationId);
                }
                return handleApiError(error, 'API_ASSET_RELATIONSHIPS', correlationId);
            }
        }
    );
}

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/knowledge-assets/[id]/relationships', thresholdMs: 1000 });
