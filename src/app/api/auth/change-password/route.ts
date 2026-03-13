import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import bcrypt from 'bcryptjs';
import { logEvento } from '@/lib/logger';
import { ChangePasswordSchema } from '@/lib/schemas';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

/**
 * POST /api/auth/change-password
 * Changes the password for the authenticated user.
 * SLA: P95 < 1000ms (due to bcrypt hashing)
 */
async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
        const session = await requirePermission('profile', 'write');

        const body = await req.json();

        // RULE #2: Zod Validation BEFORE Processing
        const validated = ChangePasswordSchema.parse(body);

        // 🛡️ [PHASE 460] STANDARDIZED USER DISCOVERY
        const users = await getTenantCollection<any>('users', session as any, 'AUTH');
        const user = await users.findOne({ email: session.user.email });

        if (!user) {
            throw new NotFoundError('User not found in AUTH cluster');
        }

        // Verify current password
        const isPasswordCorrect = await bcrypt.compare(validated.currentPassword, user.password);
        if (!isPasswordCorrect) {
            throw new ValidationError('The current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

        await users.updateOne(
            { email: session.user.email },
            {
                $set: {
                    password: hashedPassword,
                    updatedAt: new Date()
                }
            }
        );

        await logEvento({
            level: 'INFO',
            source: 'API_PROFILE',
            action: 'CHANGE_PASSWORD',
            message: `Password changed for ${session.user.email}`,
            correlationId
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                new ValidationError('Invalid password data', error.issues).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_PROFILE',
            action: 'CHANGE_PASSWORD_ERROR',
            message: error instanceof Error ? error.message : 'Unknown change password error',
            correlationId,
            details: { stack: error instanceof Error ? error.stack : undefined }
        });

        const message = error instanceof Error ? error.message : 'Error changing password';
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, message).toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - startTime;
        if (duration > 1000) {
            await logEvento({
                level: 'WARN',
                source: 'API_PROFILE',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `POST /api/auth/change-password took ${duration}ms`,
                correlationId,
                details: { duration_ms: duration }
            });
        }
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/auth/change-password', thresholdMs: 1000 });
