import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { AuditService } from '@/services/admin/AuditService';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { z } from 'zod';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';
import bcrypt from 'bcryptjs';

const PinUpdateSchema = z.object({
    pin: z.string().min(4).max(6).regex(/^\d+$/)
});

async function POST_internal(req: Request) {
    const correlationId = crypto.randomUUID();
    try {
        // Use 'profile:write' which is the standard for a user managing their own data
        const session = await requirePermission('profile', 'write');
        console.log('[PIN_UPDATE] Starting update for user:', session.user.email);

        const body = await req.json();
        const { pin } = PinUpdateSchema.parse(body);

        // Hashing PIN for security
        const salt = await bcrypt.genSalt(10);
        const pinHash = await bcrypt.hash(pin, salt);
        console.log('[PIN_UPDATE] PIN hashed successfully');

        // Use connectAuthDB as user data is in the AUTH cluster
        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: session.user.email });

        if (!user) {
            console.error('[PIN_UPDATE] User not found in Auth DB:', session.user.email);
            throw new NotFoundError('User not found');
        }

        console.log('[PIN_UPDATE] Updating user document in Auth DB...');
        await authDb.collection('users').updateOne(
            { email: session.user.email },
            { $set: { technicianPinHash: pinHash, updatedAt: new Date() } }
        );

        // Record Audit Trail
        console.log('[PIN_UPDATE] Recording audit trail...');
        try {
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
            console.log('[PIN_UPDATE] Audit record successful');
        } catch (auditError) {
            console.error('[PIN_UPDATE] Audit recording failed:', auditError);
        }

        return NextResponse.json({
            success: true,
            correlationId
        });
    } catch (error) {
        console.error('[PIN_UPDATE] Final error:', error);
        return handleApiError(error, 'API_USER_PROFILE_PIN_POST', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/user/profile/pin', thresholdMs: 1000 });
