import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectLogsDB } from '@/lib/db';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/logs
 * Recupera logs de aplicación con filtrado avanzado.
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        // Phase 70: Centralized typed role check
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const level = searchParams.get('level') || searchParams.get('nivel'); // Support both for transition
        const source = searchParams.get('source') || searchParams.get('origen');
        const search = searchParams.get('search');
        const tenantIdFilter = searchParams.get('tenantId');
        const userEmail = searchParams.get('userEmail');

        // Helper to prevent ReDoS
        const escapeRegExp = (string: string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        // Contexto de base de datos de LOGS blindado
        // Use 'application_logs' to match logger.ts
        const logColl = await getTenantCollection('application_logs', session, 'LOGS');

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

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_LOGS', correlacion_id);
    }
}
