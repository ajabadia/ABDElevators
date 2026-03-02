import crypto from 'crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { TranslationService } from '@/services/core/translation-service';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

async function GET_internal (req: NextRequest) {
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

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/i18n-sync', thresholdMs: 300 });
