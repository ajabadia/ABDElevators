import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { AppError, NotFoundError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import crypto from 'crypto';

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
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const user = await enforcePermission('knowledge', 'write');
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

        await logEvento({
            level: 'INFO',
            source: 'API_ASSET_RELATIONSHIPS',
            action: 'UPDATE_RELATIONSHIPS',
            message: `Relationships updated for document ${id}`,
            correlationId,
            details: { count: validatedRelationships.length, tenantId: user.tenantId }
        });

        return NextResponse.json({
            success: true,
            message: 'Relationships updated successfully'
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                code: 'VALIDATION_ERROR',
                message: 'Invalid relationship data',
                details: error.issues
            }, { status: 400 });
        }

        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_ASSET_RELATIONSHIPS',
            action: 'UPDATE_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error updating relationships').toJSON(),
            { status: 500 }
        );
    }
}
