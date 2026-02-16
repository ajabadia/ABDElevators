import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
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
export async function POST(req: NextRequest) {
    const correlationId = uuidv4();
    const start = Date.now();

    try {
        const session = await auth();
        const body = await req.json();
        const validated = CreateGraphRelationSchema.parse(body);
        const tenantId = session?.user?.tenantId || 'default';

        await GraphGuardian.authorizeMutation(session, {
            tenantId,
            correlationId,
        });

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

    } catch (error: any) {
        return handleError(error, 'CREATE_RELATION', correlationId);
    }
}

/**
 * DELETE /api/admin/graph/relations
 * Delete a relationship
 */
export async function DELETE(req: NextRequest) {
    const correlationId = uuidv4();
    const start = Date.now();

    try {
        const session = await auth();
        const body = await req.json();
        const validated = DeleteGraphRelationSchema.parse(body);
        const tenantId = session?.user?.tenantId || 'default';

        await GraphGuardian.authorizeMutation(session, {
            tenantId,
            correlationId,
        });

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

    } catch (error: any) {
        return handleError(error, 'DELETE_RELATION', correlationId);
    }
}

function handleError(error: any, action: string, correlationId: string) {
    console.error(`[API_GRAPH_RELATIONS][${action}]`, error);

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
