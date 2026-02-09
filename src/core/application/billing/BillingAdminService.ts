import { connectAuthDB } from '@/lib/db';
import { TenantService } from '@/lib/tenant-service';
import { QuotaService } from '@/lib/quota-service';
import { PLANS, PlanTier, PlanLimits } from '@/lib/plans';
import { TenantConfigSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { BillingEngine } from '@/lib/billing-engine';

export interface ContractSummary {
    tenantId: string;
    name: string;
    tier: PlanTier;
    planName: string;
    status: string; // Active, Past Due, etc.
    customOverrides: boolean;
    usage: {
        tokens: number;
        storage: number;
    };
    limits: {
        tokens: number;
        storage: number;
    };
    mrr: number; // Estimated
    nextBillingDate: Date;
}

export class BillingAdminService {

    /**
     * Obtiene el listado de contratos (Tenants + Estado Facturación)
     * Soporta paginación simple.
     */
    static async getTenantContracts(page: number = 1, limit: number = 10, search?: string): Promise<{ contracts: ContractSummary[], total: number }> {
        const db = await connectAuthDB();
        const skip = (page - 1) * limit;

        const query: any = {};
        if (search) {
            query['name'] = { $regex: search, $options: 'i' };
        }

        const [tenants, total] = await Promise.all([
            db.collection('tenants')
                .find(query)
                .sort({ 'subscription.status': 1, 'name': 1 }) // Active first (usually status is string, might need adjustment)
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('tenants').countDocuments(query)
        ]);

        // Enriquecer con datos de uso y cálculo de MRR en paralelo
        const contracts = await Promise.all(tenants.map(async (tenant: any) => {
            try {
                // Parse config safely
                const config = TenantConfigSchema.parse(tenant);
                const tier = (config.subscription?.tier as PlanTier) || 'FREE';
                const plan = PLANS[tier];

                // Get Real Usage
                const usageStats = await QuotaService.getTenantUsageStats(config.tenantId);
                const customLimits = config.customLimits || {};

                // Determine Effective Limits
                const tokenLimit = customLimits.llm_tokens_per_month ?? plan.limits.llm_tokens_per_month;
                const storageLimit = customLimits.storage_bytes ?? plan.limits.storage_bytes;

                // Calculate Projected Overage Cost
                // Use BillingEngine logic or simple approximation?
                // QuotaService.calculateOverage uses Plan.overage prices.
                // If custom pricing is implemented later, we'd use that.
                // For now, assume Plan Overage Prices apply unless overridden (future).

                let overageCost = 0;
                // Tokens
                if (usageStats.usage.tokens > tokenLimit && plan.overage.tokens > 0) {
                    overageCost += (usageStats.usage.tokens - tokenLimit) * plan.overage.tokens;
                }
                // Storage
                if (usageStats.usage.storage > storageLimit && plan.overage.storage > 0) {
                    overageCost += (usageStats.usage.storage - storageLimit) * plan.overage.storage;
                }

                const mrr = plan.price_monthly + overageCost;

                return {
                    tenantId: config.tenantId,
                    name: config.name,
                    tier: tier,
                    planName: plan.name,
                    status: config.subscription?.status || 'FREE',
                    customOverrides: Object.keys(customLimits).length > 0,
                    usage: {
                        tokens: usageStats.usage.tokens,
                        storage: usageStats.usage.storage
                    },
                    limits: {
                        tokens: tokenLimit,
                        storage: storageLimit
                    },
                    mrr: Math.round(mrr * 100) / 100,
                    nextBillingDate: new Date(new Date().setDate(new Date().getDate() + 30)) // Mock if not in DB
                };
            } catch (err) {
                console.error(`Error processing contract for tenant ${tenant.tenantId}`, err);
                // Return fallback
                return {
                    tenantId: tenant.tenantId,
                    name: tenant.name || 'Unknown',
                    tier: 'FREE',
                    planName: 'Error',
                    status: 'ERROR',
                    customOverrides: false,
                    usage: { tokens: 0, storage: 0 },
                    limits: { tokens: 0, storage: 0 },
                    mrr: 0,
                    nextBillingDate: new Date()
                } as ContractSummary;
            }
        }));

        return { contracts, total };
    }

    /**
     * Actualiza el "Caso" (Contrato) de un tenant: Overrides y Tier.
     */
    static async updateContract(tenantId: string, data: {
        tier?: PlanTier;
        customLimits?: {
            llm_tokens_per_month?: number;
            storage_bytes?: number;
            vector_searches_per_month?: number;
            users?: number;
        }
    }) {
        const currentConfig = await TenantService.getConfig(tenantId);

        const updates: any = {};

        // 1. Tier Change
        if (data.tier && data.tier !== currentConfig.subscription?.tier) {
            updates.subscription = {
                ...(currentConfig.subscription || {}),
                tier: data.tier
            };
        }

        // 2. Custom Limits Override
        if (data.customLimits) {
            updates.customLimits = {
                ...(currentConfig.customLimits || {}),
                ...data.customLimits
            };

            // Clean up undefined/nulls if passed to remove limit?
            // If user passes 0 or -1 to "remove override", we might need logic.
            // For now, assume explicit value is set.
        }

        await TenantService.updateConfig(tenantId, updates, {
            performedBy: 'BillingAdmin',
            correlationId: `update-contract-${Date.now()}`
        });

        await logEvento({
            level: 'INFO',
            source: 'BILLING_ADMIN',
            action: 'CONTRACT_UPDATED',
            message: `Contract updated for tenant ${tenantId}`,
            correlationId: `update-contract-${Date.now()}`,
            details: { tenantId, updates }
        });

        return { success: true };
    }
}
