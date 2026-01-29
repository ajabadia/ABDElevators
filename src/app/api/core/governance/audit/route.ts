import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GovernanceEngine } from "@/core/engine/GovernanceEngine";
import { logEvento } from "@/lib/logger";

/**
 * GET /api/core/governance/audit
 * Lista los logs de auditoría de decisiones de IA.
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const tenantId = session.user.tenantId || 'default_tenant';
        const logs = await GovernanceEngine.getInstance().getAuditLogs(tenantId);

        return NextResponse.json({
            success: true,
            logs
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Error al listar auditoría de IA",
            error: error.message
        }, { status: 500 });
    }
}
