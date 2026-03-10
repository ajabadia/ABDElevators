import { PLANS, PlanTier } from '@/lib/plans';
import { TenantConfigService } from '@/services/tenant/tenant-config-service';
import { type TenantSubscription } from '@/lib/schemas/billing';

/**
 * 📊 LimitsService: Centraliza la lógica de límites efectivos (Phase 120.2)
 * Fusiona los límites del plan base con los overrides específicos del tenant.
 */
export class LimitsService {

    /**
     * Obtiene los límites efectivos para un tenant.
     */
    static async getEffectiveLimits(tenantId: string) {
        const config = await TenantConfigService.getConfig(tenantId);
        // Ensure subscription is typed correctly from start
        const sub = (config?.subscription as unknown as TenantSubscription) || {};

        const planSlug = (sub?.planSlug as PlanTier) || 'FREE';
        const plan = PLANS[planSlug] || PLANS.FREE;

        // Unificar límites (Plan Base + Overrides)
        return {
            tokens: this.getMetricLimit(sub, 'llm_tokens_per_month', plan.limits.llm_tokens_per_month),
            storage: this.getMetricLimit(sub, 'storage_bytes', plan.limits.storage_bytes),
            searches: this.getMetricLimit(sub, 'vector_searches_per_month', plan.limits.vector_searches_per_month),
            apiRequests: this.getMetricLimit(sub, 'api_requests_per_month', plan.limits.api_requests_per_month),
            users: this.getMetricLimit(sub, 'users', plan.limits.users),
            spaces_per_tenant: this.getMetricLimit(sub, 'spaces_per_tenant', plan.limits.spaces_per_tenant),
            spaces_per_user: this.getMetricLimit(sub, 'spaces_per_user', plan.limits.spaces_per_user),
            status: sub?.status || 'trial',
            planSlug,
            tier: planSlug
        };
    }

    /**
     * Helper para obtener el límite de una métrica específica considerando overrides.
     */
    private static getMetricLimit(sub: Partial<TenantSubscription>, metricKey: string, defaultValue: number): number {
        const override = sub?.overrides?.[metricKey];

        if (!override) return defaultValue;

        if (override.type === 'FLAT_FEE_OVERAGE' && override.includedUnits !== undefined) {
            return override.includedUnits;
        }

        return defaultValue;
    }
}
