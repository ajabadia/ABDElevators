export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
import { auth } from './lib/auth';
import { logEvento } from './lib/logger';
import { rateLimit } from './lib/rate-limit';
import crypto from 'crypto';

/**
 * Middleware de Seguridad y Performance
 * Regla de Oro #8 (Performance) y #9 (Security)
 */
export async function middleware(request: NextRequest) {
    try {
        const session = await auth();
        const { pathname } = request.nextUrl;
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1';

        // 🛡️ Rutas públicas (landing page y páginas de marketing)
        const publicPaths = [
            '/',
            '/login',
            '/api/auth',
            '/api/webhooks',
            '/privacy',
            '/terms',
            '/arquitectura',
            '/features',
            '/upgrade',
            '/auth', // Allows /auth/error, /auth/verify, etc.
            '/auth/signup-invite',
            '/error',
        ];

        const isPublicPath = publicPaths.some(path => {
            if (path === '/') {
                return pathname === '/';
            }
            return pathname.startsWith(path);
        });

        // 🛡️ Rate Limiting (Regla #9 Hardening)
        // Evitamos rate limit en prefetches de Next.js para mejorar performance
        const isPrefetch = request.headers.get('Purpose') === 'prefetch' || request.headers.get('Next-Purpose') === 'prefetch';
        const isApiOrAdmin = pathname.startsWith('/api') || pathname.startsWith('/admin') || pathname.startsWith('/entities');

        if (isApiOrAdmin && !isPublicPath && !isPrefetch && process.env.NODE_ENV !== 'development') {
            const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
            let limit = isAdmin ? 50000 : 10000; // Límites mucho más altos para producción industrial
            let windowMs = 60 * 60 * 1000; // 1 hora

            // 🛡️ Hardening MFA: Límite muy estricto para intentos de MFA
            if (pathname.includes('/api/auth/mfa')) {
                limit = 10;
                windowMs = 60 * 1000; // 10 intentos por minuto
            }

            const rateKey = session?.user?.id || ip;
            const rate = await rateLimit(`rate_${rateKey}_${pathname.includes('/api/auth/mfa') ? 'mfa' : 'api'}`, {
                limit: limit,
                windowMs: windowMs
            });

            if (!rate.success) {
                await logEvento({
                    level: 'WARN',
                    source: 'SECURITY_MIDDLEWARE',
                    action: 'RATE_LIMIT_EXCEEDED',
                    message: `Rate limit excedido para: ${rateKey}`,
                    correlationId: crypto.randomUUID(),
                    details: { rateKey, pathname, currentLimit: limit }
                });

                // Si es una navegación (browser), redirigir a página de error bonita
                const accept = request.headers.get('accept');
                if (accept && accept.includes('text/html') && !pathname.startsWith('/api')) {
                    return NextResponse.redirect(new URL('/error/rate-limit', request.url));
                }

                return NextResponse.json(
                    {
                        success: false,
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'Demasiadas peticiones. Por favor, espere un momento e intente de nuevo.'
                    },
                    {
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': rate.limit.toString(),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': rate.reset.toString()
                        }
                    }
                );
            }
        }

        // 🔄 Redirection if already logged in and trying to go to login
        if (session && pathname === '/login') {
            const target = session.user.role === 'INGENIERIA' ? '/admin/knowledge-assets' : '/entities';
            return NextResponse.redirect(new URL(target, request.url));
        }

        // If not authenticated and trying to access protected route
        if (!session && !isPublicPath) {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Role-based access control
        if (session) {
            const userRole = session.user?.role;

            // 🛡️ SUPER_ADMIN Restriction: Full access (bypass checks)
            if (userRole === 'SUPER_ADMIN') {
                // Continue
            } else {
                // Regular ADMIN: Access to all /admin and /entities
                // TECHNICIAN: Only /entities, /profile and common routes
                // ENGINEERING: Only /admin/knowledge-assets (read-only) and common routes

                if (pathname.startsWith('/admin')) {
                    const isEngineeringDocs = pathname.startsWith('/admin/knowledge-assets') && userRole === 'INGENIERIA';
                    const isAdmin = userRole === 'ADMIN';

                    if (!isAdmin && !isEngineeringDocs) {
                        return NextResponse.redirect(new URL('/entities', request.url));
                    }

                    // Specific restriction for ENGINEERING on Knowledge Assets (read-only)
                    if (isEngineeringDocs && request.method !== 'GET') {
                        return NextResponse.json({ error: 'Acceso de solo lectura para Ingeniería' }, { status: 403 });
                    }
                }

                // Restriction of /entities for Engineering
                if (pathname.startsWith('/entities') && userRole === 'INGENIERIA') {
                    return NextResponse.redirect(new URL('/admin/knowledge-assets', request.url));
                }
            }
        }

        // Security & Correlation Headers (Regla #9)
        const response = NextResponse.next();
        const correlationIdResp = crypto.randomUUID();

        // ⏱️ Medir latencia (Regla #8 Performance)
        const start = Date.now();

        // We can't use 'finally' here because NextResponse.next() returns a promise 
        // that resolves when the response headers are ready, not when the body is streamed.
        // However, for standard API responses, we can track the overhead.
        // For real route-level timing, Rule #8 is better implemented in the route itself.
        // But as a global safety, we add headers.

        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('X-Correlation-ID', correlationIdResp);
        response.headers.set('X-Request-Start', start.toString());

        if (process.env.NODE_ENV === 'production') {
            response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return response;
    } catch (error: any) {
        console.error('Middleware Critical Error:', error);
        // Intentar loguear el error si es posible
        await logEvento({
            level: 'ERROR',
            source: 'MIDDLEWARE',
            action: 'UNCAUGHT_EXCEPTION',
            message: error.message || 'Error desconocido en middleware',
            correlationId: 'mw-fail',
            stack: error.stack
        }).catch(() => { });

        // En caso de fallo crítico del middleware, bloqueamos por seguridad.
        return NextResponse.json(
            { error: 'Internal Server Error (Security Middleware)', correlationId: 'mw-fail' },
            { status: 500 }
        );
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|[\\w-]+\\.\\w+).*)',
    ],
};
