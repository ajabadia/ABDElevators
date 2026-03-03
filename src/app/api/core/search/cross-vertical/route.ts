import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server";
import { enforcePermission } from '@/lib/guardian-guard';
import { CrossVerticalEngine } from "@/core/engine/CrossVerticalEngine";
import { AppError } from '@/lib/errors';

/**
 * POST /api/core/search/cross-vertical
 * Realiza una búsqueda semántica entre verticales (Horizontal Search).
 */
async function POST_internal(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await enforcePermission('rag:query', 'read');
        const { query } = await req.json();
        const tenantId = session.user.tenantId;

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
            ...data, correlationId: correlacion_id
        });
    } catch (error: unknown) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json({
            success: false,
            message: "Error en búsqueda horizontal",
            error: error instanceof Error ? error.message : 'Unknown error',
            correlationId: correlacion_id
        }, { status: 500 });
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/core/search/cross-vertical', thresholdMs: 1000 });
