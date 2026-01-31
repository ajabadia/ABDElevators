import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CrossVerticalEngine } from "@/core/engine/CrossVerticalEngine";
import crypto from 'crypto';

/**
 * POST /api/core/search/cross-vertical
 * Realiza una búsqueda semántica entre verticales (Horizontal Search).
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { query } = await req.json();
        const tenantId = session.user.tenantId || 'default_tenant';
        const correlacion_id = crypto.randomUUID();

        if (!query) {
            return NextResponse.json({ error: "Query requerida" }, { status: 400 });
        }

        const data = await CrossVerticalEngine.getInstance().semanticHorizontalSearch(
            query,
            tenantId,
            correlacion_id
        );

        return NextResponse.json({
            success: true,
            ...data, correlationId: correlacion_id});
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Error en búsqueda horizontal",
            error: error.message
        }, { status: 500 });
    }
}
