import { getTenantCollection } from './db-tenant';
import { PLANS, PlanTier } from './plans';
import { BillingEngine, BillingResult } from './billing-engine';
import { TenantService } from './tenant-service';
import { logEvento } from './logger';
import { AppError } from './errors';

export type QuotaStatus = 'ALLOWED' | 'OVERAGE_WARNING' | 'BLOCKED';

export interface QuotaCheckResult {
    status: QuotaStatus;
    reason?: string;
    current: number;
    limit: number;
    percentage: number;
    estimatedOverageCost?: number;
}

/**
 * QuotaService: Gestión unificada de cuotas y límites flexibles (Phase 120.2)
 */
export class QuotaService {
    private static SAFETY_CEILING_MULTIPLIER = 2.0; // 200% hard stop

    /**
     * Evalúa si un tenant tiene cuota disponible para una operación.
     */
    static async evaluateQuota(
        tenantId: string,
        type: 'TOKENS' | 'STORAGE' | 'SEARCHES' | 'USERS' | 'API_REQUEST',
        requestedAmount: number = 0
    ): Promise<QuotaCheckResult> {
        try {
            // 1. Obtener Configuración y Tier
            const config = await TenantService.getConfig(tenantId);
            const tier = (config.subscription?.tier as PlanTier) || 'FREE';
            const plan = PLANS[tier];

            // 2. Obtener Consumo Actual
            const currentUsage = await this.getCurrentUsage(tenantId, type);
            const totalUsage = currentUsage + requestedAmount;

            // 3. Determinar Límite
            let limit = 0;
            const customLimits = (config as any).customLimits || {};

            switch (type) {
                case 'TOKENS':
                    limit = customLimits.llm_tokens_per_month ?? plan.limits.llm_tokens_per_month;
                    break;
                case 'STORAGE':
                    limit = customLimits.storage_bytes ?? plan.limits.storage_bytes;
                    break;
                case 'SEARCHES':
                    limit = customLimits.vector_searches_per_month ?? plan.limits.vector_searches_per_month;
                    break;
                case 'USERS':
                    limit = customLimits.users ?? plan.limits.users;
                    break;
                case 'API_REQUEST':
                    limit = customLimits.api_requests_per_month ?? plan.limits.api_requests_per_month;
                    break;
            }

            if (limit === Infinity) {
                return { status: 'ALLOWED', current: currentUsage, limit: Infinity, percentage: 0 };
            }

            const percentage = (totalUsage / limit) * 100;

            // 4. Lógica de Ejecución Flexible (Regla de Oro #9 mod)

            // Caso A: FREE Tier -> Hard block al 100%
            if (tier === 'FREE' && totalUsage > limit) {
                return {
                    status: 'BLOCKED',
                    reason: `Límite de plan gratuito excedido (${limit.toLocaleString()}). Por favor, actualiza a PRO.`,
                    current: currentUsage,
                    limit,
                    percentage
                };
            }

            // Caso B: Otros Tiers -> Soft block con Overage hasta 200%
            if (totalUsage > limit) {
                const safetyCeiling = limit * this.SAFETY_CEILING_MULTIPLIER;

                if (totalUsage > safetyCeiling) {
                    return {
                        status: 'BLOCKED',
                        reason: `Techo de seguridad alcanzado (${(this.SAFETY_CEILING_MULTIPLIER * 100)}%). Bloqueo preventivo para evitar facturación excesiva.`,
                        current: currentUsage,
                        limit,
                        percentage
                    };
                }

                // Calcular coste de overage estimado
                const usageObj = { tokens: 0, storage: 0, searches: 0 };
                if (type === 'TOKENS') usageObj.tokens = totalUsage;
                else if (type === 'STORAGE') usageObj.storage = totalUsage;
                else if (type === 'SEARCHES') usageObj.searches = totalUsage;

                const overageCost = this.calculateOverage(tier, usageObj);

                return {
                    status: 'OVERAGE_WARNING',
                    reason: `Consumo fuera de cuota (Overage). Se aplicarán cargos adicionales.`,
                    current: currentUsage,
                    limit,
                    percentage,
                    estimatedOverageCost: overageCost
                };
            }

            return {
                status: 'ALLOWED',
                current: currentUsage,
                limit,
                percentage
            };

        } catch (error) {
            console.error('[QuotaService] Error evaluating quota:', error);
            // Default safe-fail: allow but log
            return { status: 'ALLOWED', current: 0, limit: 0, percentage: 0 };
        }
    }

    /**
     * Obtiene el consumo actual desde los logs de uso.
     */
    private static async getCurrentUsage(tenantId: string, type: 'TOKENS' | 'STORAGE' | 'SEARCHES' | 'USERS' | 'API_REQUEST'): Promise<number> {
        const collection = await getTenantCollection('usage_logs');

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        let metricType = '';
        switch (type) {
            case 'TOKENS': metricType = 'LLM_TOKENS'; break;
            case 'STORAGE': metricType = 'STORAGE_BYTES'; break;
            case 'SEARCHES': metricType = 'VECTOR_SEARCH'; break;
            case 'API_REQUEST': metricType = 'API_REQUEST'; break;
            case 'USERS':
                const db = await getTenantCollection('users'); // Simplified, normally in auth db
                return await db.countDocuments({ tenantId, active: true });
        }

        const result = await collection.aggregate([
            {
                $match: {
                    tenantId,
                    type: metricType,
                    timestamp: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$value' }
                }
            }
        ]) as any[];

        return result[0]?.total || 0;
    }

    /**
     * Calcula el coste de sobreuso basado en el tier.
     */
    private static calculateOverage(tier: PlanTier, usage: { tokens: number, storage: number, searches: number }): number {
        const plan = PLANS[tier];
        let cost = 0;

        if (usage.tokens > plan.limits.llm_tokens_per_month) {
            cost += (usage.tokens - plan.limits.llm_tokens_per_month) * plan.overage.tokens;
        }
        if (usage.storage > plan.limits.storage_bytes) {
            cost += (usage.storage - plan.limits.storage_bytes) * plan.overage.storage;
        }
        if (usage.searches > plan.limits.vector_searches_per_month) {
            cost += (usage.searches - plan.limits.vector_searches_per_month) * plan.overage.searches;
        }

        return Math.round(cost * 100) / 100;
    }

    /**
     * Obtiene estadísticas completas de uso para un tenant.
     * Usado por el dashboard de facturación.
     */
    static async getTenantUsageStats(tenantId: string) {
        const config = await TenantService.getConfig(tenantId);
        const tier = (config.subscription?.tier as PlanTier) || 'FREE';
        const plan = PLANS[tier];
        const collection = await getTenantCollection('usage_logs');

        // Parallel fetch of all metrics
        const [tokens, storage, searches, apiRequests, users] = await Promise.all([
            this.getCurrentUsage(tenantId, 'TOKENS'),
            this.getCurrentUsage(tenantId, 'STORAGE'),
            this.getCurrentUsage(tenantId, 'SEARCHES'),
            this.getCurrentUsage(tenantId, 'API_REQUEST'),
            this.getCurrentUsage(tenantId, 'USERS')
        ]);

        const stats = {
            tier,
            planName: plan.name,
            usage: {
                tokens,
                storage,
                searches,
                apiRequests,
                users
            },
            limits: plan.limits,
            status: {
                tokens: this.getMetricStatus(tokens, plan.limits.llm_tokens_per_month, tier),
                storage: this.getMetricStatus(storage, plan.limits.storage_bytes, tier),
                searches: this.getMetricStatus(searches, plan.limits.vector_searches_per_month, tier),
                apiRequests: this.getMetricStatus(apiRequests, plan.limits.api_requests_per_month, tier),
                users: this.getMetricStatus(users, plan.limits.users, tier),
            }
        };

        return stats;
    }

    private static getMetricStatus(current: number, limit: number, tier: PlanTier): { status: QuotaStatus, percentage: number } {
        if (limit === Infinity) return { status: 'ALLOWED', percentage: 0 };
        const percentage = (current / limit) * 100;

        let status: QuotaStatus = 'ALLOWED';
        if (current > limit) {
            if (tier === 'FREE') status = 'BLOCKED';
            else if (current > limit * this.SAFETY_CEILING_MULTIPLIER) status = 'BLOCKED';
            else status = 'OVERAGE_WARNING';
        }

        return { status, percentage };
    }
}
