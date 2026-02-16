import { NextRequest, NextResponse } from 'next/server';
import { TranslationService } from '@/lib/translation-service';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { handleApiError } from '@/lib/errors';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    console.log('--- 🌐 i18n Sync API ---');
    console.log('Iniciando sincronización forzada de todas las traducciones locales...');

    try {
        await requireRole([UserRole.SUPER_ADMIN]);
        const result = await TranslationService.forceSyncAllLocales('platform_master');

        console.log('\n--- ✅ Resultados de Sincronización ---');
        console.log(result);

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
