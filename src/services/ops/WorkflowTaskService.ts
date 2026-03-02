import { workflowTaskRepository } from '@/lib/repositories/WorkflowTaskRepository';
import { type WorkflowTask, WorkflowTaskSchema } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UserRole } from '@/types/roles';
import { type ClientSession, type Filter } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';

/**
 * ⚙️ Servicio de Gestión de Tareas de Workflow (Era 8 Hardened)
 * Proporciona lógica para listar, asignar y completar tareas delegadas.
 */
export class WorkflowTaskService {
    /**
     * Lista tareas de un tenant con filtros opcionales.
     */
    static async listTasks(tenantId: string, filters: {
        status?: WorkflowTask['status'];
        assignedRole?: UserRole;
        assignedUserId?: string;
        caseId?: string;
    } = {}, session?: TenantSession | null) {
        const query: Filter<WorkflowTask> = { tenantId };
        if (filters.status) query.status = filters.status;
        if (filters.assignedRole) query.assignedRole = filters.assignedRole;
        if (filters.assignedUserId) query.assignedUserId = filters.assignedUserId;
        if (filters.caseId) query.caseId = filters.caseId;

        return await workflowTaskRepository.listTasks(query, session);
    }

    /**
     * Obtiene estadísticas de tareas para el dashboard (Fase 219)
     */
    static async getTaskStats(tenantId: string, session?: TenantSession | null) {
        const tasks = await workflowTaskRepository.list({ tenantId }, {}, session);

        const pending = tasks.filter((t: WorkflowTask) => t.status === 'PENDING').length;
        const inReview = tasks.filter((t: WorkflowTask) => t.status === 'IN_PROGRESS' || (t.status as string) === 'UNDER_REVIEW').length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedToday = tasks.filter((t: WorkflowTask) =>
            t.status === 'COMPLETED' &&
            t.completedAt &&
            new Date(t.completedAt) >= today
        ).length;

        // Cálculo de tiempo promedio (placeholder simplificado para FASE 219)
        const completedTasks = tasks.filter((t: WorkflowTask) => t.status === 'COMPLETED' && t.completedAt && t.createdAt);
        const totalDuration = completedTasks.reduce((acc: number, t: WorkflowTask) => {
            return acc + (new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime());
        }, 0);

        const avgMinutes = completedTasks.length > 0
            ? Math.round(totalDuration / (1000 * 60 * completedTasks.length))
            : 0;

        return {
            pending,
            inReview,
            completedToday,
            avgTime: `${avgMinutes}m`
        };
    }

    /**
     * Lista tareas creadas por un usuario específico.
     */
    static async listByCreator(tenantId: string, userId: string, session?: TenantSession | null) {
        return await workflowTaskRepository.list({
            tenantId,
            'metadata.createdBy': userId
        } as any, { sort: { createdAt: -1 } }, session);
    }

    /**
     * Obtiene una tarea por ID verificando el tenant.
     */
    static async getTaskById(id: string, tenantId: string, session?: TenantSession | null) {
        const task = await workflowTaskRepository.findOne({ _id: workflowTaskRepository.toObjectId(id), tenantId } as any, session);

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
    }, session?: TenantSession | null, mongoSession?: ClientSession) {
        const { id, tenantId, userId, status, notes, metadata, correlationId } = params;

        // Validate state transition if needed (hardened check)
        // await this.getTaskById(id, tenantId, session);

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

        if (metadata) {
            for (const [key, value] of Object.entries(metadata)) {
                updateData[`metadata.${key}`] = value;
            }
        }

        const success = await workflowTaskRepository.update(id, { $set: updateData }, session, mongoSession);

        if (!success) {
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
        const updatedTask = await this.getTaskById(id, tenantId, session);
        return { success: true, taskId: id, status, task: updatedTask };
    }

    /**
     * Crea una nueva tarea de workflow (System or HITL)
     */
    static async createTask(params: {
        tenantId: string;
        caseId: string;
        type: WorkflowTask['type'];
        title: string;
        description: string;
        assignedRole: UserRole;
        priority: WorkflowTask['priority'];
        metadata?: Record<string, any>;
        correlationId?: string;
    }, session?: TenantSession | null, mongoSession?: ClientSession) {
        const taskData: Omit<WorkflowTask, '_id'> = {
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
                createdBy: params.metadata?.createdBy
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const taskId = await workflowTaskRepository.create(taskData, session, mongoSession);

        await logEvento({
            level: 'INFO',
            source: 'WORKFLOW_TASK_SERVICE',
            action: 'TASK_CREATED',
            message: `Tarea ${params.title} creada para caso ${params.caseId}`,
            tenantId: params.tenantId,
            details: { taskId, ...params },
            correlationId: params.correlationId || 'no-id'
        });

        return { success: true, taskId, task: { ...taskData, _id: taskId } };
    }
}
