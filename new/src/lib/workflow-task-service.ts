import { getTenantCollection } from './db-tenant';
import { ObjectId } from 'mongodb';
import { WorkflowTask } from './schemas';
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

        return await (collection as any).find(query).sort({ priority: -1, createdAt: -1 }).toArray();
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
        correlationId: string;
    }) {
        const { id, tenantId, userId, userName, status, notes, correlationId } = params;
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
            action: 'TASK_STATUS_UPDATED',
            message: `Tarea ${id} marcada como ${status} por ${userName}`,
            correlationId,
            tenantId,
            details: { taskId: id, previousStatus: task.status, nextStatus: status }
        });

        return { success: true, taskId: id, status };
    }
    /**
     * Crea una nueva tarea de workflow.
     */
    static async createTask(data: any) {
        const collection = await getTenantCollection(this.COLLECTION);
        const task = {
            ...data,
            _id: new ObjectId(),
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await collection.insertOne(task);

        // Audit
        await logEvento({
            level: 'INFO',
            source: 'WORKFLOW_TASK_SERVICE',
            action: 'TASK_CREATED',
            message: `Tarea creada para caso ${data.caseId}`,
            correlationId: data.correlationId || 'system',
            tenantId: data.tenantId,
            details: { taskId: task._id }
        });

        return task;
    }
}
