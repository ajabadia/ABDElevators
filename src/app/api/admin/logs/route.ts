import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectLogsDB } from '@/lib/db';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/logs
 * Recupera logs de aplicación con filtrado avanzado.
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'No autorizado para ver logs');
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const nivel = searchParams.get('nivel'); // ERROR, WARN, INFO, DEBUG
        const origen = searchParams.get('origen');
        const search = searchParams.get('search');
        const tenantIdFilter = searchParams.get('tenantId'); // Optional filter within allowed scope
        const userId = searchParams.get('userId');
        const userEmail = searchParams.get('userEmail');

        // Contexto de base de datos de LOGS blindado
        const logColl = await getTenantCollection('logs_aplicacion', session, 'LOGS');

        const query: any = {};

        // Si el usuario es SuperAdmin y quiere filtrar por un tenant específico
        if (session.user.role === 'SUPER_ADMIN' && tenantIdFilter) {
            query.tenantId = tenantIdFilter;
        }
        // Si el usuario es ADMIN y quiere filtrar dentro de sus propios tenants
        else if (session.user.role === 'ADMIN' && tenantIdFilter) {
            query.tenantId = tenantIdFilter;
        }

        if (nivel && nivel !== 'ALL') query.nivel = nivel;
        if (origen) query.origen = { $regex: origen, $options: 'i' };
        if (userEmail) query.userEmail = { $regex: userEmail, $options: 'i' };

        if (search) {
            query.$or = [
                { mensaje: { $regex: search, $options: 'i' } },
                { accion: { $regex: search, $options: 'i' } },
                { correlacion_id: { $regex: search, $options: 'i' } },
                { userEmail: { $regex: search, $options: 'i' } } // Search includes user email now
            ];
        }

        const logs = await logColl
            .find(query, {
                sort: { timestamp: -1 } as any,
                limit: limit
            });

        // Stats rápidos para el header
        const errorCount = await logColl.countDocuments({ ...query, nivel: 'ERROR' });
        const warnCount = await logColl.countDocuments({ ...query, nivel: 'WARN' });

        return NextResponse.json({
            success: true,
            logs,
            meta: { errorCount, warnCount }
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_LOGS', correlacion_id);
    }
}
