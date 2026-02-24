import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError, AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UserRole } from '@/types/roles';
import { TranslationSchema } from '@/lib/schemas';
import crypto from 'crypto';
import { z } from 'zod';

/**
 * GET /api/admin/i18n
 * Lista traducciones del sistema con soporte para filtros (lazy loading).
 * Query params: locale, namespace, search
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await requireRole([UserRole.SUPER_ADMIN]);

        const { searchParams } = new URL(req.url);
        const locale = z.string().min(2).max(5).parse(searchParams.get('locale') || 'es');
        const namespace = searchParams.get('namespace') || '';
        const search = searchParams.get('search') || '';
        const loadAll = searchParams.get('all') === 'true';
        const detailed = searchParams.get('detailed') === 'true';

        // Lazy Loading: Si no hay filtros activos Y no se solicita "todos", retornar objeto vacío
        const hasActiveFilters = namespace || search || loadAll;
        if (!hasActiveFilters) {
            return NextResponse.json({
                success: true,
                locale,
                messages: {},
                info: 'No filters applied. Use namespace or search parameters to load data.'
            });
        }

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
            // Filtrar por namespace (e.g., "common" filtra "common.*")
            filteredMessages = filterByNamespace(allMessages, namespace, detailed);
        }

        if (search) {
            // Filtrar por búsqueda en claves y valores
            filteredMessages = filterBySearch(filteredMessages, search, detailed);
        }

        return NextResponse.json({
            success: true,
            locale,
            detailed,
            messages: filteredMessages,
            filters: { namespace, search }
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_GET', correlationId);
    }
}

// Helper: Filtrar por namespace
function filterByNamespace(messages: any, namespace: string, detailed: boolean): any {
    if (namespace === 'all' || !namespace) return messages;

    const result: any = {};
    const flatMessages = detailed ? messages : nestToFlat(messages);

    for (const [key, value] of Object.entries(flatMessages)) {
        if (key.startsWith(`${namespace}.`)) {
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
