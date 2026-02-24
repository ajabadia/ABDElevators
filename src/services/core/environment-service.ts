import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { PromptSchema, WorkflowDefinitionSchema, AppEnvironmentEnum } from '@/lib/schemas';
import { AppError, DatabaseError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

/**
 * EnvironmentService
 * Handles isolation and promotion of entities between STAGING, PRODUCTION and SANDBOX.
 */
export class EnvironmentService {
    /**
     * Promotes a Prompt from STAGING to PRODUCTION.
     * If the prompt already exists in PRODUCTION (by key), it updates its template and variables.
     * Otherwise, it creates a new PRODUCTION entity.
     */
    static async promotePromptToProduction(promptId: string, tenantId: string, correlationId: string, changedBy: string) {
        const collection = await getTenantCollection('prompts');

        const stagingPrompt = await collection.findOne({
            _id: new ObjectId(promptId),
            tenantId,
            environment: 'STAGING'
        });

        if (!stagingPrompt) {
            throw new AppError('NOT_FOUND', 404, 'Prompt de Staging no encontrado');
        }

        const productionPrompt = await collection.findOne({
            key: stagingPrompt.key,
            tenantId,
            environment: 'PRODUCTION'
        });

        const now = new Date();
        const dataToPromote = {
            ...stagingPrompt,
            _id: productionPrompt ? productionPrompt._id : new ObjectId(),
            environment: 'PRODUCTION',
            updatedAt: now,
            updatedBy: changedBy
        };

        // Remove unneeded fields before update/insert
        delete (dataToPromote as any)._id;

        if (productionPrompt) {
            await collection.updateOne(
                { _id: productionPrompt._id },
                { $set: { ...stagingPrompt, environment: 'PRODUCTION', updatedAt: now, updatedBy: changedBy, _id: productionPrompt._id } }
            );
        } else {
            const newProdPrompt = { ...stagingPrompt, _id: new ObjectId(), environment: 'PRODUCTION', createdAt: now, updatedAt: now, updatedBy: changedBy };
            await collection.insertOne(newProdPrompt);
        }

        await logEvento({
            level: 'INFO',
            source: 'ENVIRONMENT_SERVICE',
            action: 'PROMOTE_PROMPT',
            message: `Prompt '${stagingPrompt.key}' promovido a PRODUCTION`,
            correlationId,
            tenantId,
            details: { promptKey: stagingPrompt.key, stagingId: promptId }
        });
    }

    /**
     * Promotes a Workflow Definition from STAGING to PRODUCTION.
     */
    static async promoteWorkflowToProduction(workflowId: string, tenantId: string, correlationId: string, changedBy: string) {
        const collection = await getTenantCollection('workflow_definitions');

        const stagingWF = await collection.findOne({
            _id: new ObjectId(workflowId),
            tenantId,
            environment: 'STAGING'
        });

        if (!stagingWF) {
            throw new AppError('NOT_FOUND', 404, 'Workflow de Staging no encontrado');
        }

        const productionWF = await collection.findOne({
            name: stagingWF.name,
            entityType: stagingWF.entityType,
            tenantId,
            environment: 'PRODUCTION'
        });

        const now = new Date();

        if (productionWF) {
            await collection.updateOne(
                { _id: productionWF._id },
                { $set: { ...stagingWF, environment: 'PRODUCTION', updatedAt: now, _id: productionWF._id } }
            );
        } else {
            const newProdWF = { ...stagingWF, _id: new ObjectId(), environment: 'PRODUCTION', createdAt: now, updatedAt: now };
            await collection.insertOne(newProdWF);
        }

        await logEvento({
            level: 'INFO',
            source: 'ENVIRONMENT_SERVICE',
            action: 'PROMOTE_WORKFLOW',
            message: `Workflow '${stagingWF.name}' promovido a PRODUCTION`,
            correlationId,
            tenantId,
            details: { workflowName: stagingWF.name, stagingId: workflowId }
        });
    }

    /**
     * Promotes Knowledge Assets (document chunks) from STAGING to PRODUCTION.
     * This simply updates the 'environment' field for all chunks matching a sourceDoc or similar.
     */
    static async promoteChunksBySourceDoc(sourceDoc: string, tenantId: string, correlationId: string) {
        const collection = await getTenantCollection('document_chunks');

        const result = await collection.updateMany(
            { sourceDoc, tenantId, environment: 'STAGING' },
            { $set: { environment: 'PRODUCTION', updatedAt: new Date() } }
        );

        await logEvento({
            level: 'INFO',
            source: 'ENVIRONMENT_SERVICE',
            action: 'PROMOTE_CHUNKS',
            message: `Promovidos ${result.modifiedCount} chunks de '${sourceDoc}' a PRODUCTION`,
            correlationId,
            tenantId,
            details: { sourceDoc, count: result.modifiedCount }
        });

        return result.modifiedCount;
    }
}
