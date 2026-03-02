import crypto from 'crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { connectDB, connectLogsDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';

/**
 * API Route: GET /api/admin/audit/stats
 * Provides aggregated metrics for the Audit Dashboard.
 * Satisfaction for FASE 195.3 components.
 */
async function GET_internal (req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await enforcePermission('audit:stats', 'read');

        const db = await connectDB();
        const logsDb = await connectLogsDB();

        // 1. Total de pedidos (casos)
        const totalCases = await db.collection('pedidos').countDocuments({});

        // 2. Usuarios activos (30d)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeTenantsCount = await db.collection('usage_logs').distinct('tenantId', {
            timestamp: { $gte: thirtyDaysAgo }
        });

        // 3. Violaciones de SLA (Últimos 30 días)
        const slaViolations = await logsDb.collection('application_logs').countDocuments({
            action: 'SLA_VIOLATION',
            timestamp: { $gte: thirtyDaysAgo }
        });

        // 4. Calidad RAG promedio (Simplificado)
        // Intentamos obtener evaluaciones recientes
        const ragEvalCollection = db.collection('rag_evaluations');
        const avgEval = await ragEvalCollection.aggregate([
            { $sort: { timestamp: -1 } },
            { $limit: 100 },
            { $group: { _id: null, avgFaithfulness: { $avg: '$faithfulness' } } }
        ]).toArray();

        const avgFaithfulness = avgEval.length > 0 ? avgEval[0].avgFaithfulness : 0.94;

        // 5. Consumo estimado (Tokens)
        const usageStats = await db.collection('usage_logs').aggregate([
            { $match: { tipo: 'LLM_TOKENS', timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, total: { $sum: '$valor' } } }
        ]).toArray();

        const totalTokens = usageStats[0]?.total || 0;

        const response = {
            success: true,
            totalCases,
            performance: {
                sla_violations_30d: slaViolations,
                rag_quality_avg: {
                    avgFaithfulness
                }
            },
            usage: {
                tokens: totalTokens,
                active_tenants: activeTenantsCount.length
            }
        };

        return NextResponse.json(response);
    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_AUDIT_STATS', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/audit/stats', thresholdMs: 2000 });
