import { connectAuthDB } from '@/lib/db';
import { TenantService } from '@/lib/tenant-service';
import { QuotaService } from '@/lib/quota-service';
import { PLANS, PlanTier, PlanLimits } from '@/lib/plans';
import { TenantConfigSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { BillingEngine } from '@/lib/billing-engine';
import { LimitsService } from '@/lib/limits-service';

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
        spaces_per_tenant: number;
    };
    limits: {
        tokens: number;
        storage: number;
        spaces_per_tenant: number;
        spaces_per_user: number;
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
                // Parse config safely (Phase 120.2)
                const config = TenantConfigSchema.parse(tenant);
                const sub = config.subscription;

                if (!sub) {
                    // Fallback for tenants without subscription (e.g. legacy)
                    return {
                        tenantId: config.tenantId,
                        name: config.name,
                        tier: 'FREE' as PlanTier,
                        planName: 'Free Tier (Legacy)',
                        status: 'ACTIVE',
                        customOverrides: false,
                        usage: { tokens: 0, storage: 0, spaces_per_tenant: 0 },
                        limits: { tokens: 0, storage: 0, spaces_per_tenant: 0, spaces_per_user: 0 },
                        mrr: 0,
                        nextBillingDate: new Date(),
                        paymentMethod: 'MANUAL',
                        history: []
                    };
                }

                const plan = PLANS[sub.planSlug || 'FREE'];

                // Get Real Usage
                const usageStats = await QuotaService.getTenantUsageStats(config.tenantId);

                // Get Spaces count for usage display
                const mainDb = await (await import('@/lib/db')).connectDB();
                const spacesCount = await mainDb.collection('spaces').countDocuments({ tenantId: config.tenantId });

                // Determine Limits from unified model
                const limits = await LimitsService.getEffectiveLimits(config.tenantId);

                // Calculate Projected Cost via BillingEngine
                const tokensCost = BillingEngine.calculateMetricCost(usageStats.tokens, sub.overrides['llm_tokens_per_month'] || plan.metrics['llm_tokens_per_month'] || plan.metrics['tokens']);
                const storageCost = BillingEngine.calculateMetricCost(usageStats.storage, sub.overrides['storage_bytes'] || plan.metrics['storage_bytes'] || plan.metrics['storage']);

                const mrr = plan.price_monthly + tokensCost.totalCost + storageCost.totalCost;

                return {
                    tenantId: config.tenantId,
                    name: config.name,
                    tier: (sub.planSlug || 'FREE') as PlanTier,
                    planName: sub.planSlug ? PLANS[sub.planSlug]?.name : 'Free Tier',
                    status: sub.status || 'ACTIVE',
                    customOverrides: sub.overrides ? Object.keys(sub.overrides).length > 0 : false,
                    usage: {
                        tokens: usageStats.tokens,
                        storage: usageStats.storage,
                        spaces_per_tenant: spacesCount
                    },
                    limits: {
                        tokens: limits.tokens,
                        storage: limits.storage,
                        spaces_per_tenant: limits.spaces_per_tenant,
                        spaces_per_user: limits.spaces_per_user
                    },
                    mrr: Math.round(mrr * 100) / 100,
                    nextBillingDate: sub.currentPeriodEnd || new Date(new Date().setDate(new Date().getDate() + 30))
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
                    usage: { tokens: 0, storage: 0, spaces_per_tenant: 0 },
                    limits: { tokens: 0, storage: 0, spaces_per_tenant: 0, spaces_per_user: 0 },
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
            spaces_per_tenant?: number;
            spaces_per_user?: number;
        }
    }) {
        const currentConfig = await TenantService.getConfig(tenantId);
        // Fix: Handle cases where subscription is undefined (legacy tenants)
        const sub = currentConfig.subscription || {
            planSlug: 'FREE',
            status: 'ACTIVE',
            overrides: {}
        } as any;

        const updates: any = {};
        const subscriptionUpdates: any = {};

        // 1. Tier Change
        if (data.tier && data.tier !== sub.planSlug) {
            subscriptionUpdates.planSlug = data.tier;
        }

        // 2. Custom Limits Override (Phase 120.2)
        if (data.customLimits) {
            subscriptionUpdates.overrides = {
                ...(sub.overrides || {})
            };

            if (data.customLimits.llm_tokens_per_month !== undefined) {
                subscriptionUpdates.overrides['llm_tokens_per_month'] = {
                    type: 'FLAT_FEE_OVERAGE',
                    includedUnits: data.customLimits.llm_tokens_per_month,
                    currency: 'EUR'
                };
            }
            if (data.customLimits.storage_bytes !== undefined) {
                subscriptionUpdates.overrides['storage_bytes'] = {
                    type: 'FLAT_FEE_OVERAGE',
                    includedUnits: data.customLimits.storage_bytes,
                    currency: 'EUR'
                };
            }
            if (data.customLimits.spaces_per_tenant !== undefined) {
                subscriptionUpdates.overrides['spaces_per_tenant'] = {
                    type: 'FLAT_FEE_OVERAGE',
                    includedUnits: data.customLimits.spaces_per_tenant,
                    currency: 'EUR'
                };
            }
            if (data.customLimits.spaces_per_user !== undefined) {
                subscriptionUpdates.overrides['spaces_per_user'] = {
                    type: 'FLAT_FEE_OVERAGE',
                    includedUnits: data.customLimits.spaces_per_user,
                    currency: 'EUR'
                };
            }
            // ... more if needed
        }

        if (Object.keys(subscriptionUpdates).length > 0) {
            updates.subscription = {
                ...sub,
                ...subscriptionUpdates,
                updatedAt: new Date()
            };
        }

        await TenantService.updateConfig(tenantId, updates, {
            performedBy: 'BillingAdmin',
            correlationId: crypto.randomUUID()
        });

        await logEvento({
            level: 'INFO',
            source: 'BILLING_ADMIN',
            action: 'CONTRACT_UPDATED',
            message: `Contract updated for tenant ${tenantId}`,
            correlationId: crypto.randomUUID(),
            details: { tenantId, updates }
        });

        return { success: true };
    }
}
