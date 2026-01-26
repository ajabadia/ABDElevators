import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectLogsDB } from '@/lib/db';
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
        const tenantId = searchParams.get('tenantId'); // SuperAdmin can filter, Admin sees only theirs
        const userId = searchParams.get('userId');
        const userEmail = searchParams.get('userEmail');

        const db = await connectLogsDB();
        const collection = db.collection('logs_aplicacion');

        const query: any = {};

        // Security Filter
        if (session.user.role === 'ADMIN') {
            // Admin can govern multiple tenants if specified in tenantAccess
            const allowedTenants = [
                (session.user as any).tenantId,
                ...((session.user as any).tenantAccess || []).map((t: any) => t.tenantId)
            ].filter(Boolean);

            if (allowedTenants.length > 1) {
                // If the user manages multiple tenants
                if (tenantId) {
                    // Check if they are trying to access a tenant they own
                    if (!allowedTenants.includes(tenantId)) {
                        throw new AppError('UNAUTHORIZED', 403, 'No tienes acceso a este tenant');
                    }
                    query.tenantId = tenantId;
                } else {
                    // Otherwise, show logs from ALL their tenants
                    query.tenantId = { $in: allowedTenants };
                }
            } else {
                // Single tenant admin
                query.tenantId = allowedTenants[0];
            }
        } else if (tenantId) {
            // SuperAdmin filtering specifically
            query.tenantId = tenantId;
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

        const logs = await collection
            .find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();

        // Stats rápidos para el header
        const errorCount = await collection.countDocuments({ ...query, nivel: 'ERROR' });
        const warnCount = await collection.countDocuments({ ...query, nivel: 'WARN' });

        return NextResponse.json({
            success: true,
            logs,
            meta: { errorCount, warnCount }
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_LOGS', correlacion_id);
    }
}
