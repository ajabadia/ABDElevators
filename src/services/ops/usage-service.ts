
import { getTenantCollection } from '@/lib/db-tenant';
import { UsageLogSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';

/**
 * Servicio de Tracking de Consumo (Visión 2.0 - Fase 7.4)
 */
export class UsageService {
    /**
     * Registra el uso de tokens de LLM.
     */
    static async trackLLM(tenantId: string, tokens: number, model: string, correlationId?: string, session?: any) {
        return this.logUsage({
            tenantId,
            type: 'LLM_TOKENS',
            value: tokens,
            resource: model,
            description: `Consumo de ${tokens} tokens en modelo ${model}`,
            correlationId
        }, session);
    }

    /**
     * Registra el uso de tokens de LLM en modo Shadow.
     */
    static async trackShadowLLM(tenantId: string, tokens: number, model: string, correlationId?: string) {
        return this.logUsage({
            tenantId,
            type: 'LLM_TOKENS',
            value: tokens,
            resource: model,
            description: `[SHADOW] Consumo de ${tokens} tokens en modelo ${model}`,
            correlationId,
            metadata: { isShadow: true }
        });
    }

    /**
     * Registra el uso de almacenamiento.
     */
    static async trackStorage(tenantId: string, bytes: number, resource: string, correlationId?: string) {
        return this.logUsage({
            tenantId,
            type: 'STORAGE_BYTES',
            value: bytes,
            resource: resource,
            description: `Almacenamiento de ${Math.round(bytes / 1024)} KB en ${resource}`,
            correlationId
        });
    }

    /**
     * Registra la precisión del contexto RAG.
     */
    static async trackContextPrecision(tenantId: string, correlationId: string, averageScore: number, query: string) {
        return this.logUsage({
            tenantId,
            type: 'RAG_PRECISION',
            value: averageScore,
            resource: 'rag-engine',
            description: `Precisión promedio de ${(averageScore * 100).toFixed(1)}% para consulta: "${query.substring(0, 50)}..."`,
            correlationId
        });
    }

    /**
     * Registra una búsqueda vectorial.
     */
    static async trackVectorSearch(tenantId: string, correlationId?: string) {
        return this.logUsage({
            tenantId,
            type: 'VECTOR_SEARCH',
            value: 1,
            resource: 'mongodb-vector-search',
            description: 'Consulta de búsqueda semántica realizada',
            correlationId
        });
    }

    /**
     * Registra el ahorro por deduplicación.
     */
    static async trackDeduplicationSaving(tenantId: string, estimatedTokens: number, correlationId?: string) {
        return this.logUsage({
            tenantId,
            type: 'SAVINGS_TOKENS',
            value: estimatedTokens,
            resource: 'deduplication-md5',
            description: `Ahorro estimado de ${estimatedTokens} tokens por deduplicación`,
            correlationId
        });
    }

    /**
     * Registra el uso de embeddings.
     */
    static async trackEmbedding(tenantId: string, chunks: number, model: string, correlationId?: string) {
        return this.logUsage({
            tenantId,
            type: 'EMBEDDING_OPS',
            value: chunks,
            resource: model,
            description: `Generación de embeddings para ${chunks} fragmentos con ${model}`,
            correlationId
        });
    }

    /**
     * Registra la generación de un nuevo informe/entidad.
     */
    static async trackReportGeneration(tenantId: string, entityId: string, correlationId?: string) {
        return this.logUsage({
            tenantId,
            type: 'REPORTS_GENERATED',
            value: 1,
            resource: entityId,
            description: `Generación de informe para entidad ${entityId}`,
            correlationId
        });
    }

    /**
     * Método genérico para registrar uso.
     */
    static async trackUsage(tenantId: string, data: {
        type: 'LLM_TOKENS' | 'STORAGE_BYTES' | 'VECTOR_SEARCH' | 'API_REQUEST' | 'SAVINGS_TOKENS' | 'EMBEDDING_OPS' | 'REPORTS_GENERATED' | 'RAG_PRECISION',
        value: number,
        resource?: string,
        description?: string,
        correlationId?: string,
        metadata?: Record<string, any>
    }) {
        return this.logUsage({
            tenantId,
            resource: 'system',
            ...data
        });
    }

    /**
     * Método interno para persistir el log de uso.
     */
    private static async logUsage(data: any, session?: any) {
        try {
            const validated = UsageLogSchema.parse(data);
            const collection = await getTenantCollection('usage_logs', session);

            await collection.insertOne(validated);

            if (validated.type === 'LLM_TOKENS' && validated.value > 10000) {
                const { NotificationService } = await import('@/services/core/notification-service');
                await NotificationService.notify({
                    tenantId: validated.tenantId,
                    type: 'BILLING_EVENT',
                    level: 'WARNING',
                    title: 'Pico de Consumo Detectado',
                    message: `Se ha detectado una operación con un consumo inusual de ${validated.value.toLocaleString()} tokens en el modelo ${validated.resource}.`,
                    link: '/admin/billing',
                    metadata: { resource: validated.resource, value: validated.value }
                });

                await logEvento({
                    level: 'WARN',
                    source: 'USAGE_SERVICE',
                    action: 'HIGH_CONSUMPTION',
                    message: `Alto consumo de tokens detectado: ${validated.value}`,
                    correlationId: validated.correlationId || 'SYSTEM'
                });
            }

            return true;
        } catch (error) {
            console.error('[UsageService ERROR] Failed to log usage:', error);
            return false;
        }
    }

    static async getTenantROI(tenantId: string) {
        try {
            const usageColl = await getTenantCollection('usage_logs');
            const entitiesColl = await getTenantCollection('entities');

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const analysisCount = await entitiesColl.countDocuments({
                createdAt: { $gte: thirtyDaysAgo },
                status: 'completed'
            });

            const usageStats = await usageColl.aggregate<any>([
                { $match: { timestamp: { $gte: thirtyDaysAgo } } },
                { $group: { _id: '$type', count: { $sum: 1 }, totalValue: { $sum: '$value' } } }
            ]);

            const vectorSearches = usageStats.find((s: any) => s._id === 'VECTOR_SEARCH')?.count || 0;
            const dedupEvents = usageStats.find((s: any) => s._id === 'SAVINGS_TOKENS')?.count || 0;
            const savedTokens = usageStats.find((s: any) => s._id === 'SAVINGS_TOKENS')?.totalValue || 0;

            const TIME_PER_ANALYSIS_MIN = 20;
            const TIME_PER_SEARCH_MIN = 15;
            const TIME_PER_DEDUP_MIN = 5;
            const HOURLY_RATE_USD = 50;

            const totalSavedMinutes = (analysisCount * TIME_PER_ANALYSIS_MIN) + (vectorSearches * TIME_PER_SEARCH_MIN) + (dedupEvents * TIME_PER_DEDUP_MIN);
            const totalSavedHours = Math.round(totalSavedMinutes / 60);

            return {
                period: '30d',
                metrics: { analysisCount, vectorSearches, dedupEvents, savedTokens },
                roi: {
                    totalSavedHours,
                    estimatedCostSavings: Math.round(totalSavedHours * HOURLY_RATE_USD),
                    currency: 'USD',
                    breakdown: {
                        analysisHours: Math.round((analysisCount * TIME_PER_ANALYSIS_MIN) / 60),
                        searchHours: Math.round((vectorSearches * TIME_PER_SEARCH_MIN) / 60),
                        dedupHours: Math.round((dedupEvents * TIME_PER_DEDUP_MIN) / 60)
                    }
                },
                efficiencyScore: analysisCount > 0 ? Math.min(100, Math.round(totalSavedMinutes / (analysisCount * 2))) : 0
            };
        } catch (error) {
            console.error('[UsageService] Error calculating ROI:', error);
            return {
                period: '30d',
                metrics: { analysisCount: 0, vectorSearches: 0, dedupEvents: 0, savedTokens: 0 },
                roi: { totalSavedHours: 0, estimatedCostSavings: 0, currency: 'USD', breakdown: { analysisHours: 0, searchHours: 0, dedupHours: 0 } },
                efficiencyScore: 0
            };
        }
    }

    static async getAggregateUsage(tenantId: string, start: Date, end: Date) {
        try {
            const collection = await getTenantCollection('usage_logs');
            const stats = await collection.aggregate<any>([
                { $match: { tenantId, timestamp: { $gte: start, $lte: end } } },
                { $group: { _id: '$type', total: { $sum: '$value' } } }
            ]);

            const usageMap: Record<string, number> = {};
            stats.forEach((s: any) => { usageMap[s._id] = s.total; });
            return usageMap;
        } catch (error) {
            console.error('[UsageService] Error fetching aggregate usage:', error);
            return {};
        }
    }

    static async getUserMetrics(userId: string, tenantId: string) {
        try {
            const validationsColl = await getTenantCollection('validations');
            const validationsCount = await validationsColl.countDocuments({ tenantId, validatedBy: userId });

            const ticketsColl = await getTenantCollection('tickets');
            const ticketsCreated = await ticketsColl.countDocuments({ tenantId, createdBy: userId });
            const ticketsResolved = await ticketsColl.countDocuments({ tenantId, assignedTo: userId, status: 'RESOLVED' });

            return {
                validationsCount, ticketsCreated, ticketsResolved,
                efficiencyScore: Math.min(100, (validationsCount * 5) + (ticketsResolved * 10))
            };
        } catch (error) {
            console.error('[UsageService] Error calculating User Metrics:', error);
            return { validationsCount: 0, ticketsCreated: 0, ticketsResolved: 0, efficiencyScore: 0 };
        }
    }

    static async getGlobalCostPrediction() {
        try {
            const { TenantService } = await import('@/services/tenant/tenant-service');
            const { PLANS } = await import('@/lib/plans');
            const tenants = await TenantService.getAllTenants();

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            let totalTokensLast30Days = 0;
            let totalStorageLast30Days = 0;

            for (const tenant of tenants) {
                const usage = await this.getAggregateUsage(tenant._id.toString(), thirtyDaysAgo, new Date());
                totalTokensLast30Days += (usage['LLM_TOKENS'] || 0);
                totalStorageLast30Days += (usage['STORAGE_BYTES'] || 0);
            }

            const dailyBurnTokens = totalTokensLast30Days / 30;
            const projectedTokensNext30Days = dailyBurnTokens * 30;
            const PRICE_PER_TOKEN = PLANS.PRO.overage.tokens;

            return {
                period: '30d',
                burnRate: { tokensPerDay: Math.round(dailyBurnTokens), storagePerDay: Math.round(totalStorageLast30Days / 30) },
                projection: {
                    tokensNext30Days: Math.round(projectedTokensNext30Days),
                    estimatedSpend: Number((projectedTokensNext30Days * PRICE_PER_TOKEN).toFixed(2)),
                    currency: 'EUR'
                },
                confidenceScore: tenants.length > 5 ? 0.85 : 0.6,
                trend: dailyBurnTokens > 0 ? 'STABLE' : 'LOW_USAGE'
            };
        } catch (error) {
            console.error('[UsageService] Error generating global cost prediction:', error);
            return null;
        }
    }

    static async getTenantCostPrediction(tenantId: string) {
        try {
            const { TenantService } = await import('@/services/tenant/tenant-service');
            const { calculateOverageCost } = await import('@/lib/plans');

            const tenant = await TenantService.getConfig(tenantId);
            if (!tenant) return null;

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const usage = await this.getAggregateUsage(tenantId, thirtyDaysAgo, new Date());
            const monthlyTokens = usage['LLM_TOKENS'] || 0;
            const monthlyStorage = usage['STORAGE_BYTES'] || 0;
            const monthlySearches = usage['VECTOR_SEARCHES'] || 0;

            const currentPlan = (tenant as any).planTier || 'FREE';
            const projectedOverage = calculateOverageCost(currentPlan, { tokens: monthlyTokens, storage: monthlyStorage, searches: monthlySearches });

            const comparisons: Record<string, number> = {};
            for (const tier of ['BASIC', 'PRO', 'ENTERPRISE'] as const) {
                comparisons[tier] = calculateOverageCost(tier, { tokens: monthlyTokens, storage: monthlyStorage, searches: monthlySearches });
            }

            return {
                usage: { tokens: monthlyTokens, storage: monthlyStorage, searches: monthlySearches },
                projectedOverage,
                comparisons,
                recommendation: this.getPlanRecommendation(currentPlan, monthlyTokens, monthlyStorage)
            };
        } catch (error) {
            console.error('[UsageService] Error generating tenant cost prediction:', error);
            return null;
        }
    }

    private static getPlanRecommendation(currentTier: string, tokens: number, storage: number): string | null {
        if (currentTier === 'FREE' && tokens > 100000) return 'BASIC';
        if (currentTier === 'BASIC' && tokens > 500000) return 'PRO';
        if (currentTier === 'PRO' && tokens > 1000000) return 'ENTERPRISE';
        return null;
    }
}
