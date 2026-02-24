import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError, AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

/**
 * POST /api/admin/i18n/sync
 * Sincronización BIDIRECCIONAL inteligente:
 * - direction: 'to-db' → Añade claves del JSON a la BD (merge, no borra)
 * - direction: 'to-file' → Añade claves de la BD al JSON (merge, no borra)
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await requireRole([UserRole.SUPER_ADMIN]);

        const body = await req.json().catch(() => ({}));
        const { locale, action = 'import', direction } = body; // Support 'import' (JSON -> DB) or 'export' (DB -> JSON)

        // Compatibility fallback for old 'direction' parameter
        const effectiveAction = direction ? (direction === 'to-file' ? 'export' : 'import') : action;

        if (!locale) throw new AppError('VALIDATION_ERROR', 400, 'Locale is required');

        let result: any;
        const start = Date.now();

        if (effectiveAction === 'export') {
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
            action: effectiveAction === 'export' ? 'MANUAL_EXPORT' : 'MANUAL_SYNC',
            message: `Operación i18n '${effectiveAction}' completada para '${locale}' en ${duration}ms`,
            correlationId,
            details: { locale, action: effectiveAction, result, duration_ms: duration }
        });

        return NextResponse.json({
            success: true,
            result,
            // Maintained fields for UI compatibility
            added: result.added || 0,
            updated: result.updated || 0,
            keysAdded: result.keysAdded || [],
            message: effectiveAction === 'export'
                ? `Exportación completada para ${locale} (${result.exported || 0} llaves)`
                : (locale === 'all'
                    ? `Sincronización global completada`
                    : `Sincronización completada para ${locale}`)
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_SYNC_POST', correlationId);
    }
}
