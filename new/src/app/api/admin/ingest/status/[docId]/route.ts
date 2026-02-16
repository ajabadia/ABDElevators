import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { auth, requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { AppError } from '@/lib/errors';

/**
 * GET /api/admin/ingest/status/[docId]
 * Devuelve el estado actual de la ingesta para un documento específico.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ docId: string }> }
) {
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        const { docId } = await params;
        if (!docId) {
            throw new AppError('VALIDATION_ERROR', 400, 'docId is required');
        }

        const { getTenantCollection } = await import('@/lib/db-tenant');
        const tenantId = session.user.tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID not found in session');
        }

        const collection = await getTenantCollection('knowledge_assets');
        const asset = await collection.findOne({
            _id: new ObjectId(docId),
            tenantId // Ensure the asset belongs to the user's tenant
        });

        if (!asset) {
            throw new AppError('NOT_FOUND', 404, 'Knowledge asset not found');
        }

        return NextResponse.json({
            success: true,
            status: asset.ingestionStatus,
            progress: asset.progress || 0,
            attempts: asset.attempts || 0,
            error: asset.error,
            filename: asset.filename,
            updatedAt: asset.updatedAt
        });

    } catch (error: any) {
        console.error(`[INGEST STATUS ERROR]`, error);
        const status = error.statusCode || 500;
        return NextResponse.json(
            { success: false, message: error.message },
            { status }
        );
    }
}
