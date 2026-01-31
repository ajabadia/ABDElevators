import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectAuthDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { UpdateProfileSchema } from '@/lib/schemas';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/auth/profile
 * Retrieves the authenticated user's profile.
 * SLA: P95 < 300ms
 */
export async function GET() {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const db = await connectAuthDB();
        const user = await db.collection('users').findOne({ email: session.user.email });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        const { password, ...safeUser } = user;
        return NextResponse.json(safeUser);
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            level: 'ERROR',
            source: 'API_PROFILE',
            action: 'GET_PROFILE_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error retrieving profile').toJSON(),
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
export async function PATCH(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const body = await req.json();

        const validated = UpdateProfileSchema.parse(body);
        const db = await connectAuthDB();

        // Get current user data for permission check (Rule #4 - Audit Trail)
        const currentUser = await db.collection('users').findOne({ email: session.user.email });
        if (!currentUser) {
            throw new AppError('NOT_FOUND', 404, 'User not found');
        }

        const isPrivileged = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
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
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Invalid profile data', error.errors).toJSON(),
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
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error updating profile').toJSON(),
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
