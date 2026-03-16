import { NextRequest, NextResponse } from "next/server";
import { getGovernanceEngine } from "@/core/engine/index.server";
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from "@/lib/errors";
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/core/governance/audit
 * Lista los logs de auditoría de decisiones de IA.
 * SLA: P95 < 2000ms
 */
export const GET = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APIGOVERNANCEAUDIT', action: 'LISTAUDIT' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('governance', 'read');
                const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';

                const logs = await getGovernanceEngine().getAuditLogs(tenantId);

                await log({
                    message: 'AI audit logs retrieved',
                    details: {
                        tenantId,
                        userId: session.user.id,
                        count: logs.length
                    }
                });

                return NextResponse.json({
                    success: true,
                    logs,
                    correlationId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'APIGOVERNANCEAUDIT', correlationId);
            }
        }
    ),
    { endpoint: 'GET /api/core/governance/audit', thresholdMs: 2000 }
);
