import crypto from 'node:crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/users/[id]/reset-password
 * Resets a user's password (ADMIN only)
 * SLA: P95 < 1000ms
 */
async function POST_internal(
    req: NextRequest,
    paramsContext: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_USERS', action: 'RESET_PASSWORD' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user', 'manage');

                const { id } = await paramsContext.params;
                const authDb = await connectAuthDB();
                const user = await authDb.collection('users').findOne({
                    _id: new ObjectId(id)
                });

                if (!user) {
                    throw new NotFoundError('User not found');
                }

                // Generate new cryptographically secure temporary password (KEEP crypto.randomBytes)
                const tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 16);
                const hashedPassword = await bcrypt.hash(tempPassword, 10);

                await authDb.collection('users').updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            password: hashedPassword,
                            updatedAt: new Date()
                        }
                    }
                );

                await log({
                    message: `Password reset for: ${user.email}`,
                    details: { userId: id }
                });

                // IMPORTANT: We do not return the password in the JSON response for security.
                // Admin should communicate it via another channel or system should send an email.
                return NextResponse.json({
                    success: true,
                    passwordResetDone: true
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_USERS', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/users/[id]/reset-password', thresholdMs: 1000 });
