
import { AppError } from '@/lib/errors';
import { GuardianEngine } from '@/core/guardian/GuardianEngine';
import { logEvento } from '@/lib/logger';

/**
 * Enforces a permission check in a server-side context (API or Action).
 * Throws AppError if unauthorized.
 */
export async function enforcePermission(resource: string, action: string) {
    // Dynamic import to avoid Next.js module issues in standalone scripts
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    if (!session?.user) {
        throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const engine = GuardianEngine.getInstance();
    const result = await engine.evaluate(
        session.user,
        resource,
        action
    );

    if (!result.allowed) {
        await logEvento({
            level: 'WARN',
            source: 'GUARDIAN_ENFORCE',
            action: 'PERMISSION_DENIED',
            message: `Permission denied for ${session.user.email} on ${resource}:${action}`,
            correlationId: session.user.id,
            details: { reason: result.reason, resource, action }
        });
        throw new AppError('FORBIDDEN', 403, `Permission denied: ${result.reason}`);
    }

    await logEvento({
        level: 'DEBUG',
        source: 'GUARDIAN_ENFORCE',
        action: 'PERMISSION_GRANTED',
        message: `Permission granted for ${session.user.email} on ${resource}:${action}`,
        correlationId: session.user.id,
        details: { resource, action }
    });

    return session;
}
