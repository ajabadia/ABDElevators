import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth';
import { logEvento } from '../lib/logger';

export interface NextAuthRequest extends NextRequest {
    auth: Session | null;
}

export type MiddlewareModule = (
    request: NextAuthRequest,
    session: Session | null,
    correlationId: string
) => Promise<NextResponse | null>;

export interface ExtendedUser {
    id: string;
    tenantId?: string;
    role?: string;
    mfaPending?: boolean;
    mfaVerified?: boolean;
    industry?: string;
}



/**
 * Helper to log events from middleware modules with internal consistency.
 */
export async function logMiddlewareEvent(params: {
    correlationId: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    action: string;
    message: string;
    details?: Record<string, unknown>;
    session?: Session | null;
}) {
    const user = params.session?.user as ExtendedUser | undefined;
    return logEvento({
        correlationId: params.correlationId,
        level: params.level,
        source: 'MIDDLEWARE',
        action: params.action,
        message: params.message,
        details: params.details as Record<string, any>,
        tenantId: user?.tenantId,
        userId: user?.id
    });
}


