import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError, AppError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/i18n/sync
 * Sincronización BIDIRECCIONAL inteligente.
 */
async function POST_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_I18N_SYNC', action: 'SYNC' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('i18n', 'manage');

                const body = await req.json().catch(() => ({}));
                const { locale, action = 'import', direction } = body;

                // Compatibility fallback for old 'direction' parameter
                const effectiveAction = direction ? (direction === 'to-file' ? 'export' : 'import') : action;

                if (!locale) throw new AppError('VALIDATION_ERROR', 400, 'Locale is required');

                let result: any;
                const start = Date.now();

                if (effectiveAction === 'export') {
                    result = await TranslationService.exportToLocalFiles(locale);
                } else {
                    if (locale === 'all') {
                        result = await TranslationService.forceSyncAllLocales();
                    } else {
                        const { messages, added, updated } = await TranslationService.forceSyncFromLocal(locale);
                        const flat = TranslationService.nestToFlat(messages);
                        result = {
                            [locale]: Object.keys(flat).length,
                            added,
                            updated,
                            keysAdded: []
                        };
                    }
                }

                const duration = Date.now() - start;

                await log({
                    message: `i18n sync '${effectiveAction}' completed for '${locale}'`,
                    details: { locale, action: effectiveAction, result, duration_ms: duration }
                });

                return NextResponse.json({
                    success: true,
                    result,
                    added: result.added || 0,
                    updated: result.updated || 0,
                    keysAdded: result.keysAdded || [],
                    message: effectiveAction === 'export'
                        ? `Exportación completada para ${locale}`
                        : `Sincronización completada para ${locale}`
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_I18N_SYNC_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/i18n/sync', thresholdMs: 10000 });
