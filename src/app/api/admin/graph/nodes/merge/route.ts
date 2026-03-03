import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { AppError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { GraphMutationService } from '@/services/graph/GraphMutationService';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { enforcePermission } from '@/lib/guardian-guard';

const NodeMergeSchema = z.object({ primaryId: z.string(), secondaryId: z.string() });
export const dynamic = 'force-dynamic';

async function POST_internal(req: NextRequest) {
    const correlationId = uuidv4();
    try {
        const session = await enforcePermission('platform:settings', 'manage');
        const { primaryId, secondaryId } = NodeMergeSchema.parse(await req.json());
        const tenantId = session.user.tenantId;

        if (primaryId === secondaryId) throw new AppError('VALIDATION_ERROR', 400, 'Cannot merge a node with itself');

        await GraphMutationService.mergeNodes(primaryId, secondaryId, tenantId);
        await logEvento({ level: 'INFO', source: 'API_GRAPH_MERGE', action: 'MERGE_NODES', message: `Merged ${secondaryId} into ${primaryId}`, correlationId, tenantId });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, 'API_GRAPH_MERGE_POST', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/graph/nodes/merge', thresholdMs: 5000 });
