import { NextResponse } from 'next/server';
import { GuardianEngine } from '@/core/guardian/GuardianEngine';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { enforcePermission } from '@/lib/guardian-guard';
import { z } from 'zod';
import crypto from 'crypto';

const CheckSchema = z.object({
    resource: z.string(),
    action: z.string()
});

export async function POST(req: Request) {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
        const user = await enforcePermission('permission:simulator', 'execute');

        const body = await req.json();
        const validated = CheckSchema.parse(body);

        const engine = GuardianEngine.getInstance();
        const result = await engine.evaluate(
            user as any,
            validated.resource,
            validated.action,
            {
                ip: body.context?.ip || req.headers.get('x-forwarded-for') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown'
            }
        );

        // Security Logging (Audit)
        if (!result.allowed) {
            await logEvento({
                level: 'WARN',
                source: 'GUARDIAN',
                action: 'ACCESS_DENIED',
                message: `Access denied for ${(user as any).email} on ${validated.resource}:${validated.action}. Reason: ${result.reason}`,
                correlationId,
                tenantId: (user as any).tenantId
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
