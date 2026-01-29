export interface AIDecisionAudit {
    id: string;
    timestamp: Date;
    agentId: string;
    entitySlug: string;
    actionType: string;
    decision: any;
    confidence: number;
    status: 'executed' | 'blocked' | 'pending_review' | 'overridden';
    tenantId: string;
    correlacion_id: string;
}

export interface GovernancePolicy {
    id: string;
    name: string;
    description: string;
    rules: {
        entitySelector: string; // '*' or specific slug
        requiresHumanReview: boolean;
        maxConfidenceThreshold: number; // 0-1
        autoExecute: boolean;
    };
    active: boolean;
}
