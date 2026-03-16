import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { AuditService } from '@/services/admin/AuditService';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { z } from 'zod';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';
import bcrypt from 'bcryptjs';

const PinUpdateSchema = z.object({
    pin: z.string().min(4).max(6).regex(/^\d+$/)
});

export const POST = withPerformanceSLA(async (req: Request) =>
    withCorrelation(
        { level: 'INFO', source: 'APIUSERPROFILEPIN', action: 'UPDATEPIN' },
        async ({ log, correlationId }) => {
            try {
                // Use 'profile:write' which is the standard for a user managing their own data
                const session = await requirePermission('profile', 'write');

                const body = await req.json();
                const { pin } = PinUpdateSchema.parse(body);

                // Hashing PIN for security
                const salt = await bcrypt.genSalt(10);
                const pinHash = await bcrypt.hash(pin, salt);

                // Use connectAuthDB as user data is in the AUTH cluster
                const authDb = await connectAuthDB();
                const user = await authDb.collection('users').findOne({ email: session.user.email });

                if (!user) {
                    throw new NotFoundError('User not found');
                }

                await authDb.collection('users').updateOne(
                    { email: session.user.email },
                    { $set: { technicianPinHash: pinHash, updatedAt: new Date() } }
                );

                // Record Audit Trail
                await AuditService.record({
                    actorType: 'USER',
                    actorId: EntityIdSchema.parse(session.user.id),
                    tenantId: TenantIdSchema.parse(session.user.tenantId),
                    source: 'ADMIN_OP',
                    action: 'UPDATE_TECHNICIAN_PIN',
                    entityType: 'USER',
                    entityId: EntityIdSchema.parse(session.user.id),
                    correlationId
                });

                await log({
                    message: 'User technician PIN updated',
                    details: {
                        userId: session.user.id,
                        tenantId: session.user.tenantId
                    }
                });

                return NextResponse.json({
                    success: true,
                    correlationId
                });
            } catch (error) {
                return handleApiError(error, 'APIUSERPROFILEPIN', correlationId);
            }
        }
    ),
    { endpoint: 'POST /api/user/profile/pin', thresholdMs: 1000 }
);
