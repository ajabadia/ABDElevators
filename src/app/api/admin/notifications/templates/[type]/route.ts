import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { NotificationTemplateService } from '@/services/admin/NotificationTemplateService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/notifications/templates/[type]
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ type: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_NOTIFICATIONS', action: 'GET_TEMPLATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('notifications:templates', 'read');
                const { type } = await context.params;

                const template = await NotificationTemplateService.getTemplateByType(type, session.user.tenantId);

                return NextResponse.json({ success: true, template, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_NOTIFICATIONS_TEMPLATE_BY_TYPE_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/notifications/templates/[type]', thresholdMs: 500 });
