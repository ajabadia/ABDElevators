/**
 * Guardian Authorization for Ingestion System
 * 
 * Single Responsibility: Enforce Guardian V3 policies for document ingestion
 * Max Lines: < 150 (Modularization Rule)
 * 
 * Banking-Grade Traceability:
 * - All authorization decisions are logged immutably
 * - Includes correlation IDs for complete audit trail
 * - Logs denials with attempt context for forensic analysis
 */

import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import type { Session } from 'next-auth';

/**
 * Scope levels for ingestion (4-level hierarchy)
 */
export type IngestScope = 'USER' | 'TENANT' | 'INDUSTRY' | 'GLOBAL';

/**
 * Authorization context for Guardian policy evaluation
 */
export interface IngestAuthContext {
    scope: IngestScope;
    ownerUserId?: string;
    industry?: string;
    tenantId: string;
    correlationId: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Guardian Authorization for Ingestion
 * 
 * Enforces multi-level permission model:
 * - USER: Personal user spaces
 * - TENANT: Tenant-shared library
 * - INDUSTRY: Industry-wide resources
 * - GLOBAL: Cross-tenant/industry knowledge
 */
export class IngestGuardian {
    /**
     * Authorize ingestion request
     * 
     * @throws AppError with code 'FORBIDDEN' if authorization fails
     */
    static async authorize(
        session: Session | null,
        context: IngestAuthContext
    ): Promise<void> {
        const startTime = Date.now();

        if (!session?.user) {
            await this.logAuthorizationFailure('NO_SESSION', context, null);
            throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
        }

        // SUPER_ADMIN bypass: can act as any role/scope
        if (this.isSuperAdmin(session)) {
            await this.logSuperAdminBypass(session, context);
            return; // Authorized
        }

        // Validate scope-specific permissions
        const isAuthorized = await this.evaluateScopePermission(session, context);

        if (!isAuthorized) {
            await this.logAuthorizationFailure('INSUFFICIENT_PERMISSIONS', context, session);
            throw new AppError(
                'FORBIDDEN',
                403,
                `Insufficient permissions for ${context.scope} scope ingestion`
            );
        }

        // Log successful authorization (banking-grade audit)
        await this.logAuthorizationSuccess(session, context, Date.now() - startTime);
    }

    /**
     * Check if user is SUPER_ADMIN
     */
    static isSuperAdmin(session: Session): boolean {
        return session.user.role === 'SUPER_ADMIN';
    }

    /**
     * Evaluate scope-specific permissions
     */
    private static async evaluateScopePermission(
        session: Session,
        context: IngestAuthContext
    ): Promise<boolean> {
        const { scope, ownerUserId, industry, tenantId } = context;
        const { role, id: userId, tenantId: userTenantId } = session.user;

        switch (scope) {
            case 'USER':
                // USER scope: owner must match session user
                return ownerUserId === userId && tenantId === userTenantId;

            case 'TENANT':
                // TENANT scope: ADMIN or SUPER_ADMIN of same tenant
                return (
                    (role === 'ADMIN' || role === 'SUPER_ADMIN') &&
                    tenantId === userTenantId
                );

            case 'INDUSTRY':
                // INDUSTRY scope: SUPER_ADMIN only (for now)
                // TODO: Add industry manager role when implemented
                return role === 'SUPER_ADMIN';

            case 'GLOBAL':
                // GLOBAL scope: SUPER_ADMIN only
                return role === 'SUPER_ADMIN';

            default:
                return false;
        }
    }

    /**
     * Log SUPER_ADMIN bypass (banking-grade audit)
     */
    private static async logSuperAdminBypass(
        session: Session,
        context: IngestAuthContext
    ): Promise<void> {
        await logEvento({
            level: 'WARN', // WARN: privileged action
            source: 'INGEST_GUARDIAN',
            action: 'SUPERADMIN_BYPASS',
            message: 'SUPER_ADMIN bypassed Guardian authorization',
            correlationId: context.correlationId,
            details: {
                userId: session.user.id,
                userEmail: session.user.email,
                userRole: session.user.role,
                targetScope: context.scope,
                targetTenantId: context.tenantId,
                targetUserId: context.ownerUserId,
                targetIndustry: context.industry,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log successful authorization (banking-grade audit)
     */
    private static async logAuthorizationSuccess(
        session: Session,
        context: IngestAuthContext,
        durationMs: number
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'INGEST_GUARDIAN',
            action: 'AUTHORIZATION_SUCCESS',
            message: `User authorized for ${context.scope} scope ingestion`,
            correlationId: context.correlationId,
            details: {
                userId: session.user.id,
                userEmail: session.user.email,
                userRole: session.user.role,
                scope: context.scope,
                tenantId: context.tenantId,
                ownerUserId: context.ownerUserId,
                industry: context.industry,
                durationMs,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log authorization failure (banking-grade audit - forensic analysis)
     */
    private static async logAuthorizationFailure(
        reason: 'NO_SESSION' | 'INSUFFICIENT_PERMISSIONS',
        context: IngestAuthContext,
        session: Session | null
    ): Promise<void> {
        await logEvento({
            level: 'ERROR',
            source: 'INGEST_GUARDIAN',
            action: 'AUTHORIZATION_FAILED',
            message: `Authorization denied: ${reason}`,
            correlationId: context.correlationId,
            details: {
                reason,
                attemptedScope: context.scope,
                targetTenantId: context.tenantId,
                targetUserId: context.ownerUserId,
                targetIndustry: context.industry,
                userId: session?.user?.id,
                userEmail: session?.user?.email,
                userRole: session?.user?.role,
                userTenantId: session?.user?.tenantId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
