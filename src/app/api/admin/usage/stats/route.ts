import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getTenantCollection } from '@/lib/db-tenant';
import { TenantService } from '@/lib/tenant-service';
import { getPlanForTenant } from '@/lib/plans';
import { AppError } from '@/lib/errors';

/**
 * GET /api/admin/usage/stats
 * Devuelve estadísticas de consumo agregadas para el tenant.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenantId = (session.user as any).tenantId || 'default_tenant';
        const db = await connectDB();
        const { collection } = await getTenantCollection('usage_logs');

        // 1. Obtener configuración de facturación (Fase 9.2)
        const billingConfig = await db.collection('tenant_billing').findOne({ tenantId });
        const planSlug = billingConfig?.planSlug || 'standard';

        // 2. Obtener detalles del plan desde pricing_plans
        const plan = await db.collection('pricing_plans').findOne({ slug: planSlug });

        // 3. Agregación de métricas principales
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

        // Helper para calcular estado (Bloqueo/Recargo)
        const calculateStatus = (usage: number, metricConfig: any) => {
            if (!metricConfig?.overageRules || !metricConfig.includedUnits) return null;
            const percent = (usage / metricConfig.includedUnits) * 100;
            const rule = [...metricConfig.overageRules]
                .sort((a: any, b: any) => b.thresholdPercent - a.thresholdPercent)
                .find((r: any) => percent > r.thresholdPercent);

            if (rule) {
                return {
                    state: rule.action === 'BLOCK' ? 'BLOCKED' : 'SURCHARGE',
                    details: `Superado ${rule.thresholdPercent}%: ${rule.action === 'BLOCK' ? 'Servicio Bloqueado' : 'Recargo aplicado'}`
                };
            }
            return null;
        };

        const reportsUsage = stats.find(s => s._id === 'REPORTS_GENERATED')?.total || 0;
        const reportsConfig = plan?.metrics?.REPORTS;
        const reportsStatus = calculateStatus(reportsUsage, reportsConfig);

        // 4. Formatear respuesta amigable con los nuevos límites
        const formattedStats = {
            reports_generated: reportsUsage,
            tokens: stats.find(s => s._id === 'LLM_TOKENS')?.total || 0,
            storage: stats.find(s => s._id === 'STORAGE_BYTES')?.total || 0,
            searches: stats.find(s => s._id === 'VECTOR_SEARCH')?.total || 0,
            api_requests: stats.find(s => s._id === 'API_CALL')?.total || 0,
            savings: stats.find(s => s._id === 'SAVINGS_TOKENS')?.total || 0,
            embeddings: stats.find(s => s._id === 'EMBEDDING_OPS')?.total || 0,
            tier: plan?.name?.toUpperCase() || 'STANDARD',
            planSlug: planSlug,
            limits: {
                reports: reportsConfig?.includedUnits ?? 10,
                tokens: plan?.metrics?.REPORTS?.includedUnits ? Infinity : 100000, // Legacy fallback
                storage: plan?.metrics?.STORAGE?.includedUnits ?? (1024 * 1024 * 1024), // 1GB default
                searches: plan?.metrics?.VECTOR_SEARCH?.includedUnits ?? 500,
                api_requests: plan?.metrics?.API_CALLS?.includedUnits ?? 1000,
            },
            status: [
                reportsStatus ? { metric: 'REPORTS', ...reportsStatus } : null
            ].filter(Boolean),
            history: await collection.find({ tenantId })
                .sort({ timestamp: -1 })
                .limit(50)
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
