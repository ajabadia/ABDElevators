import { IGovernanceRepository } from '../../domain/repositories/IGovernanceRepository';
import { getTenantCollection } from '@/lib/db-tenant';
import { GovernancePolicy, AIDecisionAudit } from '@/types/governance';

export class MongoGovernanceRepository implements IGovernanceRepository {
    async getRules(tenantId: string, ruleType?: string): Promise<GovernancePolicy[]> {
        const collection = await getTenantCollection<any>('ai_policies', { user: { tenantId } });
        // ruleType filtering if schema supports it, for now returning all active
        return await collection.find({ active: true }) as unknown as GovernancePolicy[];
    }

    async logDecision(decision: any): Promise<void> {
        const collection = await getTenantCollection<any>('ai_audit_logs', { user: { tenantId: decision.tenantId } });
        await collection.insertOne({
            ...decision,
            timestamp: new Date()
        });
    }

    async getAuditLogs(tenantId: string, limit: number): Promise<AIDecisionAudit[]> {
        const collection = await getTenantCollection<any>('ai_audit_logs', { user: { tenantId } });
        return await collection.find({}, { sort: { timestamp: -1 }, limit }) as unknown as AIDecisionAudit[];
    }
}
