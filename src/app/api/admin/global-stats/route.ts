import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB, connectAuthDB } from '@/lib/db';
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
        const authDb = await connectAuthDB();

        // 1. Totales básicos
        const totalTenants = await db.collection('tenants').countDocuments();
        const totalUsers = await authDb.collection('users').countDocuments();
        const totalFiles = await db.collection('documentos_tecnicos').countDocuments();
        const totalCases = await db.collection('pedidos').countDocuments();

        // 2. MAU (Monthly Active Users) - Usuarios con login o actividad en los últimos 30 días
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const mau = await db.collection('usage_logs').distinct('tenantId', {
            timestamp: { $gte: thirtyDaysAgo }
        });

        // 3. Estimated MRR (Monthly Recurring Revenue)
        const tenants = await db.collection('tenants').find({}).toArray();
        let estimatedMRR = 0;
        tenants.forEach((t: any) => {
            if (t.subscription?.status === 'active' || t.subscription?.status === 'trialing') {
                const plan = t.subscription.plan || 'FREE';
                if (plan === 'PRO') estimatedMRR += 99;
                if (plan === 'ENTERPRISE') estimatedMRR += 499;
            }
        });

        // 4. Consumo global (Tokens, Storage)
        const usageStats = await db.collection('usage_logs').aggregate([
            {
                $group: {
                    _id: "$tipo",
                    total: { $sum: "$valor" }
                }
            }
        ]).toArray();

        // 5. Performance Metrics (SLA Violations)
        const slaViolations = await db.collection('logs_aplicacion').countDocuments({
            accion: 'SLA_VIOLATION',
            timestamp: { $gte: thirtyDaysAgo }
        });

        const recentErrors = await db.collection('logs_aplicacion').countDocuments({
            nivel: 'ERROR',
            timestamp: { $gte: thirtyDaysAgo }
        });

        // 6. Distribución por industria
        const industryStats = await db.collection('tenants').aggregate([
            {
                $group: {
                    _id: "$industry",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        // 7. RAG Quality Avg (Últimos 100 evaluaciones)
        const ragQuality = await db.collection('rag_evaluations').aggregate([
            { $sort: { timestamp: -1 } },
            { $limit: 100 },
            {
                $group: {
                    _id: null,
                    avgFaithfulness: { $avg: "$faithfulness" },
                    avgRelevance: { $avg: "$answer_relevance" },
                    avgPrecision: { $avg: "$context_precision" }
                }
            }
        ]).toArray();

        return NextResponse.json({
            success: true,
            global: {
                totalTenants,
                totalUsers,
                totalFiles,
                totalCases,
                mau: mau.length,
                mrr: estimatedMRR,
                performance: {
                    sla_violations_30d: slaViolations,
                    errors_30d: recentErrors,
                    rag_quality_avg: ragQuality[0] || null
                },
                usage: {
                    tokens: usageStats.find(s => s._id === 'LLM_TOKENS')?.total || 0,
                    storage: usageStats.find(s => s._id === 'STORAGE_BYTES')?.total || 0,
                    searches: usageStats.find(s => s._id === 'VECTOR_SEARCH')?.total || 0,
                    savings: usageStats.find(s => s._id === 'SAVINGS_TOKENS')?.total || 0,
                },
                industries: industryStats,
                recent_tenants: tenants.slice(-5).reverse()
            }
        });

    } catch (error: any) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error.message).toJSON(), { status: 500 });
    }
}
