import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { UserRole } from '@/types/roles';

/**
 * Require valid session in API Routes (Defense in Depth).
 * Re-verifies authentication even if middleware was theoretically bypassed.
 */
export async function requireAuth() {
    const session = await auth();
    if (!session || !session.user) {
        throw new AppError('UNAUTHORIZED', 401, 'Sesión no válida o expirada');
    }
    return session;
}

/**
 * Require specific role in API Routes.
 */
export async function requireRole(allowedRoles: (UserRole | string)[]) {
    const session = await requireAuth();

    if (!allowedRoles.includes(session.user.role)) {
        throw new AppError('FORBIDDEN', 403, 'No tiene permisos suficientes para esta operación');
    }

    return session;
}

/**
 * Helper to ensure a tenantId from request matches the session (IDOR Protection).
 */
export function validateTenantOwnership(sessionTenantId: string, requestedTenantId: string | null) {
    if (requestedTenantId && sessionTenantId !== requestedTenantId) {
        throw new AppError('FORBIDDEN', 403, 'Acceso denegado: El recurso no pertenece a su organización');
    }
}

/**
 * Validates CSRF header in API Routes (Third layer of defense).
 */
export function requireCsrf(req: NextRequest) {
    const csrfToken = req.headers.get('x-csrf-token');
    if (!csrfToken) {
        throw new AppError('FORBIDDEN', 403, 'CSRF token required (Defense in Depth)');
    }
}
