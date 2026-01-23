export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
import { auth } from './lib/auth';
import { logEvento } from './lib/logger';
import { rateLimit } from './lib/rate-limit';

/**
 * Middleware de Seguridad y Performance
 * Regla de Oro #8 (Performance) y #9 (Security)
 */
export async function middleware(request: NextRequest) {
    const session = await auth();
    const { pathname } = request.nextUrl;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';

    // 🛡️ Rate Limiting (Regla #9 Hardening)
    // Límite: 100 req / hora (3,600,000 ms)
    const rateKey = session?.user?.id || ip;
    const isApiOrAdmin = pathname.startsWith('/api') || pathname.startsWith('/admin') || pathname.startsWith('/pedidos');

    if (isApiOrAdmin) {
        const rate = await rateLimit(`rate_${rateKey}`, {
            limit: 100,
            windowMs: 60 * 60 * 1000
        });

        if (!rate.success) {
            await logEvento({
                nivel: 'WARN',
                origen: 'SECURITY_MIDDLEWARE',
                accion: 'RATE_LIMIT_EXCEEDED',
                mensaje: `Rate limit excedido para: ${rateKey}`,
                correlacion_id: crypto.randomUUID(),
                detalles: { rateKey, pathname }
            });

            return NextResponse.json(
                { error: 'Demasiadas peticiones. Por favor, intente más tarde.' },
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

    // Log para debug de sesión (Regla #4)
    if (pathname.startsWith('/admin') || pathname.startsWith('/pedidos')) {
        const correlacion_id = crypto.randomUUID();
        await logEvento({
            nivel: 'DEBUG',
            origen: 'MIDDLEWARE',
            accion: 'SESSION_CHECK',
            mensaje: `Pattern: ${pathname} | Session: ${session ? 'YES' : 'NO'} | Role: ${session?.user?.role || 'NONE'}`,
            correlacion_id,
            detalles: { pathname, has_session: !!session, role: session?.user?.role }
        });
    }

    // Rutas públicas (landing page y páginas de marketing)
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
    ];

    const isPublicPath = publicPaths.some(path => {
        if (path === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(path);
    });

    // 🔄 Redirección si ya está logueado e intenta ir a login
    if (session && pathname === '/login') {
        const target = session.user.role === 'INGENIERIA' ? '/admin/documentos' : '/pedidos';
        return NextResponse.redirect(new URL(target, request.url));
    }

    // Si no está autenticado y intenta acceder a ruta protegida
    if (!session && !isPublicPath) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Control de acceso basado en roles
    if (session) {
        const userRole = session.user?.role;

        // 🛡️ Restricción SUPER_ADMIN: Acceso total (bypass checks)
        if (userRole === 'SUPER_ADMIN') {
            // Continúa
        } else {
            // ADMIN normal: Acceso a todo /admin y /pedidos
            // TECNICO: Solo /pedidos, /perfil y comunes
            // INGENIERIA: Solo /admin/documentos (read-only) y comunes

            if (pathname.startsWith('/admin')) {
                const isEngineeringDocs = pathname.startsWith('/admin/documentos') && userRole === 'INGENIERIA';
                const isAdmin = userRole === 'ADMIN';

                if (!isAdmin && !isEngineeringDocs) {
                    return NextResponse.redirect(new URL('/pedidos', request.url));
                }

                // Restricción específica para INGENIERIA en Documentos (read-only)
                if (isEngineeringDocs && request.method !== 'GET') {
                    return NextResponse.json({ error: 'Acceso de solo lectura para Ingeniería' }, { status: 403 });
                }
            }

            // Restricción de /pedidos para Ingeniería
            if (pathname.startsWith('/pedidos') && userRole === 'INGENIERIA') {
                return NextResponse.redirect(new URL('/admin/documentos', request.url));
            }
        }
    }

    // Security & Correlation Headers (Regla #9)
    const response = NextResponse.next();
    const correlacion_id_resp = crypto.randomUUID();

    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Correlacion-ID', correlacion_id_resp);

    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return response;
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
