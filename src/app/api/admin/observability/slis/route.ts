import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { connectLogsDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
/**
 * GET /api/admin/observability/slis
 * Calcula indicadores de nivel de servicio (SLIs) basados en application_logs.
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await requirePermission('platform:metrics', 'read');

        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '7');
        const source = searchParams.get('source') || 'RAG_SERVICE';

        const db = await connectLogsDB();
        const collection = db.collection('application_logs');

        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);

        // 1. Calcular Latencia P95
        const latencyLogs = await collection.find({
            source,
            'details.duration_ms': { $exists: true },
            timestamp: { $gte: sinceDate }
        }).project({ 'details.duration_ms': 1 }).toArray();

        const latencies = latencyLogs.map(l => l.details.duration_ms).sort((a, b) => a - b);
        const p95Index = Math.floor(latencies.length * 0.95);
        const p95Latency = latencies.length > 0 ? latencies[p95Index] : 0;
        const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => (a as number) + (b as number), 0) / latencies.length : 0;

        // 2. Calcular Error Rate
        const totalRequests = await collection.countDocuments({
            source,
            timestamp: { $gte: sinceDate }
        });

        const errorRequests = await collection.countDocuments({
            source,
            level: 'ERROR',
            timestamp: { $gte: sinceDate }
        });

        const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

        // 3. Obtener alertas recientes (WARN/ERROR)
        const recentAlerts = await collection.find({
            source,
            level: { $in: ['WARN', 'ERROR'] },
            timestamp: { $gte: sinceDate }
        }).sort({ timestamp: -1 }).limit(10).toArray();

        // 4. SLO Compliance
        const sloCompliance = {
            latency: p95Latency < 2000,
            availability: (100 - errorRate) > 99.9,
            targetP95: 2000,
            targetAvailability: 99.9
        };

        return NextResponse.json({
            success: true,
            periodDays: days,
            source,
            metrics: {
                p95Latency_ms: p95Latency,
                avgLatency_ms: avgLatency,
                totalRequests,
                errorRequests,
                errorRate_percent: errorRate.toFixed(4),
                sloCompliance
            },
            recentAlerts: recentAlerts.map(a => ({
                action: a.action,
                message: a.message,
                level: a.level,
                timestamp: a.timestamp
            }))
        });

    } catch (error: unknown) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error instanceof Error ? error.message : 'Unknown error').toJSON(), { status: 500 });
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/observability/slis', thresholdMs: 1000 });
