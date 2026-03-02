import crypto from 'crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError, AppError } from '@/lib/errors';

/**
 * PATCH /api/admin/i18n/[locale]
 * Actualiza múltiples traducciones para un idioma.
 */
async function PATCH_internal (
    req: NextRequest,
    { params }: { params: Promise<{ locale: string }> }
) {
    const correlationId = crypto.randomUUID();
    const { locale } = await params;

    try {
        const session = await enforcePermission('i18n', 'manage');
        const body = await req.json();
        const { translations } = body; // Map: { "nav.home": "Inicio", ... }

        if (!translations || typeof translations !== 'object') {
            throw new AppError('VALIDATION_ERROR', 400, 'Invalid translations object');
        }

        const keys = Object.keys(translations);
        for (const key of keys) {
            await TranslationService.updateTranslation({
                key,
                value: translations[key],
                locale,
                userId: session.user.email ?? undefined
            });
        }

        return NextResponse.json({
            success: true,
            count: keys.length
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_I18N_LANG_PATCH', correlationId);
    }
}

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/i18n/[locale]', thresholdMs: 300 });
