import { PLANS, PlanTier } from './plans';
import { TenantService } from './tenant-service';
import { TenantSubscription } from './schemas/billing';

/**
 * 📊 LimitsService: Centraliza la lógica de límites efectivos (Phase 120.2)
 * Fusiona los límites del plan base con los overrides específicos del tenant.
 */
export class LimitsService {

    /**
     * Obtiene los límites efectivos para un tenant.
     */
    static async getEffectiveLimits(tenantId: string) {
        const config = await TenantService.getConfig(tenantId);
        const sub = config.subscription as TenantSubscription;

        const planSlug = sub?.planSlug || 'FREE';
        const plan = PLANS[planSlug as PlanTier] || PLANS.FREE;

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
            tier: planSlug as PlanTier
        };
    }

    /**
     * Helper para obtener el límite de una métrica específica considerando overrides.
     */
    private static getMetricLimit(sub: TenantSubscription | undefined, metricKey: string, defaultValue: number): number {
        const override = sub?.overrides?.[metricKey];

        if (!override) return defaultValue;

        // Si hay override de tipo FIXED, usamos su 'unitPrice' como valor de límite si aplica o 
        // más comúnmente en nuestro esquema heredado usábamos includedUnits en FLAT_FEE_OVERAGE.
        // Pero para simplicidad en Phase 120.2, el admin setea el límite numérico directo 
        // en el objeto de overrides si es necesario.

        if (override.type === 'FLAT_FEE_OVERAGE' && override.includedUnits !== undefined) {
            return override.includedUnits;
        }

        return defaultValue;
    }
}
