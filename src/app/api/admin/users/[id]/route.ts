import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { auth, requireRole } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { AdminUpdateUserSchema } from '@/lib/schemas';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';
import { z } from 'zod';
import { UserRole } from '@/types/roles';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * PATCH /api/admin/users/[id]
 * Updates a user's data (ADMIN only)
 * SLA: P95 < 400ms
 */
export const PATCH = withPerformanceSLA(async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const isAdmin = session.user.role === UserRole.ADMIN;

        const { id } = await params;
        const body = await req.json();

        // RULE #2: Zod Validation BEFORE Processing
        const validated = AdminUpdateUserSchema.parse(body);

        const db = await connectAuthDB();

        // Isolation: If Admin, verify that the user to edit belongs to their tenant
        if (isAdmin) {
            const authDb = await connectAuthDB();
            const userToEdit = await authDb.collection('users').findOne({ _id: new ObjectId(id) });
            if (!userToEdit) {
                throw new NotFoundError('User not found');
            }
            if (userToEdit.tenantId !== session.user.tenantId) {
                await logEvento({
                    level: 'WARN',
                    source: 'API_ADMIN_USERS',
                    action: 'CROSS_TENANT_ACCESS_ATTEMPT',
                    message: `Admin ${session.user.email} attempted to modify user from another tenant: ${id}`,
                    correlationId,
                    details: { targetUserId: id, adminTenant: session.user.tenantId, userTenant: userToEdit.tenantId }
                });
                throw new AppError('FORBIDDEN', 403, 'You do not have permission to modify users from other organizations');
            }
        }

        const updateData: any = {
            ...validated,
            updatedAt: new Date()
        };

        const authDb = await connectAuthDB();
        const result = await authDb.collection('users').updateOne(
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
        if (error instanceof z.ZodError) {
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
    }
}, { endpoint: 'PATCH /api/admin/users/[id]', thresholdMs: 400 });

/**
 * GET /api/admin/users/[id]
 * Retrieves a user by ID
 * SLA: P95 < 200ms
 */
export const GET = withPerformanceSLA(async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const isAdmin = session.user.role === UserRole.ADMIN;

        const { id } = await params;
        const authDb = await connectAuthDB();
        const userToEdit = await authDb.collection('users').findOne({ _id: new ObjectId(id) });

        if (!userToEdit) {
            throw new NotFoundError('User not found');
        }

        // Isolation: If Admin, verify tenantId
        if (isAdmin && userToEdit.tenantId !== session.user.tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Not authorized to view this user');
        }

        const { password, ...safeUser } = userToEdit;
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
    }
}, { endpoint: 'GET /api/admin/users/[id]', thresholdMs: 200 });
