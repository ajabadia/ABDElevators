import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { TranslationSchema } from '@/lib/schemas';
import { z } from 'zod';

/**
 * GET /api/admin/i18n
 * Lista traducciones del sistema con soporte para filtros (lazy loading).
 * Query params: locale, namespace, search
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await enforcePermission('i18n', 'read');

        const { searchParams } = new URL(req.url);
        const locale = z.string().min(2).max(5).parse(searchParams.get('locale') || 'es');
        const namespace = searchParams.get('namespace') || '';
        const search = searchParams.get('search') || '';
        const detailed = searchParams.get('detailed') === 'true';
        const missingOnly = searchParams.get('missingOnly') === 'true';
        const secondaryLocale = searchParams.get('secondaryLocale') || '';

        // Paginación
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250);
        const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

        // Cargar mensajes (Estructurados o Detallados/Planos)
        let allMessages: any;
        if (detailed) {
            allMessages = await TranslationService.getDetailedMessages(locale);
        } else {
            allMessages = await TranslationService.getMessages(locale);
        }

        // Aplicar filtros
        let filteredMessages = allMessages;

        if (namespace) {
            filteredMessages = filterByNamespace(allMessages, namespace, detailed);
        }

        if (search) {
            filteredMessages = filterBySearch(filteredMessages, search, detailed);
        }

        if (missingOnly && secondaryLocale) {
            // Para filtrar faltantes, necesitamos comparar con el idioma secundario
            const secondaryMessages = await TranslationService.getDetailedMessages(secondaryLocale);
            filteredMessages = filterMissingKeys(filteredMessages, secondaryMessages);
        }

        // Aplicar Paginación sobre el set filtrado
        const keys = Object.keys(filteredMessages);
        const total = keys.length;
        const paginatedKeys = keys.slice(offset, offset + limit);
        const paginatedMessages: any = {};

        paginatedKeys.forEach(key => {
            paginatedMessages[key] = filteredMessages[key];
        });

        return NextResponse.json({
            success: true,
            locale,
            detailed,
            messages: paginatedMessages,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            },
            filters: { namespace, search, missingOnly }
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_GET', correlationId);
    }
}

/**
 * Filtra llaves que NO tienen valor en el idioma secundario.
 */
function filterMissingKeys(primaryMessages: any, secondaryMessages: any): any {
    const result: any = {};
    for (const [key, details] of Object.entries(primaryMessages)) {
        // Si no existe en el secundario o su valor es falsy
        const sValue = (secondaryMessages[key] as any)?.value;
        if (!sValue) {
            result[key] = details;
        }
    }
    return result;
}

// Helper: Filtrar por namespace
function filterByNamespace(messages: any, namespace: string, detailed: boolean): any {
    if (namespace === 'all' || !namespace) return messages;

    const result: any = {};
    const flatMessages = detailed ? messages : nestToFlat(messages);

    for (const [key, value] of Object.entries(flatMessages)) {
        // Mejorado: exacto o prefijo punto
        if (key === namespace || key.startsWith(`${namespace}.`)) {
            result[key] = value;
        }
    }

    return detailed ? result : flatToNest(result);
}

// Helper: Filtrar por búsqueda
function filterBySearch(messages: any, search: string, detailed: boolean): any {
    const result: any = {};
    const flatMessages = detailed ? messages : nestToFlat(messages);
    const lowerSearch = search.toLowerCase();

    for (const [key, value] of Object.entries(flatMessages)) {
        const valueStr = detailed ? (value as any).value : String(value);
        if (
            key.toLowerCase().includes(lowerSearch) ||
            valueStr.toLowerCase().includes(lowerSearch)
        ) {
            result[key] = value;
        }
    }

    return detailed ? result : flatToNest(result);
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

// Helper: Convertir flat a nested
function flatToNest(flat: Record<string, string>): any {
    const result: any = {};
    for (const [key, value] of Object.entries(flat)) {
        const parts = key.split('.');
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
    }
    return result;
}

/**
 * POST /api/admin/i18n
 * Crea una nueva llave de traducción.
 */
async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('i18n', 'manage');
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

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/i18n', thresholdMs: 300 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/i18n', thresholdMs: 300 });
