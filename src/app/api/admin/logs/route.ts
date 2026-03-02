import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/logs
 * Recupera logs de aplicación con filtrado avanzado.
 */
async function GET_internal (req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        // Phase 70: Centralized typed role check
        const session = await enforcePermission('audit:logs', 'read');

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const level = searchParams.get('level') || searchParams.get('nivel'); // Support both for transition
        const source = searchParams.get('source') || searchParams.get('origen');
        const search = searchParams.get('search');
        const tenantIdFilter = searchParams.get('tenantId');
        const userEmail = searchParams.get('userEmail');
        const loadAll = searchParams.get('all') === 'true';

        // 🛡️ Lazy Loading Guard: Si no hay filtros activos Y no se solicita "todos", retornar vacío
        const hasActiveFilters = level || source || search || userEmail || tenantIdFilter || loadAll;
        if (!hasActiveFilters) {
            return NextResponse.json({
                success: true,
                logs: [],
                meta: { errorCount: 0, warnCount: 0 },
                info: 'No filters applied. Use search, level, or source parameters to load logs.'
            });
        }
        const escapeRegExp = (string: string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        // Contexto de base de datos de LOGS blindado
        // Use 'application_logs' to match logger.ts
        const logColl = await getTenantCollection('application_logs', session, 'LOGS', { softDeletes: false });

        const query: any = {};

        // Si el usuario es SuperAdmin y quiere filtrar por un tenant específico
        if (session.user.role === UserRole.SUPER_ADMIN && tenantIdFilter) {
            query.tenantId = tenantIdFilter;
        }
        // Si el usuario es ADMIN y quiere filtrar dentro de sus propios tenants
        else if (session.user.role === UserRole.ADMIN && tenantIdFilter) {
            query.tenantId = tenantIdFilter;
        }

        if (level && level !== 'ALL') query.level = level;
        if (source) query.source = { $regex: escapeRegExp(source), $options: 'i' };
        if (userEmail) query.userEmail = { $regex: escapeRegExp(userEmail), $options: 'i' };

        if (search) {
            const sanitizedSearch = escapeRegExp(search);
            query.$or = [
                { message: { $regex: sanitizedSearch, $options: 'i' } },
                { action: { $regex: sanitizedSearch, $options: 'i' } },
                { correlationId: { $regex: sanitizedSearch, $options: 'i' } },
                { userEmail: { $regex: sanitizedSearch, $options: 'i' } }
            ];
        }

        const logs = await logColl
            .find(query, {
                sort: { timestamp: -1 } as any,
                limit: limit
            });

        // Stats rápidos para el header
        const errorCount = await logColl.countDocuments({ ...query, level: 'ERROR' });
        const warnCount = await logColl.countDocuments({ ...query, level: 'WARN' });

        return NextResponse.json({
            success: true,
            logs,
            meta: { errorCount, warnCount }
        });

    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_LOGS', correlacion_id);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/logs', thresholdMs: 1000 });
