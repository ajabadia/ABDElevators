export interface IUsageRepository {
    checkLimits(tenantId: string, feature: string): Promise<void>;
    trackUsage(tenantId: string, entityId: string, feature: string): Promise<void>;
}
