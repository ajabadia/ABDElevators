import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

const UserPreferencesSchema = z.object({
    preferences: z.array(z.object({
        type: z.enum(['SYSTEM', 'ANALYSIS_COMPLETE', 'RISK_ALERT', 'BILLING_EVENT', 'SECURITY_ALERT']),
        email: z.boolean(),
        inApp: z.boolean()
    }))
});

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await req.json();
        const { preferences } = UserPreferencesSchema.parse(body);

        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: session.user.email }); // Added this line
        await authDb.collection('users').updateOne(
            { email: session.user.email },
            {
                $set: {
                    notificationPreferences: preferences,
                    modificado: new Date()
                }
            }
        );

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
