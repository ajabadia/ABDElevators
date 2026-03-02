import { applicationLogRepository } from '@/lib/repositories/ApplicationLogRepository';
import { auditLogRepository } from '@/lib/repositories/AuditLogRepository';
import { humanValidationRepository } from '@/lib/repositories/HumanValidationRepository';
import { ingestAuditRepository } from '@/lib/repositories/IngestAuditRepository';
import { AppError } from '@/lib/errors';
import { TenantSession } from '@/lib/db-tenant';

export interface TimelineEvent {
    id: string;
    timestamp: Date;
    type: 'IA' | 'HUMAN' | 'SYSTEM' | 'INGEST';
    source: string;
    action: string;
    message: string;
    actor: string;
    details?: Record<string, unknown>;
    level: string;
    correlationId?: string;
}

/**
 * EntityTimelineService - Agrega y normaliza la historia de una entidad desde múltiples fuentes.
 * Hardened Era 8: Repository-based aggregation and strict typing.
 */
export class EntityTimelineService {

    /**
     * Recupera el historial completo de una entidad (Caso).
     */
    static async getTimeline(entityId: string, tenantId: string, session?: TenantSession | null): Promise<TimelineEvent[]> {
        // Validación de entrada (Quality Audit Fix)
        if (!entityId || typeof entityId !== 'string') {
            throw new AppError('VALIDATION_ERROR', 400, 'Invalid entityId');
        }
        if (!tenantId) {
            throw new AppError('VALIDATION_ERROR', 400, 'Invalid tenantId');
        }

        // 1. Consultas paralelas a las fuentes de datos (Repositories)
        const [appLogs, auditLogs, validations, ingestAudits] = await Promise.all([
            applicationLogRepository.list({
                $or: [{ 'details.entityId': entityId }, { 'details.caseId': entityId }],
                tenantId
            }, { limit: 100 }, session),

            auditLogRepository.list({
                entityId,
                tenantId
            }, { limit: 100 }, session),

            humanValidationRepository.list({
                entityId,
                tenantId
            }, { limit: 100 }, session),

            ingestAuditRepository.list({
                docId: entityId,
                tenantId
            }, { limit: 100 }, session)
        ]);

        // 2. Normalización de eventos
        const events: TimelineEvent[] = [];

        // Application Logs
        appLogs.forEach(l => {
            const doc = l as unknown as { _id: { toString: () => string } };
            events.push({
                id: doc._id.toString(),
                timestamp: l.timestamp,
                type: l.source.includes('GEMINI') || l.source.includes('IA') ? 'IA' : 'SYSTEM',
                source: l.source,
                action: l.action,
                message: l.message,
                actor: (l.details as Record<string, any>)?.userId || 'SYSTEM',
                level: l.level,
                correlationId: l.correlationId,
                details: l.details as Record<string, unknown>
            });
        });

        // Audit Logs
        auditLogs.forEach((a) => {
            const doc = a as unknown as { _id: { toString: () => string }, timestamp: Date, actorType: string, source: string, action: string, reason: string, actorId: string, correlationId: string, changes: any };
            events.push({
                id: doc._id.toString(),
                timestamp: doc.timestamp,
                type: doc.actorType === 'IA' ? 'IA' : (doc.actorType === 'SYSTEM' ? 'SYSTEM' : 'HUMAN'),
                source: doc.source || 'AUDIT',
                action: doc.action,
                message: doc.reason || `Acción administrativa: ${doc.action}`,
                actor: doc.actorId,
                level: 'INFO',
                correlationId: doc.correlationId,
                details: doc.changes
            });
        });

        // Validaciones Humanas
        validations.forEach(v => {
            const doc = v as unknown as { _id: { toString: () => string }, timestamp?: Date, createdAt?: Date };
            events.push({
                id: doc._id.toString(),
                timestamp: doc.timestamp || doc.createdAt || new Date(),
                type: 'HUMAN',
                source: 'VALIDATION',
                action: 'HUMAN_VERIFIED',
                message: `Validación humana completada (${v.status})`,
                actor: v.userId || v.validatedBy || 'USER',
                level: 'INFO',
                details: v.details as Record<string, unknown>
            });
        });

        // Ingest Audits
        ingestAudits.forEach(i => {
            const doc = i as unknown as { _id: { toString: () => string }, timestamp?: Date, createdAt?: Date, performedBy?: string, correlationId?: string, details?: any };
            events.push({
                id: doc._id.toString(),
                timestamp: doc.timestamp || doc.createdAt || new Date(),
                type: 'INGEST',
                source: 'INGEST_ENGINE',
                action: i.status === 'SUCCESS' ? 'INGEST_SUCCESS' : 'INGEST_FAILED',
                message: `Archivo ingestado: ${i.status}`,
                actor: doc.performedBy || 'SYSTEM',
                level: i.status === 'SUCCESS' ? 'INFO' : 'ERROR',
                correlationId: doc.correlationId,
                details: doc.details
            });
        });

        // 3. Ordenar por fecha descendente
        return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
}
