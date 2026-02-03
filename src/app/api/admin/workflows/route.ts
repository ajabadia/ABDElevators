import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { WorkflowService } from '@/lib/workflow-service';

const WorkflowSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    nodes: z.array(z.any()), // React Flow nodes
    edges: z.array(z.any()), // React Flow edges
    active: z.boolean().default(true),
    environment: z.enum(['PRODUCTION', 'STAGING', 'SANDBOX']).optional(),
    version: z.number().optional().default(1),
    industry: z.string().optional().default('ELEVATORS')
});

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No session');
        }

        // Security Hardening: Explicit Role Check
        if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'Insufficient permissions to list workflows');
        }

        const { searchParams } = new URL(req.url);
        const environment = searchParams.get('environment') || 'PRODUCTION';
        const tenantId = (session.user as any).tenantId;

        const items = await WorkflowService.listDefinitions(tenantId, 'ENTITY', environment);
        return NextResponse.json({ success: true, items });
    } catch (error) {
        return handleApiError(error, 'API_WORKFLOWS_GET', 'system');
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'No authorized session');
        }

        // Security Hardening: Explicit Role Check
        if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'Insufficient permissions to save workflows');
        }

        const body = await req.json();
        const environment = body.environment || 'PRODUCTION';

        const validated = WorkflowSchema.parse(body);
        const tenantId = (session.user as any).tenantId;

        const db = await connectDB();
        const workflows = db.collection('workflow_definitions');

        const visibleGraph = {
            nodes: validated.nodes,
            edges: validated.edges
        };

        let executableLogic: Partial<import('@/types/workflow').AIWorkflow> | null = null;
        let compilationError: string | null = null;

        try {
            const { compileGraphToLogic } = await import('@/lib/workflow-compiler');
            executableLogic = compileGraphToLogic(validated.nodes, validated.edges, validated.name, tenantId);
        } catch (e: any) {
            console.warn('Workflow Compilation Failed:', e);
            compilationError = e.message;
        }

        // Optimized Update with Version Check (Optimistic Locking)
        const query: any = { name: validated.name, tenantId, environment };

        // If it's an update (not first creation), we check the version
        if (validated.version > 1) {
            query.version = validated.version;
        }

        const result = await workflows.updateOne(
            query,
            {
                $set: {
                    name: validated.name,
                    active: validated.active,
                    tenantId,
                    environment,
                    industry: validated.industry,
                    entityType: 'ENTITY', // Default for now
                    visual: visibleGraph,
                    executable: executableLogic,
                    compilationError: compilationError,
                    updatedAt: new Date(),
                    updatedBy: session.user.email
                },
                $inc: { version: 1 },
                $setOnInsert: {
                    createdAt: new Date(),
                    createdBy: session.user.email
                }
            },
            { upsert: true }
        );

        if (result.matchedCount === 0 && validated.version > 1) {
            throw new AppError('CONFLICT', 409, 'Optimistic locking failure: The workflow has been modified by another user. Please refresh and try again.');
        }

        return NextResponse.json({
            success: true,
            id: result.upsertedId || 'updated',
            compiled: !!executableLogic,
            warning: compilationError
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_WORKFLOWS_POST', 'system');
    }
}
