import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/i18n/stats
 * Retorna estadísticas de namespaces para filtros.
 */
async function GET_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_I18N_STATS', action: 'FETCH' },
        async ({ log, correlationId }) => {
            try {
                await requirePermission('i18n', 'read');

                const { searchParams } = new URL(req.url);
                const locale = searchParams.get('locale') || 'es';

                // Cargar todos los mensajes
                const messages = await TranslationService.getMessages(locale);

                // Aplanar y contar por namespace
                const flatMessages = nestToFlat(messages);
                const namespaceCounts: Record<string, number> = {};

                for (const key of Object.keys(flatMessages)) {
                    const namespace = key.split('.')[0] || 'common';
                    namespaceCounts[namespace] = (namespaceCounts[namespace] || 0) + 1;
                }

                // Calcular total
                const total = Object.values(namespaceCounts).reduce((sum, count) => sum + count, 0);

                await log({
                    message: `i18n statistics generated for locale ${locale}`,
                    details: { locale, totalKeys: total, namespaceCount: Object.keys(namespaceCounts).length }
                });

                return NextResponse.json({
                    success: true,
                    locale,
                    total,
                    namespaces: namespaceCounts
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_I18N_STATS_GET', correlationId);
            }
        }
    );
}

// Helper: Aplanar objeto anidado
function nestToFlat(obj: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    if (!obj) return result;
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, nestToFlat(value, newKey));
        } else {
            result[newKey] = String(value);
        }
    }
    return result;
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/i18n/stats', thresholdMs: 500 });
