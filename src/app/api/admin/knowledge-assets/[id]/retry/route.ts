import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import { IngestService } from '@/services/ingest/IngestService';
import { GridFSUtils } from '@/lib/gridfs-utils';
import { uploadPDFToCloudinary } from '@/lib/cloudinary';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * POST /api/admin/knowledge-assets/[id]/retry
 * 
 * Phase 131: Granular retry based on ingestion state:
 * - hasStorage=true && hasChunks=false: Retry indexing only
 * - hasStorage=false && hasChunks=true: Retry Cloudinary upload only  
 * - hasStorage=false && hasChunks=false: Full retry (legacy behavior)
 * 
 * SLA: P95 < 500ms (to respond, processing is async)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        const userRole = session?.user?.role;
        if (!['ADMIN', 'SUPER_ADMIN', 'ENGINEERING'].includes(userRole || '')) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const { id } = await params;
        const tenantId = (session?.user as any).tenantId;
        const db = await connectDB();

        // Parse body for granular retry options
        const body = await req.json().catch(() => ({}));
        const retryType = body.retryType || 'auto'; // 'auto' | 'indexing' | 'storage' | 'full'

        // 1. Find the asset
        const filter = userRole === 'SUPER_ADMIN'
            ? { _id: new ObjectId(id) }
            : { _id: new ObjectId(id), tenantId };

        const asset = await db.collection('knowledge_assets').findOne(filter);

        if (!asset) {
            throw new NotFoundError('Knowledge asset not found');
        }

        // Phase 131: Determine retry strategy based on state
        const hasStorage = asset.hasStorage ?? false;
        const hasChunks = asset.hasChunks ?? false;

        let finalRetryType = retryType;

        if (retryType === 'auto') {
            // Auto-detect what needs to be retried
            if (hasStorage && !hasChunks) {
                finalRetryType = 'indexing';
            } else if (!hasStorage && hasChunks) {
                finalRetryType = 'storage';
            } else {
                finalRetryType = 'full';
            }
        }

        await logEvento({
            level: 'INFO',
            source: 'API_ASSET_RETRY',
            action: 'RETRY_STRATEGY',
            message: `Retry strategy determined: ${finalRetryType}`,
            correlationId,
            tenantId,
            details: {
                assetId: id,
                filename: asset.filename,
                hasStorage,
                hasChunks,
                retryType,
                finalRetryType
            }
        });

        // 2. Execute retry based on type
        if (finalRetryType === 'indexing') {
            // Retry indexing only (has storage, no chunks)
            await retryIndexing(db, asset, id, correlationId, session);
        } else if (finalRetryType === 'storage') {
            // Retry Cloudinary upload only (has chunks, no storage)
            await retryStorage(db, asset, id, correlationId, session);
        } else {
            // Full retry (legacy behavior)
            await retryFull(db, asset, id, correlationId, session);
        }

        return NextResponse.json({
            success: true,
            message: `Retry initiated (${finalRetryType}). Processing in background.`,
            assetId: id,
            retryType: finalRetryType,
            hasStorage: finalRetryType === 'storage' ? true : hasStorage,
            hasChunks: finalRetryType === 'indexing' ? true : hasChunks
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            level: 'ERROR',
            source: 'API_ASSET_RETRY',
            action: 'ERROR_FATAL',
            message: error.message,
            correlationId,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Failed to initiate retry').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_ASSET_RETRY',
                action: 'SLA_VIOLATION',
                message: `Retry API slow: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

// ============================================================================
// Phase 131: Granular Retry Helpers
// ============================================================================

/**
 * Retry indexing only (has storage but no chunks)
 */
async function retryIndexing(
    db: any,
    asset: any,
    assetId: string,
    correlationId: string,
    session: any
) {
    await logEvento({
        level: 'INFO',
        source: 'API_ASSET_RETRY',
        action: 'RETRY_INDEXING_START',
        message: `Retrying indexing only for asset: ${asset.filename}`,
        correlationId,
        tenantId: asset.tenantId,
        details: { assetId, hasStorage: asset.hasStorage, blobId: asset.blobId }
    });

    // Update status
    await db.collection('knowledge_assets').updateOne(
        { _id: new ObjectId(assetId) },
        {
            $set: {
                ingestionStatus: 'PROCESSING',
                indexingError: null,
                progress: 0,
                updatedAt: new Date()
            }
        }
    );

    // Trigger indexing (fire and forget)
    IngestService.executeAnalysis(assetId, {
        correlationId,
        userEmail: session?.user?.email || 'system',
        tenantId: asset.tenantId
    }).catch(err => {
        console.error(`[RETRY_INDEXING_ERROR] ${assetId}:`, err);
    });
}

/**
 * Retry Cloudinary upload only (has chunks but no storage)
 */
async function retryStorage(
    db: any,
    asset: any,
    assetId: string,
    correlationId: string,
    session: any
) {
    await logEvento({
        level: 'INFO',
        source: 'API_ASSET_RETRY',
        action: 'RETRY_STORAGE_START',
        message: `Retrying Cloudinary upload only for asset: ${asset.filename}`,
        correlationId,
        tenantId: asset.tenantId,
        details: { assetId, hasChunks: asset.hasChunks, blobId: asset.blobId }
    });

    if (!asset.blobId) {
        throw new ValidationError('No blob available for storage retry. Please retry full ingestion.');
    }

    // Update status
    await db.collection('knowledge_assets').updateOne(
        { _id: new ObjectId(assetId) },
        {
            $set: {
                ingestionStatus: 'PROCESSING',
                storageError: null,
                progress: 0,
                updatedAt: new Date()
            }
        }
    );

    try {
        // Read from GridFS
        const buffer = await GridFSUtils.getForProcessing(asset.blobId, correlationId);

        // Upload to Cloudinary
        const result = await uploadPDFToCloudinary(buffer, asset.filename, asset.tenantId);

        // Update with success
        await db.collection('knowledge_assets').updateOne(
            { _id: new ObjectId(assetId) },
            {
                $set: {
                    ingestionStatus: 'COMPLETED',
                    hasStorage: true,
                    cloudinaryUrl: result.secureUrl,
                    cloudinaryPublicId: result.publicId,
                    storageError: null,
                    progress: 100,
                    updatedAt: new Date()
                }
            }
        );

        await logEvento({
            level: 'INFO',
            source: 'API_ASSET_RETRY',
            action: 'RETRY_STORAGE_SUCCESS',
            message: `Cloudinary upload succeeded for asset: ${asset.filename}`,
            correlationId,
            tenantId: asset.tenantId,
            details: { assetId, publicId: result.publicId }
        });

    } catch (error) {
        const err = error as Error;

        // Update with error
        await db.collection('knowledge_assets').updateOne(
            { _id: new ObjectId(assetId) },
            {
                $set: {
                    ingestionStatus: 'INDEXED_NO_STORAGE',
                    storageError: err.message,
                    updatedAt: new Date()
                }
            }
        );

        await logEvento({
            level: 'ERROR',
            source: 'API_ASSET_RETRY',
            action: 'RETRY_STORAGE_FAILED',
            message: `Cloudinary upload failed for asset: ${asset.filename}`,
            correlationId,
            tenantId: asset.tenantId,
            details: { assetId, error: err.message }
        });

        throw new AppError('EXTERNAL_SERVICE_ERROR', 500, `Storage retry failed: ${err.message}`);
    }
}

/**
 * Full retry (legacy behavior - reset everything)
 */
async function retryFull(
    db: any,
    asset: any,
    assetId: string,
    correlationId: string,
    session: any
) {
    await logEvento({
        level: 'INFO',
        source: 'API_ASSET_RETRY',
        action: 'RETRY_FULL_START',
        message: `Full retry for asset: ${asset.filename}`,
        correlationId,
        tenantId: asset.tenantId,
        details: { assetId }
    });

    // Reset to PENDING (legacy behavior)
    await db.collection('knowledge_assets').updateOne(
        { _id: new ObjectId(assetId) },
        {
            $set: {
                ingestionStatus: 'PENDING',
                progress: 0,
                error: null,
                updatedAt: new Date()
            }
        }
    );

    // Trigger full analysis
    IngestService.executeAnalysis(assetId, {
        correlationId,
        userEmail: session?.user?.email || 'system',
        tenantId: asset.tenantId
    }).catch(err => {
        console.error(`[RETRY_FULL_ERROR] ${assetId}:`, err);
    });
}
