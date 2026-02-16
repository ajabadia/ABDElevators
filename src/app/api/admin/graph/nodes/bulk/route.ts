import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { GraphGuardian } from '@/services/graph/security/GraphGuardian';
import { GraphMutationService } from '@/services/graph/GraphMutationService';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const BulkDeleteSchema = z.object({
    ids: z.array(z.string()).min(1)
});

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
    const correlationId = uuidv4();
    const start = Date.now();

    try {
        const session = await auth();
        const body = await req.json();
        const { ids } = BulkDeleteSchema.parse(body);
        const tenantId = session?.user?.tenantId || 'default';

        await GraphGuardian.authorizeMutation(session, {
            tenantId,
            correlationId,
        });

        const deletedCount = await GraphMutationService.deleteNodesBulk(ids, tenantId);

        await logEvento({
            level: 'INFO',
            source: 'API_GRAPH_BULK',
            action: 'DELETE_NODES_BULK',
            message: `Deleted ${deletedCount} nodes in bulk`,
            correlationId,
            tenantId,
            details: { ids, deletedCount, duration: Date.now() - start }
        });

        return NextResponse.json({ success: true, deletedCount });

    } catch (error: any) {
        console.error('[API_GRAPH_BULK][DELETE_NODES_BULK]', error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'VALIDATION_ERROR', details: error.errors }, { status: 400 });
        }
        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
        }
        return NextResponse.json({ error: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
    }
}
