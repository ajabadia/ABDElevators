import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { connectDB, logEvento } from '@abd/platform-core/server';
import { AppError } from '@abd/platform-core';
import { ObjectId } from 'mongodb';

const UxModeRequestSchema = z.object({
    uxMode: z.enum(['simple', 'expert']),
});

/**
 * Update User UX Mode Preference
 * POST /api/user/ux-mode
 * FASE 253: UX MODE SIMPLE vs EXPERT
 */
export async function POST(req: Request) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new AppError('UNAUTHORIZED', 401, 'Debes iniciar sesión');
        }

        const body = await req.json();
        const validated = UxModeRequestSchema.parse(body);

        const db = await connectDB();
        const users = db.collection('users');

        const result = await users.updateOne(
            { _id: new ObjectId(session.user.id) },
            {
                $set: {
                    'preferences.uxMode': validated.uxMode,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Usuario no encontrado');
        }

        await logEvento({
            level: 'INFO',
            source: 'API_USER_PREFERENCES',
            action: 'UPDATE_UX_MODE',
            message: `User ${session.user.email} updated UX mode to ${validated.uxMode}`,
            correlationId,
            details: { userId: session.user.id, uxMode: validated.uxMode }
        });

        return NextResponse.json({ success: true, uxMode: validated.uxMode });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'INVALID_INPUT', details: error.format() }, { status: 400 });
        }
        if (error instanceof AppError) {
            return NextResponse.json({ code: error.code, message: error.message }, { status: error.status });
        }

        console.error('[API_USER_UX_MODE] Error:', error);
        return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }, { status: 500 });
    } finally {
        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_USER_PREFERENCES',
                action: 'PERFORMANCE_SLA_BREACH',
                message: 'Endpoint /api/user/ux-mode exceeded 500ms SLA',
                correlationId,
                details: { duration_ms: duration }
            });
        }
    }
}
