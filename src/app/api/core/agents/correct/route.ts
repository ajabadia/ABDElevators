import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AgentEngine } from "@/core/engine/AgentEngine";
import { logEvento } from "@/lib/logger";

/**
 * POST /api/core/agents/correct
 * Registra una corrección humana sobre datos de IA para aprendizaje.
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { entitySlug, originalData, correctedData, correlacion_id } = body;

        if (!entitySlug || !originalData || !correctedData) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        const tenantId = session.user.tenantId || 'default_tenant';
        const userId = session.user.email || 'unknown';

        const resultId = await AgentEngine.getInstance().recordCorrection(
            entitySlug,
            originalData,
            correctedData,
            userId,
            tenantId,
            correlacion_id || crypto.randomUUID()
        );

        return NextResponse.json({
            success: true,
            correctionId: resultId
        });
    } catch (error: any) {
        console.error('[CORE_AGENT_CORRECT] Error:', error);
        return NextResponse.json({
            success: false,
            message: "Error al registrar corrección",
            error: error.message
        }, { status: 500 });
    }
}
