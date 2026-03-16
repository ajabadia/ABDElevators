import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/logs/stats
 * Proporciona contadores agregados para los filtros de auditoría.
 */
async function GET_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_LOGS_STATS', action: 'FETCH' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('audit:logs', 'read');

                // Contexto de base de datos de LOGS
                const logColl = await getTenantCollection('application_logs', session, 'LOGS', { softDeletes: false });

                // Pipeline de agregación para obtener niveles y fuentes
                const statsResults = await logColl.aggregate([
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
                ]);

                const stats = statsResults[0] || { levels: [], sources: [], total: [] };

                // Formatear resultados
                const levelCounts: Record<string, number> = {};
                stats.levels.forEach((l: any) => {
                    levelCounts[l._id] = l.count;
                });

                const sourceCounts: Record<string, number> = {};
                stats.sources.forEach((s: any) => {
                    sourceCounts[s._id] = s.count;
                });

                await log({
                    message: 'Log statistics aggregated successfully',
                    details: { totalLogs: stats.total[0]?.count || 0, levelCount: Object.keys(levelCounts).length }
                });

                return NextResponse.json({
                    success: true,
                    total: stats.total[0]?.count || 0,
                    levels: levelCounts,
                    sources: sourceCounts
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_LOGS_STATS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/logs/stats', thresholdMs: 500 });
