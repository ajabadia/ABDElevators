import crypto from 'node:crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { AppError, NotFoundError } from '@/lib/errors';

/**
 * POST /api/admin/users/[id]/reset-password
 * Resets a user's password (ADMIN only)
 * SLA: P95 < 1000ms
 */
async function POST_internal(
    req: NextRequest,
    paramsContext: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

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

        // Generate new cryptographically secure temporary password
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

        await logEvento({
            level: 'INFO',
            source: 'API_ADMIN_USERS',
            action: 'RESET_PASSWORD',
            message: `Password reset for: ${user.email}`,
            correlationId,
            details: { userId: id }
        });

        // IMPORTANT: We do not return the password in the JSON response for security.
        // Admin should communicate it via another channel or system should send an email.
        return NextResponse.json({
            success: true,
            passwordResetDone: true
        });
    } catch (error: unknown) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            level: 'ERROR',
            source: 'API_ADMIN_USERS',
            action: 'RESET_PASSWORD_ERROR',
            message: error instanceof Error ? error.message : 'Unknown reset error',
            correlationId,
            details: { stack: error instanceof Error ? error.stack : undefined }
        });
        const message = error instanceof Error ? error.message : 'Error resetting password';
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, message).toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - startTime;
        if (duration > 1000) {
            await logEvento({
                level: 'WARN',
                source: 'API_ADMIN_USERS',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `POST /api/admin/users/[id]/reset-password took ${duration}ms`,
                correlationId,
                details: { duration_ms: duration }
            });
        }
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/users/[id]/reset-password', thresholdMs: 1000 });
