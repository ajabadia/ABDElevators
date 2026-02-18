import { NextRequest, NextResponse } from 'next/server';
import { AnomalyDetectionService } from '@/lib/anomaly-detection-service';
import { SovereignOntologyService } from '@/lib/self-evolving-ontology';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * ⏰ Cron Job: Early Warning System (Phase 160.3)
 * Runs predictive audits to detect statistical anomalies in the platform.
 * Security: CRON_SECRET header validation.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const cronSecret = req.headers.get('x-cron-secret');

    // Security check - Allow local dev or secret header
    if (process.env.NODE_ENV === 'production' && cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await logEvento({
            level: 'INFO',
            source: 'CRON_PREDICTIVE_AUDIT',
            action: 'START',
            message: 'Starting predictive intelligence audit',
            correlationId
        });

        const [latencyAnomalies, errorAnomalies, evolutionResult] = await Promise.all([
            AnomalyDetectionService.detectLatencyAnomalies(),
            AnomalyDetectionService.detectErrorAnomalies(),
            SovereignOntologyService.applyAutonomousRefinements('SYSTEM', correlationId) // Refinamiento global
        ]);

        const total = latencyAnomalies.length + errorAnomalies.length;

        await logEvento({
            level: 'INFO',
            source: 'CRON_PREDICTIVE_AUDIT',
            action: 'COMPLETE',
            message: `Predictive audit complete. Detected ${total} anomalies.`,
            correlationId,
            details: {
                latencyAnomaliesCount: latencyAnomalies.length,
                errorAnomaliesCount: errorAnomalies.length
            }
        });

        return NextResponse.json({
            success: true,
            detectedCount: total,
            correlationId
        });

    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'CRON_PREDICTIVE_AUDIT',
            action: 'FAILED',
            message: `Predictive audit failed: ${error.message}`,
            correlationId,
            details: { stack: error.stack }
        });

        return NextResponse.json({
            success: false,
            error: error.message,
            correlationId
        }, { status: 500 });
    }
}
