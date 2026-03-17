import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';
import { CorrelationIdService } from './services/observability/CorrelationIdService';
import { logEvento } from './lib/logger';
import { sanitizer } from './lib/sanitization';

// Modular Middleware Imports
import { NextAuthRequest, logMiddlewareEvent, ExtendedUser } from './middleware/utils';

import { hostValidation } from './middleware/host-validation';
import { securityLogic } from './middleware/security-logic';
import { rateLimiting } from './middleware/rate-limiting';
import { apiAuth } from './middleware/api-auth';
import { applySecurityHeaders } from './middleware/headers';

const { auth } = NextAuth(authConfig);

export const config = {
    // Broaden matcher to intercept all routes for logic-based filtering
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};

/**
 * Main Middleware Orchestrator
 * Sequentially calls specialized modules to handle Host Validation, Security Logic, 
 * Rate Limiting, and Authentication.
 */
export default auth(async function middleware(request: NextAuthRequest) {
    const { pathname } = request.nextUrl;
    const session = request.auth;
    const correlationId = CorrelationIdService.fromRequest(request);

    try {
        // 1. Host Header & Domain Validation (Critical P0)
        const hostError = await hostValidation(request, session, correlationId);
        if (hostError) return hostError;

        // 2. Security Logic (CVE Mitigation, CSRF, MFA)
        const securityError = await securityLogic(request, session, correlationId);
        if (securityError) return securityError;

        // 3. Rate Limiting (API & Auth)
        const rateLimitError = await rateLimiting(request, session, correlationId);
        if (rateLimitError) return rateLimitError;

        // 4. Trace route access for debugging
        const monitoredPaths = ['/admin-dashboard', '/dashboard', '/work', '/intelligence', '/agents', '/insights'];
        if (monitoredPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
            const user = session?.user as ExtendedUser | undefined;
            await logMiddlewareEvent({
                correlationId,
                level: 'DEBUG',
                action: 'ROUTE_ACCESS',
                message: `Acceso a ruta: ${sanitizer.path(pathname)}`,
                details: {
                    pathname: sanitizer.path(pathname),
                    hasSession: !!session,
                    mfaStatus: user ? (user.mfaVerified ? 'VERIFIED' : (user.mfaPending ? 'PENDING' : 'OFF')) : 'N/A'
                },
                session
            });
        }


        // 5. Authentication & Authorization Gateways
        const publicPaths = ['/', '/login', '/pricing', '/terms', '/privacy', '/contact', '/about', '/features', '/auth'];
        const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/')) || pathname.startsWith('/api/pricing') || pathname.startsWith('/api/auth') || pathname === '/favicon.ico' || pathname.startsWith('/_next');

        // Internal gateways (API Secret / API Key)
        const apiAuthResult = await apiAuth(request, session, correlationId);
        if (apiAuthResult) return apiAuthResult;

        // Session-based protection for private routes
        if (!session && !isPublicPath && !pathname.startsWith('/api/internal/')) {
            if (pathname.startsWith('/api/')) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Redirect logged-in users away from /login unless MFA is pending
        const user = session?.user as ExtendedUser | undefined;
        if (session && pathname === '/login' && !user?.mfaPending) {
            return NextResponse.redirect(new URL('/admin-dashboard', request.url));
        }


        // 6. Finalize: Apply Security Headers
        const response = NextResponse.next();
        return await applySecurityHeaders(request, response, correlationId);

    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        await logEvento({
            correlationId,
            level: 'ERROR',
            source: 'MIDDLEWARE',
            action: 'UNEXPECTED_ERROR_MAIN',
            message: `Error crítico en el orquestador de middleware: ${errorMsg}`,
            details: { 
                pathname, 
                error: errorMsg,
                stack: error instanceof Error ? error.stack : undefined 
            },
            tenantId: (session?.user as ExtendedUser | undefined)?.tenantId
        });


        return new NextResponse(JSON.stringify({
            success: false,
            code: 'MIDDLEWARE_ERROR',
            message: 'Internal processing error'
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'X-Error-Reference': correlationId 
            }
        });
    }
});

