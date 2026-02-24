import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { AppError, NotFoundError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { getPDFDownloadUrl } from '@/lib/cloudinary';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * GET /api/admin/knowledge-assets/[id]/preview
 * Generates a direct URL for inline PDF viewing (Securely)
 * SLA: P95 < 500ms
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        // 1. Enforce permission
        const user = await enforcePermission('knowledge', 'read');

        const { id } = await params;

        // 2. SECURE COLLECTION: Multi-tenant Isolation
        const { auth } = await import('@/lib/auth');
        const session = await auth();
        const collection = await getTenantCollection('knowledge_assets', session);

        const asset = await collection.findOne({
            _id: new ObjectId(id)
        });

        if (!asset) {
            throw new NotFoundError('Asset not found or access denied');
        }

        const publicId = asset.cloudinaryPublicId || asset.cloudinary_public_id;
        const blobId = asset.blobId;

        if (publicId) {
            // Generate Cloudinary URL optimized for inline viewing
            const previewUrl = getPDFDownloadUrl(publicId).replace('fl_attachment/', '');
            return NextResponse.redirect(previewUrl);
        } else if (blobId) {
            // Serve directly from GridFS
            await logEvento({
                level: 'INFO',
                source: 'API_ASSET_PREVIEW',
                action: 'GRIDFS_FALLBACK',
                message: `Serving from GridFS fallback for asset ${id}`,
                correlationId
            });
            const { GridFSUtils } = await import('@/lib/gridfs-utils');
            const buffer = await GridFSUtils.getForProcessing(blobId, correlationId);

            return new NextResponse(new Uint8Array(buffer), {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'inline',
                },
            });
        } else {
            throw new AppError('VALIDATION_ERROR', 400, 'This asset does not have a PDF file attached (Cloudinary or GridFS)');
        }

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_ASSET_PREVIEW',
            action: 'PREVIEW_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error generating preview').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_ASSET_PREVIEW',
                action: 'SLA_VIOLATION',
                message: `Preview slow: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
