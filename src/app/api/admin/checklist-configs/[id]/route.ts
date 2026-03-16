import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { ChecklistConfigService } from '@/services/admin/ChecklistConfigService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/checklist-configs/[id]
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_CHECKLIST_CONFIG', action: 'GET' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('config:manage', 'read');
                const { id } = await context.params;

                const config = await ChecklistConfigService.getConfigById(id, session.user.tenantId);

                return NextResponse.json({ success: true, config, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_CHECKLIST_CONFIG_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/checklist-configs/[id]', thresholdMs: 500 });
