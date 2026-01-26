import { getTenantCollection } from './db-tenant';
import { PromptSchema, PromptVersionSchema, Prompt, PromptVersion } from './schemas';
import { AppError, DatabaseError } from './errors';
import { logEvento } from './logger';
import { ObjectId } from 'mongodb';

/**
 * Servicio de Gestión de Prompts Dinámicos (Fase 7.6)
 */
export class PromptService {
    /**
     * Obtiene un prompt activo por su key
     */
    static async getPrompt(key: string, tenantId: string): Promise<Prompt> {
        const { collection } = await getTenantCollection('prompts');
        const prompt = await collection.findOne({ key, tenantId, active: true });

        if (!prompt) {
            throw new AppError('NOT_FOUND', 404, `Prompt con key "${key}" no encontrado para este tenant`);
        }

        return PromptSchema.parse(prompt);
    }

    /**
     * Renderiza un prompt reemplazando variables
     */
    static async renderPrompt(
        key: string,
        variables: Record<string, any>,
        tenantId: string
    ): Promise<string> {
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
            const { collection } = await getTenantCollection('prompts');
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

        return rendered;
    }

    /**
     * Actualiza un prompt (crea nueva versión)
     */
    static async updatePrompt(
        promptId: string,
        newTemplate: string,
        variables: any[],
        changedBy: string,
        changeReason: string,
        tenantId?: string
    ): Promise<void> {
        const { collection } = await getTenantCollection('prompts');
        const { collection: versionsCollection } = await getTenantCollection('prompt_versions');

        const query: any = { _id: new ObjectId(promptId) };
        if (tenantId) query.tenantId = tenantId;

        const prompt = await collection.findOne(query);
        if (!prompt) {
            throw new AppError('NOT_FOUND', 404, 'Prompt no encontrado');
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
            nivel: 'INFO',
            origen: 'PROMPT_SERVICE',
            accion: 'UPDATE_PROMPT',
            mensaje: `Prompt ${prompt.key} actualizado a versión ${prompt.version + 1}`,
            correlacion_id: promptId,
            detalles: { promptKey: prompt.key, newVersion: prompt.version + 1, changedBy, changeReason }
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
        const { collection } = await getTenantCollection('prompts');
        const { collection: versionsCollection } = await getTenantCollection('prompt_versions');

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
            nivel: 'WARN',
            origen: 'PROMPT_SERVICE',
            accion: 'ROLLBACK_PROMPT',
            mensaje: `Prompt ${prompt.key} revertido a versión ${targetVersion}`,
            correlacion_id: promptId,
            detalles: { promptKey: prompt.key, targetVersion, changedBy }
        });
    }

    /**
     * Lista todos los prompts (por tenant o global para SuperAdmins)
     */
    static async listPrompts(tenantId?: string | null, activeOnly: boolean = true): Promise<Prompt[]> {
        const { collection } = await getTenantCollection('prompts');
        let filter: any = activeOnly ? { active: true } : {};
        if (tenantId) filter.tenantId = tenantId;

        const prompts = await collection.find(filter).sort({ tenantId: 1, category: 1, name: 1 }).toArray();
        return prompts.map(p => PromptSchema.parse(p));
    }

    /**
     * Obtiene el historial de versiones de un prompt
     */
    static async getVersionHistory(promptId: string, tenantId?: string): Promise<PromptVersion[]> {
        const { collection } = await getTenantCollection('prompt_versions');
        const query: any = { promptId: new ObjectId(promptId) };
        if (tenantId) query.tenantId = tenantId;

        const versions = await collection
            .find(query)
            .sort({ version: -1 })
            .toArray();

        return versions.map(v => PromptVersionSchema.parse(v));
    }

    /**
     * Obtiene el historial global (últimos cambios en todos los prompts)
     */
    static async getGlobalHistory(tenantId?: string | null): Promise<any[]> {
        const { collection: versionsCollection } = await getTenantCollection('prompt_versions');
        const { collection: promptsCollection } = await getTenantCollection('prompts');

        const query: any = {};
        if (tenantId) query.tenantId = tenantId;

        const versions = await versionsCollection
            .find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        // Enriquecer con el nombre del prompt actual para contexto
        const promptIds = Array.from(new Set(versions.map(v => v.promptId)));
        const prompts = await promptsCollection.find({ _id: { $in: promptIds } }).toArray();
        const promptMap = new Map(prompts.map(p => [p._id.toString(), p]));

        return versions.map(v => ({
            ...v,
            promptName: promptMap.get(v.promptId.toString())?.name || 'Prompt Eliminado',
            promptKey: promptMap.get(v.promptId.toString())?.key || 'UNKNOWN'
        }));
    }
}
