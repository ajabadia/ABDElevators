
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { unstable_cache } from 'next/cache';
import { PromptSchema, PromptVersionSchema, Prompt, PromptVersion } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';
import { DEFAULT_MODEL } from '@/lib/constants/ai-models';
import { AiModelManager } from '@/services/llm/ai-model-manager';
import { PromptInputSanitizer } from '@/services/llm/PromptInputSanitizer';

/**
 * Servicio de Gestión de Prompts Dinámicos (Fase 7.6)
 */
export class PromptService {
    /**
     * Sanitiza inputs de variables para prevenir prompt injection.
     */
    private static sanitizePromptInput(input: any): string {
        return PromptInputSanitizer.sanitize(input);
    }

    /**
     * Obtiene un prompt activo por su key e industria (con fallback a GENERIC)
     */
    static async getPrompt(
        key: string,
        tenantId: string,
        environment: string = 'PRODUCTION',
        industry: string = 'GENERIC',
        session?: any
    ): Promise<Prompt> {
        try {
            const cachedFetcher = unstable_cache(
                async (k, t, e, i) => this.fetchPromptInternal(k, t, e, i, session),
                [`prompt-${key}-${tenantId}`],
                { revalidate: 3600, tags: [`prompts-${tenantId}`, `prompt-${key}`] }
            );

            return await cachedFetcher(key, tenantId, environment, industry);
        } catch (error: any) {
            if (error.message?.includes('incrementalCache') || error.message?.includes('unstable_cache')) {
                return this.fetchPromptInternal(key, tenantId, environment, industry, session);
            }
            throw error;
        }
    }

    private static async fetchPromptInternal(
        key: string,
        tenantId: string,
        environment: string,
        industry: string,
        session?: any
    ): Promise<Prompt> {
        const collection = await getTenantCollection('prompts', session);

        const query = { key, tenantId, industry, active: true, environment };
        let prompt = await collection.findOne(query);

        if (!prompt && industry !== 'GENERIC') {
            prompt = await collection.findOne({ key, tenantId, industry: 'GENERIC', active: true, environment });
        }

        if (!prompt) {
            const { PROMPTS } = await import('@/lib/prompts');
            const fallback = PROMPTS[key as keyof typeof PROMPTS];

            if (fallback) {
                await logEvento({
                    level: 'WARN',
                    source: 'PROMPT_SERVICE',
                    action: 'FALLBACK_USED',
                    message: `Prompt "${key}" no encontrado en DB. Usando fallback.`,
                    correlationId: `fallback-${key}-${Date.now()}`,
                    details: { key, tenantId, industry, environment }
                });

                return {
                    key, tenantId, industry,
                    template: fallback.template,
                    variables: [],
                    environment,
                    active: true,
                    version: fallback.version,
                    usageCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    category: 'GENERIC'
                } as any;
            }

            throw new AppError('NOT_FOUND', 404, `Prompt con key "${key}" no encontrado`);
        }

        return PromptSchema.parse(prompt);
    }

    /**
     * Obtiene el prompt renderizado y el modelo sugerido
     */
    static async getRenderedPrompt(
        key: string,
        variables: Record<string, any>,
        tenantId: string,
        environment: string = 'PRODUCTION',
        industry: string = 'GENERIC',
        session?: TenantSession
    ): Promise<{ text: string, model: string }> {
        const prompt = await this.getPrompt(key, tenantId, environment, industry, session);

        const missingVars = prompt.variables
            .filter(v => v.required && !(v.name in variables))
            .map(v => v.name);

        if (missingVars.length > 0) {
            throw new AppError('MISSING_VARIABLES', 400, `Variables requeridas faltantes: ${missingVars.join(', ')}`);
        }

        const allVariables = { ...variables, tenantId };
        let rendered = prompt.template;
        for (const [varName, varValue] of Object.entries(allVariables)) {
            const sanitizedValue = this.sanitizePromptInput(varValue);
            const placeholder = `{{${varName}}}`;
            rendered = rendered.replace(new RegExp(`${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), sanitizedValue);
        }

        try {
            const collection = await getTenantCollection('prompts', session);
            await collection.updateOne(
                { _id: (prompt as any)._id },
                { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } }
            );
        } catch (err) {
            console.error("Error auditing prompt usage:", err);
        }

        let model = (prompt as any).model;
        if (!model || model === DEFAULT_MODEL) {
            model = session ? await AiModelManager.getFunctionalModel(session, key as any) : DEFAULT_MODEL;
        }

        return { text: rendered, model };
    }

    /**
     * Obtiene el prompt principal y el de sombra.
     */
    static async getPromptWithShadow(
        key: string,
        variables: Record<string, any>,
        tenantId: string,
        industry: string = 'GENERIC',
        session?: TenantSession
    ): Promise<{
        production: { text: string, model: string },
        shadow?: { text: string, model: string, key: string }
    }> {
        const promptObj = await this.getPrompt(key, tenantId, 'PRODUCTION', industry, session);
        const production = await this.render(promptObj, variables, tenantId, session);

        if (promptObj.isShadowActive && promptObj.shadowPromptKey) {
            try {
                const shadowPromptObj = await this.getPrompt(promptObj.shadowPromptKey, tenantId, 'PRODUCTION', industry, session);
                const shadowRendered = await this.render(shadowPromptObj, variables, tenantId, session);

                return {
                    production,
                    shadow: {
                        text: shadowRendered.text,
                        model: (promptObj as any).shadowModel || shadowRendered.model,
                        key: promptObj.shadowPromptKey
                    }
                };
            } catch (err) {
                console.error(`[SHADOW PROMPT ERROR] Error renderizando sombra "${promptObj.shadowPromptKey}":`, err);
                return { production };
            }
        }

        return { production };
    }

    private static async render(
        prompt: Prompt,
        variables: Record<string, any>,
        tenantId: string,
        session?: TenantSession
    ): Promise<{ text: string, model: string }> {
        const missingVars = prompt.variables
            .filter(v => v.required && !(v.name in variables))
            .map(v => v.name);

        if (missingVars.length > 0) {
            throw new AppError('MISSING_VARIABLES', 400, `Variables requeridas faltantes: ${missingVars.join(', ')}`);
        }

        const allVariables = {
            ...variables,
            tenantId,
            vertical: (prompt.industry || 'GENERIC').toLowerCase()
        };
        let rendered = prompt.template;
        for (const [varName, varValue] of Object.entries(allVariables)) {
            const sanitizedValue = this.sanitizePromptInput(varValue);
            const placeholder = `{{${varName}}}`;
            rendered = rendered.replace(new RegExp(`${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), sanitizedValue);
        }

        return { text: rendered, model: (prompt as any).model || DEFAULT_MODEL };
    }

    static async updatePrompt(
        promptId: string,
        updates: { template: string, variables: any[], category?: string, model?: string, industry?: string },
        changedBy: string,
        changeReason: string,
        tenantId?: string,
        auditMetadata?: { correlationId?: string, ip?: string, userAgent?: string }
    ): Promise<void> {
        const collection = await getTenantCollection('prompts');
        const versionsCollection = await getTenantCollection('prompt_versions');

        const query: any = { _id: new ObjectId(promptId) };
        if (tenantId) query.tenantId = tenantId;

        const prompt = await collection.findOne(query);
        if (!prompt) throw new AppError('NOT_FOUND', 404, 'Prompt no encontrado');

        if (prompt.maxLength && updates.template.length > prompt.maxLength) {
            throw new AppError('VALIDATION_ERROR', 400, `Template excede máximo permitido`);
        }

        const versionSnapshot: PromptVersion = {
            promptId: new ObjectId(promptId),
            tenantId: prompt.tenantId,
            version: prompt.version,
            template: prompt.template,
            variables: prompt.variables,
            changedBy,
            changeReason,
            correlationId: auditMetadata?.correlationId,
            ip: auditMetadata?.ip,
            userAgent: auditMetadata?.userAgent,
            environment: prompt.environment || 'PRODUCTION',
            industry: prompt.industry || 'GENERIC',
            createdAt: new Date()
        };

        await versionsCollection.insertOne(PromptVersionSchema.parse(versionSnapshot));

        await collection.updateOne(
            { _id: new ObjectId(promptId) },
            {
                $set: {
                    template: updates.template,
                    variables: updates.variables,
                    category: updates.category || prompt.category,
                    model: updates.model || prompt.model,
                    industry: updates.industry || prompt.industry,
                    version: prompt.version + 1,
                    updatedBy: changedBy,
                    updatedAt: new Date()
                }
            }
        );

        // Audit Trail implementation
        const { AuditTrailService } = await import('@/services/security/audit-trail-service');
        await AuditTrailService.logConfigChange({
            actorType: 'USER', actorId: changedBy, tenantId: prompt.tenantId,
            action: 'UPDATE_PROMPT', entityType: 'PROMPT', entityId: promptId,
            changes: { before: { version: prompt.version }, after: { version: prompt.version + 1 } },
            reason: changeReason, correlationId: auditMetadata?.correlationId || promptId
        } as any);

        await logEvento({
            level: 'INFO', source: 'PROMPT_SERVICE', action: 'UPDATE_PROMPT',
            message: `Prompt ${prompt.key} actualizado a v${prompt.version + 1}`,
            correlationId: auditMetadata?.correlationId || promptId
        });
    }

    static async rollbackToVersion(promptId: string, targetVersion: number, changedBy: string): Promise<void> {
        const collection = await getTenantCollection('prompts');
        const versionsCollection = await getTenantCollection('prompt_versions');

        const versionSnapshot = await versionsCollection.findOne({ promptId: new ObjectId(promptId), version: targetVersion });
        if (!versionSnapshot) throw new AppError('NOT_FOUND', 404, `Versión ${targetVersion} no encontrada`);

        const prompt = await collection.findOne({ _id: new ObjectId(promptId) });
        if (!prompt) throw new AppError('NOT_FOUND', 404, 'Prompt no encontrado');

        await collection.updateOne(
            { _id: new ObjectId(promptId) },
            {
                $set: {
                    template: versionSnapshot.template,
                    variables: versionSnapshot.variables,
                    version: prompt.version + 1,
                    updatedBy: changedBy,
                    updatedAt: new Date()
                }
            }
        );
    }

    static async listPrompts(options: {
        tenantId?: string | null, activeOnly?: boolean, environment?: string, limit?: number, after?: string | null
    } = {}): Promise<Prompt[] & { nextCursor?: string | null }> {
        const { tenantId = null, activeOnly = false, environment = 'PRODUCTION', limit = 50, after = null } = options;
        const collection = await getTenantCollection('prompts');
        const filter: any = {};

        if (environment === 'PRODUCTION') filter.environment = { $in: ['PRODUCTION', null, undefined] };
        else filter.environment = environment;

        if (activeOnly) filter.$or = [{ active: true }, { active: { $exists: false } }];
        if (tenantId) filter.tenantId = tenantId;
        if (after) filter._id = { $gt: new ObjectId(after) };

        const results = await collection.find(filter, { sort: { _id: 1 }, limit: limit + 1 });
        const items: any = results.slice(0, limit).map(p => PromptSchema.safeParse(p).success ? PromptSchema.parse(p) : { ...p, _validationError: true });

        items.nextCursor = results.length > limit ? (results[limit - 1]._id.toString()) : null;
        return items;
    }

    static async getVersionHistory(promptId: string, tenantId?: string): Promise<PromptVersion[]> {
        const collection = await getTenantCollection('prompt_versions');
        const query: any = { promptId: new ObjectId(promptId) };
        if (tenantId) query.tenantId = tenantId;
        const versions = await collection.find(query, { sort: { version: -1 } });
        return versions.map(v => PromptVersionSchema.parse(v));
    }

    static async getGlobalHistory(tenantId?: string | null): Promise<any[]> {
        const versionsCollection = await getTenantCollection('prompt_versions');
        const promptsCollection = await getTenantCollection('prompts');

        const query: any = {};
        if (tenantId) query.tenantId = tenantId;

        const versions = await versionsCollection.find(query, { sort: { createdAt: -1 }, limit: 50 });
        const promptIds = Array.from(new Set(versions.map(v => v.promptId)));
        const prompts = await promptsCollection.find({ _id: { $in: promptIds } });
        const promptMap = new Map(prompts.map(p => [(p as any)._id.toString(), p]));

        return versions.map(v => ({
            ...v,
            promptName: (promptMap.get(v.promptId.toString()) as any)?.name || 'Prompt Eliminado',
            promptKey: (promptMap.get(v.promptId.toString()) as any)?.key || 'UNKNOWN'
        }));
    }

    static async syncFallbacks(tenantId: string = 'abd_global', session?: any): Promise<{ created: number, updated: number, errors: number }> {
        const { PROMPTS } = await import('@/lib/prompts');
        const collection = await getTenantCollection('prompts', session);
        let created = 0, updated = 0, errors = 0;

        for (const [key, master] of Object.entries(PROMPTS)) {
            try {
                const existing = await collection.findOne({ key, tenantId });
                if (!existing) {
                    await collection.insertOne(PromptSchema.parse({
                        tenantId, key, name: key.replace(/_/g, ' '),
                        template: master.template, version: master.version,
                        active: true, environment: 'PRODUCTION', industry: 'GENERIC',
                        category: 'GENERAL', model: DEFAULT_MODEL, variables: [],
                        createdAt: new Date(), updatedAt: new Date()
                    }));
                    created++;
                } else if (master.version > (existing.version || 0)) {
                    await collection.updateOne({ _id: existing._id }, { $set: { template: master.template, version: master.version, updatedAt: new Date() } });
                    updated++;
                }
            } catch (err) {
                console.error(`Error syncing "${key}":`, err);
                errors++;
            }
        }
        return { created, updated, errors };
    }
}
