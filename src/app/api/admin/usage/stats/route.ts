import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';

/**
 * GET /api/admin/usage/stats
 * Devuelve estadísticas de consumo agregadas para el tenant.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenantId = (session.user as any).tenantId || 'default_tenant';
        const { collection } = await getTenantCollection('usage_logs');

        // Agregación de métricas principales
        const stats = await collection.aggregate([
            { $match: { tenantId } },
            {
                $group: {
                    _id: "$tipo",
                    total: { $sum: "$valor" },
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        // Formatear respuesta amigable
        const formattedStats = {
            tokens: stats.find(s => s._id === 'LLM_TOKENS')?.total || 0,
            storage: stats.find(s => s._id === 'STORAGE_BYTES')?.total || 0,
            searches: stats.find(s => s._id === 'VECTOR_SEARCH')?.total || 0,
            api_requests: stats.find(s => s._id === 'API_REQUEST')?.total || 0,
            history: await collection.find({ tenantId })
                .sort({ timestamp: -1 })
                .limit(20)
                .toArray()
        };

        return NextResponse.json({
            success: true,
            tenantId,
            stats: formattedStats
        });

    } catch (error: any) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error.message).toJSON(), { status: 500 });
    }
}
