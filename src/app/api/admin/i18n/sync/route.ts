import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TranslationService } from '@/lib/translation-service';
import { handleApiError, AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

/**
 * POST /api/admin/i18n/sync
 * Sincroniza archivos locales a la DB (útil para despliegues iniciales o resets)
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await requireRole([UserRole.SUPER_ADMIN]);

        const body = await req.json().catch(() => ({}));
        const { locale } = body;

        if (!locale) throw new AppError('VALIDATION_ERROR', 400, 'Locale is required');

        // Forzamos sincronización desde el archivo local JSON hacia la DB
        const messages = await TranslationService.forceSyncFromLocal(locale);

        await logEvento({
            level: 'INFO',
            source: 'API_I18N',
            action: 'MANUAL_SYNC',
            message: `Sincronización manual iniciada para '${locale}'`,
            correlationId
        });

        return NextResponse.json({
            success: true,
            count: Object.keys(messages).length,
            message: `Sincronización completada para ${locale}`
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_SYNC_POST', correlationId);
    }
}
