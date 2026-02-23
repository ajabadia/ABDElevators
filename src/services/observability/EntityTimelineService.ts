import { getTenantCollection } from '@/lib/db-tenant';
import { connectLogsDB } from '@/lib/db';
import { AuditTrail } from '@/lib/schemas/system';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

export interface TimelineEvent {
    id: string;
    timestamp: Date;
    type: 'IA' | 'HUMAN' | 'SYSTEM' | 'INGEST';
    source: string;
    action: string;
    message: string;
    actor: string;
    details?: any;
    level: string;
    correlationId?: string;
}

/**
 * EntityTimelineService - Agrega y normaliza la historia de una entidad desde múltiples fuentes.
 * Phase 132.6
 */
export class EntityTimelineService {

    /**
     * Recupera el historial completo de una entidad (Caso).
     */
    static async getTimeline(entityId: string, tenantId: string): Promise<TimelineEvent[]> {
        // Validación de entrada (Quality Audit Fix)
        if (!entityId || typeof entityId !== 'string') {
            throw new AppError('VALIDATION_ERROR', 400, 'Invalid entityId');
        }
        if (!tenantId) {
            throw new AppError('VALIDATION_ERROR', 400, 'Invalid tenantId');
        }

        const dbLogs = await connectLogsDB();

        // 1. Consultas paralelas a las fuentes de datos
        const [appLogs, auditLogs, validations, ingestAudits] = await Promise.all([
            dbLogs.collection('application_logs').find({
                $or: [{ 'details.entityId': entityId }, { 'details.caseId': entityId }],
                tenantId
            }).limit(100).toArray(),

            dbLogs.collection('audit_admin_ops').find({
                entityId,
                tenantId
            }).toArray(),

            dbLogs.collection('human_validations').find({
                entityId,
                tenantId
            }).toArray(),

            dbLogs.collection('ingest_audits').find({
                docId: entityId,
                tenantId
            }).toArray()
        ]);

        // 2. Normalización de eventos
        const events: TimelineEvent[] = [];

        // Application Logs
        appLogs.forEach(l => {
            events.push({
                id: l._id.toString(),
                timestamp: l.timestamp,
                type: l.source.includes('GEMINI') || l.source.includes('IA') ? 'IA' : 'SYSTEM',
                source: l.source,
                action: l.action,
                message: l.message,
                actor: l.userId || 'SYSTEM',
                level: l.level,
                correlationId: l.correlationId,
                details: l.details
            });
        });

        // Audit Logs
        auditLogs.forEach((a: any) => {
            events.push({
                id: a._id.toString(),
                timestamp: a.timestamp,
                type: a.actorType === 'IA' ? 'IA' : (a.actorType === 'SYSTEM' ? 'SYSTEM' : 'HUMAN'),
                source: a.source || 'AUDIT',
                action: a.action,
                message: a.reason || `Acción administrativa: ${a.action}`,
                actor: a.actorId,
                level: 'INFO',
                correlationId: a.correlationId,
                details: a.changes
            });
        });

        // Validaciones Humanas
        validations.forEach(v => {
            events.push({
                id: v._id.toString(),
                timestamp: v.timestamp || v.createdAt || new Date(),
                type: 'HUMAN',
                source: 'VALIDATION',
                action: 'HUMAN_VERIFIED',
                message: `Validación humana completada (${v.status})`,
                actor: v.userId || v.validatedBy || 'USER',
                level: 'INFO',
                details: v.details
            });
        });

        // Ingest Audits
        ingestAudits.forEach(i => {
            events.push({
                id: i._id.toString(),
                timestamp: i.timestamp,
                type: 'INGEST',
                source: 'INGEST_ENGINE',
                action: i.status === 'SUCCESS' ? 'INGEST_SUCCESS' : 'INGEST_FAILED',
                message: `Archivo ingestado: ${i.status}`,
                actor: i.performedBy,
                level: i.status === 'SUCCESS' ? 'INFO' : 'ERROR',
                correlationId: i.correlationId,
                details: i.details
            });
        });

        // 3. Ordenar por fecha descendente
        return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
}
