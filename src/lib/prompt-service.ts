import { getTenantCollection } from './db-tenant';
import { PromptSchema, PromptVersionSchema, Prompt, PromptVersion } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';

/**
 * Servicio de Gestión de Prompts Dinámicos (Fase 7.6)
 * Evolucionado para soporte Multi-Vertical (Phase 101.1)
 */
export class PromptService {
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
        const collection = await getTenantCollection('prompts', session);

        // 1. Intentar específico por industria
        let prompt = await collection.findOne({
            key,
            tenantId,
            industry,
            active: true,
            environment
        });

        // 2. Fallback a GENERIC si no es el pedido y no se encontró
        if (!prompt && industry !== 'GENERIC') {
            prompt = await collection.findOne({
                key,
                tenantId,
                industry: 'GENERIC',
                active: true,
                environment
            });
        }

        if (!prompt) {
            console.error(`[DEBUG PROMPT] NOT FOUND: { key: "${key}", tenantId: "${tenantId}", industry: "${industry}", active: true }`);
            throw new AppError('NOT_FOUND', 404, `Prompt con key "${key}" no encontrado para este tenant (${tenantId}) e industria (${industry})`);
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
        session?: any
    ): Promise<{ text: string, model: string }> {
        const prompt = await this.getPrompt(key, tenantId, environment, industry, session);

        // Validar que todas las variables requeridas estén presentes
        const missingVars = prompt.variables
            .filter(v => v.required && !(v.name in variables))
            .map(v => v.name);

        if (missingVars.length > 0) {
            throw new AppError(
                'MISSING_VARIABLES',
                400,
                `Variables requeridas faltantes: ${missingVars.join(', ')}`
            );
        }

        // Reemplazar variables en el template (Injectamos tenantId por defecto si existe)
        const allVariables = { ...variables, tenantId };
        let rendered = prompt.template;
        for (const [varName, varValue] of Object.entries(allVariables)) {
            const placeholder = `{{${varName}}}`;
            rendered = rendered.replace(new RegExp(`${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), String(varValue));
        }

        // Auditar uso
        try {
            const collection = await getTenantCollection('prompts', session);
            await collection.updateOne(
                { _id: (prompt as any)._id },
                {
                    $inc: { usageCount: 1 },
                    $set: { lastUsedAt: new Date() }
                }
            );
        } catch (err: any) {
            console.error("Error auditing prompt usage:", err);
        }

        const model = (prompt as any).model || 'gemini-2.5-flash';
        return { text: rendered, model };
    }

    /**
     * Obtiene el prompt principal y el de sombra (si está activo).
     */
    static async getPromptWithShadow(
        key: string,
        variables: Record<string, any>,
        tenantId: string,
        industry: string = 'GENERIC',
        session?: any
    ): Promise<{
        production: { text: string, model: string },
        shadow?: { text: string, model: string, key: string }
    }> {
        const promptObj = await this.getPrompt(key, tenantId, 'PRODUCTION', industry, session);
        const production = await this.render(promptObj, variables, tenantId);

        if (promptObj.isShadowActive && promptObj.shadowPromptKey) {
            try {
                const shadowPromptObj = await this.getPrompt(promptObj.shadowPromptKey, tenantId, 'PRODUCTION', industry, session);
                const shadowRendered = await this.render(shadowPromptObj, variables, tenantId);

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

    /**
     * Helper interno para renderizar un prompt cargado
     */
    private static async render(
        prompt: Prompt,
        variables: Record<string, any>,
        tenantId: string
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
            const placeholder = `{{${varName}}}`;
            rendered = rendered.replace(new RegExp(`${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), String(varValue));
        }

        return { text: rendered, model: (prompt as any).model || 'gemini-1.5-flash' };
    }

    /**
     * Actualiza un prompt (crea nueva versión) con trazabilidad extendida
     */
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
        if (!prompt) {
            throw new AppError('NOT_FOUND', 404, 'Prompt no encontrado');
        }

        if (prompt.maxLength && updates.template.length > prompt.maxLength) {
            throw new AppError('VALIDATION_ERROR', 400, `La longitud del template (${updates.template.length}) excede el máximo permitido (${prompt.maxLength})`);
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

        const validatedVersion = PromptVersionSchema.parse(versionSnapshot);
        await versionsCollection.insertOne(validatedVersion);

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

        // Auditoría Unificada (Phase 132.3)
        const { AuditTrailService } = await import('./services/audit-trail-service');
        await AuditTrailService.logConfigChange({
            actorType: 'USER',
            actorId: changedBy,
            tenantId: prompt.tenantId,
            action: 'UPDATE_PROMPT',
            entityType: 'PROMPT',
            entityId: promptId,
            changes: {
                before: { version: prompt.version, template: prompt.template },
                after: { version: prompt.version + 1, template: updates.template }
            },
            reason: changeReason,
            correlationId: auditMetadata?.correlationId || promptId
        } as any);

        await logEvento({
            level: 'INFO',
            source: 'PROMPT_SERVICE',
            action: 'UPDATE_PROMPT',
            message: `Prompt ${prompt.key} actualizado a versión ${prompt.version + 1}`,
            correlationId: auditMetadata?.correlationId || promptId,
            details: { promptKey: prompt.key, newVersion: prompt.version + 1, changedBy, changeReason }
        });
    }

    /**
     * Rollback a una versión anterior
     */
    static async rollbackToVersion(
        promptId: string,
        targetVersion: number,
        changedBy: string,
        tenantId?: string
    ): Promise<void> {
        const collection = await getTenantCollection('prompts');
        const versionsCollection = await getTenantCollection('prompt_versions');

        const versionSnapshot = await versionsCollection.findOne({
            promptId: new ObjectId(promptId),
            version: targetVersion
        });

        if (!versionSnapshot) {
            throw new AppError('NOT_FOUND', 404, `Versión ${targetVersion} no encontrada`);
        }

        const prompt = await collection.findOne({ _id: new ObjectId(promptId) });
        if (!prompt) {
            throw new AppError('NOT_FOUND', 404, 'Prompt no encontrado');
        }

        const currentSnapshot: PromptVersion = {
            promptId: new ObjectId(promptId),
            tenantId: prompt.tenantId,
            version: prompt.version,
            template: prompt.template,
            variables: prompt.variables,
            changedBy,
            changeReason: `Rollback a versión ${targetVersion}`,
            environment: prompt.environment || 'PRODUCTION',
            industry: prompt.industry || 'GENERIC',
            createdAt: new Date()
        };

        await versionsCollection.insertOne(PromptVersionSchema.parse(currentSnapshot));

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

    /**
     * Lista todos los prompts (por tenant o global para SuperAdmins)
     */
    static async listPrompts(options: {
        tenantId?: string | null,
        activeOnly?: boolean,
        environment?: string,
        limit?: number,
        after?: string | null
    } = {}): Promise<Prompt[] & { nextCursor?: string | null }> {
        const { tenantId = null, activeOnly = false, environment = 'PRODUCTION', limit = 50, after = null } = options;
        const collection = await getTenantCollection('prompts');
        const filter: any = {};

        if (environment === 'PRODUCTION') {
            filter.environment = { $in: ['PRODUCTION', null, undefined] };
        } else {
            filter.environment = environment;
        }

        if (activeOnly) {
            filter.$or = [{ active: true }, { active: { $exists: false } }];
        }
        if (tenantId) filter.tenantId = tenantId;
        if (after) {
            filter._id = { $gt: new ObjectId(after) };
        }

        const results = await collection.find(filter, {
            sort: { _id: 1 },
            limit: limit + 1
        });

        const items: any = results.slice(0, limit).map(p => {
            const result = PromptSchema.safeParse(p);
            if (!result.success) {
                return { ...p, _validationError: true } as any;
            }
            return result.data;
        });

        const hasNextPage = results.length > limit;
        items.nextCursor = hasNextPage ? (results[limit - 1]._id.toString()) : null;

        return items;
    }

    /**
     * Obtiene el historial de versiones de un prompt
     */
    static async getVersionHistory(promptId: string, tenantId?: string): Promise<PromptVersion[]> {
        const collection = await getTenantCollection('prompt_versions');
        const query: any = { promptId: new ObjectId(promptId) };
        if (tenantId) query.tenantId = tenantId;

        const versions = await collection.find(query, { sort: { version: -1 } });
        return versions.map(v => PromptVersionSchema.parse(v));
    }

    /**
     * Obtiene el historial global (últimos cambios en todos los prompts)
     */
    static async getGlobalHistory(tenantId?: string | null): Promise<any[]> {
        const versionsCollection = await getTenantCollection('prompt_versions');
        const promptsCollection = await getTenantCollection('prompts');

        const query: any = {};
        if (tenantId) query.tenantId = tenantId;

        const versions = await versionsCollection.find(query, {
            sort: { createdAt: -1 },
            limit: 50
        });

        const promptIds = Array.from(new Set(versions.map(v => v.promptId)));
        const prompts = await promptsCollection.find({ _id: { $in: promptIds } });
        const promptMap = new Map(prompts.map(p => [(p as any)._id.toString(), p]));

        return versions.map(v => ({
            ...v,
            promptName: (promptMap.get(v.promptId.toString()) as any)?.name || 'Prompt Eliminado',
            promptKey: (promptMap.get(v.promptId.toString()) as any)?.key || 'UNKNOWN'
        }));
    }
}
