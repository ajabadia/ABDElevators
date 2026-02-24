import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

/**
 * GET /api/admin/i18n/[locale]/debug?key=some.key
 * Retorna detalles técnicos de una llave para debugging.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ locale: string }> }
) {
    const correlationId = crypto.randomUUID();
    try {
        await requireRole([UserRole.SUPER_ADMIN]);

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
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_DEBUG_GET', correlationId);
    }
}
