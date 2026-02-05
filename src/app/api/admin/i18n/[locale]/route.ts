import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TranslationService } from '@/lib/translation-service';
import { handleApiError, AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

/**
 * PATCH /api/admin/i18n/[locale]
 * Actualiza múltiples traducciones para un idioma.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ locale: string }> }
) {
    const correlationId = crypto.randomUUID();
    const { locale } = await params;

    try {
        const session = await requireRole([UserRole.SUPER_ADMIN]);
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
                userId: session.user.email
            });
        }

        return NextResponse.json({
            success: true,
            count: keys.length
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_LANG_PATCH', correlationId);
    }
}
