export enum TenantTier {
    BASIC = 'BASIC',
    PRO = 'PRO',
    ENTERPRISE = 'ENTERPRISE'
}

export interface FeatureEntitlement {
    featureKey: string;
    allowed: boolean;
    limit?: number; // p.ej. 100 informes/mes
}

export interface TierConfig {
    tier: TenantTier;
    defaultEntitlements: FeatureEntitlement[];
    defaultLimits: {
        tokensPerMonth: number;
        storageBytes: number;
        vectorSearchesPerMonth: number;
        maxUsers: number;
    };
}
