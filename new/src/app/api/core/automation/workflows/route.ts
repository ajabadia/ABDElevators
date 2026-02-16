import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantCollection } from "@/lib/db-tenant";
import { logEvento } from "@/lib/logger";

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
        const tenantId = session.user.tenantId || 'default_tenant';
        const collection = await getTenantCollection('ai_workflows', { user: { tenantId } });
        const workflows = await collection.find({});

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
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const tenantId = session.user.tenantId || 'default_tenant';
        const collection = await getTenantCollection('ai_workflows', { user: { tenantId } });

        const workflow = {
            ...body,
            tenantId,
            updatedAt: new Date()
        };

        let result;
        if (body._id) {
            const { _id, ...updateData } = workflow;
            result = await collection.updateOne({ _id: _id } as any, { $set: updateData });
        } else {
            workflow.createdAt = new Date();
            workflow.active = true;
            result = await collection.insertOne(workflow);
        }

        await logEvento({
            level: 'INFO',
            source: 'API_AUTOMATION',
            action: 'SAVE_WORKFLOW',
            message: `Workflow de IA guardado: ${workflow.name}`,
            correlationId: crypto.randomUUID()
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
