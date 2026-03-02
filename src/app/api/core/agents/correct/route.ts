import { NextRequest, NextResponse } from "next/server";
import { AgentEngine } from "@/core/engine/AgentEngine";
import { enforcePermission } from "@/lib/guardian-guard";
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from "@/lib/errors";

/**
 * POST /api/core/agents/correct
 * Registra una corrección humana sobre datos de IA para aprendizaje.
 * SLA: P95 < 1000ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('technical:agents', 'update');

        const body = await req.json();
        const { entitySlug, originalData, correctedData, correlationId: bodyCorrelationId } = body;

        if (!entitySlug || !originalData || !correctedData) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';
        const userId = session.user.email || 'unknown';

        const resultId = await AgentEngine.getInstance().recordCorrection(
            entitySlug,
            originalData,
            correctedData,
            userId,
            tenantId,
            bodyCorrelationId || correlationId
        );

        return NextResponse.json({
            success: true,
            correctionId: resultId,
            correlationId
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CORE_AGENTS_CORRECT_POST', correlationId);
    }
}, { endpoint: 'POST /api/core/agents/correct', thresholdMs: 1000 });
