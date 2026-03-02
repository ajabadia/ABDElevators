import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/i18n/stats
 * Retorna estadísticas de namespaces para filtros.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await enforcePermission('i18n', 'read');

        const { searchParams } = new URL(req.url);
        const locale = searchParams.get('locale') || 'es';

        // Cargar todos los mensajes
        const messages = await TranslationService.getMessages(locale);

        // Aplanar y contar por namespace
        const flatMessages = nestToFlat(messages);
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
    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_I18N_STATS_GET', correlationId);
    }
}

// Helper: Aplanar objeto anidado
function nestToFlat(obj: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    if (!obj) return result;
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, nestToFlat(value, newKey));
        } else {
            result[newKey] = String(value);
        }
    }
    return result;
}
