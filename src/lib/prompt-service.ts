import { getTenantCollection } from './db-tenant';
import { PromptSchema, PromptVersionSchema, Prompt, PromptVersion } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';

/**
 * Servicio de Gestión de Prompts Dinámicos (Fase 7.6)
 */
export class PromptService {
    /**
     * Obtiene un prompt activo por su key
     */
    static async getPrompt(key: string, tenantId: string): Promise<Prompt> {
        const collection = await getTenantCollection('prompts');

        const prompt = await collection.findOne({ key, tenantId, active: true });

        if (!prompt) {
            console.error(`[DEBUG PROMPT] NOT FOUND: { key: "${key}", tenantId: "${tenantId}", active: true }`);
            throw new AppError('NOT_FOUND', 404, `Prompt con key "${key}" no encontrado para este tenant (${tenantId})`);
        }

        return PromptSchema.parse(prompt);
    }

    /**
     * Obtiene el prompt renderizado y el modelo sugerido
     */
    static async getRenderedPrompt(
        key: string,
        variables: Record<string, any>,
        tenantId: string
    ): Promise<{ text: string, model: string }> {
        const prompt = await this.getPrompt(key, tenantId);

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

        // Auditar uso (Fase Group A: Audit Prompt Usage)
        try {
            const collection = await getTenantCollection('prompts');
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

        const model = (prompt as any).model || 'gemini-1.5-flash';
        console.log(`[DEBUG PROMPT] Key: "${key}", Model: "${model}"`);

        return {
            text: rendered,
            model
        };
    }

    /**
     * Obtiene el prompt principal y el de sombra (si está activo). (Fase 36)
     */
    static async getPromptWithShadow(
        key: string,
        variables: Record<string, any>,
        tenantId: string
    ): Promise<{
        production: { text: string, model: string },
        shadow?: { text: string, model: string, key: string }
    }> {
        const promptObj = await this.getPrompt(key, tenantId);
        const production = await this.render(promptObj, variables, tenantId);

        if (promptObj.isShadowActive && promptObj.shadowPromptKey) {
            try {
                const shadowPromptObj = await this.getPrompt(promptObj.shadowPromptKey, tenantId);
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

        const allVariables = { ...variables, tenantId };
        let rendered = prompt.template;
        for (const [varName, varValue] of Object.entries(allVariables)) {
            const placeholder = `{{${varName}}}`;
            rendered = rendered.replace(new RegExp(`${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), String(varValue));
        }

        // Auditar uso asíncronamente
        getTenantCollection('prompts').then(col => {
            col.updateOne(
                { _id: (prompt as any)._id },
                {
                    $inc: { usageCount: 1 },
                    $set: { lastUsedAt: new Date() }
                }
            ).catch(err => console.error("Error auditing prompt usage:", err));
        });

        const model = (prompt as any).model || 'gemini-1.5-flash';
        return { text: rendered, model };
    }

    /**
     * Renderiza un prompt reemplazando variables (Legacy compatibility)
     */
    static async renderPrompt(
        key: string,
        variables: Record<string, any>,
        tenantId: string
    ): Promise<string> {
        const result = await this.getRenderedPrompt(key, variables, tenantId);
        return result.text;
    }

    /**
     * Actualiza un prompt (crea nueva versión) con trazabilidad extendida
     */
    static async updatePrompt(
        promptId: string,
        newTemplate: string,
        variables: any[],
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

        // Validar Max Longitud (Hard Limit)
        if (prompt.maxLength && newTemplate.length > prompt.maxLength) {
            throw new AppError('VALIDATION_ERROR', 400, `La longitud del template (${newTemplate.length}) excede el máximo permitido (${prompt.maxLength})`);
        }

        // Crear snapshot de la versión anterior
        const versionSnapshot: PromptVersion = {
            promptId: new ObjectId(promptId),
            tenantId: prompt.tenantId, // Usar el tenantId del propio prompt
            version: prompt.version,
            template: prompt.template,
            variables: prompt.variables,
            changedBy,
            changeReason,
            correlationId: auditMetadata?.correlationId,
            ip: auditMetadata?.ip,
            userAgent: auditMetadata?.userAgent,
            createdAt: new Date()
        };

        const validatedVersion = PromptVersionSchema.parse(versionSnapshot);
        await versionsCollection.insertOne(validatedVersion);

        // Actualizar prompt con nueva versión
        await collection.updateOne(
            { _id: new ObjectId(promptId), tenantId },
            {
                $set: {
                    template: newTemplate,
                    variables,
                    version: prompt.version + 1,
                    updatedBy: changedBy,
                    updatedAt: new Date()
                }
            }
        );

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

        const versionQuery: any = {
            promptId: new ObjectId(promptId),
            version: targetVersion
        };
        if (tenantId) versionQuery.tenantId = tenantId;

        const versionSnapshot = await versionsCollection.findOne(versionQuery);

        if (!versionSnapshot) {
            throw new AppError('NOT_FOUND', 404, `Versión ${targetVersion} no encontrada`);
        }

        const promptQuery: any = { _id: new ObjectId(promptId) };
        if (tenantId) promptQuery.tenantId = tenantId;

        const prompt = await collection.findOne(promptQuery);
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
            createdAt: new Date()
        };

        await versionsCollection.insertOne(PromptVersionSchema.parse(currentSnapshot));

        // Restaurar versión antigua
        await collection.updateOne(
            { _id: new ObjectId(promptId), tenantId },
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

        await logEvento({
            level: 'WARN',
            source: 'PROMPT_SERVICE',
            action: 'ROLLBACK_PROMPT',
            message: `Prompt ${prompt.key} revertido a versión ${targetVersion}`,
            correlationId: promptId,
            details: { promptKey: prompt.key, targetVersion, changedBy }
        });
    }

    /**
     * Lista todos los prompts (por tenant o global para SuperAdmins)
     */
    static async listPrompts(tenantId?: string | null, activeOnly: boolean = true): Promise<Prompt[]> {
        const collection = await getTenantCollection('prompts');
        let filter: any = {};
        if (activeOnly) {
            filter.$or = [{ active: true }, { active: { $exists: false } }];
        }
        if (tenantId) filter.tenantId = tenantId;

        const prompts = await collection.find(filter, { sort: { tenantId: 1, category: 1, name: 1 } });

        return prompts.map(p => {
            const result = PromptSchema.safeParse(p);
            if (!result.success) {
                console.error(`[PROMPT VALIDATION ERROR] ID: ${p._id}, Key: ${p.key}:`, result.error.format());
                return { ...p, _validationError: true } as any;
            }
            return result.data;
        });
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
