import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

/**
 * GET /api/admin/logs/stats
 * Proporciona contadores agregados para los filtros de auditoría.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        // Contexto de base de datos de LOGS
        const logColl = await getTenantCollection('application_logs', session, 'LOGS');

        // Pipeline de agregación para obtener niveles y fuentes
        const [stats] = await logColl.aggregate([
            {
                $facet: {
                    levels: [
                        { $group: { _id: "$level", count: { $sum: 1 } } }
                    ],
                    sources: [
                        { $group: { _id: "$source", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    total: [
                        { $count: "count" }
                    ]
                }
            }
        ]).toArray();

        // Formatear resultados
        const levelCounts: Record<string, number> = {};
        stats.levels.forEach((l: any) => {
            levelCounts[l._id] = l.count;
        });

        const sourceCounts: Record<string, number> = {};
        stats.sources.forEach((s: any) => {
            sourceCounts[s._id] = s.count;
        });

        return NextResponse.json({
            success: true,
            total: stats.total[0]?.count || 0,
            levels: levelCounts,
            sources: sourceCounts
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_LOGS_STATS', correlationId);
    }
}
