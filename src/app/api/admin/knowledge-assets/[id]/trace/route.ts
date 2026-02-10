import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB, connectLogsDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { ObjectId } from 'mongodb';

/**
 * GET /api/admin/knowledge-assets/[id]/trace
 * Retrieves the full execution trace (audit + logs) for an asset.
 * SLA: P95 < 500ms
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const { id } = await params;
        const tenantId = (session?.user as any).tenantId;

        const db = await connectDB();
        const logsDb = await connectLogsDB();

        // 1. Fetch Asset to get correlationId
        const asset = await db.collection('knowledge_assets').findOne({
            _id: new ObjectId(id),
            // Security: Filter by tenant unless super admin
            ...(session?.user?.role !== 'SUPER_ADMIN' ? { tenantId } : {})
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

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, error.message).toJSON(),
            { status: 500 }
        );
    }
}
