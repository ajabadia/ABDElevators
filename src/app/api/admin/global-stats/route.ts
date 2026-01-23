import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { AppError } from '@/lib/errors';

/**
 * GET /api/admin/global-stats
 * Devuelve métricas globales de toda la plataforma (Solo SUPER_ADMIN).
 * SLA: P95 < 500ms
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const db = await connectDB();

        // 1. Totales básicos
        const totalTenants = await db.collection('tenants').countDocuments();
        const totalUsers = await db.collection('usuarios').countDocuments();
        const totalFiles = await db.collection('documentos_tecnicos').countDocuments();
        const totalCases = await db.collection('pedidos').countDocuments();

        // 2. Consumo global (Tokens, Storage)
        const usageStats = await db.collection('usage_logs').aggregate([
            {
                $group: {
                    _id: "$tipo",
                    total: { $sum: "$valor" }
                }
            }
        ]).toArray();

        // 3. Distribución por industria
        const industryStats = await db.collection('tenants').aggregate([
            {
                $group: {
                    _id: "$industry",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        // 4. Actividad reciente (logs críticos de cualquier tenant)
        const recentActivities = await db.collection('logs_aplicacion')
            .find({ nivel: { $in: ['ERROR', 'WARN', 'INFO'] } })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        return NextResponse.json({
            success: true,
            global: {
                totalTenants,
                totalUsers,
                totalFiles,
                totalCases,
                usage: {
                    tokens: usageStats.find(s => s._id === 'LLM_TOKENS')?.total || 0,
                    storage: usageStats.find(s => s._id === 'STORAGE_BYTES')?.total || 0,
                    searches: usageStats.find(s => s._id === 'VECTOR_SEARCH')?.total || 0,
                },
                industries: industryStats,
                activities: recentActivities
            }
        });

    } catch (error: any) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error.message).toJSON(), { status: 500 });
    }
}
