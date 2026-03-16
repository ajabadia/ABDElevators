import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { NotificationTemplateService } from '@/services/admin/NotificationTemplateService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/notifications/templates
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_NOTIFICATIONS', action: 'LIST_TEMPLATES' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('notifications:templates', 'read');
                const templates = await NotificationTemplateService.listTemplates(session.user.tenantId);

                return NextResponse.json({ success: true, templates, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_NOTIFICATIONS_TEMPLATES_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/notifications/templates', thresholdMs: 500 });
