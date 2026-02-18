import { getTenantCollection } from './db-tenant';
import { ObjectId } from 'mongodb';
import { AppError } from './errors';

export interface TimelineEvent {
    id: string;
    timestamp: Date;
    type: 'INGEST' | 'ANALYSIS' | 'WORKFLOW' | 'VALIDATION' | 'SYSTEM' | 'USER_ACTION';
    title: string;
    message: string;
    user?: string;
    details?: any;
}

/**
 * 🕵️ ENTITY TIMELINE SERVICE (Audit 2304)
 * Provides a unified "Forensic Timeline" for any entity (Pedido, Contrato, etc).
 * Aggregates data from multiple sources: cases, application_logs, and audit_trails.
 */
export class EntityTimelineService {
    /**
     * Gets the full life-cycle history for a specific entity.
     */
    static async getTimeline(tenantId: string, entityId: string): Promise<TimelineEvent[]> {
        const events: TimelineEvent[] = [];

        // 1. Get original entity for base creation info and state history
        const entitiesCollection = await getTenantCollection('entities');
        const entity = await entitiesCollection.findOne({ _id: new ObjectId(entityId), tenantId });

        if (!entity) throw new AppError('NOT_FOUND', 404, 'Entidad no encontrada');

        // Initial creation event
        events.push({
            id: `init-${entityId}`,
            timestamp: entity.createdAt || new Date(),
            type: 'INGEST',
            title: 'Entidad Creada/Recibida',
            message: `Entidad ${entity.identifier || entityId} registrada en el sistema.`,
            details: { status: entity.status }
        });

        // Workflow transitions history
        if (entity.transitions_history && Array.isArray(entity.transitions_history)) {
            entity.transitions_history.forEach((log: any, index: number) => {
                events.push({
                    id: `transition-${index}`,
                    timestamp: log.timestamp,
                    type: 'WORKFLOW',
                    title: 'Transición de Estado',
                    message: `Cambio de ${log.from} a ${log.to}`,
                    user: log.role,
                    details: { comment: log.comment }
                });
            });
        }

        // 2. Fetch specific logs for this entity
        // We use application_logs for system-level actions (LLM extraction, etc)
        const logsCollection = await getTenantCollection('application_logs', null, 'LOGS');
        const entityLogs = await logsCollection.find({
            'details.caseId': entityId,
            tenantId
        }, { sort: { timestamp: 1 } });

        entityLogs.forEach((log: any) => {
            events.push({
                id: log._id.toString(),
                timestamp: log.timestamp,
                type: this.mapLogToType(log),
                title: log.action,
                message: log.message,
                details: log.details
            });
        });

        // 3. Fetch audit trails for manual updates or config changes impacting this entity
        const auditCollection = await getTenantCollection('audit_trails', null, 'LOGS');
        const entityAudits = await auditCollection.find({
            entityId: entityId,
            tenantId
        }, { sort: { timestamp: 1 } });

        entityAudits.forEach((audit: any) => {
            events.push({
                id: audit._id.toString(),
                timestamp: audit.timestamp,
                type: 'USER_ACTION',
                title: 'Modificación Manual',
                message: `El usuario realizó cambios en la entidad: ${audit.action}`,
                user: audit.userId,
                details: audit.changes
            });
        });

        // Sort everything by timestamp
        return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    private static mapLogToType(log: any): TimelineEvent['type'] {
        if (log.source === 'LLM' || log.source === 'EXTRACTION_SERVICE') return 'ANALYSIS';
        if (log.source === 'WORKFLOW_ENGINE') return 'WORKFLOW';
        if (log.source === 'VALIDATION_SERVICE') return 'VALIDATION';
        return 'SYSTEM';
    }
}
