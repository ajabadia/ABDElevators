import { applicationLogRepository } from '@/lib/repositories/ApplicationLogRepository';
import { auditLogRepository } from '@/lib/repositories/AuditLogRepository';
import { humanValidationRepository } from '@/lib/repositories/HumanValidationRepository';
import { ingestAuditRepository } from '@/lib/repositories/IngestAuditRepository';
import { AppError } from '@/lib/errors';
import { TenantSession } from '@/lib/db-tenant';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';

export interface TimelineEvent {
    id: string;
    timestamp: Date;
    type: 'IA' | 'HUMAN' | 'SYSTEM' | 'INGEST';
    source: string;
    action: string;
    message: string;
    actor: string;
    label: string; // FASE 304: Human-readable business action
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
        const tId = TenantIdSchema.parse(tenantId);
        const eId = EntityIdSchema.parse(entityId);

        // 1. Consultas paralelas a las fuentes de datos (Repositories)
        const [appLogs, auditLogs, validations, ingestAudits] = await Promise.all([
            applicationLogRepository.list({
                $or: [{ 'details.entityId': eId }, { 'details.caseId': eId }],
                tenantId: tId
            } as any, { limit: 100 }, session),

            auditLogRepository.list({
                entityId: eId,
                tenantId: tId
            } as any, { limit: 100 }, session),

            humanValidationRepository.list({
                entityId: eId,
                tenantId: tId
            } as any, { limit: 100 }, session),

            ingestAuditRepository.list({
                docId: eId,
                tenantId: tId
            } as any, { limit: 100 }, session)
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
                actor: (l.details as Record<string, unknown>)?.userId as string || 'SYSTEM',
                level: l.level,
                correlationId: l.correlationId,
                details: l.details as Record<string, unknown>,
                label: ''
            });
        });

        // Audit Logs
        auditLogs.forEach((a) => {
            const doc = a as any;
            events.push({
                id: doc._id.toString(),
                timestamp: doc.timestamp as Date,
                type: doc.actorType === 'IA' ? 'IA' : (doc.actorType === 'SYSTEM' ? 'SYSTEM' : 'HUMAN'),
                source: (doc.source as string) || 'AUDIT',
                action: doc.action as string,
                message: (doc.reason as string) || `Acción administrativa: ${doc.action}`,
                actor: doc.actorId as string,
                level: 'INFO',
                correlationId: doc.correlationId as string,
                details: doc.changes as Record<string, unknown>,
                label: ''
            });
        });

        // Validaciones Humanas
        validations.forEach(v => {
            const doc = v as any;
            events.push({
                id: doc._id.toString(),
                timestamp: (doc.timestamp || doc.createdAt || new Date()) as Date,
                type: 'HUMAN',
                source: 'VALIDATION',
                action: 'HUMAN_VERIFIED',
                message: `Validación humana completada (${v.status})`,
                actor: (v.userId || v.validatedBy || 'USER') as string,
                level: 'INFO',
                details: v.details as Record<string, unknown>,
                label: ''
            });
        });

        // Ingest Audits
        ingestAudits.forEach(i => {
            const doc = i as any;
            events.push({
                id: doc._id.toString(),
                timestamp: (doc.timestamp || doc.createdAt || new Date()) as Date,
                type: 'INGEST',
                source: 'INGEST_ENGINE',
                action: i.status === 'SUCCESS' ? 'INGEST_SUCCESS' : 'INGEST_FAILED',
                message: `Archivo ingestado: ${i.status}`,
                actor: (doc.performedBy || 'SYSTEM') as string,
                level: i.status === 'SUCCESS' ? 'INFO' : 'ERROR',
                correlationId: doc.correlationId as string,
                details: doc.details as Record<string, unknown>,
                label: ''
            });
        });

        // 3. Ordenar por fecha descendente
        return events
            .map(e => ({
                ...e,
                label: this.getFriendlyLabel(e.action, e.type, e.message)
            }))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Normaliza acciones técnicas a etiquetas de negocio (Bank-Grade Transparency).
     */
    private static getFriendlyLabel(action: string, type: string, message: string): string {
        const mapping: Record<string, string> = {
            'INGEST_COMPLETE': 'Documento Analizado con Éxito',
            'INGEST_SUCCESS': 'Análisis de Documento Finalizado',
            'INGEST_ERROR': 'Error en el Procesamiento del Documento',
            'INGEST_FAILED': 'Fallo Crítico en Ingesta',
            'UPDATE_PROMPT': 'Configuración de IA Actualizada',
            'UPDATE_TENANT_CONFIG': 'Reglas de Negocio Modificadas',
            'HUMAN_VERIFIED': 'Aprobación Humana Registrada',
            'SENSITIVE_DATA_ACCESS': 'Acceso a Datos Confidenciales',
            'QUOTA_BLOCK': 'Operación Bloqueada por Cuota',
            'PERFORMANCE_SLA_VIOLATION': 'Alerta de Rendimiento (Lento)',
            'FALLBACK_USED': 'Uso de Configuración de Respaldo'
        };

        if (action.startsWith('GOVERNANCE_EVALUATION')) return 'Evaluación de Políticas de Seguridad';

        return mapping[action] || action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
}
