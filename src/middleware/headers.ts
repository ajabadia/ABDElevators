import { NextResponse } from 'next/server';
import { NextAuthRequest, logMiddlewareEvent } from './utils';
import { isAllowedOrigin, getCorsHeaders } from '../lib/cors';
import { CorrelationIdService } from '../services/observability/CorrelationIdService';

/**
 * Applies CORS and Standard Security Headers (CSP, HSTS, XFO, etc.).
 */
export async function applySecurityHeaders(request: NextAuthRequest, response: NextResponse, correlationId: string) {
    const { pathname } = request.nextUrl;
    const origin = request.headers.get('origin');
    const isDev = process.env.NODE_ENV === 'development';

    // 1. CORS Hardening
    if (origin) {
        if (isAllowedOrigin(origin)) {
            const corsHeaders = getCorsHeaders(origin);
            Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
            });
        } else {
            await logMiddlewareEvent({
                correlationId,
                level: 'WARN',
                action: 'CORS_BLOCKED',
                message: `CORS blocked from unauthorized origin: ${origin}`,
                details: { origin, pathname },
                session: request.auth
            });
            // Note: We don't return 403 here because some browser-direct navigations send Origin.
            // Strict enforcement is usually handled in the apiAuth or specific handlers.
        }
    }

    // 2. Standard Headers
    // Era 12: Cryptographically strong nonce
    const nonce = btoa(Array.from(crypto.getRandomValues(new Uint8Array(16)), b => String.fromCharCode(b)).join(''));
    
    response.headers.set('x-nonce', nonce);
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-DNS-Prefetch-Control", "on");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

    if (!isDev) {
        response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }

    // 3. Content Security Policy (CSP)
    const scriptSrc = isDev
        ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' localhost:*`
        : `'self' 'nonce-${nonce}' 'strict-dynamic' https: blob:`;

    const cspHeader = `
        default-src 'self';
        script-src ${scriptSrc};
        script-src-attr 'none';
        style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com;
        img-src 'self' data: https://res.cloudinary.com https://www.transparenttextures.com blob:;
        font-src 'self' data: https://fonts.gstatic.com;
        connect-src 'self' ${isDev ? 'ws: wss:' : ''} https://*.upstash.io https://*.googleapis.com https://*.google-analytics.com https://cdn.jsdelivr.net https://res.cloudinary.com;
        frame-ancestors 'none';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        worker-src 'self' blob:;
        ${isDev ? '' : 'upgrade-insecure-requests;'}
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set("Content-Security-Policy", cspHeader);
    
    return response;
}
