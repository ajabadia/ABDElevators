import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { GovernancePolicy, AIDecisionAudit } from '@/types/governance';

/**
 * GovernanceEngine: Supervisa y audita el comportamiento de los agentes de IA.
 * (Fase KIMI 12)
 */
export class GovernanceEngine {
    private static instance: GovernanceEngine;

    private constructor() { }

    public static getInstance(): GovernanceEngine {
        if (!GovernanceEngine.instance) {
            GovernanceEngine.instance = new GovernanceEngine();
        }
        return GovernanceEngine.instance;
    }

    /**
     * Evalúa si una acción de IA puede ejecutarse basándose en las políticas.
     */
    public async evaluateAction(
        agentId: string,
        entitySlug: string,
        actionType: string,
        tenantId: string
    ): Promise<{ canExecute: boolean; requiresReview: boolean; policyId?: string }> {
        try {
            const collection = await getTenantCollection('ai_policies', { user: { tenantId } });
            const policies = await collection.find({ active: true }) as unknown as GovernancePolicy[];

            // Encontrar la política más específica
            const policy = policies.find(p => p.rules.entitySelector === entitySlug)
                || policies.find(p => p.rules.entitySelector === '*');

            if (!policy) {
                return { canExecute: true, requiresReview: false };
            }

            return {
                canExecute: policy.rules.autoExecute,
                requiresReview: policy.rules.requiresHumanReview,
                policyId: policy.id
            };
        } catch (error) {
            return { canExecute: true, requiresReview: true };
        }
    }

    /**
     * Registra una decisión de la IA para auditoría.
     */
    public async logDecision(audit: Omit<AIDecisionAudit, 'id' | 'timestamp'>) {
        try {
            const collection = await getTenantCollection('ai_audit_logs', { user: { tenantId: audit.tenantId } });

            const decisionLog: AIDecisionAudit = {
                ...audit,
                id: crypto.randomUUID(),
                timestamp: new Date()
            };

            await collection.insertOne(decisionLog as any);

            await logEvento({
                level: audit.status === 'blocked' ? 'WARN' : 'INFO',
                source: 'AI_GOVERNANCE',
                action: 'AUDIT_LOG',
                message: `AI Decision recorded: ${audit.actionType} on ${audit.entitySlug} (Status: ${audit.status})`,
                correlationId: audit.correlationId,
                details: { status: audit.status, confidence: audit.confidence }
            });
        } catch (error) {
            console.error('[GovernanceEngine] Error logging decision:', error);
        }
    }

    /**
     * Obtiene los logs de auditoría para un tenant.
     */
    public async getAuditLogs(tenantId: string, limit = 50): Promise<AIDecisionAudit[]> {
        const collection = await getTenantCollection('ai_audit_logs', { user: { tenantId } });
        return await collection.find({}, { sort: { timestamp: -1 }, limit }) as unknown as AIDecisionAudit[];
    }
}
