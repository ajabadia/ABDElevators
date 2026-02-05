import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TranslationService } from '@/lib/translation-service';
import { handleApiError, AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UserRole } from '@/types/roles';
import { TranslationSchema } from '@/lib/schemas';
import crypto from 'crypto';
import { z } from 'zod';

/**
 * GET /api/admin/i18n
 * Lista todas las traducciones del sistema.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await requireRole([UserRole.SUPER_ADMIN]);

        const { searchParams } = new URL(req.url);
        const locale = z.string().min(2).max(5).parse(searchParams.get('locale') || 'es');

        // Cargamos los mensajes estructurados
        const messages = await TranslationService.getMessages(locale);

        return NextResponse.json({
            success: true,
            locale,
            messages
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_GET', correlationId);
    }
}

/**
 * POST /api/admin/i18n
 * Crea una nueva llave de traducción.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requireRole([UserRole.SUPER_ADMIN]);
        const body = await req.json();

        // Validation Layer (Strict)
        const validated = TranslationSchema.pick({ key: true, value: true, locale: true }).parse(body);
        const { key, value, locale } = validated;

        // Persistir individualmente
        await TranslationService.updateTranslation({
            key,
            value,
            locale,
            userId: session.user.email ?? 'unknown'
        });

        await logEvento({
            level: 'INFO',
            source: 'API_I18N',
            action: 'KEY_CREATED',
            message: `Nueva llave '${key}' creada para '${locale}'`,
            correlationId,
            details: { key, locale }
        });

        return NextResponse.json({ success: true, key });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_CREATE_POST', correlationId);
    }
}
