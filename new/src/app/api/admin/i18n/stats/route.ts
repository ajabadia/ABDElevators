import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TranslationService } from '@/lib/translation-service';
import { handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

/**
 * GET /api/admin/i18n/stats
 * Retorna estadísticas de namespaces para filtros.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await requireRole([UserRole.SUPER_ADMIN]);

        const { searchParams } = new URL(req.url);
        const locale = searchParams.get('locale') || 'es';

        // Cargar todos los mensajes
        const messages = await TranslationService.getMessages(locale);

        // Aplanar y contar por namespace
        const flatMessages = TranslationService.nestToFlat(messages);
        const namespaceCounts: Record<string, number> = {};

        for (const key of Object.keys(flatMessages)) {
            const namespace = key.split('.')[0] || 'common';
            namespaceCounts[namespace] = (namespaceCounts[namespace] || 0) + 1;
        }

        // Calcular total
        const total = Object.values(namespaceCounts).reduce((sum, count) => sum + count, 0);

        return NextResponse.json({
            success: true,
            locale,
            total,
            namespaces: namespaceCounts
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_STATS_GET', correlationId);
    }
}
