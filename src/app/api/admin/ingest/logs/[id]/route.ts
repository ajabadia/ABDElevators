import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { requirePermission } from '@/lib/auth';
import { AppError } from '@/lib/errors';

/**
 * GET /api/admin/ingest/logs/[id]
 * Polls for the latest ingestion logs for a given correlationId.
 */
async function GET_internal (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: correlationId } = await params;
        const session = await requirePermission('ingest:logs', 'read');

        const auditCollection = await getTenantCollection('audit_ingestion', {
            user: { id: 'system_monitor', tenantId: session.user.tenantId, role: 'SUPER_ADMIN' }
        });

        const logs = await auditCollection.find(
            { correlationId },
            { sort: { timestamp: 1 }, limit: 50 }
        );

        return NextResponse.json({
            success: true,
            logs: logs.map(l => ({
                action: l.action,
                message: l.message,
                level: l.level,
                timestamp: l.timestamp
            }))
        });

    } catch (error: unknown) {
        const err = error instanceof AppError ? error : new AppError('INTERNAL_ERROR', 500, String(error));
        console.error('[INGEST_LOGS_API_ERROR]', err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: err.status }
        );
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/ingest/logs/[id]', thresholdMs: 10000 });
