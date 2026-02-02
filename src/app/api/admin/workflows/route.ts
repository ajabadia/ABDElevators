
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // Assuming auth is set up
import { connectDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { z } from 'zod';

const WorkflowSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    nodes: z.array(z.any()), // React Flow nodes
    edges: z.array(z.any()), // React Flow edges
    active: z.boolean().default(true)
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) { // Simple auth check
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validated = WorkflowSchema.parse(body);

        const db = await connectDB();
        const workflows = db.collection('workflow_definitions');

        // Simple Upsert logic for MVP: if ID provided, update; else insert
        // React Flow doesn't inherently provide a "Workflow ID", we'd need to generate one or pass it
        // For this demo, we'll treat it as "Create New" or "Update if exists by Name" (simplified)

        const visibleGraph = {
            nodes: validated.nodes,
            edges: validated.edges
        };

        // Validate and Compile Logic
        // We catch compilation errors to prevent saving invalid graphs as "active"
        let executableLogic: Partial<import('@/types/workflow').AIWorkflow> | null = null;
        let compilationError: string | null = null;

        try {
            const { compileGraphToLogic } = await import('@/lib/workflow-compiler');
            executableLogic = compileGraphToLogic(validated.nodes, validated.edges, validated.name, session.user.email); // Using email as tenant for now
        } catch (e: any) {
            console.warn('Workflow Compilation Failed:', e);
            compilationError = e.message;
            // We still save the visual part so user doesn't lose work, but mark as inactive? 
            // For MVP, we proceed but log error.
        }

        const result = await workflows.updateOne(
            { name: validated.name },
            {
                $set: {
                    ...validated,
                    visual: visibleGraph,
                    executable: executableLogic,
                    compilationError: compilationError,
                    updatedAt: new Date(),
                    updatedBy: session.user.email
                },
                $setOnInsert: {
                    createdAt: new Date(),
                    createdBy: session.user.email
                }
            },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            id: result.upsertedId || 'updated',
            compiled: !!executableLogic,
            warning: compilationError
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
        }
        console.error('Workflow Save Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
