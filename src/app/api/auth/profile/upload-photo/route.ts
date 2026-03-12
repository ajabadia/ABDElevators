import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { uploadProfilePhoto } from '@/lib/cloudinary';
import { connectAuthDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';

/**
 * POST /api/auth/profile/upload-photo
 * Uploads a profile photo to Cloudinary and returns the URL.
 * SLA: P95 < 2000ms
 */
async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
        const session = await requirePermission('profile', 'write');

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            throw new ValidationError('No file was uploaded');
        }

        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: session.user.email });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const tenantId = user.tenantId || session.user.tenantId;

        if (!tenantId) {
            throw new AppError('TENANT_CONFIG_ERROR', 500, 'The user does not have an associated tenantId');
        }

        const result = await uploadProfilePhoto(buffer, file.name, tenantId, user._id.toString());

        // Update the user document in the database
        await authDb.collection('users').updateOne(
            { email: session.user.email },
            {
                $set: {
                    photoUrl: result.secureUrl,
                    photoCloudinaryId: result.publicId,
                    updatedAt: new Date()
                }
            }
        );

        await logEvento({
            level: 'INFO',
            source: 'API_PROFILE_PHOTO',
            action: 'UPLOAD_PHOTO',
            message: `Profile photo updated and persisted for ${session.user.email}`,
            correlationId,
            details: { public_id: result.publicId }
        });

        return NextResponse.json({
            url: result.secureUrl,
            publicId: result.publicId
        });
    } catch (error: unknown) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_PROFILE_PHOTO',
            action: 'UPLOAD_ERROR',
            message: error instanceof Error ? error.message : 'Unknown photo upload error',
            correlationId,
            details: { stack: error instanceof Error ? error.stack : undefined }
        });

        const message = error instanceof Error ? error.message : 'Error uploading image';
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, message).toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - startTime;
        if (duration > 2000) {
            await logEvento({
                level: 'WARN',
                source: 'API_PROFILE_PHOTO',
                action: 'SLA_VIOLATION',
                message: `Slow photo upload: ${duration}ms`,
                correlationId,
                details: { duration_ms: duration }
            });
        }
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/auth/profile/upload-photo', thresholdMs: 1000 });
