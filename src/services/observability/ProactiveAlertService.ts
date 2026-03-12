import { ObservabilityRepository } from './ObservabilityRepository';
import { NotificationService } from '../core/NotificationService';

/**
 * 🛰️ ProactiveAlertService
 * Detects anomalies and SLA violations before they affect users.
 * Era 15: Advanced Compliance & Performance.
 */
export class ProactiveAlertService {
    private static readonly P95_THRESHOLD_MS = 1500; // Threshold for proactive alert
    private static lastSentAlerts = new Map<string, number>(); // Throttling: AlertType -> LastTimestamp
    private static readonly ALERT_THROTTLE_MS = 1000 * 60 * 60; // 1 Hour throttle per alert type

    /**
     * Evaluates the current system state and returns active alerts.
     */
    static async checkSystemHealth(): Promise<{ type: 'SLA' | 'SECURITY'; message: string; severity: 'CRITICAL' | 'WARNING' }[]> {
        const alerts: { type: 'SLA' | 'SECURITY'; message: string; severity: 'CRITICAL' | 'WARNING' }[] = [];

        try {
            // 1. Check P95 SLA Violations (Last 5 min)
            const recentP95 = await ObservabilityRepository.getRecentP95Metrics(5);
            for (const metric of recentP95) {
                const p95Value = metric.p95 as number;
                if (p95Value > this.P95_THRESHOLD_MS) {
                    alerts.push({
                        type: 'SLA',
                        message: `P95 Latency Spike: ${metric._id} is at ${p95Value}ms (Threshold: ${this.P95_THRESHOLD_MS}ms)`,
                        severity: p95Value > this.P95_THRESHOLD_MS * 2 ? 'CRITICAL' : 'WARNING'
                    });
                }
            }

            // 2. Check Security Anomalies (Last 10 min)
            const anomalies = await ObservabilityRepository.getRecentAnomalies(10);
            for (const anomaly of anomalies) {
                alerts.push({
                    type: 'SECURITY',
                    message: `Security Anomaly Detected: ${anomaly.count} events of type '${anomaly._id}' in the last 10 minutes.`,
                    severity: 'CRITICAL'
                });
            }

        } catch (error) {
            console.error('🛰️ ProactiveAlertService: Failed to check health', error);
        }

        return alerts;
    }

    /**
     * Sends email notifications for critical alerts.
     * Throttled to avoid spamming.
     */
    static async notifyCriticalAlerts(alerts: { type: 'SLA' | 'SECURITY'; message: string; severity: 'CRITICAL' | 'WARNING' }[]): Promise<void> {
        const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
        if (criticalAlerts.length === 0) return;

        const now = Date.now();
        const pendingAlerts = criticalAlerts.filter(a => {
            const lastSent = this.lastSentAlerts.get(a.type) || 0;
            return (now - lastSent) > this.ALERT_THROTTLE_MS;
        });

        if (pendingAlerts.length === 0) return;

        // Compose summary
        const summary = pendingAlerts.map(a => `[${a.type}] ${a.message}`).join('\n');
        
        try {
            await NotificationService.notify({
                tenantId: 'system', 
                type: 'SYSTEM_ANOMALY',
                level: 'ERROR',
                title: '⚠️ CRITICAL SYSTEM ANOMALY DETECTED',
                message: `The proactive monitoring system has detected the following critical issues:\n\n${summary}\n\nPlease check the Admin Dashboard immediately.`,
                extraRecipients: ['admin@abdelevators.com'], 
            });

            // Update throttle map
            pendingAlerts.forEach(a => this.lastSentAlerts.set(a.type, now));
            
        } catch (e) {
            console.error('🛰️ ProactiveAlertService: Failed to send critical notifications', e);
        }
    }

    /**
     * Prediction logic: Checks if latency is trending upwards.
     */
    static async predictBottlenecks(): Promise<string | null> {
        // Phase 440: Compare last 5 min P95 vs last 60 min P95
        try {
            const shortTerm = await ObservabilityRepository.getRecentP95Metrics(5);
            const longTerm = await ObservabilityRepository.getRecentP95Metrics(60);

            for (const s of shortTerm) {
                const l = longTerm.find(x => x._id === s._id);
                if (l && (s.p95 as number) > (l.p95 as number) * 1.5) {
                    return `Predictive Alert: Latency for ${s._id} is trending upwards (+50% vs hour average). Potential bottleneck ahead.`;
                }
            }
        } catch (e) {
            return null;
        }
        return null; 
    }
}
