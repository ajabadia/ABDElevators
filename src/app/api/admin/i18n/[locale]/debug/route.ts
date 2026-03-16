import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { i18nDebugService } from '@/services/admin/i18nDebugService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/i18n/[locale]/debug
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ locale: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_I18N_DEBUG', action: 'DIAGNOSE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('platform:settings', 'manage');
                const { locale } = await context.params;

                await log({ message: `Diagnosing i18n issues for locale: ${locale}` });
                const diagnosis = await i18nDebugService.diagnoseLocale(locale);

                return NextResponse.json({ success: true, diagnosis, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_I18N_DEBUG_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/i18n/[locale]/debug', thresholdMs: 1000 });
