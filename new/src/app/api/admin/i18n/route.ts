import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TranslationService } from '@/lib/translation-service';
import { handleApiError, AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UserRole } from '@/types/roles';
import { TranslationSchema } from '@/lib/schemas';
import crypto from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

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

        // Cargar mensajes detallados (con source metadata)
        const detailedMessages = await TranslationService.getDetailedMessages(locale, 'platform_master');

        // Aplicar filtros a la estructura plana detallada
        let filteredDetailed = detailedMessages;

        if (namespace) {
            filteredDetailed = Object.fromEntries(
                Object.entries(filteredDetailed).filter(([key]) => key.startsWith(`${namespace}.`))
            );
        }

        if (search) {
            const lowerSearch = search.toLowerCase();
            filteredDetailed = Object.fromEntries(
                Object.entries(filteredDetailed).filter(([key, data]) =>
                    key.toLowerCase().includes(lowerSearch) ||
                    data.value.toLowerCase().includes(lowerSearch)
                )
            );
        }

        return NextResponse.json({
            success: true,
            locale,
            messages: filteredDetailed,
            filters: { namespace, search }
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_I18N_GET', correlationId);
    }
}

// Helper: Filtrar por namespace
function filterByNamespace(messages: any, namespace: string): any {
    if (namespace === 'all' || !namespace) return messages;

    const result: any = {};
    const flatMessages = TranslationService.nestToFlat(messages);

    for (const [key, value] of Object.entries(flatMessages)) {
        if (key.startsWith(`${namespace}.`)) {
            result[key] = value;
        }
    }

    return TranslationService.flatToNested(Object.entries(result).map(([key, value]) => ({ key, value })));
}

// Helper: Filtrar por búsqueda
function filterBySearch(messages: any, search: string): any {
    const result: any = {};
    const flatMessages = TranslationService.nestToFlat(messages);
    const lowerSearch = search.toLowerCase();

    for (const [key, value] of Object.entries(flatMessages)) {
        if (
            key.toLowerCase().includes(lowerSearch) ||
            String(value).toLowerCase().includes(lowerSearch)
        ) {
            result[key] = value;
        }
    }

    return TranslationService.flatToNested(Object.entries(result).map(([key, value]) => ({ key, value })));
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

        // Persistir individualmente (Forzamos platform_master para el panel admin)
        await TranslationService.updateTranslation({
            key,
            value,
            locale,
            tenantId: 'platform_master',
            userId: session.user.email ?? 'admin'
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
