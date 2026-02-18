import { getTenantCollection } from './db-tenant';
import { ObjectId } from 'mongodb';
import { AppError } from './errors';
import { NotificationService } from './notification-service';

export interface WorkflowExecutionEvent {
    _id?: ObjectId;
    workflowId: string;
    nodeId: string;
    tenantId: string;
    type: 'trigger' | 'action' | 'condition';
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    durationMs: number;
    timestamp: Date;
    correlationId: string;
    error?: string;
    metadata?: Record<string, any>;
}

/**
 * Service to manage and aggregate workflow execution analytics.
 * Phase 53 - Workflow Analytics.
 * Phase 54 - Anomaly Detection.
 */
export class WorkflowAnalyticsService {
    /**
     * Records a single node execution event and checks for anomalies.
     */
    static async recordEvent(event: Omit<WorkflowExecutionEvent, 'timestamp'>) {
        try {
            const collection = await getTenantCollection('workflow_analytics', { user: { id: 'system', tenantId: event.tenantId, role: 'SYSTEM' } } as any);
            await collection.insertOne({
                ...event,
                timestamp: new Date()
            });

            // If the status is FAILED, we trigger an immediate anomaly check for the node
            if (event.status === 'FAILED') {
                await this.detectAnomalies(event.workflowId, event.tenantId, event.nodeId);
            }
        } catch (error) {
            console.error('[WorkflowAnalyticsService] Error recording event:', error);
        }
    }

    /**
     * Detects anomalies based on error rates and latency spikes.
     */
    static async detectAnomalies(workflowId: string, tenantId: string, nodeId?: string) {
        const collection = await getTenantCollection<WorkflowExecutionEvent>('workflow_analytics', { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any);
        const windowSize = 50; // Last 50 executions
        const errorThreshold = 0.15; // 15% error rate spike

        // 1. Check for Error Rate Anomalies
        // Note: SecureCollection.find() returns a Promise of an array, not a cursor.
        const recentEvents = await collection.find({
            workflowId,
            tenantId,
            ...(nodeId && { nodeId })
        }, {
            limit: windowSize,
            sort: { timestamp: -1 } as any
        });

        if (recentEvents.length >= 10) {
            const errorCount = recentEvents.filter((e: WorkflowExecutionEvent) => e.status === 'FAILED').length;
            const errorRate = errorCount / recentEvents.length;

            if (errorRate >= errorThreshold) {
                await NotificationService.notify({
                    tenantId,
                    type: 'RISK_ALERT',
                    level: 'ERROR',
                    title: 'Anomaly Detected: High Error Rate',
                    message: `Workflow ${workflowId}${nodeId ? ` node ${nodeId}` : ''} is experiencing a ${Math.round(errorRate * 100)}% error rate in the last ${recentEvents.length} executions.`,
                    metadata: { workflowId, nodeId, errorRate, type: 'ERROR_SPIKE' }
                });
            }
        }

        // 2. Check for Latency Spikes (Comparing with baseline)
        if (nodeId) {
            const stats = await this.getWorkflowStats(workflowId, tenantId, 7);
            const nodeStat = stats.nodes.find((n: any) => n.nodeId === nodeId);

            if (nodeStat && recentEvents.length > 0) {
                const recentAvgDuration = recentEvents.reduce((acc: number, curr: WorkflowExecutionEvent) => acc + curr.durationMs, 0) / recentEvents.length;
                const baselineAvg = nodeStat.avgDuration;

                // Threshold: 2x baseline AND > 500ms (to avoid alerts on tiny values)
                if (recentAvgDuration > baselineAvg * 2 && recentAvgDuration > 500) {
                    await NotificationService.notify({
                        tenantId,
                        type: 'RISK_ALERT',
                        level: 'WARNING',
                        title: 'Anomaly Detected: Latency Spike',
                        message: `Node ${nodeId} in workflow ${workflowId} is performing slower than usual (${Math.round(recentAvgDuration)}ms vs baseline ${Math.round(baselineAvg)}ms).`,
                        metadata: { workflowId, nodeId, baselineAvg, recentAvgDuration, type: 'LATENCY_SPIKE' }
                    });
                }
            }
        }
    }

    /**
     * Gets aggregated heatmap and bottleneck data for a specific workflow.
     */
    static async getWorkflowStats(workflowId: string, tenantId: string, timeRangeDays: number = 7) {
        const collection = await getTenantCollection('workflow_analytics', { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRangeDays);

        const pipeline = [
            {
                $match: {
                    workflowId,
                    tenantId,
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$nodeId',
                    count: { $sum: 1 },
                    avgDuration: { $avg: '$durationMs' },
                    errorCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    nodeId: '$_id',
                    count: 1,
                    avgDuration: 1,
                    errorRate: {
                        $cond: [
                            { $gt: ['$count', 0] },
                            { $divide: ['$errorCount', '$count'] },
                            0
                        ]
                    }
                }
            }
        ];

        const stats = await collection.aggregate<any>(pipeline);

        // Calculate global KPIs
        const kpis = await collection.aggregate<any>([
            {
                $match: {
                    workflowId,
                    tenantId,
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalExecutions: { $sum: 1 },
                    avgGlobalDuration: { $avg: '$durationMs' },
                    globalSuccessRate: {
                        $avg: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
                    }
                }
            }
        ]);

        return {
            nodes: stats,
            kpis: kpis[0] || { totalExecutions: 0, avgGlobalDuration: 0, globalSuccessRate: 0 }
        };
    }

    /**
     * Gets detailed execution logs for a specific workflow.
     */
    static async getWorkflowLogs(workflowId: string, tenantId: string, limit: number = 50) {
        const collection = await getTenantCollection<WorkflowExecutionEvent>('workflow_analytics', { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any);

        return await collection.find({
            workflowId,
            tenantId
        }, {
            limit,
            sort: { timestamp: -1 } as any
        });
    }
}

