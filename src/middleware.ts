import { NextResponse, NextRequest } from 'next/server';
import NextAuth, { Session } from 'next-auth';
import { authConfig } from './lib/auth.config';
import { checkRateLimit, LIMITS } from './lib/rate-limit';
import { logEvento } from './lib/logger';
import crypto from 'crypto';

const { auth } = NextAuth(authConfig);

export const config = {
    // Broaden matcher to intercept all routes for logic-based filtering
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};

// Interface extension for NextAuth 5 middleware request
interface NextAuthRequest extends NextRequest {
    auth: Session | null;
}

// NextJS Middleware with NextAuth 5 (Beta) wrapper. 
// Note: 'auth' provides the session in 'request.auth'
export default auth(async function middleware(request: NextAuthRequest) {
    const { pathname } = request.nextUrl;
    const session = request.auth;
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const correlationId = crypto.randomUUID();

    // 🛡️ [SECURITY] Rate Limiting (Phase 140)
    // Apply rate limits to API routes
    if (pathname.startsWith('/api/')) {
        const isAuthTarget = pathname.startsWith('/api/auth') && !pathname.includes('/session');
        const limitConfig = isAuthTarget ? LIMITS.AUTH : LIMITS.CORE;
        const rateLimit = await checkRateLimit(ip, limitConfig);

        if (!rateLimit.success) {
            await logEvento({
                level: 'WARN',
                source: 'MIDDLEWARE',
                action: 'RATE_LIMIT_EXCEEDED',
                message: `Rate limit blocked ${ip} on ${pathname}`,
                correlationId,
                details: { ip, pathname, limit: rateLimit.limit }
            });

            return new NextResponse(JSON.stringify({
                success: false,
                message: "Too many requests",
                retryAfter: rateLimit.reset
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': rateLimit.limit.toString(),
                    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                    'X-RateLimit-Reset': rateLimit.reset.toString()
                }
            });
        }
    }

    // Trace path for debugging (Non-sensitive)
    const monitoredPaths = ['/admin', '/dashboard', '/search', '/settings', '/login'];
    if (monitoredPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        await logEvento({
            level: 'DEBUG',
            source: 'MIDDLEWARE',
            action: 'ROUTE_ACCESS',
            message: `Acceso a ruta: ${pathname}`,
            correlationId,
            details: {
                pathname,
                hasSession: !!session,
                user: session?.user?.email ?? 'anonymous',
                mfaStatus: session?.user ? (session.user.mfaVerified ? 'VERIFIED' : (session.user.mfaPending ? 'PENDING' : 'OFF')) : 'N/A'
            }
        });
    }

    try {
        // 1. PUBLIC ROUTES WHITELIST
        const isPublicPath =
            pathname === '/' ||
            pathname === '/login' ||
            pathname === '/pricing' ||
            pathname === '/terms' ||
            pathname === '/privacy' ||
            pathname === '/contact' ||
            pathname === '/accessibility' ||
            pathname === '/about' ||
            pathname === '/architecture' ||
            pathname === '/upgrade' ||
            pathname.startsWith('/features/') ||
            pathname === '/features' ||
            pathname.startsWith('/sandbox/') ||
            pathname === '/sandbox' ||
            pathname.startsWith('/auth') ||
            pathname.startsWith('/api/auth') ||
            pathname.startsWith('/api/pricing') ||
            pathname.startsWith('/_next') ||
            pathname === '/favicon.ico';

        // 🛡️ [PHASE 183] INTERNAL GATEWAY & SECRET ROTATION
        if (pathname.startsWith('/api/internal/')) {
            const internalSecret = request.headers.get("x-internal-secret");
            const expectedSecret = process.env.INTERNAL_API_SECRET;
            const previousSecret = process.env.PREVIOUS_INTERNAL_API_SECRET;

            // 1. Secret rotation check
            const isAuthorizedSecret =
                (expectedSecret && internalSecret === expectedSecret) ||
                (previousSecret && internalSecret === previousSecret);

            // 2. IP Allow-listing
            const allowedIps = (process.env.ALLOWED_INTERNAL_IPS || '').split(',').map(s => s.trim()).filter(Boolean);
            const isAuthorizedIp = allowedIps.length === 0 || allowedIps.includes(ip);

            if (!isAuthorizedSecret || !isAuthorizedIp) {
                const sanitizedPath = pathname.replace(/[^\w\/\.\-]/g, '');
                const sanitizedIp = ip.replace(/[^\d\.]/g, '');

                await logEvento({
                    level: 'ERROR',
                    source: 'SECURITY_GATEWAY',
                    action: 'UNAUTHORIZED_INTERNAL_ACCESS',
                    message: `Intento de acceso interno no autorizado a ${sanitizedPath}`,
                    correlationId,
                    details: {
                        ip: sanitizedIp,
                        path: sanitizedPath,
                        authSecretMatch: !!isAuthorizedSecret,
                        ipMatch: !!isAuthorizedIp
                    }
                });

                return new NextResponse(JSON.stringify({ success: false, message: "Forbidden" }), { status: 403 });
            }
        }

        // 2. Auth Logic Protection
        // Protect ALL paths not explicitly whitelisted
        if (!session && !isPublicPath) {
            // API routes: Return 401 instead of HTML redirect
            if (pathname.startsWith('/api/')) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Redirect to dashboard if logged in and trying to access login page
        const isMfaPending = session?.user?.mfaPending === true;
        if (session && pathname === '/login' && !isMfaPending) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }

        // 🛡️ [PHASE 120.1] MFA ENFORCEMENT
        const isMfaAllowedPath = pathname.startsWith('/api/auth') || pathname === '/login' || pathname === '/admin/profile';

        if (isMfaPending && !isMfaAllowedPath) {
            await logEvento({
                level: 'INFO',
                source: 'MFA_ENFORCEMENT',
                action: 'MFA_REDIRECT',
                message: `Redirigiendo a /admin/profile para completar MFA: ${pathname}`,
                correlationId,
                details: { pathname }
            });

            if (pathname.startsWith('/api/')) {
                return new NextResponse(JSON.stringify({
                    success: false,
                    code: 'MFA_REQUIRED',
                    message: 'MFA Setup required'
                }), { status: 403, headers: { 'Content-Type': 'application/json' } });
            }
            return NextResponse.redirect(new URL('/admin/profile', request.url));
        }

        // 3. Security Headers (CSP, HSTS, etc)
        const nonce = btoa(crypto.randomUUID());
        const response = NextResponse.next();

        response.headers.set('x-nonce', nonce);
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("X-XSS-Protection", "1; mode=block");
        response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        response.headers.set("X-DNS-Prefetch-Control", "on");
        response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

        // HSTS (Strict-Transport-Security) - 1 year
        if (process.env.NODE_ENV === 'production') {
            response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
        }

        // Relax CSP for development: Nonce and unsafe-inline don't coexist well for hydration scripts
        const hostname = request.headers.get("host") || "";
        const isDev = process.env.NODE_ENV === 'development' ||
            hostname.includes('localhost') ||
            hostname.includes('127.0.0.1');

        const scriptSrc = isDev
            ? "'self' 'unsafe-inline' 'unsafe-eval' https: http: blob:"
            : `'self' 'nonce-${nonce}' 'strict-dynamic' https: http: blob:`;

        const cspHeader = `
            default-src 'self';
            script-src ${scriptSrc};
            script-src-attr 'unsafe-inline';
            style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com;
            img-src 'self' data: https://res.cloudinary.com https://www.transparenttextures.com blob:;
            font-src 'self' data: https://fonts.gstatic.com;
            connect-src 'self' ${isDev ? 'ws: wss:' : ''} https://*.upstash.io https://*.googleapis.com https://*.google-analytics.com https://cdn.jsdelivr.net;
            frame-ancestors 'none';
            object-src 'none';
            base-uri 'self';
            worker-src 'self' blob:;
            ${isDev ? '' : 'upgrade-insecure-requests;'}
        `.replace(/\s{2,}/g, ' ').trim();

        response.headers.set("Content-Security-Policy", cspHeader);
        return response;

    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        await logEvento({
            level: 'ERROR',
            source: 'MIDDLEWARE',
            action: 'UNEXPECTED_ERROR',
            message: `Error inesperado en middleware: ${errorMsg}`,
            correlationId,
            details: {
                pathname,
                error: errorMsg,
                stack: errorStack
            }
        });

        // CRITICAL SECURITY FIX: Fail Closed, not Open.
        return new NextResponse(JSON.stringify({
            success: false,
            message: 'Middleware Error',
            error: process.env.NODE_ENV === 'development' ? errorMsg : 'An unexpected error occurred'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
