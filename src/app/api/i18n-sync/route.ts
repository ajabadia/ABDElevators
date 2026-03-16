import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/i18n-sync
 * Forces synchronization of all translations with the external provider.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_I18N_SYNC', action: 'FORCE_SYNC' },
        async ({ log, correlationId }) => {
            try {
                await requirePermission('platform:settings', 'manage');
                const result = await TranslationService.forceSyncAllLocales('platform_master');

                await log({ 
                    level: 'INFO', 
                    message: 'I18n synchronization completed successfully', 
                    details: { stats: result } 
                });

                return NextResponse.json({ success: true, stats: result, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_I18N_SYNC', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/i18n-sync', thresholdMs: 2000 });
