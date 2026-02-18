import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantCollection } from "@/lib/db-tenant";
import { logEvento } from "@/lib/logger";
import { enforcePermission } from "@/lib/guardian-guard";
import { MongoAIWorkflowRepository } from "@/core/adapters/persistence/MongoAIWorkflowRepository";
import crypto from 'crypto';

const workflowRepository = new MongoAIWorkflowRepository();

/**
 * GET /api/core/automation/workflows
 * Lista los flujos de trabajo de IA activos.
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const enforcedSession = await enforcePermission('automation:workflows', 'read');
        const userId = enforcedSession.user.id;
        const tenantId = enforcedSession.user.tenantId;

        const workflows = await workflowRepository.findActiveByTrigger('on_event' as any, tenantId);

        return NextResponse.json({
            success: true,
            workflows
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Error al listar workflows",
            error: error.message
        }, { status: 500 });
    }
}

/**
 * POST /api/core/automation/workflows
 * Crea o actualiza un flujo de trabajo de IA.
 */
export async function POST(req: NextRequest) {
    try {
        const enforcedSession = await enforcePermission('automation:workflows', 'write');
        const body = await req.json();
        const collection = await getTenantCollection('ai_workflows', enforcedSession as any);

        let result;
        if (body._id) {
            const { _id, ...updateData } = body;
            result = await collection.updateOne({ _id: _id } as any, { $set: updateData });
        } else {
            const workflowData = {
                ...body,
                createdAt: new Date(),
                active: true,
                tenantId: enforcedSession.user.tenantId
            };
            result = await collection.insertOne(workflowData);
        }

        await logEvento({
            level: 'INFO',
            source: 'API_AUTOMATION',
            action: 'SAVE_WORKFLOW',
            message: `Workflow de IA guardado: ${body.name}`,
            correlationId: crypto.randomUUID(),
            tenantId: enforcedSession.user.tenantId
        });

        return NextResponse.json({
            success: true,
            result
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Error al guardar workflow",
            error: error.message
        }, { status: 500 });
    }
}
