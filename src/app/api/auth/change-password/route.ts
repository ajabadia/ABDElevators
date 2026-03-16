import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import bcrypt from 'bcryptjs';
import { ChangePasswordSchema } from '@/lib/schemas';
import { handleApiError, NotFoundError, ValidationError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/auth/change-password
 * Changes the password for the authenticated user.
 * SLA: P95 < 1000ms (due to bcrypt hashing)
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_PROFILE', action: 'CHANGE_PASSWORD' },
        async ({ log, correlationId }) => {
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

                await log({
                    message: `Password changed for ${session.user.email}`,
                    tenantId: session.user.tenantId
                });

                return NextResponse.json({ success: true });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CHANGE_PASSWORD_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/auth/change-password', thresholdMs: 1000 });
