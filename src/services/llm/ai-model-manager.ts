import { Document } from 'mongodb';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import {
    TenantAiConfigSchema,
    SupportedAiModel,
    TenantAiConfig
} from '@/lib/schemas/ai-governance';
import { AIMODELIDS } from '@/lib/ai-models';
import { AppError } from '@/lib/errors';
import { TenantLimitsService } from '../auth/TenantLimitsService';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * AiModelManager
 * Handles per-tenant AI governance, model selection, and limits.
 */
export class AiModelManager {
    private static cache: Map<string, TenantAiConfig> = new Map();

    /**
     * Get the effective AI model for a specific functional purpose (Phase 212).
     * Falls back to platform defaults if no tenant override exists.
     */
    static async getFunctionalModel(session: TenantSession, purpose: keyof typeof AIMODELIDS): Promise<SupportedAiModel> {
        const config = await this.getTenantAiConfig(session);

        // Map purposes to schema fields
        const fieldMap: Record<string, keyof TenantAiConfig> = {
            RAG_GENERATOR: 'ragGeneratorModel',
            RAG_QUERY_REWRITER: 'ragQueryRewriterModel',
            REPORT_GENERATOR: 'reportGeneratorModel',
            WORKFLOW_ROUTER: 'workflowRouterModel',
            WORKFLOW_NODE_ANALYZER: 'workflowNodeAnalyzerModel',
            ONTOLOGY_REFINER: 'ontologyRefinerModel',
            QUERY_ENTITY_EXTRACTOR: 'queryEntityExtractorModel',
            SIDEKICK_CONTEXTUAL: 'sidekickModel'
        };

        const field = fieldMap[purpose];
        const override = field ? config[field] as SupportedAiModel : undefined;

        // 1. Tenant Override (UI Governance)
        if (override) return override;

        // 2. Platform Default (ENV / Code)
        const platformDefault = AIMODELIDS[purpose];
        if (platformDefault) return platformDefault as SupportedAiModel;

        // 3. Absolute Fallback (Tenant Default)
        return config.defaultModel;
    }

    /**
     * Get the effective AI model for a tenant (Generic backward compatibility).
     */
    static async getEffectiveModel(session: TenantSession, preference?: SupportedAiModel): Promise<SupportedAiModel> {
        const config = await this.getTenantAiConfig(session);
        return preference || config.defaultModel;
    }

    /**
     * Get the full AI configuration for a tenant.
     */
    static async getTenantAiConfig(session: TenantSession): Promise<TenantAiConfig> {
        const tenantId = session.user?.tenantId || 'platform_master';

        if (this.cache.has(tenantId)) {
            return this.cache.get(tenantId)!;
        }

        const collection = await getTenantCollection<Document>('ai_configs', session);
        const doc = await collection.findOne({ tenantId });

        const config = doc
            ? TenantAiConfigSchema.parse(doc)
            : TenantAiConfigSchema.parse({ tenantId }); // Return defaults

        // Inject Phase 345 Rate Limits
        const rateLimits = await TenantLimitsService.getTenantRateLimits(tenantId);
        if (rateLimits) {
            config.rateLimits = rateLimits;
        }

        this.cache.set(tenantId, config);
        return config;
    }

    /**
     * Update AI configuration for a tenant (SUPER_ADMIN or Admin with permission).
     */
    static async updateTenantAiConfig(
        session: TenantSession,
        targetTenantId: string,
        updates: Partial<TenantAiConfig>
    ): Promise<void> {
        // Governance check
        if (session.user?.role !== 'SUPER_ADMIN' && session.user?.tenantId !== targetTenantId) {
            throw new AppError('FORBIDDEN', 403, 'No tienes permiso para modificar la configuración de IA');
        }

        return await withCorrelation(
            { level: 'INFO', source: 'AI_MODEL_MANAGER', action: 'CONFIG_UPDATED', tenantId: session.user?.tenantId },
            async ({ log }) => {
                const collection = await getTenantCollection<Document>('ai_configs', session);

                const validated = TenantAiConfigSchema.partial().parse(updates);

                await collection.updateOne(
                    { tenantId: targetTenantId },
                    {
                        $set: {
                            ...validated,
                            updatedAt: new Date(),
                            updatedBy: session.user?.id
                        }
                    },
                    { upsert: true }
                );

                // Invalidate Cache
                this.cache.delete(targetTenantId);

                await log({
                    message: `AI configuration updated for tenant ${targetTenantId}`,
                    details: { targetTenantId, updates }
                });
            }
        );
    }

    /**
     * Validate request against tenant limits.
     */
    static async validatePromptLimit(session: TenantSession, promptLength: number): Promise<void> {
        const config = await this.getTenantAiConfig(session);

        if (promptLength > config.maxTokensPerRequest * 4) { // Heuristic: 1 token approx 4 chars
            throw new AppError('LIMIT_EXCEEDED', 400, `El prompt excede el límite permitido para tu configuración (${config.maxTokensPerRequest} tokens)`);
        }
    }
}
