import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { GuardianEngine } from '@/core/guardian/GuardianEngine';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

const CheckItemSchema = z.object({
    resource: z.string(),
    action: z.string()
});

const CheckSchema = z.union([
    CheckItemSchema,
    z.array(CheckItemSchema)
]);

/**
 * POST /api/admin/permissions/check
 * Oracle for permission verification (Phase 97+ Compliance).
 */
async function POST_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'GUARDIAN', action: 'PERMISSION_CHECK' },
        async ({ log, correlationId }) => {
            try {
                // [SECURITY] Protect the oracle itself
                const session = await requirePermission('system:security', 'read');
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
                        await log({
                            level: 'WARN',
                            message: `Access denied for ${user.email} on ${check.resource}:${check.action}`,
                            details: { resource: check.resource, action: check.action, reason: result.reason }
                        });
                    }

                    return {
                        resource: check.resource,
                        action: check.action,
                        allowed: result.allowed,
                        reason: result.reason
                    };
                }));

                await log({
                    message: `Performed permission check for ${user.email}`,
                    details: { checkCount: checks.length, userEmail: user.email }
                });

                const isBulk = Array.isArray(validated);
                return NextResponse.json(isBulk ? { results } : results[0]);

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_PERMISSIONS_CHECK_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/permissions/check', thresholdMs: 500 });
