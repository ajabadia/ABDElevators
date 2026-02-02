import { NextResponse, NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';
import { checkRateLimit, LIMITS } from './lib/rate-limit';

const { auth } = NextAuth(authConfig);

export const config = {
    // Protect admin routes (UI & API) and login page
    matcher: [
        "/admin/:path*",
        "/api/admin/:path*",
        "/login"
    ],
};

export default auth(async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = (request as any).auth;
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

    console.log(`🛡️ [MIDDLEWARE] Path: ${pathname}, IP: ${ip}, Session: ${!!session}`);

    try {
        // 1. SECURITY: Global Admin Rate Limiting (Phase 55)
        // Protects both UI and API Admin routes from brute force / scraping
        if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
            const { success, reset } = await checkRateLimit(ip, LIMITS.ADMIN);
            if (!success) {
                console.warn(`⚠️ Rate Limit Exceeded (Admin) for IP: ${ip}`);
                return new NextResponse("Too Many Requests", {
                    status: 429,
                    headers: { "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString() }
                });
            }
        }

        // 2. Auth Logic
        // Redirect to dashboard if logged in and trying to access login page
        if (session && pathname === '/login') {
            return NextResponse.redirect(new URL('/admin/knowledge-assets', request.url));
        }

        // Protect admin routes
        if (!session && (pathname.startsWith('/admin') || pathname.startsWith('/api/admin'))) {
            // API routes: Return 401 instead of HTML redirect
            if (pathname.startsWith('/api/')) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // 3. Security Headers (CSP, HSTS, etc)
        const response = NextResponse.next();

        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("X-XSS-Protection", "1; mode=block");
        response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

        // Strictly define allowed sources
        response.headers.set("Content-Security-Policy",
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https://res.cloudinary.com blob:; " +
            "font-src 'self'; " +
            "connect-src 'self' https://*.upstash.io; " +
            "frame-ancestors 'none'; " +
            "object-src 'none'; " +
            "base-uri 'self';"
        );

        return response;

    } catch (error) {
        console.error('🔥 [MIDDLEWARE ERROR]', error);
        // CRITICAL SECURITY FIX: Fail Closed, not Open.
        return new NextResponse('Internal Server Error', { status: 500 });
    }
});
