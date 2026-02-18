import { NextResponse } from 'next/server';
import { GuardianEngine } from '@/core/guardian/GuardianEngine';
import { AppError, handleApiError } from '@/lib/errors';
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
    const start = Date.now();

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

        return NextResponse.json({
            allowed: result.allowed,
            reason: result.reason,
            durationMs: Date.now() - start
        });

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
