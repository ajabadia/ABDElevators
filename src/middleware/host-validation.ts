import { NextResponse } from 'next/server';
import { MiddlewareModule, logMiddlewareEvent } from './utils';

/**
 * Consolidates Host Header and Domain validation to prevent Host Spoofing and SSRF.
 */
export const hostValidation: MiddlewareModule = async (request, session, correlationId) => {
    const { hostname } = request.nextUrl;
    const hostHeader = request.headers.get('host');
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

    const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || '').split(',').map(h => h.trim()).filter(Boolean);
    const APP_DOMAIN = process.env.APP_DOMAIN;
    const VERCEL_URL = process.env.VERCEL_URL;

    const isHostAllowed = (h: string | null) => {
        if (!h) return false;
        
        // Always allow localhost in development
        if (process.env.NODE_ENV === 'development') {
            return h === 'localhost' || h.startsWith('localhost:') || h === '127.0.0.1' || h.startsWith('127.0.0.1:');
        }

        // 1. Check against ALLOWED_HOSTS list
        const inAllowedList = ALLOWED_HOSTS.some(allowed => h === allowed || h.endsWith(`.${allowed}`));
        if (inAllowedList) return true;

        // 2. Check against APP_DOMAIN
        if (APP_DOMAIN && (h === APP_DOMAIN || h.endsWith(`.${APP_DOMAIN}`))) return true;

        // 3. Check against VERCEL_URL (Strict)
        if (VERCEL_URL && h === VERCEL_URL) return true;

        // 4. Wildcard check for Vercel preview deployments (Only if it matches project name pattern)
        if (/^[a-zA-Z0-9-]+\.vercel\.app$/.test(h) && h.includes('abdelevators')) return true;

        return false;
    };

    // Validate both Host header and NextUrl hostname (Spoofing Protection)
    if (!isHostAllowed(hostHeader) || !isHostAllowed(hostname)) {
        await logMiddlewareEvent({
            correlationId,
            level: 'ERROR',
            action: 'INVALID_HOST_BLOCKED',
            message: `Acceso bloqueado desde host no autorizado: Header=${hostHeader}, Hostname=${hostname}`,
            details: { hostHeader, hostname, ip },
            session
        });
        return new NextResponse("Invalid Host", { status: 403 });
    }

    return null;
};
