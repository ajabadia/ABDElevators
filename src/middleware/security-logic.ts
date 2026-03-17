import { NextResponse } from 'next/server';
import { MiddlewareModule, logMiddlewareEvent, ExtendedUser } from './utils';

import { sanitizer, REGEX } from '../lib/sanitization';

/**
 * Consolidates security-specific checks including internal subrequest tokens,
 * CSRF protection, and MFA enforcement.
 */
export const securityLogic: MiddlewareModule = async (request, session, correlationId) => {
    const { pathname } = request.nextUrl;
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const allowedHost = process.env.APP_DOMAIN || 'localhost';

    // 1. CVE-2025-29927: Internal Subrequest Token Validation
    const subrequestToken = request.headers.get('x-middleware-subrequest');
    if (subrequestToken) {
        request.headers.delete('x-middleware-subrequest'); // Always delete to prevent forwarding
        if (!REGEX.MIDDLEWARE_TOKEN.test(subrequestToken)) {
            await logMiddlewareEvent({
                correlationId,
                level: 'ERROR',
                action: 'CVE-2025-29927_BLOCKED',
                message: `Invalid internal subrequest token blocked from IP: ${sanitizer.ip(ip)}`,
                details: { ip: sanitizer.ip(ip), pathname: sanitizer.path(pathname) },
                session
            });
            return new NextResponse(JSON.stringify({ success: false, code: 'SECURITY_VIOLATION', message: 'Internal Security Violation' }), { 
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // 2. CSRF Protection for Mutations
    const method = request.method;
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isExempt = 
        pathname.startsWith('/api/auth') || 
        pathname.startsWith('/api/internal/') || 
        pathname === '/api/logs';

    if (isMutation && !isExempt) {
        const csrfToken = request.headers.get('x-csrf-token');
        const origin = request.headers.get('origin');

        if (!csrfToken) {
            await logMiddlewareEvent({
                correlationId,
                level: 'WARN',
                action: 'CSRF_MISSING_HEADER',
                message: `Missing x-csrf-token on ${method} ${pathname}`,
                session
            });
            return new NextResponse(JSON.stringify({ success: false, message: "CSRF token required" }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (origin && !origin.includes(allowedHost.split(':')[0])) {
            await logMiddlewareEvent({
                correlationId,
                level: 'ERROR',
                action: 'CSRF_ORIGIN_MISMATCH',
                message: `CSRF Origin mismatch: ${origin} vs ${allowedHost}`,
                details: { origin, allowedHost },
                session
            });
            return new NextResponse(JSON.stringify({ success: false, message: "Invalid Origin" }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // 3. MFA Enforcement
    const user = session?.user as ExtendedUser | undefined;
    const isMfaPending = user?.mfaPending === true;

    const isMfaAllowedPath = 
        pathname.startsWith('/api/auth') || 
        pathname === '/login' || 
        pathname === '/settings/profile';

    if (isMfaPending && !isMfaAllowedPath) {
        await logMiddlewareEvent({
            correlationId,
            level: 'INFO',
            action: 'MFA_REDIRECT',
            message: `Redirigiendo a /settings/profile para completar MFA: ${pathname}`,
            details: { pathname },
            session
        });

        if (pathname.startsWith('/api/')) {
            return new NextResponse(JSON.stringify({
                success: false,
                code: 'MFA_REQUIRED',
                message: 'MFA Setup required'
            }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        return NextResponse.redirect(new URL('/settings/profile', request.url));
    }

    return null;
};
