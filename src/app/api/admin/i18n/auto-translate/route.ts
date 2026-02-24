import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError, AppError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

/**
 * POST /api/admin/i18n/auto-translate
 * Genera traducciones usando IA (Gemini).
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await requireRole([UserRole.SUPER_ADMIN]);
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
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_AUTO_TRANSLATE_POST', correlationId);
    }
}
