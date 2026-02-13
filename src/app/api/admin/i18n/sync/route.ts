import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TranslationService } from '@/lib/translation-service';
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
        const { locale, direction = 'to-db' } = body;

        if (!locale) throw new AppError('VALIDATION_ERROR', 400, 'Locale is required');
        if (!['to-db', 'to-file'].includes(direction)) {
            throw new AppError('VALIDATION_ERROR', 400, 'Direction must be "to-db" or "to-file"');
        }

        const result = await TranslationService.syncBidirectional(locale, direction);

        const directionLabel = direction === 'to-db' ? 'JSON → BD' : 'BD → JSON';

        // Crear mensaje detallado (Smart-Merge aware)
        let detailedMessage = `Sincronización ${directionLabel} ('${locale}'): `;
        const totalChanges = result.added + result.updated;

        if (totalChanges === 0) {
            detailedMessage += 'No se detectaron discrepancias ni claves nuevas.';
        } else {
            const sampleKeys = result.keysChanged.slice(0, 5).join(' | ');
            const remaining = result.keysChanged.length > 5 ? ` (+${result.keysChanged.length - 5} más)` : '';
            detailedMessage += `${result.added} nuevas, ${result.updated} actualizadas. [${sampleKeys}${remaining}]`;
        }

        await logEvento({
            level: 'INFO',
            source: 'API_I18N',
            action: direction === 'to-db' ? 'SYNC_TO_DB' : 'SYNC_TO_FILE',
            message: detailedMessage,
            correlationId,
            details: { ...result }
        });

        return NextResponse.json({
            success: true,
            added: result.added,
            updated: result.updated,
            keysAdded: result.keysChanged, // Mantener keysAdded para compatibilidad UI (o actualizar UI)
            message: detailedMessage,
            direction
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_SYNC_POST', correlationId);
    }
}
