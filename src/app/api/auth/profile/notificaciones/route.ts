import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

const UserPreferencesSchema = z.object({
    preferences: z.array(z.object({
        type: z.enum(['SYSTEM', 'ANALYSIS_COMPLETE', 'RISK_ALERT', 'BILLING_EVENT', 'SECURITY_ALERT']),
        email: z.boolean(),
        inApp: z.boolean()
    }))
});

async function PATCH_internal(req: NextRequest) {
    try {
        const session = await requirePermission('profile', 'write');

        const body = await req.json();
        const { preferences } = UserPreferencesSchema.parse(body);

        const authDb = await connectAuthDB();
        await authDb.collection('users').updateOne(
            { email: session.user.email },
            {
                $set: {
                    notificationPreferences: preferences,
                    updatedAt: new Date()
                }
            }
        );

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
        }
        const status = error instanceof AppError ? error.status : 500;
        const message = error instanceof Error ? error.message : 'Unknown notification preference error';
        return NextResponse.json({ error: message }, { status });
    }
}

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/auth/profile/notificaciones', thresholdMs: 1000 });
