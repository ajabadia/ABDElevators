import { logEvento } from '@/lib/logger';
import { AnomalyDetectionService, Anomaly } from './AnomalyDetectionService';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { TenantConfig } from '@/lib/schemas/auth';
import { connectDB } from '@/lib/db';

/**
 * 🤖 OpsPlaybookService
 * Executes automated playbooks in response to platform anomalies.
 * Standardized for Era 8 (Zero any, structured logging, SLA-ready).
 * FASE 251: Operational Autopilot.
 */
export class OpsPlaybookService {
    /**
     * Run global autopilot check.
     * Analyzes anomalies from AnomalyDetectionService and triggers corresponding playbooks.
     */
    static async runGlobal(correlationId: string = crypto.randomUUID()): Promise<{ playbooksTriggered: number }> {
        let playbooksTriggered = 0;

        try {
            await logEvento({
                level: 'INFO',
                source: 'OPS_PLAYBOOK',
                action: 'AUTOPILOT_START',
                message: 'Starting global autopilot playbook execution',
                correlationId
            });

            const [latencyAnomalies, errorAnomalies] = await Promise.all([
                AnomalyDetectionService.detectLatencyAnomalies(),
                AnomalyDetectionService.detectErrorAnomalies()
            ]);

            const allAnomalies = [...latencyAnomalies, ...errorAnomalies];

            if (allAnomalies.length === 0) {
                await logEvento({
                    level: 'DEBUG',
                    source: 'OPS_PLAYBOOK',
                    action: 'AUTOPILOT_NO_ANOMALIES',
                    message: 'No anomalies detected, zero playbooks triggered',
                    correlationId
                });
                return { playbooksTriggered: 0 };
            }

            for (const anomaly of allAnomalies) {
                const triggered = await this.evaluateAnomaly(anomaly, correlationId);
                if (triggered) playbooksTriggered++;
            }

            return { playbooksTriggered };
        } catch (error: unknown) {
            const err = error as Error;
            await logEvento({
                level: 'ERROR',
                source: 'OPS_PLAYBOOK',
                action: 'AUTOPILOT_CRITICAL_FAILURE',
                message: `Autopilot execution failed: ${err.message}`,
                correlationId,
                details: { stack: err.stack }
            });
            return { playbooksTriggered: 0 };
        }
    }

    /**
     * Evaluates a single anomaly and decides if a playbook should be triggered.
     */
    private static async evaluateAnomaly(anomaly: Anomaly, correlationId: string): Promise<boolean> {
        // Playbook: HIGH_ERROR_RATE -> Check Source & Autopilot Status
        if (anomaly.type === 'ERROR_RATE' && anomaly.severity === 'CRITICAL') {
            return await this.executeHighErrorRatePlaybook(anomaly, correlationId);
        }

        // Playbook: LATENCY_ANOMALY -> Alert (No auto-action yet for latency unless critical)
        if (anomaly.type === 'LATENCY' && anomaly.severity === 'CRITICAL') {
            await logEvento({
                level: 'WARN',
                source: 'OPS_PLAYBOOK',
                action: 'LATENCY_ALERT',
                message: `High latency detected in ${anomaly.source}. Manual review recommended.`,
                correlationId,
                details: anomaly
            });
        }

        return false;
    }

    /**
     * Playbook: High Error Rate
     * If a tenant service is failing critically, we might pause active processes or restrict traffic.
     */
    private static async executeHighErrorRatePlaybook(anomaly: Anomaly, correlationId: string): Promise<boolean> {
        try {
            // Source format: "TENANT:{tenantId}:SERVICE"
            if (!anomaly.source.startsWith('TENANT:')) return false;

            const parts = anomaly.source.split(':');
            const tenantId = parts[1];

            // 1. Get Tenant Config
            const db = await connectDB();
            const config = await db.collection<TenantConfig>('tenant_configs').findOne({ tenantId });

            if (!config || !config.autoOps?.enabled || !config.autoOps?.autoRepairIngest) {
                await logEvento({
                    level: 'DEBUG',
                    source: 'OPS_PLAYBOOK',
                    action: 'PLAYBOOK_SKIPPED',
                    message: `Playbook skipped for tenant ${tenantId}: AutoOps disabled or not targeting this service`,
                    correlationId,
                    details: { tenantId, anomaly }
                });
                return false;
            }

            // 2. Action: If service is INGEST_API, we might pause ingestion
            if (anomaly.source.includes('INGEST_API')) {
                await logEvento({
                    level: 'WARN',
                    source: 'OPS_PLAYBOOK',
                    action: 'INGEST_PAUSE_TRIGGERED',
                    message: `CRITICAL Error rate detected in Ingest API for tenant ${tenantId}. Pausing ingestion to prevent data corruption.`,
                    correlationId,
                    tenantId,
                    details: anomaly
                });

                // Implementation of Pause logic would go here (e.g., updating a flag in DB)
                // For now, we log the intent and the system would check this flag in IngestService
                await db.collection('tenant_configs').updateOne(
                    { tenantId },
                    {
                        $set: {
                            'autoOps.lastAction': 'INGEST_PAUSED',
                            'autoOps.lastActionAt': new Date(),
                            'autoOps.pauseReason': anomaly.message
                        }
                    }
                );

                return true;
            }

            return false;
        } catch (error) {
            console.error('[OpsPlaybookService.executeHighErrorRatePlaybook] Error:', error);
            return false;
        }
    }
}
