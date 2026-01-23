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

    // Si no está autenticado y intenta acceder a ruta protegida
    if (!session && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Control de acceso basado en roles
    if (session) {
        const userRole = session.user?.role;

        // Rutas compartidas por todos los autenticados: /perfil, /mis-documentos

        // ADMIN: Acceso total a /admin
        if (pathname.startsWith('/admin') && userRole !== 'ADMIN' && userRole !== 'INGENIERIA') {
            // Si es INGENIERIA puede entrar a /admin/documentos (read-only)
            if (!(pathname.startsWith('/admin/documentos') && userRole === 'INGENIERIA')) {
                return NextResponse.redirect(new URL('/pedidos', request.url));
            }
        }

        // TECNICO: Solo puede entrar a /pedidos y las comunes
        if (pathname.startsWith('/admin') && userRole === 'TECNICO') {
            return NextResponse.redirect(new URL('/pedidos', request.url));
        }

        // Solo ADMIN y TECNICO pueden acceder a /pedidos
        if (pathname.startsWith('/pedidos') && userRole === 'INGENIERIA') {
            return NextResponse.redirect(new URL('/admin/documentos', request.url));
        }

        // Restricción específica para INGENIERIA en Documentos (read-only)
        if (pathname.startsWith('/admin/documentos') && userRole === 'INGENIERIA') {
            if (request.method !== 'GET') {
                return NextResponse.json({ error: 'Acceso de solo lectura para Ingeniería' }, { status: 403 });
            }
        }
    }

    // Security & Correlation Headers (Regla #9)
    const response = NextResponse.next();
    const correlacion_id = crypto.randomUUID();

    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Correlacion-ID', correlacion_id);

    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|[\\w-]+\\.\\w+).*)',
    ],
};
