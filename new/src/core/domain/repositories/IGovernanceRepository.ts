export interface IGovernanceRepository {
    getRules(tenantId: string, ruleType?: string): Promise<any[]>;
    logDecision(decision: any): Promise<void>;
}
