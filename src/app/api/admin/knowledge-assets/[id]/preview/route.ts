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
        if (!publicId) {
            throw new AppError('VALIDATION_ERROR', 400, 'This asset does not have a PDF file attached');
        }

        // 3. Generate Cloudinary URL optimized for inline viewing
        // By default Cloudinary might force download if fl_attachment is set.
        // We ensure we get a URL that can be streamed/displayed.
        const previewUrl = getPDFDownloadUrl(publicId).replace('fl_attachment/', '');

        await logEvento({
            level: 'INFO',
            source: 'API_ASSET_PREVIEW',
            action: 'PREVIEW_GENERATED',
            message: `Preview generated for: ${asset.filename}`,
            correlationId,
            details: { assetId: id, tenantId: (user as any).tenantId }
        });

        // We redirect to the Cloudinary URL or return it?
        // For inline preview in an iframe, redirecting is usually fine if Cloudinary headers allow it.
        return NextResponse.redirect(previewUrl);

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
