import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { requirePermission } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { AdminUpdateUserSchema } from '@/lib/schemas';
import { ValidationError, NotFoundError, handleApiError, AppError } from '@/lib/errors';
import { z } from 'zod';
import { UserRole } from '@/types/roles';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';

const API_SOURCE = 'API_ADMIN_USERS_ID';

/**
 * PATCH /api/admin/users/[id]
 * Updates a user's data (ADMIN only)
 * SLA: P95 < 400ms
 */
async function PATCH_internal(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_USERS', action: 'UPDATE_USER' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user', 'manage');
                const isAdmin = session.user.role === UserRole.ADMIN;

                const { id } = await params;
                const body = await req.json();

                // RULE #2: Zod Validation BEFORE Processing
                const validated = AdminUpdateUserSchema.parse(body);

                // 🛡️ [PHASE 460] STANDARDIZED USER DISCOVERY
                const users = await getTenantCollection<any>('users', session as any, 'AUTH');

                // Isolation: If Admin, verify that the user to edit belongs to their tenant
                if (isAdmin) {
                    const userToEdit = await users.findOne({ _id: new ObjectId(id) });
                    if (!userToEdit) {
                        throw new NotFoundError('User not found in AUTH cluster');
                    }
                    if (userToEdit.tenantId !== session.user.tenantId) {
                        await log({
                            level: 'WARN',
                            action: 'CROSS_TENANT_ACCESS_ATTEMPT',
                            message: `Admin ${session.user.email} attempted to modify user from another tenant: ${id}`,
                            details: { targetUserId: id, adminTenant: session.user.tenantId, userTenant: userToEdit.tenantId }
                        });
                        throw new AppError('FORBIDDEN', 403, 'You do not have permission to modify users from other organizations');
                    }
                }

                const updateData = {
                    ...validated,
                    updatedAt: new Date()
                };

                const result = await users.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.matchedCount === 0) {
                    throw new NotFoundError('User not found');
                }

                await log({
                    message: `User updated: ${id}`,
                    details: { userId: id, updatedFields: Object.keys(validated) }
                });

                return NextResponse.json({ success: true });
            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    return handleApiError(new ValidationError('Invalid update data', error.issues), API_SOURCE, correlationId);
                }
                return handleApiError(error, API_SOURCE, correlationId);
            }
        }
    );
}

/**
 * GET /api/admin/users/[id]
 * Retrieves a user by ID
 * SLA: P95 < 200ms
 */
async function GET_internal(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_USERS', action: 'GET_USER' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user', 'read');
                const isAdmin = session.user.role === UserRole.ADMIN;

                const { id } = await params;
                
                // 🛡️ [PHASE 460] STANDARDIZED USER DISCOVERY
                const users = await getTenantCollection<any>('users', session as any, 'AUTH');
                const userToEdit = await users.findOne({ _id: new ObjectId(id) });

                if (!userToEdit) {
                    throw new NotFoundError('User not found in AUTH cluster');
                }

                // Isolation: If Admin, verify tenantId
                if (isAdmin && userToEdit.tenantId !== session.user.tenantId) {
                    throw new AppError('FORBIDDEN', 403, 'Not authorized to view this user');
                }

                await log({
                    message: `Admin retrieved details for user ${id}`,
                    details: { userId: id, targetEmail: userToEdit.email }
                });

                const { password, mfaSecret, activationToken, ...safeUser } = userToEdit;
                return NextResponse.json(safeUser);
            } catch (error: unknown) {
                return handleApiError(error, API_SOURCE, correlationId);
            }
        }
    );
}

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/users/[id]', thresholdMs: 400 });
export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/users/[id]', thresholdMs: 200 });
