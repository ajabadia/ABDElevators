export enum AppPermission {
    // Knowledge Administration
    KNOWLEDGE_INGEST = 'knowledge:ingest',
    KNOWLEDGE_REDACT = 'knowledge:redact',
    KNOWLEDGE_DELETE = 'knowledge:delete',

    // Business Operations
    ENTITY_ANALYZE = 'entity:analyze',
    ENTITY_DELETE = 'entity:delete',
    CHECKLIST_MANAGE = 'checklist:manage',
    REPORT_GENERATE = 'report:generate',

    // User & Team Management
    USER_INVITE = 'user:invite',
    USER_MANAGE = 'user:manage',
    ROLE_ASSIGN = 'role:assign',

    // Billing & Tiers
    BILLING_VIEW = 'billing:view',
    BILLING_MANAGE = 'billing:manage',
    SUBSCRIPTION_UPGRADE = 'subscription:upgrade',

    // Advanced Features
    INSIGHTS_VIEW = 'insights:view',
    PREDICTIVE_MAINTENANCE = 'predictive:view',
    AI_GOVERNANCE_VIEW = 'ai_governance:view',
    AI_GOVERNANCE_MANAGE = 'ai_governance:manage',

    // System & Audit
    SYSTEM_AUDIT_VIEW = 'system:audit',
    SYSTEM_CONFIG = 'system:config',
    MFA_ENFORCE = 'security:mfa_enforcement'
}

export const ALL_PERMISSIONS = Object.values(AppPermission);
