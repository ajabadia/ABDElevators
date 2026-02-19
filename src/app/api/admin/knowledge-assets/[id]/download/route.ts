import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getPDFDownloadUrl } from '@/lib/cloudinary';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/knowledge-assets/[id]/download
 * Downloads the original PDF from Cloudinary
 * SLA: P95 < 500ms
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'ENGINEERING' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized for download');
        }

        const { id } = await params;
        const db = await connectDB();
        const asset = await db.collection('knowledge_assets').findOne({
            _id: new ObjectId(id)
        });

        if (!asset) {
            throw new NotFoundError('Document not found');
        }

        const publicId = asset.cloudinaryPublicId || asset.cloudinary_public_id;
        const blobId = asset.blobId;
        const filename = asset.filename || asset.nombre_archivo || 'documento.pdf';

        let fileBuffer: Buffer | Uint8Array;
        let contentType: string = 'application/pdf';

        if (publicId) {
            try {
                const downloadUrl = getPDFDownloadUrl(publicId);
                const response = await fetch(downloadUrl);
                if (response.ok) {
                    fileBuffer = new Uint8Array(await response.arrayBuffer());
                    contentType = response.headers.get('Content-Type') || 'application/pdf';
                } else {
                    throw new Error(`Cloudinary fetch failed: ${response.status}`);
                }
            } catch (error) {
                if (blobId) {
                    const { GridFSUtils } = await import('@/lib/gridfs-utils');
                    fileBuffer = await GridFSUtils.getForProcessing(blobId, correlationId);
                } else {
                    throw new AppError('EXTERNAL_SERVICE_ERROR', 503, 'Failed to fetch from Cloudinary and no GridFS fallback available');
                }
            }
        } else if (blobId) {
            const { GridFSUtils } = await import('@/lib/gridfs-utils');
            fileBuffer = await GridFSUtils.getForProcessing(blobId, correlationId);
        } else {
            throw new ValidationError('Asset has no stored file (Cloudinary or GridFS)');
        }

        return new NextResponse(new Uint8Array(fileBuffer), {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_DOWNLOAD',
            action: 'DOWNLOAD_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error downloading PDF').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_DOWNLOAD',
                action: 'SLA_VIOLATION',
                message: `Download slow: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
