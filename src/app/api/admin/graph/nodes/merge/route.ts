import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { GraphGuardian } from '@/services/graph/security/GraphGuardian';
import { GraphMutationService } from '@/services/graph/GraphMutationService';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const NodeMergeSchema = z.object({
    primaryId: z.string(),
    secondaryId: z.string()
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const correlationId = uuidv4();
    const start = Date.now();

    try {
        const session = await auth();
        const body = await req.json();
        const { primaryId, secondaryId } = NodeMergeSchema.parse(body);
        const tenantId = session?.user?.tenantId || 'default';

        if (primaryId === secondaryId) {
            throw new AppError('VALIDATION_ERROR', 400, 'Cannot merge a node with itself');
        }

        await GraphGuardian.authorizeMutation(session, {
            tenantId,
            correlationId,
        });

        await GraphMutationService.mergeNodes(primaryId, secondaryId, tenantId);

        await logEvento({
            level: 'INFO',
            source: 'API_GRAPH_MERGE',
            action: 'MERGE_NODES',
            message: `Merged node ${secondaryId} into ${primaryId}`,
            correlationId,
            tenantId,
            details: { primaryId, secondaryId, duration: Date.now() - start }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[API_GRAPH_MERGE][POST]', error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'VALIDATION_ERROR', details: error.errors }, { status: 400 });
        }
        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
        }
        return NextResponse.json({ error: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
    }
}
