import { NextRequest, NextResponse } from "next/server";
import { getAgentEngine } from "@/core/engine/index.server";
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from "@/lib/errors";
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/core/agents/correct
 * Registra una corrección humana sobre datos de IA para aprendizaje.
 * SLA: P95 < 1000ms
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_CORE_AGENTS_LEARNING', action: 'RECORD_CORRECTION' },
        async ({ correlationId, log }) => {
            try {
                const session = await requirePermission('technical:agents', 'update');

                const body = await req.json();
                const { entitySlug, originalData, correctedData, correlationId: bodyCorrelationId } = body;

                if (!entitySlug || !originalData || !correctedData) {
                    await log({ level: 'WARN', message: 'Incomplete correction data received' });
                    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
                }

                const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';
                const userId = session.user.email || 'unknown';

                await log({
                    message: `Recording human correction for agent engine: ${entitySlug}`,
                    details: { entitySlug, userId },
                    tenantId
                });

                const resultId = await getAgentEngine().recordCorrection(
                    entitySlug,
                    originalData,
                    correctedData,
                    userId,
                    tenantId,
                    bodyCorrelationId || correlationId
                );

                await log({
                    message: 'Agent learning correction recorded successfully',
                    details: { correctionId: resultId },
                    tenantId
                });

                return NextResponse.json({
                    success: true,
                    correctionId: resultId,
                    correlationId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CORE_AGENTS_CORRECT_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/core/agents/correct', thresholdMs: 1000 });
