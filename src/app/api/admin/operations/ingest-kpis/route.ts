import crypto from 'node:crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { getTenantCollection } from '@/lib/db-tenant';

/**
 * GET /api/admin/operations/ingest-kpis
 * Returns key performance indicators for the Ingestion Dashboard (Era 10).
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await requirePermission('ingest:metrics', 'read');
        const tenantId = session.user.tenantId || 'platform_master';

        const db = await getTenantCollection('knowledge_assets', { user: session.user });
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            total24h,
            success24h,
            failed24h,
            repairedTotal,
            dlqCount
        ] = await Promise.all([
            // Total ingestas 24h
            db.countDocuments({ tenantId, createdAt: { $gte: oneDayAgo } }),
            // Éxito 24h
            db.countDocuments({ tenantId, ingestionStatus: 'COMPLETED', createdAt: { $gte: oneDayAgo } }),
            // Fallo 24h
            db.countDocuments({ tenantId, ingestionStatus: 'FAILED', createdAt: { $gte: oneDayAgo } }),
            // Auto-reparados históricos
            db.countDocuments({ tenantId, autoRepaired: true }),
            // Dead Letter Queue (Failed pending attention)
            db.countDocuments({ tenantId, ingestionStatus: 'FAILED' })
        ]) as number[];

        const successRate = total24h > 0 ? (success24h / total24h) * 100 : 100;

        return NextResponse.json({
            success: true,
            kpis: [
                {
                    id: 'ingestions_24h',
                    label: 'Documentos Hoy',
                    value: total24h,
                    secondary: `${success24h} éxitos / ${failed24h} fallos`,
                    status: successRate > 90 ? 'success' : successRate > 70 ? 'warning' : 'danger'
                },
                {
                    id: 'auto_repair',
                    label: 'Auto-Repair',
                    value: repairedTotal,
                    secondary: 'Reparados sin intervención',
                    status: 'info'
                },
                {
                    id: 'dlq',
                    label: 'DLQ / Errores',
                    value: dlqCount,
                    secondary: 'Pendiente de revisión',
                    status: dlqCount > 0 ? 'warning' : 'success'
                }
            ],
            timing: {
                duration_ms: Date.now() - start
            }
        });

    } catch (error) {
        return handleApiError(error, 'API_INGEST_KPIS', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, {
    endpoint: 'GET /api/admin/operations/ingest-kpis',
    thresholdMs: 1000
});
