import crypto from 'crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError } from '@/lib/errors';

/**
 * GET /api/admin/i18n/[locale]/debug?key=some.key
 * Retorna detalles técnicos de una llave para debugging.
 */
async function GET_internal (
    req: NextRequest,
    { params }: { params: Promise<{ locale: string }> }
) {
    const correlationId = crypto.randomUUID();
    try {
        await enforcePermission('i18n', 'read');

        const { locale } = await params;
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json({ success: false, message: 'Missing key parameter' }, { status: 400 });
        }

        const debugInfo = await TranslationService.getKeyDebugInfo(locale, key);

        return NextResponse.json({
            success: true,
            ...debugInfo
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_I18N_DEBUG_GET', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/i18n/[locale]/debug', thresholdMs: 300 });
