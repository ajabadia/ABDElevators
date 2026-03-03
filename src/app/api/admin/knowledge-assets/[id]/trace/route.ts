import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { connectDB, connectLogsDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';

/**
 * GET /api/admin/knowledge-assets/[id]/trace
 * Retrieves the full execution trace (audit + logs) for an asset.
 * SLA: P95 < 500ms
 */
async function GET_internal(
    req: NextRequest,
    paramsContext: { params: Promise<{ id: string }> }
) {
    const correlationId_trace = crypto.randomUUID();
    try {
        const session = await enforcePermission('knowledge:asset', 'manage');

        const { id } = await paramsContext.params;
        const tenantId = session.user.tenantId;

        const db = await connectDB();
        const logsDb = await connectLogsDB();

        // 1. Fetch Asset to get correlationId
        const asset = await db.collection('knowledge_assets').findOne({
            _id: new ObjectId(id),
            // Security: Filter by tenant unless super admin
            ...(session.user.role !== 'SUPER_ADMIN' ? { tenantId } : {})
        });

        if (!asset) {
            throw new AppError('NOT_FOUND', 404, 'Knowledge asset not found');
        }

        const correlationId = asset.correlationId;

        if (!correlationId) {
            return NextResponse.json({
                success: true,
                asset,
                audit: [],
                logs: [],
                message: 'No correlationId found for this asset. Detailed tracing not available for legacy ingestions.'
            });
        }

        // 2. Fetch Audit Events
        const auditEvents = await db.collection('audit_ingestion').find({
            correlationId
        }).sort({ timestamp: 1 }).toArray();

        // 3. Fetch Application Logs
        const logs = await logsDb.collection('application_logs').find({
            correlationId
        }).sort({ timestamp: 1 }).toArray();

        return NextResponse.json({
            success: true,
            asset: {
                _id: asset._id,
                filename: asset.filename,
                ingestionStatus: asset.ingestionStatus,
                error: asset.error,
                correlationId: asset.correlationId
            },
            audit: auditEvents,
            logs: logs
        });

    } catch (error: unknown) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        const message = error instanceof Error ? error.message : 'Unknown trace error';
        await logEvento({
            level: 'ERROR',
            source: 'API_TRACE',
            action: 'GET_TRACE_FAILED',
            message: message,
            correlationId: correlationId_trace,
            details: { stack: error instanceof Error ? error.stack : undefined }
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, message).toJSON(),
            { status: 500 }
        );
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/knowledge-assets/[id]/trace', thresholdMs: 1000 });
