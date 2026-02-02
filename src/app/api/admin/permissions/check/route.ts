import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GuardianEngine } from '@/core/guardian/GuardianEngine';
import { AppError, ValidationError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';

const CheckSchema = z.object({
    resource: z.string(),
    action: z.string()
});

export async function POST(req: Request) {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Session required for permission check');
        }

        const body = await req.json();
        const validated = CheckSchema.parse(body);

        const engine = GuardianEngine.getInstance();
        const result = await engine.evaluate(
            session.user as any,
            validated.resource,
            validated.action,
            {
                ip: req.headers.get('x-forwarded-for') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown'
            }
        );

        // Security Logging (Audit)
        if (!result.allowed) {
            await logEvento({
                level: 'WARN',
                source: 'GUARDIAN',
                action: 'ACCESS_DENIED',
                message: `Access denied for ${session.user.email} on ${validated.resource}:${validated.action}. Reason: ${result.reason}`,
                correlationId,
                tenantId: session.user.tenantId
            });
        }

        const duration = Date.now() - startTime;

        return NextResponse.json({
            allowed: result.allowed,
            reason: result.reason,
            durationMs: duration
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }
        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('[Guardian API] Critical Error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
