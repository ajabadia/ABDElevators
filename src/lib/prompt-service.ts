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

        // Reemplazar variables en el template
        let rendered = prompt.template;
        for (const [varName, varValue] of Object.entries(variables)) {
            const placeholder = `{{${varName}}}`;
            rendered = rendered.replace(new RegExp(placeholder, 'g'), String(varValue));
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
        tenantId: string
    ): Promise<void> {
        const { collection } = await getTenantCollection('prompts');
        const { collection: versionsCollection } = await getTenantCollection('prompt_versions');

        const prompt = await collection.findOne({ _id: new ObjectId(promptId), tenantId });
        if (!prompt) {
            throw new AppError('NOT_FOUND', 404, 'Prompt no encontrado');
        }

        // Crear snapshot de la versión anterior
        const versionSnapshot: PromptVersion = {
            promptId: new ObjectId(promptId),
            tenantId,
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
        tenantId: string
    ): Promise<void> {
        const { collection } = await getTenantCollection('prompts');
        const { collection: versionsCollection } = await getTenantCollection('prompt_versions');

        const versionSnapshot = await versionsCollection.findOne({
            promptId: new ObjectId(promptId),
            tenantId,
            version: targetVersion
        });

        if (!versionSnapshot) {
            throw new AppError('NOT_FOUND', 404, `Versión ${targetVersion} no encontrada`);
        }

        const prompt = await collection.findOne({ _id: new ObjectId(promptId), tenantId });
        if (!prompt) {
            throw new AppError('NOT_FOUND', 404, 'Prompt no encontrado');
        }

        // Crear snapshot de la versión actual antes del rollback
        const currentSnapshot: PromptVersion = {
            promptId: new ObjectId(promptId),
            tenantId,
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
     * Lista todos los prompts del tenant
     */
    static async listPrompts(tenantId: string, activeOnly: boolean = true): Promise<Prompt[]> {
        const { collection } = await getTenantCollection('prompts');
        const filter = activeOnly ? { tenantId, active: true } : { tenantId };

        const prompts = await collection.find(filter).sort({ category: 1, name: 1 }).toArray();
        return prompts.map(p => PromptSchema.parse(p));
    }

    /**
     * Obtiene el historial de versiones de un prompt
     */
    static async getVersionHistory(promptId: string, tenantId: string): Promise<PromptVersion[]> {
        const { collection } = await getTenantCollection('prompt_versions');
        const versions = await collection
            .find({ promptId: new ObjectId(promptId), tenantId })
            .sort({ version: -1 })
            .toArray();

        return versions.map(v => PromptVersionSchema.parse(v));
    }
}
