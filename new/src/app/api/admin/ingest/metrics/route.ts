import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { getTenantCollection } from '@/lib/db-tenant';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

/**
 * GET /api/admin/ingest/metrics
 * Devuelve métricas de ingestión por tenant:
 * - Tasas de éxito/fallo por fase
 * - Tiempos promedio por fase
 * - Documentos en estados parciales
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    
    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
        }

        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId') || session.user.tenantId || 'platform_master';
        
        // Solo SUPER_ADMIN puede ver métricas de otros tenants
        if (tenantId !== session.user.tenantId && session.user.role !== UserRole.SUPER_ADMIN) {
            throw new AppError('FORBIDDEN', 403, 'No tienes permiso para ver métricas de otros tenants');
        }

        const db = await getTenantCollection('knowledge_assets', { user: session.user });
        
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Métricas de la última hora
        const [lastHourStats, statusBreakdown, partialStates] = await Promise.all([
            // Stats de la última hora
            db.countDocuments({
                tenantId,
                createdAt: { $gte: oneHourAgo }
            }),
            
            // Breakdown por status
            db.aggregate([
                { $match: { tenantId } },
                { $group: {
                    _id: '$ingestionStatus',
                    count: { $sum: 1 }
                }}
            ]),
            
            // Estados parciales (INDEXED_NO_STORAGE, STORED_NO_INDEX, PARTIAL)
            db.countDocuments({
                tenantId,
                ingestionStatus: { $in: ['INDEXED_NO_STORAGE', 'STORED_NO_INDEX', 'PARTIAL'] }
            })
        ]);

        // Calcular tasas
        const totalByStatus = statusBreakdown.reduce((acc: any, item: any) => {
            acc[item._id || 'UNKNOWN'] = item.count;
            return acc;
        }, {});

        const total = Object.values(totalByStatus).reduce((a: any, b: any) => a + b, 0) as number;
        const completed = totalByStatus.COMPLETED || 0;
        const failed = totalByStatus.FAILED || 0;
        
        const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
        const failureRate = total > 0 ? ((failed / total) * 100).toFixed(1) : '0';

        // Promedio de tiempo de procesamiento (últimas 24h)
        const avgTimeDocs = await db.aggregate([
            {
                $match: {
                    tenantId,
                    ingestionStatus: 'COMPLETED',
                    updatedAt: { $gte: oneDayAgo }
                }
            },
            {
                $project: {
                    processingTime: { $subtract: ['$updatedAt', '$createdAt'] }
                }
            },
            {
                $group: {
                    _id: null,
                    avgTime: { $avg: '$processingTime' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const avgProcessingMs = avgTimeDocs[0]?.avgTime || 0;
        const completedLast24h = avgTimeDocs[0]?.count || 0;

        // Determinar alertas
        const alerts: string[] = [];
        
        // Alerta: >10% failure en la última hora
        if (parseFloat(failureRate) > 10) {
            alerts.push(`HIGH_FAILURE_RATE: ${failureRate}% de ingestas fallidas en la última hora`);
        }
        
        // Alerta: >50 documentos en INDEXED_NO_STORAGE
        if ((totalByStatus.INDEXED_NO_STORAGE || 0) > 50) {
            alerts.push(`CLOUDINARY_DOWN: ${totalByStatus.INDEXED_NO_STORAGE} documentos sin storage`);
        }
        
        // Alerta: >50 documentos en STORED_NO_INDEX
        if ((totalByStatus.STORED_NO_INDEX || 0) > 50) {
            alerts.push(`INDEXING_PENDING: ${totalByStatus.STORED_NO_INDEX} documentos sin indexar`);
        }

        return NextResponse.json({
            tenantId,
            period: {
                lastHour: {
                    totalIngestions: lastHourStats,
                    successRate: `${successRate}%`,
                    failureRate: `${failureRate}%`
                },
                last24h: {
                    completedDocuments: completedLast24h,
                    avgProcessingTimeMs: Math.round(avgProcessingMs),
                    avgProcessingTimeSec: (avgProcessingMs / 1000).toFixed(1)
                }
            },
            statusBreakdown: totalByStatus,
            partialStates: {
                total: partialStates,
                INDEXED_NO_STORAGE: totalByStatus.INDEXED_NO_STORAGE || 0,
                STORED_NO_INDEX: totalByStatus.STORED_NO_INDEX || 0,
                PARTIAL: totalByStatus.PARTIAL || 0
            },
            alerts: alerts.length > 0 ? alerts : ['OK']
        });

    } catch (error) {
        return handleApiError(error, 'API_INGEST_METRICS', correlationId);
    }
}
