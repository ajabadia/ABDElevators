import { NextRequest, NextResponse } from "next/server";
import { GovernanceEngine } from "@/core/engine/GovernanceEngine";
import { logEvento } from "@/lib/logger";
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from "@/lib/errors";

/**
 * GET /api/core/governance/audit
 * Lista los logs de auditoría de decisiones de IA.
 * SLA: P95 < 2000ms
 */
export const GET = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();

    try {
        const session = await requirePermission('governance', 'read');
        const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';

        const logs = await GovernanceEngine.getInstance().getAuditLogs(tenantId);

        return NextResponse.json({
            success: true,
            logs,
            correlationId
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_GOVERNANCE_AUDIT_GET', correlationId);
    }
}, { endpoint: 'GET /api/core/governance/audit', thresholdMs: 2000 });
