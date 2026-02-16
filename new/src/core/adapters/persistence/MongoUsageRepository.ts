import { IUsageRepository } from '../../domain/repositories/IUsageRepository';
import { AccessControlService } from '@/lib/access-control';
import { UsageService } from '@/lib/usage-service';

export class MongoUsageRepository implements IUsageRepository {
    async checkLimits(tenantId: string, feature: string): Promise<void> {
        // Redirect to existing shared service (Adaptation Layer)
        await AccessControlService.checkUsageLimits(tenantId, feature as any);
    }

    async trackUsage(tenantId: string, entityId: string, feature: string): Promise<void> {
        if (feature === 'REPORTS') {
            await UsageService.trackReportGeneration(tenantId, entityId);
        }
    }
}
