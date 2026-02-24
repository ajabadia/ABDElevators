import { NextResponse } from 'next/server';
import { GuardianEngine } from '@/core/guardian/GuardianEngine';
import { AppError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { enforcePermission } from '@/lib/guardian-guard';
import { z } from 'zod';
import crypto from 'crypto';

const CheckItemSchema = z.object({
    resource: z.string(),
    action: z.string()
});

const CheckSchema = z.union([
    CheckItemSchema,
    z.array(CheckItemSchema)
]);

export async function POST(req: Request) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        // ERA 8: Guardian Oracle Pattern. 
        // We only require authentication, not restricted administrative permissions to check one's own rights.
        const { auth } = await import('@/lib/auth');
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
        }
        const user = session.user;

        const body = await req.json();
        const validated = CheckSchema.parse(body);
        const checks = Array.isArray(validated) ? validated : [validated];

        const engine = GuardianEngine.getInstance();
        const results = await Promise.all(checks.map(async (check) => {
            const result = await engine.evaluate(
                user as any,
                check.resource,
                check.action,
                {
                    ip: req.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: req.headers.get('user-agent') || 'unknown'
                }
            );

            // Security Logging (Audit) for Denials
            if (!result.allowed) {
                await logEvento({
                    level: 'WARN',
                    source: 'GUARDIAN',
                    action: 'ACCESS_DENIED',
                    message: `Access denied for ${(user as any).email} on ${check.resource}:${check.action}. Reason: ${result.reason}`,
                    correlationId,
                    tenantId: (user as any).tenantId
                });
            }

            return {
                resource: check.resource,
                action: check.action,
                allowed: result.allowed,
                reason: result.reason
            };
        }));

        const isBulk = Array.isArray(validated);
        return NextResponse.json(isBulk ? { results } : results[0]);

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PERMISSIONS_CHECK_POST', correlationId);
    } finally {
        const duration = Date.now() - start;
        if (duration > 500) { // SLA Simulator: P95 < 500ms
            await logEvento({
                level: 'WARN',
                source: 'API_PERMISSIONS',
                action: 'PERF_SLA_VIOLATION',
                message: `POST /api/admin/permissions/check tardó ${duration}ms`,
                correlationId,
                details: { duration_ms: duration, threshold_ms: 500 }
            });
        }
    }
}
