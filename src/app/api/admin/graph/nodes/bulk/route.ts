import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { GraphMutationService } from '@/services/graph/GraphMutationService';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { requirePermission } from '@/lib/auth';
const BulkDeleteSchema = z.object({ ids: z.array(z.string()).min(1) });
export const dynamic = 'force-dynamic';

async function DELETE_internal(req: NextRequest) {
    const correlationId = uuidv4();
    try {
        const session = await requirePermission('platform:settings', 'manage');
        const { ids } = BulkDeleteSchema.parse(await req.json());
        const tenantId = session.user.tenantId;

        const deletedCount = await GraphMutationService.deleteNodesBulk(ids, tenantId);
        await logEvento({ level: 'INFO', source: 'API_GRAPH_BULK', action: 'DELETE_NODES_BULK', message: `Deleted ${deletedCount} nodes`, correlationId, tenantId });
        return NextResponse.json({ success: true, deletedCount });
    } catch (error: unknown) {
        return handleApiError(error, 'API_GRAPH_BULK_DELETE', correlationId);
    }
}

export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'DELETE /api/admin/graph/nodes/bulk', thresholdMs: 5000 });
