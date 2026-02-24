import { connectLogsDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { NotificationService } from '@/services/core/NotificationService';

export interface Anomaly {
    id: string;
    type: 'LATENCY' | 'ERROR_RATE';
    source: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    timestamp: Date;
    details: {
        currentValue: number;
        baselineValue: number;
        zScore: number;
        threshold: number;
    };
}

/**
 * 🧠 AnomalyDetectionService (Phase 160.3)
 * Uses statistical analysis (Z-score) to detect abnormal patterns in platform logs.
 */
export class AnomalyDetectionService {

    /**
     * Calculates baseline stats (mean & stdDev) for a specific metric.
     */
    private static async getStatsBaseline(source: string, metric: 'durationMs' | 'errorCount', windowHours: number = 24) {
        const db = await connectLogsDB();
        const since = new Date();
        since.setHours(since.getHours() - windowHours);

        if (metric === 'durationMs') {
            const stats = await db.collection('application_logs').aggregate([
                { $match: { source, durationMs: { $exists: true }, timestamp: { $gte: since } } },
                {
                    $group: {
                        _id: null,
                        avg: { $avg: "$durationMs" },
                        stdDev: { $stdDevPop: "$durationMs" },
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();

            return stats[0] || { avg: 0, stdDev: 0, count: 0 };
        } else {
            // Error rate baseline
            const stats = await db.collection('application_logs').aggregate([
                { $match: { source, level: 'ERROR', timestamp: { $gte: since } } },
                {
                    $group: {
                        _id: {
                            hour: { $hour: "$timestamp" },
                            day: { $dayOfMonth: "$timestamp" }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avg: { $avg: "$count" }, // Average errors per hour
                        stdDev: { $stdDevPop: "$count" }
                    }
                }
            ]).toArray();

            return stats[0] || { avg: 0, stdDev: 0 };
        }
    }

    /**
     * Detects latency anomalies based on Z-score > 2.0 (95th percentile)
     */
    static async detectLatencyAnomalies(): Promise<Anomaly[]> {
        const db = await connectLogsDB();
        const now = new Date();
        const last15Mins = new Date(now.getTime() - 15 * 60000);

        // Get unique sources with latency data in the last 15 mins
        const sources = await db.collection('application_logs').distinct('source', {
            durationMs: { $exists: true },
            timestamp: { $gte: last15Mins }
        });

        const anomalies: Anomaly[] = [];

        for (const source of sources) {
            const baseline = await this.getStatsBaseline(source, 'durationMs');

            // Skip if baseline is too small for statistical significance
            if (baseline.count < 10 || baseline.stdDev === 0) continue;

            const recentAvgResult = await db.collection('application_logs').aggregate([
                { $match: { source, durationMs: { $exists: true }, timestamp: { $gte: last15Mins } } },
                { $group: { _id: null, avg: { $avg: "$durationMs" } } }
            ]).toArray();

            const recentAvg = recentAvgResult[0]?.avg || 0;
            const zScore = (recentAvg - baseline.avg) / baseline.stdDev;

            if (zScore > 2.0) {
                const severity = zScore > 5 ? 'CRITICAL' : zScore > 3 ? 'HIGH' : 'MEDIUM';

                const anomaly: Anomaly = {
                    id: `latency_${source}_${now.getTime()}`,
                    type: 'LATENCY',
                    source,
                    severity,
                    message: `Pico de latencia detectado en ${source} (Z-score: ${zScore.toFixed(2)})`,
                    timestamp: now,
                    details: {
                        currentValue: recentAvg,
                        baselineValue: baseline.avg,
                        zScore,
                        threshold: 2.0
                    }
                };

                anomalies.push(anomaly);

                // Auto-report critical anomalies
                if (severity === 'CRITICAL' || severity === 'HIGH') {
                    await this.reportAnomaly(anomaly);
                }
            }
        }

        return anomalies;
    }

    /**
     * Detects abnormal error rates.
     */
    static async detectErrorAnomalies(): Promise<Anomaly[]> {
        const db = await connectLogsDB();
        const now = new Date();
        const lastHour = new Date(now.getTime() - 60 * 60000);

        const sources = await db.collection('application_logs').distinct('source', {
            level: 'ERROR',
            timestamp: { $gte: lastHour }
        });

        const anomalies: Anomaly[] = [];

        for (const source of sources) {
            const baseline = await this.getStatsBaseline(source, 'errorCount');
            const recentCount = await db.collection('application_logs').countDocuments({
                source,
                level: 'ERROR',
                timestamp: { $gte: lastHour }
            });

            if (baseline.avg === 0 && recentCount > 5) {
                // First errors after silence
                anomalies.push(this.createErrorAnomaly(source, recentCount, 0, 3.0, 'HIGH'));
                continue;
            }

            if (baseline.stdDev === 0) continue;

            const zScore = (recentCount - baseline.avg) / baseline.stdDev;

            if (zScore > 3.0) {
                const severity = zScore > 6 ? 'CRITICAL' : 'HIGH';
                const anomaly = this.createErrorAnomaly(source, recentCount, baseline.avg, zScore, severity);
                anomalies.push(anomaly);
                await this.reportAnomaly(anomaly);
            }
        }

        return anomalies;
    }

    private static createErrorAnomaly(source: string, current: number, baseline: number, zScore: number, severity: any): Anomaly {
        return {
            id: `error_${source}_${Date.now()}`,
            type: 'ERROR_RATE',
            source,
            severity,
            message: `Tasa de errores inusual detectada en ${source} (${current} errores/hora)`,
            timestamp: new Date(),
            details: {
                currentValue: current,
                baselineValue: baseline,
                zScore,
                threshold: 3.0
            }
        };
    }

    private static async reportAnomaly(anomaly: Anomaly) {
        await logEvento({
            level: anomaly.severity === 'CRITICAL' ? 'ERROR' : 'WARN',
            source: 'ANOMALY_ENGINE',
            action: 'ANOMALY_DETECTED',
            message: anomaly.message,
            correlationId: 'SYSTEM',
            details: anomaly
        });

        if (anomaly.severity === 'CRITICAL') {
            await NotificationService.notify({
                tenantId: 'SYSTEM',
                type: 'SYSTEM',
                level: 'ERROR',
                title: 'ALERTA PREDICTIVA: ' + anomaly.type,
                message: anomaly.message + '. Ver detalles en el Dashboard de SuperAdmin.',
                link: '/admin/superadmin'
            });
        }
    }
}
