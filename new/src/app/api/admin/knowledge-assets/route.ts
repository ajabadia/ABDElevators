import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/knowledge-assets
 * Lists all technical documents (knowledge assets) in the RAG corpus.
 * SLA: P95 < 500ms
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'ENGINEERING' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const db = await connectDB();
        const userRole = session?.user?.role;
        const tenantId = (session?.user as any).tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID not found in session');
        }

        // SuperAdmin sees all, Admin/Engineering only their tenant
        const filter = userRole === 'SUPER_ADMIN' ? {} : { tenantId };

        const searchParams = req.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        const assets = await db.collection('knowledge_assets')
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await db.collection('knowledge_assets').countDocuments(filter);

        return NextResponse.json({
            success: true,
            assets, // Renamed from documentos to assets
            pagination: {
                total,
                limit,
                skip
            }
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_ASSETS_LIST',
            action: 'FETCH_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error listing assets').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_ASSETS_LIST',
                action: 'SLA_VIOLATION',
                message: `Asset list slow: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
