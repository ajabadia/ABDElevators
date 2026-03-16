import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { uploadProfilePhoto } from '@/lib/cloudinary';
import { connectAuthDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { UserService } from '@/services/auth/UserService';
import { AppError, NotFoundError, ValidationError, handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/users/[id]/upload-photo
 * Allows an ADMIN to upload a profile photo for any user.
 * SLA: P95 < 2000ms
 */
async function POST_internal(
    req: NextRequest,
    paramsContext: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_PHOTO', action: 'ADMIN_UPLOAD_PHOTO' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user', 'manage');

                const { id } = await paramsContext.params;
                const formData = await req.formData();
                const file = formData.get('file') as File;

                if (!file) {
                    throw new ValidationError('No file was uploaded');
                }

                const authDb = await connectAuthDB();
                const user = await authDb.collection('users').findOne({ _id: new ObjectId(id) });

                if (!user) {
                    throw new NotFoundError('User not found');
                }

                const buffer = Buffer.from(await file.arrayBuffer());
                const tenantId = user.tenantId;
                if (!tenantId) {
                    throw new AppError('TENANT_CONFIG_ERROR', 500, 'User has no tenantId');
                }
                const result = await uploadProfilePhoto(buffer, file.name, tenantId, id);

                // Update user document via Service (Phase 171.2)
                await UserService.updateProfilePhoto(id, result.secureUrl, result.publicId);

                await log({
                    message: `Admin ${session.user.email} changed profile photo for user ${id}`,
                    details: { targetUserId: id, public_id: result.publicId }
                });

                return NextResponse.json({
                    url: result.secureUrl,
                    public_id: result.publicId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_PHOTO', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/users/[id]/upload-photo', thresholdMs: 2000 });
