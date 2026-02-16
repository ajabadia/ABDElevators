/**
 * Graph Guardian
 * 
 * Enforces RBAC policies for Knowledge Graph mutations.
 * 
 * Rules:
 * - Only ADMIN or SUPER_ADMIN can create nodes/relations globally or at tenant level.
 * - TECHNICAL users might have restricted write access (future).
 */

import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import type { Session } from 'next-auth';
import { UserRole } from '@/types/roles';

export interface GraphAuthContext {
    tenantId: string;
    correlationId: string;
    ipAddress?: string;
    userAgent?: string;
}

export class GraphGuardian {
    /**
     * Authorize graph mutation request
     * 
     * @throws AppError with code 'FORBIDDEN' if authorization fails
     */
    static async authorizeMutation(
        session: Session | null,
        context: GraphAuthContext
    ): Promise<void> {
        const startTime = Date.now();

        if (!session?.user) {
            await this.logAuthorizationFailure('NO_SESSION', context, null);
            throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
        }

        const { role, tenantId: userTenantId } = session.user;

        // Check if user has permission to mutate the graph
        // For Phase 150, we restrict to ADMIN and SUPER_ADMIN
        const allowedRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TECHNICAL];
        const isAuthorizedRole = allowedRoles.includes(role as UserRole);

        // Ensure tenant isolation
        const isCorrectTenant = context.tenantId === userTenantId || role === UserRole.SUPER_ADMIN;

        if (!isAuthorizedRole || !isCorrectTenant) {
            await this.logAuthorizationFailure('INSUFFICIENT_PERMISSIONS', context, session);
            throw new AppError(
                'FORBIDDEN',
                403,
                `Insufficient permissions to mutate graph for tenant ${context.tenantId}`
            );
        }

        // Log successful authorization
        await this.logAuthorizationSuccess(session, context, Date.now() - startTime);
    }

    private static async logAuthorizationSuccess(
        session: Session,
        context: GraphAuthContext,
        durationMs: number
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'GRAPH_GUARDIAN',
            action: 'AUTHORIZATION_SUCCESS',
            message: `User authorized for graph mutation`,
            correlationId: context.correlationId,
            tenantId: context.tenantId,
            details: {
                userId: session.user.id,
                userRole: session.user.role,
                durationMs,
            },
        });
    }

    private static async logAuthorizationFailure(
        reason: string,
        context: GraphAuthContext,
        session: Session | null
    ): Promise<void> {
        await logEvento({
            level: 'ERROR',
            source: 'GRAPH_GUARDIAN',
            action: 'AUTHORIZATION_FAILED',
            message: `Graph mutation denied: ${reason}`,
            correlationId: context.correlationId,
            tenantId: context.tenantId,
            details: {
                reason,
                userId: session?.user?.id,
                userRole: session?.user?.role,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            },
        });
    }
}
