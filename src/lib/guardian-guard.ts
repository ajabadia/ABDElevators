
import { AppError } from '@/lib/errors';
import { GuardianEngine } from '@/core/guardian/GuardianEngine';

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
        throw new AppError('FORBIDDEN', 403, `Permission denied: ${result.reason}`);
    }

    return session;
}
