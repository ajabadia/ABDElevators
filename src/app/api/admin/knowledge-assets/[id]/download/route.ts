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

        if (!publicId) {
            throw new ValidationError('This document does not have a stored PDF file');
        }

        const downloadUrl = getPDFDownloadUrl(publicId);
        const filename = asset.filename || asset.nombre_archivo || 'documento.pdf';

        await logEvento({
            level: 'INFO',
            source: 'API_DOWNLOAD',
            action: 'PDF_DOWNLOAD_START',
            message: `Starting PDF Download Proxy: ${filename}`,
            correlationId,
            details: { assetId: id }
        });

        // Proxy the request to Cloudinary to handle naming and potential 401s
        const response = await fetch(downloadUrl);

        if (!response.ok) {
            throw new AppError('EXTERNAL_SERVICE_ERROR', 502, `Failed to fetch file from storage: ${response.statusText}`);
        }

        const blob = await response.blob();

        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/pdf',
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
                message: `Download slow (redirect): ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
