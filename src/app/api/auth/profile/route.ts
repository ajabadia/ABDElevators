import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { connectAuthDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { UpdateProfileSchema } from '@/lib/schemas';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import { UserRole } from '@/types/roles';

/**
 * GET /api/auth/profile
 * Retrieves the authenticated user's profile.
 * SLA: P95 < 300ms
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await requirePermission('profile', 'read');

        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: session.user.email });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        const { password, ...safeUser } = user;
        return NextResponse.json(safeUser);
    } catch (error: unknown) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            level: 'ERROR',
            source: 'API_PROFILE',
            action: 'GET_PROFILE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown profile get error',
            correlationId,
            details: { stack: error instanceof Error ? error.stack : undefined }
        });
        const message = error instanceof Error ? error.message : 'Error retrieving profile';
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, message).toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 300) {
            await logEvento({
                level: 'WARN',
                source: 'API_PROFILE',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `GET /api/auth/profile took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

/**
 * PATCH /api/auth/profile
 * Updates the authenticated user's profile.
 * SLA: P95 < 500ms
 */
async function PATCH_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await requirePermission('profile', 'write');

        const body = await req.json();

        const validated = UpdateProfileSchema.parse(body);
        const db = await connectAuthDB();
        const currentUser = await db.collection('users').findOne({ email: session.user.email });
        if (!currentUser) {
            throw new AppError('NOT_FOUND', 404, 'User not found');
        }

        const isPrivileged = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(currentUser.role as UserRole);
        const identityFields = ['firstName', 'lastName', 'jobTitle'];
        const isAttemptingIdentityChange = identityFields.some(field => body[field] !== undefined);

        if (!isPrivileged && isAttemptingIdentityChange) {
            // Check if values actually change
            const hasActualChange = identityFields.some(field =>
                body[field] !== undefined && body[field] !== currentUser[field]
            );

            if (hasActualChange) {
                await logEvento({
                    level: 'WARN',
                    source: 'API_PROFILE',
                    action: 'UNAUTHORIZED_IDENTITY_CHANGE_ATTEMPT',
                    message: `User ${session.user.email} attempted to change protected fields`,
                    correlationId,
                    details: { attemptedFields: Object.keys(body).filter(k => identityFields.includes(k)) }
                });
                throw new AppError('FORBIDDEN', 403, 'You do not have permission to modify managed identity fields.');
            }
        }

        const updateData = {
            ...validated,
            updatedAt: new Date()
        };

        const result = await db.collection('users').updateOne(
            { email: session.user.email },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            throw new NotFoundError('User not found');
        }

        await logEvento({
            level: 'INFO',
            source: 'API_PROFILE',
            action: 'UPDATE_PROFILE',
            message: `Profile updated for ${session.user.email}`,
            correlationId,
            details: { updatedFields: Object.keys(validated) }
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Invalid profile data', (error as any).errors).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_PROFILE',
            action: 'UPDATE_PROFILE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown profile update error',
            correlationId,
            details: { stack: error instanceof Error ? error.stack : undefined }
        });

        const message = error instanceof Error ? error.message : 'Error updating profile';
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, message).toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_PROFILE',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `PATCH /api/auth/profile took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/auth/profile', thresholdMs: 1000 });

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/auth/profile', thresholdMs: 1000 });
