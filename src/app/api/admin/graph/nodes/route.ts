import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { GraphGuardian } from '@/services/graph/security/GraphGuardian';
import { GraphMutationService } from '@/services/graph/GraphMutationService';
import { CreateGraphNodeSchema, UpdateGraphNodeSchema } from '@/lib/schemas';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/graph/nodes
 * Create a new node
 */
export async function POST(req: NextRequest) {
    const correlationId = uuidv4();
    const start = Date.now();

    try {
        const session = await auth();
        const body = await req.json();
        const validated = CreateGraphNodeSchema.parse(body);
        const tenantId = session?.user?.tenantId || 'default';

        await GraphGuardian.authorizeMutation(session, {
            tenantId,
            correlationId,
        });

        const nodeId = await GraphMutationService.createNode(validated, tenantId);

        await logEvento({
            level: 'INFO',
            source: 'API_GRAPH_NODES',
            action: 'CREATE_NODE',
            message: `Node created: ${nodeId}`,
            correlationId,
            tenantId,
            details: { nodeId, duration: Date.now() - start }
        });

        return NextResponse.json({ success: true, id: nodeId });

    } catch (error: any) {
        return handleError(error, 'CREATE_NODE', correlationId);
    }
}

/**
 * PATCH /api/admin/graph/nodes
 * Update an existing node
 */
export async function PATCH(req: NextRequest) {
    const correlationId = uuidv4();
    const start = Date.now();

    try {
        const session = await auth();
        const body = await req.json();
        const validated = UpdateGraphNodeSchema.parse(body);
        const tenantId = session?.user?.tenantId || 'default';

        await GraphGuardian.authorizeMutation(session, {
            tenantId,
            correlationId,
        });

        await GraphMutationService.updateNode(validated, tenantId);

        await logEvento({
            level: 'INFO',
            source: 'API_GRAPH_NODES',
            action: 'UPDATE_NODE',
            message: `Node updated: ${validated.id}`,
            correlationId,
            tenantId,
            details: { nodeId: validated.id, duration: Date.now() - start }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return handleError(error, 'UPDATE_NODE', correlationId);
    }
}

/**
 * DELETE /api/admin/graph/nodes?id=...
 * Delete a node
 */
export async function DELETE(req: NextRequest) {
    const correlationId = uuidv4();
    const start = Date.now();

    try {
        const session = await auth();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) throw new AppError('VALIDATION_ERROR', 400, 'Node ID is required');

        const tenantId = session?.user?.tenantId || 'default';

        await GraphGuardian.authorizeMutation(session, {
            tenantId,
            correlationId,
        });

        await GraphMutationService.deleteNode(id, tenantId);

        await logEvento({
            level: 'INFO',
            source: 'API_GRAPH_NODES',
            action: 'DELETE_NODE',
            message: `Node deleted: ${id}`,
            correlationId,
            tenantId,
            details: { nodeId: id, duration: Date.now() - start }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return handleError(error, 'DELETE_NODE', correlationId);
    }
}

function handleError(error: any, action: string, correlationId: string) {
    console.error(`[API_GRAPH_NODES][${action}]`, error);

    if (error.name === 'ZodError') {
        return NextResponse.json({
            error: 'VALIDATION_ERROR',
            details: error.errors
        }, { status: 400 });
    }

    if (error instanceof AppError) {
        return NextResponse.json({
            error: error.message,
            code: error.code
        }, { status: error.status });
    }

    return NextResponse.json({
        error: 'INTERNAL_ERROR',
        message: error.message
    }, { status: 500 });
}
