import { NextRequest, NextResponse } from 'next/server';
import { TranslationService } from '@/services/core/translation-service';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    await logEvento({
        level: 'INFO',
        source: 'API_I18N_SYNC',
        action: 'INIT',
        message: 'Iniciando sincronización forzada de todas las traducciones locales...',
        correlationId
    });

    try {
        await requireRole([UserRole.SUPER_ADMIN]);
        const result = await TranslationService.forceSyncAllLocales('platform_master');

        await logEvento({
            level: 'INFO',
            source: 'API_I18N_SYNC',
            action: 'SYNC_COMPLETE',
            message: 'Sincronización completada con éxito.',
            correlationId,
            details: { stats: result }
        });

        return NextResponse.json({
            success: true,
            message: 'Sincronización completada con éxito.',
            stats: result
        });
    } catch (error: any) {
        console.error('\n❌ Error durante la sincronización:', error);
        return handleApiError(error, 'API_I18N_SYNC_PUBLIC', correlationId);
    }
}
