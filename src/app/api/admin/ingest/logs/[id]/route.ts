
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';

/**
 * GET /api/admin/ingest/logs/[id]
 * Polls for the latest ingestion logs for a given correlationId.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: correlationId } = await params;
        const session = await auth();

        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
        }

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

    } catch (error: any) {
        console.error('[INGEST_LOGS_API_ERROR]', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.status || 500 }
        );
    }
}
