import { NextRequest, NextResponse } from 'next/server';
import { connectLogsDB } from '@/lib/db';
import { auth, requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { AppError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * GET /api/admin/ai-trace/[id]
 * Recupera la traza completa de una operación por correlationId.
 * Agrega logs de aplicación, auditoría y métricas de LLM.
 * Phase 132.4
 */
export const GET = withPerformanceSLA(async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const { id: correlationId } = await params;

        const db = await connectLogsDB();

        // 1. Obtener todos los logs técnicos relacionados
        const applicationLogs = await db.collection('application_logs')
            .find({ correlationId })
            .sort({ timestamp: 1 })
            .toArray();

        // 2. Obtener logs de auditoría (Config changes, Admin ops, etc)
        const auditLogs = await Promise.all([
            db.collection('audit_config_changes').find({ correlationId }).toArray(),
            db.collection('audit_admin_ops').find({ correlationId }).toArray(),
            db.collection('audit_data_access').find({ correlationId }).toArray(),
            db.collection('audit_trails').find({ correlationId }).toArray(),
        ]);

        const flatAuditLogs = auditLogs.flat().sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // 3. Obtener métricas de uso de LLM
        const usageLogs = await db.collection('usage_logs')
            .find({ correlationId })
            .toArray();

        if (applicationLogs.length === 0 && flatAuditLogs.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No trace found for this correlation ID'
            }, { status: 404 });
        }

        // 4. Construir el grafo de decisión (simplificado para el MVP)
        const trace = {
            correlationId,
            summary: {
                totalEvents: applicationLogs.length + flatAuditLogs.length,
                startTime: applicationLogs[0]?.timestamp || flatAuditLogs[0]?.timestamp,
                endTime: applicationLogs[applicationLogs.length - 1]?.timestamp || flatAuditLogs[flatAuditLogs.length - 1]?.timestamp,
                hasErrors: applicationLogs.some(l => l.level === 'ERROR'),
                llmTokens: usageLogs.reduce((sum, u) => sum + (u.details?.tokens || 0), 0)
            },
            pipeline: applicationLogs.map(l => ({
                timestamp: l.timestamp,
                source: l.source,
                action: l.action,
                message: l.message,
                level: l.level,
                details: l.details
            })),
            governance: flatAuditLogs.map(a => ({
                timestamp: a.timestamp,
                actor: a.actorId,
                action: a.action,
                entity: a.entityType,
                changes: a.changes,
                reason: a.reason
            }))
        };

        return NextResponse.json(trace);
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        return NextResponse.json({
            success: false,
            message: 'Error retrieving AI trace',
            error: error.message
        }, { status: 500 });
    }
}, { endpoint: 'GET /api/admin/ai-trace/[id]', thresholdMs: 500 });
