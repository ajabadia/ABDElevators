import { Document } from 'mongodb';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import {
    TenantAiConfig,
    TenantAiConfigSchema,
    SupportedAiModel
} from '@/lib/schemas/ai-governance';
import { AppError } from '@/lib/errors';

/**
 * AiModelManager
 * Handles per-tenant AI governance, model selection, and limits.
 */
export class AiModelManager {
    private static cache: Map<string, TenantAiConfig> = new Map();

    /**
     * Get the effective AI model for a tenant.
     */
    static async getEffectiveModel(session: TenantSession, preference?: SupportedAiModel): Promise<SupportedAiModel> {
        const config = await this.getTenantAiConfig(session);

        // Preference takes precedence if it's not explicitly restricted (future logic)
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

        const collection = await getTenantCollection<Document>('ai_configs', session, 'LOGS');
        const doc = await collection.findOne({ tenantId });

        const config = doc
            ? TenantAiConfigSchema.parse(doc)
            : TenantAiConfigSchema.parse({ tenantId }); // Return defaults

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

        const collection = await getTenantCollection<Document>('ai_configs', session, 'LOGS');

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

        await logEvento({
            level: 'INFO',
            source: 'AI_MODEL_MANAGER',
            action: 'CONFIG_UPDATED',
            message: `AI configuration updated for tenant ${targetTenantId}`,
            tenantId: session.user?.tenantId,
            correlationId: `ai-cfg-${Date.now()}`,
            details: { targetTenantId, updates }
        });
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
