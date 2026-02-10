/**
 * Service Account Authentication for Background Workers
 * 
 * Single Responsibility: Generate and validate worker authentication tokens
 * Max Lines: < 100 (Modularization Rule)
 * 
 * Banking-Grade Traceability:
 * - All token generation/validation logged immutably
 * - Token includes cryptographic signature for non-repudiation
 * - Audit trail for worker identity verification
 */

import jwt from 'jsonwebtoken';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

/**
 * Worker token payload
 */
export interface WorkerTokenPayload {
    workerId: string;
    tenantId: string;
    scope: 'INGEST_WORKER';
    correlationId: string;
    iat: number; // Issued at
    exp: number; // Expiration
}

/**
 * Service Account Authentication
 * 
 * Provides secure authentication for background workers:
 * - JWT-based tokens with expiration
 * - Cryptographic signature verification
 * - Immutable audit trail for worker actions
 */
export class ServiceAccountAuth {
    private static readonly WORKER_SECRET = process.env.WORKER_JWT_SECRET || 'REPLACE_IN_PRODUCTION';
    private static readonly TOKEN_EXPIRATION = '1h'; // 1 hour validity

    /**
     * Create JWT token for ingest worker
     * 
     * @param tenantId - Tenant context for this worker session
     * @param correlationId - Request correlation ID for audit trail
     * @returns Signed JWT token
     */
    static async createWorkerToken(
        tenantId: string,
        correlationId: string
    ): Promise<string> {
        const payload: Omit<WorkerTokenPayload, 'iat' | 'exp'> = {
            workerId: 'system_ingest_worker',
            tenantId,
            scope: 'INGEST_WORKER',
            correlationId,
        };

        const token = jwt.sign(payload, this.WORKER_SECRET, {
            expiresIn: this.TOKEN_EXPIRATION,
        });

        // Log token creation (banking-grade audit)
        await logEvento({
            level: 'INFO',
            source: 'SERVICE_ACCOUNT_AUTH',
            action: 'WORKER_TOKEN_CREATED',
            message: 'Background worker token generated',
            correlationId,
            details: {
                workerId: payload.workerId,
                tenantId,
                scope: payload.scope,
                expiresIn: this.TOKEN_EXPIRATION,
                timestamp: new Date().toISOString(),
            },
        });

        return token;
    }

    /**
     * Validate worker token
     * 
     * @param token - JWT token to validate
     * @returns Decoded payload if valid
     * @throws AppError if token is invalid or expired
     */
    static async validateToken(token: string): Promise<WorkerTokenPayload> {
        try {
            const payload = jwt.verify(token, this.WORKER_SECRET) as WorkerTokenPayload;

            // Log successful validation (audit trail)
            await logEvento({
                level: 'DEBUG',
                source: 'SERVICE_ACCOUNT_AUTH',
                action: 'WORKER_TOKEN_VALIDATED',
                message: 'Worker token validated successfully',
                correlationId: payload.correlationId,
                details: {
                    workerId: payload.workerId,
                    tenantId: payload.tenantId,
                    timestamp: new Date().toISOString(),
                },
            });

            return payload;
        } catch (error) {
            const err = error as Error;

            // Log validation failure (banking-grade forensics)
            await logEvento({
                level: 'ERROR',
                source: 'SERVICE_ACCOUNT_AUTH',
                action: 'WORKER_TOKEN_VALIDATION_FAILED',
                message: 'Worker token validation failed',
                correlationId: 'unknown',
                details: {
                    errorName: err.name,
                    errorMessage: err.message,
                    timestamp: new Date().toISOString(),
                },
            });

            throw new AppError('UNAUTHORIZED', 401, 'Invalid worker token');
        }
    }
}
