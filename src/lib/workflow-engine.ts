import { getTenantCollection } from './db-tenant';
import { AppError, ValidationError, NotFoundError } from './errors';
import { WorkflowConfigSchema, GenericCaseSchema, IndustryType } from './schemas';
import { ObjectId } from 'mongodb';
import { logEvento } from './logger';

export interface TransitionRequest {
    caseId: string;
    action: string;
    role: string;
    industry: IndustryType;
    caseType: string;
    correlacion_id: string;
    comment?: string;
    signature?: string;
}

/**
 * Motor de Workflows (Visión 2.0 - Fase 7.2)
 * Orquestador de transiciones de estado genéricas.
 */
export class WorkflowEngine {
    /**
     * Obtiene la configuración de workflow activa para un contexto.
     */
    static async getConfig(tenantId: string, industry: IndustryType, caseType: string) {
        const { collection } = await getTenantCollection('workflow_configs');
        const config = await collection.findOne({
            tenantId,
            industry,
            caseType,
            active: true
        });

        return config;
    }

    /**
     * Ejecuta una transición de estado en un caso.
     */
    static async executeTransition(request: TransitionRequest) {
        const { caseId, action, role, industry, caseType, correlacion_id, comment, signature } = request;

        const { collection: casesCollection, tenantId } = await getTenantCollection('casos');
        const config = await this.getConfig(tenantId, industry, caseType);

        if (!config) {
            throw new AppError('NOT_FOUND', 404, `No se encontró configuración de workflow para ${industry}/${caseType}`);
        }

        const caso = await casesCollection.findOne({
            _id: new ObjectId(caseId),
            tenantId
        });

        if (!caso) {
            throw new NotFoundError('Caso no encontrado');
        }

        // 1. Identificar la transición solicitada
        const transition = config.transitions.find((t: any) => t.action === action && t.from === caso.status);

        if (!transition) {
            throw new ValidationError(`Acción '${action}' no permitida en el estado actual '${caso.status}'`);
        }

        // 2. Verificar permisos por rol
        if (!transition.roles.includes(role)) {
            throw new AppError('UNAUTHORIZED', 403, `Tu rol (${role}) no tiene permisos para ejecutar esta acción`);
        }

        // 3. Verificar requisitos adicionales (firma/comentario)
        if (transition.require_comment && !comment) {
            throw new ValidationError(`La acción '${action}' requiere un comentario justificativo`);
        }

        if (transition.require_signature && !signature) {
            throw new ValidationError(`La acción '${action}' requiere firma digital`);
        }

        // 4. Ejecutar actualización
        const updateData: any = {
            status: transition.to,
            actualizado: new Date(),
        };

        if (comment || signature) {
            updateData.last_transition = {
                action,
                from: transition.from,
                to: transition.to,
                role,
                comment,
                signature,
                timestamp: new Date()
            };
        }

        await casesCollection.updateOne(
            { _id: new ObjectId(caseId) },
            { $set: updateData }
        );

        await logEvento({
            nivel: 'INFO',
            origen: 'WORKFLOW_ENGINE',
            accion: 'STATE_TRANSITION',
            mensaje: `Caso ${caseId} movido de ${transition.from} a ${transition.to} via ${action}`,
            correlacion_id,
            detalles: { caseId, from: transition.from, to: transition.to, role }
        });

        return { success: true, from: transition.from, to: transition.to };
    }
}
