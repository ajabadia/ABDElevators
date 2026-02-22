import { getTenantCollection } from './db-tenant';
import { ObjectId } from 'mongodb';
import type { WorkflowTask } from './schemas';
import { AppError } from './errors';
import { logEvento } from './logger';
import { UserRole } from '../types/roles';

/**
 * ⚙️ Servicio de Gestión de Tareas de Workflow (Fase 97)
 * Proporciona lógica para listar, asignar y completar tareas delegadas.
 */
export class WorkflowTaskService {
    private static COLLECTION = 'workflow_tasks';

    /**
     * Lista tareas de un tenant con filtros opcionales.
     */
    static async listTasks(tenantId: string, filters: {
        status?: WorkflowTask['status'];
        assignedRole?: UserRole;
        assignedUserId?: string;
        caseId?: string;
    } = {}) {
        const collection = await getTenantCollection(this.COLLECTION);

        const query: any = { tenantId };
        if (filters.status) query.status = filters.status;
        if (filters.assignedRole) query.assignedRole = filters.assignedRole;
        if (filters.assignedUserId) query.assignedUserId = filters.assignedUserId;
        if (filters.caseId) query.caseId = filters.caseId;

        return await collection.find(query, {
            sort: { priority: -1, createdAt: -1 }
        });
    }

    /**
     * Lista tareas creadas por un usuario específico.
     */
    static async listByCreator(tenantId: string, userId: string) {
        const collection = await getTenantCollection(this.COLLECTION);
        return await collection.find({
            tenantId,
            'metadata.createdBy': userId
        }, {
            sort: { createdAt: -1 }
        });
    }

    /**
     * Obtiene una tarea por ID verificando el tenant.
     */
    static async getTaskById(id: string, tenantId: string) {
        const collection = await getTenantCollection(this.COLLECTION);
        const task = await collection.findOne({ _id: new ObjectId(id), tenantId });

        if (!task) {
            throw new AppError('NOT_FOUND', 404, 'Tarea no encontrada');
        }

        return task;
    }

    /**
     * Actualiza el estado de una tarea y registra la auditoría.
     */
    static async updateStatus(params: {
        id: string;
        tenantId: string;
        userId: string;
        userName: string;
        status: WorkflowTask['status'];
        notes?: string;
        metadata?: Record<string, any>;
        correlationId: string;
    }) {
        const { id, tenantId, userId, userName, status, notes, metadata, correlationId } = params;
        const collection = await getTenantCollection(this.COLLECTION);

        const task = await this.getTaskById(id, tenantId);

        const updateData: any = {
            status,
            updatedAt: new Date(),
        };

        if (status === 'COMPLETED') {
            updateData.completedAt = new Date();
            updateData.completedBy = userId;
        }

        if (notes) {
            updateData['metadata.resolution_notes'] = notes;
        }

        // ⚡ FASE 128.3: Generic metadata update (e.g. workshop checklist)
        if (metadata) {
            for (const [key, value] of Object.entries(metadata)) {
                updateData[`metadata.${key}`] = value;
            }
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id), tenantId },
            { $set: updateData }
        );

        if (result.modifiedCount === 0) {
            throw new AppError('DATABASE_ERROR', 500, 'Error al actualizar la tarea');
        }

        // Trazabilidad Industrial
        await logEvento({
            level: 'INFO',
            source: 'WORKFLOW_TASK_SERVICE',
            action: 'TASK_STATUS_UPDATE',
            message: `Tarea ${id} actualizada a ${status}`,
            tenantId,
            details: { id, status, resolution_notes: notes },
            correlationId,
        });

        // ⚡ FASE 127: Return complete task for HITL integration
        const updatedTask = await this.getTaskById(id, tenantId);
        return { success: true, taskId: id, status, task: updatedTask };
    }

    /**
     * Crea una nueva tarea de workflow (System or HITL)
     */
    static async createTask(params: {
        tenantId: string;
        caseId: string;
        type: 'DOCUMENT_REVIEW' | 'SECURITY_SIGNATURE' | 'TECHNICAL_VALIDATION' | 'COMPLIANCE_CHECK' | 'WORKFLOW_DECISION';
        title: string;
        description: string;
        assignedRole: UserRole;
        priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        metadata?: Record<string, any>;
        correlationId?: string;
    }) {
        const collection = await getTenantCollection('workflow_tasks');
        const taskId = new ObjectId();

        const task = {
            _id: taskId,
            tenantId: params.tenantId,
            caseId: params.caseId,
            type: params.type,
            title: params.title,
            description: params.description,
            assignedRole: params.assignedRole,
            priority: params.priority,
            status: 'PENDING',
            metadata: {
                ...params.metadata,
                createdBy: params.metadata?.createdBy // Assumes caller passes it if available, or we inject it
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await collection.insertOne(task);

        await logEvento({
            level: 'INFO',
            source: 'WORKFLOW_TASK_SERVICE',
            action: 'TASK_CREATED',
            message: `Tarea ${params.title} creada para caso ${params.caseId}`,
            tenantId: params.tenantId,
            details: { taskId: taskId.toString(), ...params },
            correlationId: params.correlationId || 'no-id'
        });

        return { success: true, taskId: taskId.toString(), task };
    }
}
