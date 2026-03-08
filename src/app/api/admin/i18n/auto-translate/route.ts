import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError, AppError } from '@/lib/errors';

/**
 * POST /api/admin/i18n/auto-translate
 * Genera traducciones usando IA (Gemini).
 */
async function POST_internal (req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await requirePermission('i18n', 'manage');
        const body = await req.json();
        const { sourceLocale, targetLocale, keys } = body;

        if (!sourceLocale || !targetLocale || !keys || !Array.isArray(keys)) {
            throw new AppError('VALIDATION_ERROR', 400, 'Missing required parameters: sourceLocale, targetLocale, keys');
        }

        const result = await TranslationService.autoTranslate({
            sourceLocale,
            targetLocale,
            keys,
            tenantId: session.user.tenantId, // platform_master
            correlationId
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_I18N_AUTO_TRANSLATE_POST', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/i18n/auto-translate', thresholdMs: 300 });
