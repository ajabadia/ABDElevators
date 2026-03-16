import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { i18nService } from '@/services/admin/stub-services';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/i18n/[locale]
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ locale: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_I18N', action: 'GET_LOCALE_DATA' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('platform:settings', 'read');
                const { locale } = await context.params;

                const data = await i18nService.getLocaleData(locale);

                return NextResponse.json({ success: true, data, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_I18N_LOCALE_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/i18n/[locale]', thresholdMs: 1000 });
