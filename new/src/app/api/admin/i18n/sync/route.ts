import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TranslationService } from '@/lib/translation-service';
import { handleApiError, AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

/**
 * POST /api/admin/i18n/sync
 * Sincroniza archivos locales a la DB.
 * Body: { locale: 'es' | 'en' | 'all' }
 * - 'all': sincroniza todos los idiomas soportados.
 * - Un locale específico: sincroniza solo ese idioma.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();
    try {
        await requireRole([UserRole.SUPER_ADMIN]);

        const body = await req.json().catch(() => ({}));
        const { locale, action = 'import' } = body; // 'import' (JSON -> DB) o 'export' (DB -> JSON)

        if (!locale) throw new AppError('VALIDATION_ERROR', 400, 'Locale is required');

        let result: any;

        if (action === 'export') {
            // Sincronización Bidireccional: DB -> JSON Local
            result = await TranslationService.exportToLocalFiles(locale);
        } else {
            // Importación estándar: JSON Local -> DB
            if (locale === 'all') {
                result = await TranslationService.forceSyncAllLocales();
            } else {
                const { messages, added, updated } = await TranslationService.forceSyncFromLocal(locale);
                const flat = TranslationService.nestToFlat(messages);
                result = {
                    [locale]: Object.keys(flat).length,
                    added,
                    updated,
                    keysAdded: [] // Simplification: Detailed keys not tracked in bulk mode to save RAM
                };
            }
        }

        const duration = Date.now() - start;

        await logEvento({
            level: 'INFO',
            source: 'API_I18N',
            action: action === 'export' ? 'MANUAL_EXPORT' : 'MANUAL_SYNC',
            message: `Operación i18n '${action}' completada para '${locale}' en ${duration}ms`,
            correlationId,
            details: { locale, action, result, duration_ms: duration }
        });

        return NextResponse.json({
            success: true,
            result,
            message: action === 'export'
                ? `Exportación completada para ${locale} (${result.exported} llaves)`
                : (locale === 'all'
                    ? `Sincronización global completada`
                    : `Sincronización completada para ${locale}`)
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_SYNC_POST', correlationId);
    }
}
