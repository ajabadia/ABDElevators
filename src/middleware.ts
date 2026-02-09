import { NextResponse, NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';
import { checkRateLimit, LIMITS } from './lib/rate-limit';

const { auth } = NextAuth(authConfig);

export const config = {
    // Broaden matcher to intercept all routes for logic-based filtering
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};

export default auth(async function middleware(request: NextRequest & { auth?: any }) {
    const { pathname } = request.nextUrl;
    const session = request.auth;
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

    // Trace path for debugging
    if (pathname.startsWith('/admin') || pathname === '/dashboard' || pathname === '/search' || pathname === '/settings') {
        console.error(`🛡️ [MIDDLEWARE] Path: ${pathname}, Session: ${!!session}, MFA Pending: ${session?.user?.mfaPending}`);
    }

    try {
        // 1. PUBLIC ROUTES WHITELIST
        const isPublicPath =
            pathname === '/' ||
            pathname === '/login' ||
            pathname.startsWith('/auth') ||
            pathname.startsWith('/_next');

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
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // 🛡️ [PHASE 120.1] MFA ENFORCEMENT
        const isMfaAllowedPath = pathname.startsWith('/api/auth') || pathname === '/login' || pathname === '/admin/profile';

        if (isMfaPending && !isMfaAllowedPath) {
            console.error(`🔒 [MFA ENFORCEMENT] REDIRECTING ${pathname} -> /admin/profile`);
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

        // Relax CSP for development: Nonce and unsafe-inline don't coexist well for hydration scripts
        const hostname = request.headers.get("host") || "";
        const isDev = process.env.NODE_ENV === 'development' ||
            hostname.includes('localhost') ||
            hostname.includes('127.0.0.1');

        const scriptSrc = isDev
            ? "'self' 'unsafe-inline' 'unsafe-eval' https: http:"
            : `'self' 'nonce-${nonce}' 'strict-dynamic' https: http:`;

        const cspHeader = `
            default-src 'self';
            script-src ${scriptSrc};
            style-src 'self' 'unsafe-inline';
            img-src 'self' data: https://res.cloudinary.com blob:;
            font-src 'self' data:;
            connect-src 'self' https://*.upstash.io https://*.googleapis.com https://*.google-analytics.com;
            frame-ancestors 'none';
            object-src 'none';
            base-uri 'self';
        `.replace(/\s{2,}/g, ' ').trim();

        response.headers.set("Content-Security-Policy", cspHeader);
        return response;

    } catch (error: any) {
        console.error('🔥 [MIDDLEWARE ERROR]', error);
        // CRITICAL SECURITY FIX: Fail Closed, not Open.
        return new NextResponse(JSON.stringify({
            success: false,
            message: 'Middleware Error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
