import crypto from 'crypto';
import { NextRequest, NextResponse } from "next/server";
import { IntelligenceDashboard } from "@/core/engine/IntelligenceDashboard";
import { logEvento } from "@/lib/logger";
import { enforcePermission } from "@/lib/guardian-guard";
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from "@/lib/errors";

/**
 * GET /api/core/dashboard/intelligence
 * Obtiene métricas agregadas de inteligencia colectiva (Fase 9).
 * SLA: P95 < 2000ms
 */
export const GET = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('knowledge', 'read');
        const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';

        const metrics = await IntelligenceDashboard.getInstance().getMetrics(tenantId);

        return NextResponse.json({
            success: true,
            metrics,
            correlationId
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CORE_DASHBOARD_INTEL_GET', correlationId);
    }
}, { endpoint: 'GET /api/core/dashboard/intelligence', thresholdMs: 2000 });
