import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { UpdateProfileSchema } from '@/lib/schemas';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { maskSensitiveData } from '@/lib/sanitization';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/auth/profile
 * Retrieves the authenticated user's profile.
 * SLA: P95 < 300ms
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_PROFILE', action: 'GET_PROFILE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('profile', 'read');

                // 🛡️ [PHASE 460] STANDARDIZED USER DISCOVERY
                const users = await getTenantCollection<any>('users', session as any, 'AUTH');
                const user = await users.findOne({ email: session.user.email });

                if (!user) {
                    throw new NotFoundError('User not found in AUTH cluster');
                }

                const { password, ...safeUser } = user;
                return NextResponse.json(maskSensitiveData(safeUser));
            } catch (error: unknown) {
                return handleApiError(error, 'API_PROFILE_GET', correlationId);
            }
        }
    );
}

/**
 * PATCH /api/auth/profile
 * Updates the authenticated user's profile.
 * SLA: P95 < 500ms
 */
async function PATCH_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_PROFILE', action: 'UPDATE_PROFILE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('profile', 'write');
                const body = await req.json();

                // RULE #2: Zod Validation BEFORE Processing
                const validated = UpdateProfileSchema.parse(body);
                
                // 🛡️ [PHASE 460] STANDARDIZED USER DISCOVERY
                const users = await getTenantCollection<any>('users', session as any, 'AUTH');
                const currentUser = await users.findOne({ email: session.user.email });

                if (!currentUser) {
                    throw new NotFoundError('User not found in AUTH cluster');
                }

                const isPrivileged = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(currentUser.role as UserRole);
                const identityFields = ['firstName', 'lastName', 'jobTitle'];
                const isAttemptingIdentityChange = identityFields.some(field => body[field] !== undefined);

                if (!isPrivileged && isAttemptingIdentityChange) {
                    const hasActualChange = identityFields.some(field =>
                        body[field] !== undefined && body[field] !== currentUser[field]
                    );

                    if (hasActualChange) {
                        await log({
                            level: 'WARN',
                            message: `User ${session.user.email} attempted to change protected fields`,
                            details: { attemptedFields: Object.keys(body).filter(k => identityFields.includes(k)) }
                        });
                        return NextResponse.json({ error: 'You do not have permission to modify managed identity fields.' }, { status: 403 });
                    }
                }

                const updateData: any = {
                    ...validated,
                    updatedAt: new Date()
                };

                // [PHASE 460] Dot notation for partial preferences update
                if (validated.preferences) {
                    Object.entries(validated.preferences).forEach(([key, value]) => {
                        if (value !== undefined) {
                            updateData[`preferences.${key}`] = value;
                        }
                    });
                    delete updateData.preferences;
                }

                const result = await users.updateOne(
                    { email: session.user.email },
                    { $set: updateData }
                );

                if (result.matchedCount === 0) {
                    throw new NotFoundError('User not found');
                }

                await log({
                    message: `Profile updated for ${session.user.email}`,
                    details: { updatedFields: Object.keys(validated) },
                    tenantId: session.user.tenantId
                });

                return NextResponse.json({ success: true });
            } catch (error: unknown) {
                return handleApiError(error, 'API_PROFILE_PATCH', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/auth/profile', thresholdMs: 300 });

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/auth/profile', thresholdMs: 500 });
