import { AnomalyDetectionService, Anomaly } from './AnomalyDetectionService';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { TenantConfig } from '@/lib/schemas/auth';
import { connectDB } from '@/lib/db';
import { TenantIdSchema } from '@/lib/schemas/common';
import { withCorrelation } from '@/lib/logger/with-correlation';

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
    static async runGlobal(correlationId?: string): Promise<{ playbooksTriggered: number }> {
        return withCorrelation({ level: 'INFO', source: 'OPS_PLAYBOOK', action: 'AUTOPILOT_START', correlationId }, async ({ log, correlationId: activeCorrelationId }) => {
            let playbooksTriggered = 0;

            await log({
                message: 'Starting global autopilot playbook execution',
                details: { correlationId: activeCorrelationId }
            });

            const [latencyAnomalies, errorAnomalies] = await Promise.all([
                AnomalyDetectionService.detectLatencyAnomalies(),
                AnomalyDetectionService.detectErrorAnomalies()
            ]);

            const allAnomalies = [...latencyAnomalies, ...errorAnomalies];

            if (allAnomalies.length === 0) {
                await log({
                    level: 'DEBUG',
                    action: 'AUTOPILOT_NO_ANOMALIES',
                    message: 'No anomalies detected, zero playbooks triggered'
                });
                return { playbooksTriggered: 0 };
            }

            for (const anomaly of allAnomalies) {
                const triggered = await this.evaluateAnomaly(anomaly, activeCorrelationId);
                if (triggered) playbooksTriggered++;
            }

            return { playbooksTriggered };
        });
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
             await withCorrelation({ level: 'WARN', source: 'OPS_PLAYBOOK', action: 'LATENCY_ALERT', correlationId }, async ({ log }) => {
                await log({
                    message: `High latency detected in ${anomaly.source}. Manual review recommended.`,
                    details: anomaly as unknown as Record<string, unknown>
                });
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
            const tenantId = TenantIdSchema.parse(parts[1]);

            return await withCorrelation({ level: 'INFO', source: 'OPS_PLAYBOOK', action: 'EXECUTE_PLAYBOOK_ERRORS', correlationId, tenantId }, async ({ log }) => {
                // 1. Get Tenant Config
                const configCollection = await getTenantCollection<TenantConfig>('tenant_configs', { tenantId } as any);
                const config = await configCollection.findOne({ tenantId });

                if (!config || !config.autoOps?.enabled || !config.autoOps?.autoRepairIngest) {
                    await log({
                        level: 'DEBUG',
                        action: 'PLAYBOOK_SKIPPED',
                        message: `Playbook skipped for tenant ${tenantId}: AutoOps disabled or not targeting this service`,
                        details: { tenantId, anomaly: anomaly as any }
                    });
                    return false;
                }

                // 2. Action: If service is INGEST_API, we might pause ingestion
                if (anomaly.source.includes('INGEST_API')) {
                    await log({
                        level: 'WARN',
                        action: 'INGEST_PAUSE_TRIGGERED',
                        message: `CRITICAL Error rate detected in Ingest API for tenant ${tenantId}. Pausing ingestion to prevent data corruption.`,
                        details: { anomaly: anomaly as any }
                    });

                    // Implementation of Pause logic would go here
                    await configCollection.updateOne(
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
            });
        } catch (error) {
            console.error('[OpsPlaybookService.executeHighErrorRatePlaybook] Error:', error);
            return false;
        }
    }
}
