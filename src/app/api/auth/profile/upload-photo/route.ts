import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { uploadProfilePhoto } from '@/lib/cloudinary';
import { connectAuthDB } from '@/lib/db';
import { AppError, NotFoundError, ValidationError, handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/auth/profile/upload-photo
 * Uploads a profile photo to Cloudinary and returns the URL.
 * SLA: P95 < 2000ms
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_PROFILE_PHOTO', action: 'UPLOAD_PHOTO' },
        async ({ correlationId, log }) => {
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

                await log({
                    message: `Profile photo updated for ${session.user.email}`,
                    details: { public_id: result.publicId }
                });

                return NextResponse.json({
                    url: result.secureUrl,
                    publicId: result.publicId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_PROFILE_PHOTO_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/auth/profile/upload-photo', thresholdMs: 2000 });
