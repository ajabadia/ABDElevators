import { NextRequest, NextResponse } from "next/server";
import { PredictiveEngine } from "@/core/engine/PredictiveEngine";
import { logEvento } from "@/lib/logger";
import { enforcePermission } from "@/lib/guardian-guard";
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from "@/lib/errors";

/**
 * GET /api/core/predictive/maintenance
 * Obtiene el tablero de mantenimiento predictivo (Fase 8).
 * SLA: P95 < 2000ms
 */
export const GET = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('technical:predictive', 'read');
        const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';

        const predictions = await PredictiveEngine.getInstance().getMaintenanceForecast(tenantId, correlationId);

        return NextResponse.json({
            success: true,
            predictions,
            correlationId
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_PREDICTIVE_MAINTENANCE_GET', correlationId);
    }
}, { endpoint: 'GET /api/core/predictive/maintenance', thresholdMs: 2000 });
