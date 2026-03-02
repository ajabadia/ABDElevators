import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { handleApiError, AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { GraphGuardian } from '@/services/graph/security/GraphGuardian';
import { GraphMutationService } from '@/services/graph/GraphMutationService';
import { CreateGraphRelationSchema, DeleteGraphRelationSchema } from '@/lib/schemas';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/graph/relations
 * Create or update a relationship
 */
async function POST_internal (req: NextRequest) {
    const correlationId = uuidv4();
    const start = Date.now();

    try {
        const session = await enforcePermission('knowledge:graph', 'manage');
        const body = await req.json();
        const validated = CreateGraphRelationSchema.parse(body);
        const tenantId = session.user.tenantId;

        await GraphMutationService.createRelation(validated, tenantId);

        await logEvento({
            level: 'INFO',
            source: 'API_GRAPH_RELATIONS',
            action: 'CREATE_RELATION',
            message: `Relation ${validated.type} created/updated between ${validated.sourceId} and ${validated.targetId}`,
            correlationId,
            tenantId,
            details: { ...validated, duration: Date.now() - start }
        });

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        return handleApiError(error, 'API_GRAPH_RELATIONS_CREATE', correlationId);
    }
}

/**
 * DELETE /api/admin/graph/relations
 * Delete a relationship
 */
async function DELETE_internal (req: NextRequest) {
    const correlationId = uuidv4();
    const start = Date.now();

    try {
        const session = await enforcePermission('knowledge:graph', 'manage');
        const body = await req.json();
        const validated = DeleteGraphRelationSchema.parse(body);
        const tenantId = session.user.tenantId;

        await GraphMutationService.deleteRelation(validated, tenantId);

        await logEvento({
            level: 'INFO',
            source: 'API_GRAPH_RELATIONS',
            action: 'DELETE_RELATION',
            message: `Relation ${validated.type} deleted between ${validated.sourceId} and ${validated.targetId}`,
            correlationId,
            tenantId,
            details: { ...validated, duration: Date.now() - start }
        });

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        return handleApiError(error, 'API_GRAPH_RELATIONS_MUTATION', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/graph/relations', thresholdMs: 5000 });

export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'DELETE /api/admin/graph/relations', thresholdMs: 5000 });
