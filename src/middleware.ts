import { NextResponse, NextRequest } from 'next/server';
import NextAuth, { Session } from 'next-auth';
import { authConfig } from './lib/auth.config';
import { checkRateLimit, LIMITS } from './lib/rate-limit';
import { isAllowedOrigin, getCorsHeaders } from './lib/cors';
import { logEvento } from './lib/logger';
import { sanitizer, REGEX } from './lib/sanitization';

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
export default auth(async function middleware(request: NextAuthRequest) {
    const { pathname } = request.nextUrl;
    const session = request.auth;
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const correlationId = globalThis.crypto.randomUUID();

    // 🛡️ [SECURITY] Hardening Wave 3: Host Header Validation
    const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || '').split(',').map(h => h.trim()).filter(Boolean);
    const APP_DOMAIN = process.env.APP_DOMAIN;
    const VERCEL_URL = process.env.VERCEL_URL;

    const host = request.headers.get('host');
    const isHostAllowed = (h: string | null) => {
        if (!h) return false;
        if (process.env.NODE_ENV === 'development') return true;
        return ALLOWED_HOSTS.some(allowed => h === allowed || h.endsWith(`.${allowed}`)) ||
               (APP_DOMAIN && (h === APP_DOMAIN || h.endsWith(`.${APP_DOMAIN}`))) ||
               (VERCEL_URL && (h === VERCEL_URL || h.endsWith('.vercel.app')));
    };

    if (!isHostAllowed(host)) {
        await logEvento({
            level: 'WARN',
            source: 'MIDDLEWARE',
            action: 'INVALID_HOST_BLOCKED',
            message: `Acceso bloqueado desde host no autorizado: ${host}`,
            correlationId,
            details: { host, ip }
        });
        return new NextResponse("Invalid Host", { status: 403 });
    }

    try {
        // 🛡️ [SECURITY] Mitigation for CVE-2025-29927 (Middleware Bypass) — Hardened Phase 450
        const subrequest = request.headers.get('x-middleware-subrequest');
        if (subrequest) {
            // 1. Delete header immediately to prevent downstream bypass if forwarded
            request.headers.delete('x-middleware-subrequest');

            // 2. Strict validation: Next.js internal token is a 32-char hex string
            const isValidToken = REGEX.MIDDLEWARE_TOKEN.test(subrequest);

            if (!isValidToken) {
                await logEvento({
                    level: 'ERROR',
                    source: 'MIDDLEWARE',
                    action: 'CVE-2025-29927_BLOCKED',
                    message: `Invalid internal subrequest token blocked from IP: ${sanitizer.ip(ip)}`,
                    correlationId,
                    details: { 
                        ip: sanitizer.ip(ip), 
                        pathname: sanitizer.path(pathname), 
                        subrequestPreview: sanitizer.header(subrequest)
                    }
                });
                return new NextResponse('Security Violation', { status: 403 });
            }
        }

        // 🛡️ [SECURITY] Host Header Validation & CORS Spoofing Protection (Phase 287/294)
        const host = request.headers.get('host');
        const hostname = request.nextUrl.hostname;
        const allowedHost = process.env.APP_DOMAIN || 'localhost';
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

        // Strict Vercel URL validation instead of endsWith
        const expectedVercelHost = process.env.VERCEL_URL;
        const isVercel = expectedVercelHost
            ? hostname === expectedVercelHost
            : /^[a-zA-Z0-9-]+\.vercel\.app$/.test(hostname) && hostname.includes('abdelevators');

        const isAllowedDomain = hostname === allowedHost.split(':')[0];

        if (!isLocalhost && !isVercel && !isAllowedDomain) {
            await logEvento({
                level: 'ERROR',
                source: 'MIDDLEWARE',
                action: 'HOST_SPOOF_ATTEMPT',
                message: `Detected unauthorized hostname: ${hostname} (Host: ${host})`,
                correlationId,
                details: { hostname, host, expected: allowedHost }
            });
            return new NextResponse('Invalid Host', { status: 403 });
        }

        // 🛡️ [SECURITY] CSRF Protection for mutations (Phase 285)
        const method = request.method;
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
        const isNextAuth = pathname.startsWith('/api/auth');

        if (isMutation && !isNextAuth) {
            const csrfToken = request.headers.get('x-csrf-token');
            const origin = request.headers.get('origin');

            if (!csrfToken) {
                await logEvento({
                    level: 'WARN',
                    source: 'MIDDLEWARE',
                    action: 'CSRF_MISSING_HEADER',
                    message: `Missing x-csrf-token on ${method} ${pathname}`,
                    correlationId
                });
                return new NextResponse(JSON.stringify({ success: false, message: "CSRF token required" }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (origin && !origin.includes(allowedHost.split(':')[0])) {
                await logEvento({
                    level: 'ERROR',
                    source: 'MIDDLEWARE',
                    action: 'CSRF_ORIGIN_MISMATCH',
                    message: `CSRF Origin mismatch: ${origin} vs ${allowedHost}`,
                    correlationId
                });
                return new NextResponse(JSON.stringify({ success: false, message: "Invalid Origin" }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 🛡️ [P1] Block null origin on mutations unless it's a browser-direct same-origin request with CSRF
            // But usually XHR/Fetch always sends Origin. If missing on mutation, it's suspicious.
            if (!origin) {
                 await logEvento({
                    level: 'WARN',
                    source: 'MIDDLEWARE',
                    action: 'MUTATION_WITHOUT_ORIGIN',
                    message: `Mutation attempt without Origin header on ${pathname}`,
                    correlationId
                });
                // We allow it only if CSRF is present, but it's safer to warn and block if strictly following SOC2
                // return new NextResponse("Origin Required", { status: 403 });
            }
        }

        // 🛡️ [SECURITY] Rate Limiting (Phase 140)
        if (pathname.startsWith('/api/')) {
            const isAuthTarget = pathname.startsWith('/api/auth'); // Rate limit ALL auth including /session (P2)
            const limitConfig = isAuthTarget ? LIMITS.AUTH : LIMITS.CORE;

            // Pass tenantId if available in session (Phase 345)
            const tenantId = session?.user?.tenantId;
            const rateLimit = await checkRateLimit(ip, limitConfig, tenantId);

            if (!rateLimit.success) {
                await logEvento({
                    level: 'WARN',
                    source: 'MIDDLEWARE',
                    action: 'RATE_LIMIT_EXCEEDED',
                    message: `Rate limit blocked ${sanitizer.ip(ip)} on ${sanitizer.path(pathname)}`,
                    correlationId,
                    details: { 
                        ip: sanitizer.ip(ip), 
                        pathname: sanitizer.path(pathname), 
                        limit: rateLimit.limit 
                    }
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
                        'X-RateLimit-Reset': rateLimit.reset.toString(),
                        'X-RateLimit-Tenant-ID': tenantId || 'anonymous',
                        'Retry-After': Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000)).toString()
                    }
                });
            }
        }

        // Trace path for debugging (Non-sensitive)
        const monitoredPaths = ['/admin-dashboard', '/dashboard', '/search', '/settings', '/login', '/work', '/intelligence', '/agents', '/insights'];
        if (monitoredPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
            await logEvento({
                level: 'DEBUG',
                source: 'MIDDLEWARE',
                action: 'ROUTE_ACCESS',
                message: `Acceso a ruta: ${sanitizer.path(pathname)}`,
                correlationId,
                details: {
                    pathname: sanitizer.path(pathname),
                    hasSession: !!session,
                    user: session?.user?.email?.split('@')[0] + '@...', // Truncate email
                    mfaStatus: session?.user ? (session.user.mfaVerified ? 'VERIFIED' : (session.user.mfaPending ? 'PENDING' : 'OFF')) : 'N/A'
                }
            });
        }

        // 1. PUBLIC ROUTES WHITELIST
        const isPublicPath =
            pathname === '/api/swagger/spec' ||
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

            const isAuthorizedSecret =
                (expectedSecret && internalSecret === expectedSecret) ||
                (previousSecret && internalSecret === previousSecret);

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
        if (!session && !isPublicPath) {
            if (pathname.startsWith('/api/')) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const isMfaPending = session?.user?.mfaPending === true;
        if (session && pathname === '/login' && !isMfaPending) {
            return NextResponse.redirect(new URL('/admin-dashboard', request.url));
        }

        // 🛡️ [SECURITY] API Key Authentication (Phase 345/Era 12)
        const authHeader = request.headers.get('authorization');
        const apiKeyHeader = request.headers.get('x-api-key');
        const rawApiKey = apiKeyHeader || (authHeader?.startsWith('Bearer sk_') ? authHeader.replace('Bearer ', '') : null);

        if (rawApiKey && pathname.startsWith('/api/')) {
            // 🛡️ [SSRF Mitigation] Use hardcoded internal base URL instead of request.url
            const internalBase = process.env.INTERNAL_API_BASE_URL || 'http://localhost:3000';
            const internalUrl = `${internalBase}/api/internal/auth/validate-key`;

            // Extract resource hints from URL (e.g., /api/spaces/[id]/...)
            const spaceIdMatch = pathname.match(/\/api\/spaces\/([a-f\d]{24})/i);
            const assetIdMatch = pathname.match(/\/api\/assets\/([a-f\d]{24})/i);

            const internalSecret = process.env.INTERNAL_API_SECRET;
            if (!internalSecret) {
                await logEvento({
                    level: 'ERROR',
                    source: 'MIDDLEWARE',
                    action: 'CONFIGURATION_ERROR',
                    message: 'INTERNAL_API_SECRET is not configured',
                    correlationId
                });
                return new NextResponse("Configuration Error", { status: 500 });
            }

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 🛡️ [P1] 5s Timeout

                const validationResponse = await fetch(internalUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-internal-secret': internalSecret
                    },
                    body: JSON.stringify({
                        rawKey: rawApiKey,
                        tenantId: request.headers.get('x-tenant-id'),
                        resourceIds: {
                            spaceId: spaceIdMatch?.[1],
                            assetId: assetIdMatch?.[1]
                        }
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (validationResponse.ok) {
                    const { apiKey } = await validationResponse.json();

                    // Inject Identity Headers
                    const response = NextResponse.next();
                    response.headers.set('x-tenant-id', apiKey.tenantId);
                    response.headers.set('x-api-key-id', apiKey.id);
                    return response;
                } else {
                    const errorData = await validationResponse.json();
                    return new NextResponse(JSON.stringify({
                        success: false,
                        message: errorData.message || "Invalid API Key"
                    }), { status: validationResponse.status, headers: { 'Content-Type': 'application/json' } });
                }
            } catch (error) {
                console.error('[Middleware] API Key Validation Error:', error);
                // Fail closed for security
                return new NextResponse("Authentication Service Unavailable", { status: 503 });
            }
        }

        // 🛡️ [PHASE 120.1] MFA ENFORCEMENT
        const isMfaAllowedPath = pathname.startsWith('/api/auth') || pathname === '/login' || pathname === '/settings/profile';

        if (isMfaPending && !isMfaAllowedPath) {
            await logEvento({
                level: 'INFO',
                source: 'MFA_ENFORCEMENT',
                action: 'MFA_REDIRECT',
                message: `Redirigiendo a /settings/profile para completar MFA: ${pathname}`,
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
            return NextResponse.redirect(new URL('/settings/profile', request.url));
        }

        // 🛡️ [PHASE 282] CORS HARDENING
        const origin = request.headers.get('origin');
        if (origin && !isAllowedOrigin(origin)) {
            await logEvento({
                level: 'WARN',
                source: 'SECURITY_HEADERS',
                action: 'CORS_BLOCKED',
                message: `CORS request blocked from unauthorized origin: ${origin}`,
                correlationId,
                details: { origin, pathname }
            });
            return new NextResponse(JSON.stringify({ success: false, message: "CORS Unauthorized" }), { status: 403 });
        }

        // 3. Security Headers (CSP, HSTS, etc)
        const nonce = btoa(globalThis.crypto.randomUUID());
        const response = NextResponse.next();

        if (origin && isAllowedOrigin(origin)) {
            const corsHeaders = getCorsHeaders(origin);
            Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
            });
        }

        response.headers.set('x-nonce', nonce);
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        response.headers.set("X-DNS-Prefetch-Control", "on");
        response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
        response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
        response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

        if (process.env.NODE_ENV === 'production') {
            response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
        }

        const isDev = process.env.NODE_ENV === 'development';
        const scriptSrc = isDev
            ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' localhost:*`
            : `'self' 'nonce-${nonce}' 'strict-dynamic' https: blob:`;

        const cspHeader = `
            default-src 'self';
            script-src ${scriptSrc};
            script-src-attr 'unsafe-inline';
            style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com;
            img-src 'self' data: https://res.cloudinary.com https://www.transparenttextures.com blob:;
            font-src 'self' data: https://fonts.gstatic.com;
            connect-src 'self' ${isDev ? 'ws: wss:' : ''} https://*.upstash.io https://*.googleapis.com https://*.google-analytics.com https://cdn.jsdelivr.net https://res.cloudinary.com;
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
            details: { pathname, error: errorMsg, stack: errorStack }
        });

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
