import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { AdminUpdateUserSchema } from '@/lib/schemas';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * PATCH /api/admin/users/[id]
 * Updates a user's data (ADMIN only)
 * SLA: P95 < 400ms
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        const isAdmin = session?.user?.role === 'ADMIN';
        const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

        if (!isAdmin && !isSuperAdmin) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const { id } = await params;
        const body = await req.json();

        // RULE #2: Zod Validation BEFORE Processing
        const validated = AdminUpdateUserSchema.parse(body);

        const db = await connectAuthDB();

        // Isolation: If Admin, verify that the user to edit belongs to their tenant
        if (isAdmin) {
            const userToEdit = await db.collection('users').findOne({ _id: new ObjectId(id) });
            if (!userToEdit) {
                throw new NotFoundError('User not found');
            }
            if (userToEdit.tenantId !== session?.user?.tenantId) {
                await logEvento({
                    level: 'WARN',
                    source: 'API_ADMIN_USERS',
                    action: 'CROSS_TENANT_ACCESS_ATTEMPT',
                    message: `Admin ${session?.user?.email} attempted to modify user from another tenant: ${id}`,
                    correlationId,
                    details: { targetUserId: id, adminTenant: session?.user?.tenantId, userTenant: userToEdit.tenantId }
                });
                throw new AppError('FORBIDDEN', 403, 'You do not have permission to modify users from other organizations');
            }
        }

        const updateData: any = {
            ...validated,
            updatedAt: new Date()
        };

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            throw new NotFoundError('User not found');
        }

        await logEvento({
            level: 'INFO',
            source: 'API_ADMIN_USERS',
            action: 'UPDATE_USER',
            message: `User updated: ${id}`,
            correlationId,
            details: { userId: id, updatedFields: Object.keys(validated) }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Invalid update data', error.issues).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_ADMIN_USERS',
            action: 'UPDATE_USER_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error updating user').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 400) {
            await logEvento({
                level: 'WARN',
                source: 'API_ADMIN_USERS',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `PATCH /api/admin/users/[id] took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

/**
 * GET /api/admin/users/[id]
 * Retrieves a user by ID
 * SLA: P95 < 200ms
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        const isAdmin = session?.user?.role === 'ADMIN';
        const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

        if (!isAdmin && !isSuperAdmin) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const { id } = await params;
        const db = await connectAuthDB();
        const user = await db.collection('users').findOne({ _id: new ObjectId(id) });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Isolation: If Admin, verify tenantId
        if (isAdmin && user.tenantId !== session?.user?.tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Not authorized to view this user');
        }

        const { password, ...safeUser } = user;
        return NextResponse.json(safeUser);
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            level: 'ERROR',
            source: 'API_ADMIN_USERS',
            action: 'GET_USER_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Server error').toJSON(),
            { status: 500 }
        );
    } finally {
        const durationMs = Date.now() - start;
        if (durationMs > 200) {
            await logEvento({
                level: 'WARN',
                source: 'API_ADMIN_USERS',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `GET /api/admin/users/[id] took ${durationMs}ms`,
                correlationId,
                details: { durationMs }
            });
        }
    }
}
